import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {CodexClient,AgentManager} from '../server/codex.ts';
import {ProjectStore} from '../server/store.ts';
import {ffmpegPath,runMedia} from '../server/media.ts';
import {newProject,newScene,id,shotSchema,resultSchema,sceneFrames} from '../shared/project.ts';
import {directorBasis,directionBasis} from '../shared/audio-led.ts';

for(const workflow of ['audio-led-cuts-v2','director-first-cuts-v3']) test(`${workflow} completes its staged production with measured speech and media lineage`,async()=>{
  const root=path.resolve('data/audio-led-tests');await fs.mkdir(root,{recursive:true});
  const folder=await fs.mkdtemp(path.join(root,'run-'));
  const tone=path.join(folder,'tone.wav'),image=path.join(folder,'frame.png'),video=path.join(folder,'motion.mp4');
  await runMedia(ffmpegPath(),['-v','error','-y','-f','lavfi','-i','sine=frequency=440:duration=1',tone]);
  await runMedia(ffmpegPath(),['-v','error','-y','-f','lavfi','-i','color=c=navy:s=64x64','-frames:v','1',image]);
  await runMedia(ffmpegPath(),['-v','error','-y','-loop','1','-i',image,'-t','1','-r','24','-c:v','libx264','-pix_fmt','yuv420p',video]);
  const order:string[]=[];
  class Fixture extends CodexClient {
    override async status(){return {available:true,message:'Fixture transport'};}
    override async rpc(method:string,params:any={}) {
      if(method==='thread/start')return {thread:{id:'audio-led-fixture'}};
      if(['thread/inject_items','thread/name/set','thread/resume'].includes(method))return {};
      if(method!=='turn/start')throw new Error(method);
      const jobId=params.input[0].text.match(/jobs\/([\da-f-]+)\/input.json/)[1];
      const {project:p,job}=JSON.parse(await fs.readFile(path.join(params.cwd,'jobs',jobId,'input.json'),'utf8'));
      if(workflow==='director-first-cuts-v3')assert.ok(params.input[0].text.includes(`SKILL RESOURCE ROOT: ${path.join(params.cwd,'skill-snapshot')}.`));
      order.push(job.action+(job.action==='storyboard'&&job.scope==='project'?':treatment':''));const scene=p.scenes.find((s:any)=>s.id===job.sceneId);
      let result;
      if(job.action==='plan'){
        assert.ok(params.input[0].text.includes(workflow==='director-first-cuts-v3'?'WRITER DRAFT':'Image/video prompts, camera notes, shot lists and direction can remain empty'));
        result={summary:'Complete script',plan:{story:'A connected event.',fullNarration:p.scenes.map((s:any)=>s.narration).join(' ')},scenes:p.scenes};
      }else if(job.action==='storyboard'&&job.scope==='project'){
        assert.ok(p.scenes.every((s:any)=>!s.audioAssetId));
        const scenes=p.scenes.map((s:any)=>({...s,narration:'A connected event becomes urgent.',direction:'A single persistent room and continued action.',spokenStyle:'Concern becomes decisive urgency.',
          shots:[120,60,60].map((n,i)=>shotSchema.parse({id:s.id+'-'+i,title:'Cut '+i,purpose:'Visible development '+i,startFrame:[0,120,180][i],durationFrames:n,narrationAnchor:'A connected event',startState:'Established phase '+i,endState:'Established phase '+(i+1)}))}));
        result={summary:'Directed spoken treatment',plan:{story:p.plan.story,fullNarration:scenes.map((s:any)=>s.narration).join(' ')},scenes};
      }else if(job.action==='storyboard'){
        assert.ok(p.scenes.every((s:any)=>s.audioAssetId));
        const total=sceneFrames(p,scene);assert.equal(total,24);
        result={summary:'Directed timing',sceneUpdates:[{id:scene.id,direction:workflow==='director-first-cuts-v3'?scene.direction:'A single persistent room and continued action.',directionBasis:directionBasis(p,scene),shots:[12,6,6].map((n,i)=>workflow==='director-first-cuts-v3'?{...scene.shots[i],startFrame:[0,12,18][i],durationFrames:n}:shotSchema.parse({id:scene.id+'-'+i,title:'Cut '+i,startFrame:[0,12,18][i],durationFrames:n,narrationAnchor:'A connected event.',startState:'Established phase '+i,endState:'Established phase '+(i+1)}))}]};
      }else{
        const kind=job.action==='audio'?'audio':job.action==='images'?'image':'video';
        if(workflow==='director-first-cuts-v3') { assert.equal(p.plan.directorBasis,directorBasis(p));assert.equal(scene.narration,'A connected event becomes urgent.'); }
        const file=`media/${jobId}.${kind==='audio'?'wav':kind==='image'?'png':'mp4'}`;
        await fs.copyFile(kind==='audio'?tone:kind==='image'?image:video,path.join(params.cwd,file));
        const shots=kind==='audio'?[]:scene.shots;
        result={summary:'Protocol media fixture only',assets:kind==='audio'?[{name:'Voice',kind,path:file,sceneId:scene.id}]:shots.map((shot:any)=>{
          const source=p.assets.find((a:any)=>a.sceneId===scene.id&&a.shotId===shot.id&&a.kind==='image');
          return {name:shot.title,kind,path:file,sceneId:scene.id,shotId:shot.id,prompt:'Resolved per-cut provider prompt',startFrame:shot.startFrame,durationFrames:shot.durationFrames,sourceImageId:kind==='video'?source.id:undefined,replaceClipId:kind==='video'?p.clips.find((c:any)=>c.assetId===source.id)?.id:undefined};
        }),sceneUpdates:shots.length?[{id:scene.id,shots:shots.map((shot:any)=>({...shot,[kind==='image'?'imagePrompt':'videoPrompt']:'Resolved per-cut provider prompt'}))}]:[]};
      }
      await fs.writeFile(path.join(params.cwd,'jobs',jobId,'result.json'),JSON.stringify(resultSchema.parse(result)));
      const turn=id();setTimeout(()=>this.emit('notification',{method:'turn/completed',params:{threadId:params.threadId,turn:{id:turn,status:'completed'}}}),15);
      return {turn:{id:turn}};
    }
  }
  const p=newProject('New audio-led production');p.settings.fps=24;p.conversation.mode='managed';
  p.skill={id:'cinematic-3d-storytelling',name:'Storytelling',content:`metadata:\n  workflow: ${workflow}\n`};
  p.scenes.push(newScene('Second scene'));p.scenes.forEach(s=>{s.narration='A connected event.';assert.equal(s.shots.length,0);});
  const store=new ProjectStore(folder);await store.create(p);
  if(workflow==='director-first-cuts-v3') {
    const snapshot=path.join(store.folder(p.id),'skill-snapshot');await fs.mkdir(snapshot,{recursive:true});
    await fs.writeFile(path.join(snapshot,'SKILL.md'),p.skill.content);
  }
  const manager=new AgentManager(store,new Fixture());
  await manager.queue(p.id,{action:'plan',scope:'project',produceAfterPlan:true,sceneId:p.scenes[0].id,clipIds:[],instructions:'Produce the fixture'});
  const end=Date.now()+25000;
  while(Date.now()<end){const current=await store.read(p.id);if(current.production.status==='failed'||(current.production.status==='awaiting-review'&&current.assets.filter(a=>a.kind==='video').length===6&&current.jobs.every(j=>j.status==='completed')))break;await new Promise(r=>setTimeout(r,30));}
  const saved=await store.read(p.id);
  assert.equal(saved.production.status,'awaiting-review',JSON.stringify(saved.jobs.map(j=>j.error??j.applyError)));
  assert.deepEqual(order,['plan',...(workflow==='director-first-cuts-v3'?['storyboard:treatment']:[]),'audio','audio','storyboard','storyboard','images','images','video','video']);
  assert.equal(saved.clips.length,6);
  for(const scene of saved.scenes){assert.equal(sceneFrames(saved,scene),24);assert.equal(scene.shots.length,3);assert.ok(scene.shots.every(s=>s.imagePrompt&&s.videoPrompt));assert.equal(saved.clips.filter(c=>c.sceneId===scene.id).reduce((n,c)=>n+c.durationFrames,0),24);}
  assert.equal(saved.review.approvals.storyboard,null);
  if(workflow==='director-first-cuts-v3') {
    assert.equal(saved.plan.fullNarration,saved.scenes.map(s=>s.narration).join(' '));
    assert.equal(saved.plan.directorBasis,directorBasis(saved));
    const treatment=saved.jobs.find(j=>j.action==='storyboard'&&j.scope==='project')!;
    const raw=JSON.parse(await fs.readFile(path.join(store.folder(p.id),'jobs',treatment.id,'raw-director-result.json'),'utf8'));
    assert.equal(raw.plan.directorBasis,undefined);
  }
});
