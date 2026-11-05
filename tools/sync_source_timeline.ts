/** Populate existing source scenes and map existing renders by source time. No generation calls.
 * npx tsx tools/sync_source_timeline.ts --project UUID [--renders manifest.json]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { ProjectStore } from '../server/store.ts';
import { ffmpegPath, probePath, runMedia, measure } from '../server/media.ts';
import { activeVersion, id, makeClip, nextSceneNumber, cleanTransitions, type Asset, type Project } from '../shared/project.ts';
import { populateSourceReferences, excludeSourceRanges, sourceAsset } from '../shared/source-timeline.ts';

const schema=z.object({exclusions:z.array(z.object({startSeconds:z.number().nonnegative(),endSeconds:z.number().positive(),reason:z.string()}).refine(x=>x.endSeconds>x.startSeconds)).default([]),cameraCuts:z.array(z.number().positive()).default([]),renders:z.array(z.object({id:z.string(),title:z.string(),path:z.string(),startSeconds:z.number().nonnegative(),endSeconds:z.number().positive(),provider:z.string(),model:z.string(),sourceIn:z.number().int().nonnegative().default(0),durationFrames:z.number().int().positive().optional(),speed:z.number().min(0.25).max(4).default(1),prompt:z.string().default(''),notes:z.string().default('Existing selected render; review quality before final approval.')})).default([])});
export async function syncSourceTimeline(store:ProjectStore,projectId:string,value:unknown={}){
  const m=schema.parse(value),before=await store.read(projectId);if(!before.sourceVideo)throw new Error('Import a source video first');
  for(let i=0;i<m.renders.length;i++)for(let j=0;j<i;j++)if(m.renders[i].startSeconds<m.renders[j].endSeconds&&m.renders[j].startSeconds<m.renders[i].endSeconds)throw new Error('Render source ranges overlap');
  const probe=JSON.parse((await runMedia(probePath(),['-v','error','-show_streams','-of','json',await store.safeFile(projectId,before.sourceVideo.proxyPath)])).toString());
  const hasAudio=probe.streams.some((s:any)=>s.codec_type==='audio');
  const prepared: (z.infer<typeof schema>["renders"][number] & {info: Awaited<ReturnType<typeof measure>>;audio?:{path:string;durationFrames:number};frames:number})[]=[];
  for(const r of m.renders){
    if(!(r.endSeconds>r.startSeconds))throw new Error('Render range end must follow start');
    const info=await measure(r.path,r.path,before.settings.fps);if(info.kind!=='video')throw new Error('Renders must be video');
    const hash=createHash('sha256').update(await fs.readFile(r.path)).digest('hex').slice(0,20);
    const rel=`media/${hash}${path.extname(r.path).toLowerCase()}`,dest=path.join(store.folder(projectId),rel);
    if(path.resolve(r.path)!==path.resolve(dest))await fs.copyFile(r.path,dest);
    const streams=JSON.parse((await runMedia(probePath(),['-v','error','-show_streams','-of','json',dest])).toString());
    let audio: {path:string;durationFrames:number}|undefined;
    if(streams.streams.some((s:any)=>s.codec_type==='audio')){
      const ar=`media/${hash}-native.wav`,af=path.join(store.folder(projectId),ar);
      try{await fs.access(af);}catch{await runMedia(ffmpegPath(),['-v','error','-y','-i',dest,'-map','0:a:0','-c:a','pcm_s16le',af]);}
      audio={path:ar,durationFrames:(await measure(af,af,before.settings.fps)).durationFrames!};
    }
    const frames=r.durationFrames??Math.min(info.durationFrames!,audio?.durationFrames??Infinity)-r.sourceIn;
    if(frames<1||r.sourceIn+frames>info.durationFrames!||audio&&r.sourceIn+frames>audio.durationFrames)throw new Error(`Render ${r.id} exceeds native duration`);
    prepared.push({...r,path:rel,info,audio,frames});
  }
  return store.mutate(projectId,p=>{
    let next=nextSceneNumber(p);p.sourceVideo!.hasAudio=hasAudio;
    for(const cut of [...m.cameraCuts].sort((a,b)=>a-b)){
      const index=p.scenes.findIndex(s=>s.source&&s.source.startSeconds+1e-5<cut&&s.source.endSeconds-1e-5>cut);if(index<0)continue;
      const scene=p.scenes[index];if(p.clips.some(c=>c.sceneId===scene.id&&p.assets.find(a=>a.id===c.assetId)?.role!=='source-reference'))throw new Error('Do not split a scene with existing edited media');
      const originalEnd=scene.source!.endSeconds,extra={...structuredClone(scene),id:id(),number:next++,shots:[],audioAssetId:null};
      scene.source!.endSeconds=cut;scene.estimatedFrames=Math.max(1,Math.round((cut-scene.source!.startSeconds)*p.settings.fps));
      extra.source={...scene.source!,referenceId:`${scene.source!.referenceId}.cut-${extra.number}`,startSeconds:cut,endSeconds:originalEnd};extra.title=`Scene ${extra.number} · source camera take`;extra.estimatedFrames=Math.max(1,Math.round((originalEnd-cut)*p.settings.fps));p.scenes.splice(index+1,0,extra);
      p.clips=p.clips.filter(c=>c.sceneId!==scene.id);p.assets.filter(a=>a.sceneId===scene.id&&a.role==='source-reference').forEach(a=>{a.archived=true;});
    }
    excludeSourceRanges(p,m.exclusions.length?m.exclusions:p.sourceVideo!.exclusions??[]);
    for(const scene of p.scenes){
      if(!scene.source)continue;const start=scene.source.startSeconds,end=scene.source.endSeconds;
      const renders=prepared.filter(r=>r.startSeconds<end&&r.endSeconds>start);if(!renders.length)continue;
      const existing=p.clips.filter(c=>c.sceneId===scene.id);
      if(existing.some(c=>p.assets.find(a=>a.id===c.assetId)?.role!=='source-reference'&&!p.assets.find(a=>a.id===c.assetId)?.versions.some(v=>v.provenance.tool==='Mapped existing render')))throw new Error(`Scene ${scene.number} has unrelated edits; preserve them before remapping`);
      p.clips=p.clips.filter(c=>c.sceneId!==scene.id);let cursor=0;
      const boundaries=[...new Set([start,end,...renders.flatMap(r=>[Math.max(start,r.startSeconds),Math.min(end,r.endSeconds)])])].sort((a,b)=>a-b);
      for(let i=0;i<boundaries.length-1;i++){
        const a=boundaries[i],b=boundaries[i+1],r=renders.find(r=>r.startSeconds<=a+1e-6&&r.endSeconds>=b-1e-6);
        let video:Asset,audio:Asset|undefined,sourceIn:number,duration:number,speed=1;
        if(r){
          const lo=Math.round((a-r.startSeconds)/(r.endSeconds-r.startSeconds)*r.frames),hi=Math.round((b-r.startSeconds)/(r.endSeconds-r.startSeconds)*r.frames);
          sourceIn=r.sourceIn+lo;speed=r.speed;duration=Math.floor(hi/speed)-Math.floor(lo/speed);
          // Quantization can otherwise ask for one more source frame at the final edge.
          duration=Math.min(duration,Math.floor((r.sourceIn+r.frames-sourceIn)/speed));
          const assetFor=(kind:'video'|'audio',file:string,frames:number):Asset=>{
            const old=p.assets.find(x=>x.sceneId===scene.id&&x.kind===kind&&x.role==='render'&&activeVersion(x).path===file);if(old){old.archived=false;return old;}
            const vid=id(),x:Asset={id:id(),name:`${r.title}${kind==='audio'?' · dialogue & effects':''}`,kind,role:'render',sceneId:scene.id,activeVersionId:vid,outdated:false,versions:[{id:vid,path:file,durationFrames:frames,...(kind==='video'?{width:r.info.width,height:r.info.height}:{}),provenance:{provider:r.provider,model:r.model,tool:'Mapped existing render',jobId:r.id,prompt:r.prompt,createdAt:new Date().toISOString(),sourceVersionIds:[]}}]};p.assets.push(x);return x;
          };
          video=assetFor('video',r.path,r.info.durationFrames!);if(r.audio)audio=assetFor('audio',r.audio.path,r.audio.durationFrames);
        }else{
          video=sourceAsset(p,scene,'video');if(hasAudio)audio=sourceAsset(p,scene,'audio');sourceIn=Math.round(a*p.settings.fps);duration=Math.min(Math.round(b*p.settings.fps)-sourceIn,activeVersion(video).durationFrames!-sourceIn);
        }
        if(duration<1)continue;
        const c=makeClip(scene.id,video,cursor,duration);c.sourceIn=sourceIn;c.speed=speed;p.clips.push(c);
        if(audio){const c=makeClip(scene.id,audio,cursor,duration,'music');c.sourceIn=sourceIn;c.speed=speed;p.clips.push(c);}
        cursor+=duration;
      }
      scene.estimatedFrames=Math.max(1,cursor);scene.source.status='review';scene.source.notes=[...new Set([scene.source.notes,...renders.map(r=>r.notes)])].join('\n');
      scene.source.route=renders[0].provider==='Higgsfield'?'seedance':'veo';scene.source.motion=renders[0].provider==='Higgsfield'?'high':'low';
      if(renders.length===1&&renders[0].startSeconds<=start&&renders[0].endSeconds>=end)scene.title=renders[0].title;
    }
    populateSourceReferences(p);cleanTransitions(p);
  },before.revision);
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(fileURLToPath(import.meta.url))){
  const arg=(name:string)=>{const i=process.argv.indexOf(name);return i<0?undefined:process.argv[i+1];};const project=arg('--project');if(!project)throw new Error('Use --project UUID [--renders manifest.json]');
  const store=new ProjectStore(path.resolve(process.env.VIBECUT_DATA_DIR||'data/projects')),file=arg('--renders');
  const p=await syncSourceTimeline(store,project,file?JSON.parse(await fs.readFile(file,'utf8')):{});
  console.log(JSON.stringify({projectId:p.id,scenes:p.scenes.length,referenceClips:p.clips.filter(c=>c.track==='visual'&&p.assets.find(a=>a.id===c.assetId)?.role==='source-reference').length,renderClips:p.clips.filter(c=>c.track==='visual'&&p.assets.find(a=>a.id===c.assetId)?.role==='render').length,revision:p.revision}));
}
