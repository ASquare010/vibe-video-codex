/** Register completed prior attempts for comparison without repeating plot beats on the timeline. */
import fs from 'node:fs/promises';import path from 'node:path';
import {ProjectStore} from '../server/store.ts';import {measure} from '../server/media.ts';import {nativeRenderAudio} from '../server/source-render.ts';import {id,type Asset} from '../shared/project.ts';
const i=process.argv.indexOf('--plan');if(i<0)throw new Error('Use --plan timeline-plan.json');
const plan=JSON.parse(await fs.readFile(process.argv[i+1],'utf8')),store=new ProjectStore(path.resolve('data/projects')),p=await store.read(plan.projectId),prepared:{asset:Asset;audio?:Asset}[]=[];
for(const j of plan.extraAttempts||[]){const file=path.join(j.folder,'output_01.mp4');if(!await fs.stat(file).catch(()=>false))continue;
 const relative=path.relative(store.folder(p.id),file).replaceAll('\\','/');if(p.assets.some(a=>a.versions.some(v=>v.path===relative)))continue;
 const vid=id(),prompt=await fs.readFile(j.prompt,'utf8').catch(()=>''),asset:Asset={id:id(),name:`Alternate · Scene ${j.sceneNumber} · earlier take`,kind:'video',role:'render',sceneId:j.sceneId,activeVersionId:vid,outdated:false,versions:[{...(await measure(file,file,24)),id:vid,path:relative,provenance:{provider:j.provider==='veo'?'Google Cloud':'Higgsfield',model:j.model,tool:'Earlier generated attempt retained for comparison; not active timeline',prompt,createdAt:new Date().toISOString(),sourceVersionIds:[]}}]};
 const audio=await nativeRenderAudio(store,p,j.sceneId,file,vid);if(audio)audio.name=`Alternate sound · Scene ${j.sceneNumber}`;prepared.push({asset,audio});}
if(prepared.length)await store.mutate(p.id,p=>{for(const x of prepared){p.assets.push(x.asset);if(x.audio)p.assets.push(x.audio);}},p.revision);
console.log(JSON.stringify({alternatesAdded:prepared.length}));
