/** Attach a completed, locally verified H3 take. Never initiates inference. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {ProjectStore} from '../../server/store.ts';
import {id,activeVersion,type Asset} from '../../shared/project.ts';
import {measure} from '../../server/media.ts';
import {nativeRenderAudio} from '../../server/source-render.ts';
import {placeSourceRender} from '../../shared/source-timeline.ts';
const a=process.argv.indexOf('--receipt');if(a<0)throw new Error('Use --receipt completed-take.json');
const r=JSON.parse(await fs.readFile(process.argv[a+1],'utf8')),root=path.resolve('data/projects'),store=new ProjectStore(root),folder=store.folder(r.projectId);
const before=await store.read(r.projectId),scene=before.scenes.find(s=>s.id===r.sceneId);if(!scene)throw new Error('Scene map changed; review before applying');
if(Math.abs(scene.source!.startSeconds-r.start)>1e-5||Math.abs(scene.source!.endSeconds-r.end)>1e-5)throw new Error('Source scope changed; review before applying');
if(before.assets.some(v=>v.versions.some(v=>v.provenance.jobId===r.jobId)&&v.name===r.name)){console.log(JSON.stringify({status:'already-applied',jobId:r.jobId}));process.exit(0);}
const safe=(file:string)=>{const v=path.relative(folder,path.resolve(file));if(!v||v.startsWith('..')||path.isAbsolute(v))throw new Error('Take must be inside project');return v.replaceAll('\\','/');};
const vid=id(),version={...(await measure(r.file,r.file,24)),id:vid,path:safe(r.file),provenance:{provider:'Installed MiniMax H3',model:'minimax_h3_ref2va_pruned_int8_convrot',tool:'Resumable H3 production',prompt:r.prompt,createdAt:new Date().toISOString(),jobId:r.jobId,sourceVersionIds:[]}};
const asset:Asset={id:id(),sceneId:r.sceneId,name:r.name,kind:'video',role:'render',versions:[version],activeVersionId:vid,outdated:false};
const audio=r.place===false?undefined:await nativeRenderAudio(store,before,r.sceneId,r.file,vid);
const poses:Asset[]=[];for(const item of r.poses??[]){const v=id();poses.push({id:id(),sceneId:r.sceneId,name:'Photographic reference · '+item.label,kind:'image',role:'render',outdated:false,activeVersionId:v,versions:[{...(await measure(item.file,item.file,24)),id:v,path:safe(item.file),provenance:{...version.provenance,tool:item.existing?'Reused existing source-matched photograph':'H3 photographic reference',jobId:item.existing||item.jobId?.startsWith('existing-reference-')?undefined:item.jobId,prompt:item.prompt}}]});}
const p=await store.mutate(r.projectId,p=>{
 if(p.assets.some(a=>a.versions.some(v=>v.provenance.jobId===r.jobId)&&a.name===r.name))return;
 p.assets.push(asset,...poses);if(audio)p.assets.push(audio);
 if(r.place!==false){
  // A revised H3 take replaces prior H3 picture AND its paired sound; keep the files as history.
  const previous=p.assets.filter(a=>a.sceneId===r.sceneId&&a.id!==asset.id&&a.kind==='video'&&a.versions.some(v=>v.provenance.tool==='Resumable H3 production'));
  const previousIds=new Set(previous.map(a=>a.id)),previousVersions=new Set(previous.flatMap(a=>a.versions.map(v=>v.id)));
  for(const a of p.assets)if(a.kind==='audio'&&a.sceneId===r.sceneId&&a.versions.some(v=>v.provenance.sourceVersionIds.some(x=>previousVersions.has(x))))previousIds.add(a.id);
  p.clips=p.clips.filter(c=>!c.assetId||!previousIds.has(c.assetId));
  placeSourceRender(p,asset,audio,{durationFrames:r.targetFrames});const s=p.scenes.find(s=>s.id===r.sceneId)!;s.approved=false;s.source!.status='review';s.source!.notes+=' H3 photographic source-guided draft '+r.jobId+'. '+(r.reviewNote??'Visual motion, contacts, dialogue and joins await review.');s.videoPrompt=r.prompt;
 }
 for(const take of [{jobId:r.jobId,file:r.metadata},...(r.poses??[]).filter((x:any)=>!x.existing&&!x.jobId?.startsWith('existing-reference-')).map((x:any)=>({jobId:x.jobId,file:x.metadata}))])if(!p.costs.some(c=>c.id==='h3-'+take.jobId))p.costs.push({id:'h3-'+take.jobId,provider:'Installed MiniMax H3',model:'ref2va',sceneId:r.sceneId,amount:0,unit:'USD',status:'recorded',scope:r.name,receipt:safe(take.file),notes:'No per-generation API charge. Existing Google Cloud A100 infrastructure is metered separately; credit coverage and actual VM invoice have not been priced here.'});
 if(!p.costs.some(c=>c.id==='h3-vm-infrastructure'))p.costs.push({id:'h3-vm-infrastructure',provider:'Google Cloud',model:'Existing A100 VM',amount:null,unit:'USD',status:'unpriced',scope:'H3 production infrastructure',notes:'Do not report this run as zero total cost: VM time, storage and network charges require Cloud billing reconciliation.'});
},before.revision);console.log(JSON.stringify({status:'applied',revision:p.revision,scene:r.number,jobId:r.jobId,file:r.file}));
