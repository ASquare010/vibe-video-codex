/** Reconcile saved provider receipts and reviewed media with the source timeline. No inference calls. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {ProjectStore} from '../server/store.ts';
import {SkillCatalog} from '../server/skills.ts';
import {measure} from '../server/media.ts';
import {nativeRenderAudio} from '../server/source-render.ts';
import {placeSourceRender} from '../shared/source-timeline.ts';
import {providerCharge} from '../shared/provider-charge.ts';
import {assertBudget} from '../shared/compact-plan.ts';
import {activeVersion,id,type Asset} from '../shared/project.ts';
const arg=(n:string)=>process.argv[process.argv.indexOf(n)+1];
if(!process.argv.includes('--plan'))throw new Error('Use --plan batch-plan.json [--import 1,3,...] [--finish]');
const plan=JSON.parse(await fs.readFile(arg('--plan'),'utf8')),store=new ProjectStore(path.resolve('data/projects'));
const base=store.folder(plan.projectId),relative=(f:string)=>path.relative(base,path.resolve(f)).replaceAll('\\','/');
async function read(f:string){try{return JSON.parse(await fs.readFile(f,'utf8'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return {};throw e;}}
const previous=await store.read(plan.projectId),charges:any[]=[],images:Asset[]=[],prepared:{n:number;asset:Asset;audio?:Asset;review:any}[]=[],currentOperations=new Map<string,string>();
for(const s of plan.scenes){
 const stem=s.referenceStem||'first-frame',f=s.referenceImage||path.join(s.folder,'first-frame.jpg'),existing=previous.assets.find(a=>a.sceneId===s.sceneId&&a.kind==='image'&&activeVersion(a).path===relative(f));
 if(!existing&&await fs.stat(f).catch(()=>false)){
  const vid=id();images.push({id:id(),name:`Realistic reference · Scene ${s.number}`,kind:'image',sceneId:s.sceneId,versions:[{...(await measure(f,f,24)),id:vid,path:relative(f),provenance:{provider:'OpenAI',tool:'GPT image generation',prompt:await fs.readFile(path.join(s.folder,stem+'-prompt.txt'),'utf8').catch(()=>''),createdAt:new Date().toISOString(),jobId:`gpt-reference-${plan.batchId||'through38'}-${s.number}-${stem}`,sourceVersionIds:[]}}],activeVersionId:vid,outdated:false});
 }
 for(const name of (await fs.readdir(s.folder)).filter((f:string)=>f.endsWith('-provenance.json'))){const receipt=path.join(s.folder,name),v=await read(receipt);if(v.tool==='built-in image_gen'&&v.sourceOutput)charges.push({id:`gpt-reference-image-${relative(receipt)}`,provider:'OpenAI',amount:null,unit:'USD',status:'unpriced',scope:`Scene ${s.number} reference image attempt ${name}`,sceneId:s.sceneId,receipt:relative(receipt),notes:'Built-in GPT image attempt; no monetary receipt returned. Excluded from USD, not assumed free.'});}
 const a=await read(path.join(s.folder,'dialogue-verified.json'));
 if(a.usageMetadata){const u=a.usageMetadata;charges.push({id:`analysis-through38-${s.number}`,provider:'Google Cloud',model:a.modelVersion||'gemini-3.8-flash',sceneId:s.sceneId,amount:((u.promptTokenCount||0)*.75+((u.candidatesTokenCount||0)+(u.thoughtsTokenCount||0))*3.75)/1e6,unit:'USD',status:'estimate',scope:`Scene ${s.number} merged English dialogue verification`,receipt:relative(path.join(s.folder,'dialogue-verified.json')),notes:'Published introductory token rates, including reported reasoning tokens; Cloud grant application unverified.'});}
}
for(const j of [...plan.jobs,...(plan.extraAttempts||[])]){
 const d=j.folder,submission=await read(path.join(d,j.provider==='veo'?'submission.json':'higgsfield-receipt.json'));
 const operation=j.provider==='veo'?submission.provider?.name:submission.job_id;
 if(!operation)continue;
 if(plan.jobs.includes(j))currentOperations.set(j.key,operation);
 const status=await read(path.join(d,j.provider==='veo'?'provider_status.json':'higgsfield-status.json'));
 const charge=providerCharge(j,status);
 charges.push({id:operation,provider:j.provider==='veo'?'Google Cloud':'Higgsfield',model:j.model,sceneId:j.sceneId,...charge,unit:j.provider==='veo'?'USD':'Higgsfield credits',scope:`Scene ${j.sceneNumber}, request ${j.key}, native dialogue and effects`,nativeSeconds:j.nativeSeconds,receipt:relative(path.join(d,j.provider==='veo'?'submission.json':'higgsfield-receipt.json'))});

}
const imports=process.argv.includes('--import')?arg('--import').split(',').map(Number):[];
for(const n of imports){
 const s=plan.scenes.find((s:any)=>s.number===n);if(!s)throw new Error('Scene outside authorized plan');
 const review=await read(s.timelineReviewPath||path.join(s.folder,'review.json'));if(review.decision!=='place-for-review')throw new Error(`Scene ${n} needs a written review before placement`);
 const file=s.finishedFile||path.join(s.folder,'finished.mp4');if(previous.assets.some(a=>a.kind==='video'&&a.role==='render'&&activeVersion(a).path===relative(file)&&previous.clips.some(c=>c.assetId===a.id)))continue;
 const meta=await measure(file,file,previous.settings.fps);if(meta.width!==1280||meta.height!==720)throw new Error('Review output must be 720p');
 const vid=id(),asset:Asset={id:id(),name:s.timelineLabel||`Rendered · Scene ${n}`,kind:'video',sceneId:s.sceneId,role:'render',versions:[{...meta,id:vid,path:relative(file),provenance:{provider:s.provider==='veo'?'Google Cloud':'Higgsfield',model:s.model||(s.provider==='veo'?'veo-3.1-fast-generate-001':'seedance_2_0 fast'),tool:'Source remake, creator-requested review timeline',prompt:s.prompts.join('\n\n'),jobId:s.providerJobIds?.join(' + ')||`through38-scene-${n}`,createdAt:new Date().toISOString(),sourceVersionIds:[]}}],activeVersionId:vid,outdated:false};
 const audio=await nativeRenderAudio(store,previous,s.sceneId,file,vid);if(!audio)throw new Error('Missing native audio');prepared.push({n,asset,audio,review});
}
for(const f of plan.analysisReceipts||[]){const a=await read(f),u=a.usageMetadata;if(u)charges.push({id:`analysis-${relative(f)}`,provider:'Google Cloud',model:a.modelVersion||'gemini-3.8-flash',amount:((u.promptTokenCount||0)*.75+((u.candidatesTokenCount||0)+(u.thoughtsTokenCount||0))*3.75)/1e6,unit:'USD',status:'estimate',scope:'Source continuity / exact dialogue analysis',receipt:relative(f),notes:'Published introductory token rates, including reasoning; grant application unverified.'});}
const skill=await new SkillCatalog().read('video-rerender');
const saved=await store.mutate(plan.projectId,p=>{
 p.skill=skill;p.assets.push(...images);
 if(plan.batchId)p.costs=p.costs.filter(c=>!c.id.startsWith(`gpt-reference-${plan.batchId}-`));
 for(const charge of charges){const i=p.costs.findIndex(c=>c.id===charge.id);if(i>=0)p.costs[i]=charge;else p.costs.push(charge);}
 for(const s of plan.scenes){const scene=p.scenes.find(x=>x.id===s.sceneId)!;if(!scene)throw new Error('Scene changed during production');
  if(scene.generationPlan?.state!=='rendered'){
   scene.generationPlan??={mode:'generate',state:'planned',provider:s.provider,nativeSeconds:s.nativeSeconds,estimatedCredits:0,reason:plan.authorization||'Creator-requested replacements preserving source camera continuity.'};
   scene.generationPlan!.provider=s.provider;if(s.provider==='veo')scene.generationPlan!.estimatedCredits=0;
   if(scene.source)scene.source.route=s.provider==='veo'?'veo':'seedance';
   scene.generationPlan!.nativeSeconds=s.nativeSeconds;
   const expected=plan.jobs.filter((j:any)=>s.takeSelections?s.takeSelections.some((t:any)=>t.jobKey===j.key):j.sceneId===s.sceneId),ids=expected.map((j:any)=>currentOperations.get(j.key)).filter(Boolean),accepted=charges.filter(c=>ids.includes(c.id));
   if(accepted.length>=expected.length)scene.generationPlan!.state='reserved';
   else {scene.generationPlan!.state='planned';if(s.provider==='higgsfield')scene.generationPlan!.estimatedCredits=expected.reduce((n:number,j:any)=>n+j.quoteCredits,0)-accepted.reduce((n:number,c:any)=>n+(c.amount||0),0);}
  }
  const selectedMatches=s.finishedFile&&p.clips.some(c=>c.sceneId===s.sceneId&&c.track==='visual'&&p.assets.find(a=>a.id===c.assetId)?.versions.find(v=>v.id===c.versionId)?.path===relative(s.finishedFile));
  if(scene.generationPlan?.state!=='rendered'||selectedMatches||prepared.some(x=>x.n===s.number)){scene.imagePrompt=images.find(a=>a.sceneId===s.sceneId)?.versions[0].provenance.prompt||scene.imagePrompt;scene.videoPrompt=s.prompts.join('\n\n');}
  if(s.title)scene.title=s.title;
  if(s.reviewNotes&&!scene.source!.notes.includes(s.reviewNotes))scene.source!.notes+='\nReview: '+s.reviewNotes;
  if(s.contentAdaptation&&!scene.source!.notes.includes(s.contentAdaptation)){scene.source!.notes+='\n'+s.contentAdaptation;scene.title=s.title;scene.source!.motion='low';}
 }
 for(const {n,asset,audio,review} of prepared){p.clips=p.clips.filter(c=>c.sceneId!==asset.sceneId||p.assets.find(a=>a.id===c.assetId)?.role!=='render');p.assets.push(asset);if(audio)p.assets.push(audio);placeSourceRender(p,asset,audio);const s=p.scenes.find(x=>x.id===asset.sceneId)!;s.source!.notes+=`\nGenerated take ${n} placed for creator review: ${review.summary}`;s.approved=false;}
 p.estimatedCostUsd=p.costs.filter(c=>c.unit==='USD'&&c.amount!==null).reduce((sum,c)=>sum+c.amount!,0);
 p.production=plan.stopRequested?{status:'paused',stage:'video',error:'Stopped at creator request. Already-launched results were collected; no new requests or retries are authorized.'}:process.argv.includes('--finish')?{status:'awaiting-review',stage:'video'}:{status:'running',stage:'video'};
 assertBudget(p);
},previous.revision);
console.log(JSON.stringify({revision:saved.revision,imported:prepared.map(x=>x.n),imagesAdded:images.length,estimatedCostUsd:saved.estimatedCostUsd,budget:assertBudget(saved)}));
