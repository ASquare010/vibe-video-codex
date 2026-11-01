/** Apply the reviewed image board through existing director validation. Never generate media. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ProjectStore} from '../../server/store.ts';
import {measure} from '../../server/media.ts';
import {id,assetSchema,versionSchema,makeClip,resultSchema,jobSchema,sceneFrames,totalFrames} from '../../shared/project.ts';
import {directionBasis,directorTreatmentIssue,directionIssue} from '../../shared/audio-led.ts';
import {reopenReview} from '../../shared/review.ts';
import {validateProductionResult} from '../../server/production.ts';

const projectId='761bb19c-3366-42b3-bb34-274cc9f0f625';
const store=new ProjectStore(path.resolve('data/projects')),root=store.folder(projectId),out=path.join(root,'storyboard-v2');
const read=async(file:string)=>JSON.parse(await fs.readFile(path.join(out,file),'utf8'));
const sha=async(file:string)=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
const plan=await read('plan.json'),lock=await read('preservation-lock.json'),selections=await read('selections.json'),review=await read('review-notes.json');
const before=await store.read(projectId);
if(await fs.stat(path.join(out,'applied.json')).then(()=>true,()=>false))throw new Error('Already applied; inspect receipt instead of duplicating assets.');
if(before.jobs.some(j=>j.status==='running'||j.status==='queued'))throw new Error('Active job: do not race a producer.');
if(JSON.stringify(before.plan)!==JSON.stringify(lock.plan))throw new Error('Creator changed the locked plan.');
if(JSON.stringify(before.scenes.map(({id,title,narration,spokenStyle,audioPrompt})=>({id,title,narration,spokenStyle,audioPrompt})))!==JSON.stringify(lock.sceneWords))throw new Error('Creator changed story or speech.');
if(plan.cuts.length!==60||review.cuts.length!==60||review.cuts.some((c:any)=>c.status!=='selected-still-reviewed'))throw new Error('Review all 60 selected stills before applying.');
for(const a of lock.audio){const asset=before.assets.find(x=>x.id===a.assetId)!;if(asset.activeVersionId!==a.versionId||await sha(path.join(root,a.path))!==a.sha256)throw new Error('Accepted audio changed.');}
for(const s of selections)if(await sha(path.join(root,s.path))!==s.sha256)throw new Error('Selected still changed after inspection.');

const directed=before.scenes.map(s=>({...structuredClone(s),
  direction:'Director revision over the unchanged accepted narration. '+plan.cuts.filter((c:any)=>c.sceneId===s.id).map((c:any)=>`${c.id} (${c.startFrame}..${c.startFrame+c.durationFrames-1}): ${c.plannedAction} Speech window ${c.speechWindow.start.toFixed(3)}–${c.speechWindow.end.toFixed(3)}s. ${c.speechWindow.recognizedContext||'Accepted pause; explanatory continuation.'}`).join('\n'),
  shots:plan.cuts.filter((c:any)=>c.sceneId===s.id).map((c:any)=>({id:c.id,title:c.title,purpose:c.plannedAction,narrationAnchor:c.narrationAnchor,startFrame:c.startFrame,durationFrames:c.durationFrames,
    imagePrompt:c.imagePrompt,videoPrompt:'',camera:'Resolved by the selected portrait still; animation is not commissioned.',
    startState:c.previousState+' Current selected pose: '+c.decisiveStill,endState:c.plannedAction+' Next development: '+c.nextRequiredState,
    sound:'Existing accepted Holden narration only; no new effects or generated sound.',media:'image' as const})),
  directionBasis:directionBasis(before,s)!,approved:false}));
const treatment=resultSchema.parse({summary:'Creator-authorized 60-cut image/audio storyboard, exact story and recorded performance preserved.',plan:{story:before.plan.story,fullNarration:before.plan.fullNarration},scenes:directed});
const job=jobSchema.parse({id:id(),action:'storyboard',scope:'project',sceneId:before.scenes[0].id,clipIds:[],instructions:'Revise director coverage to 50–60 connected cuts over unchanged story and accepted audio. Images only; no video generation.',revision:before.revision,status:'completed',createdAt:new Date().toISOString()});
validateProductionResult(before,job,treatment);
const candidate={...before,plan:{...before.plan,...treatment.plan},scenes:treatment.scenes!};
if(directorTreatmentIssue(candidate)||candidate.scenes.some(s=>directionIssue(candidate,s)))throw new Error('Director/timing validation failed.');

// Measure real files before the single atomic manifest mutation. Preserve exact lineage on reuse.
const receiptRows=await read('image-receipts.json');
const assets:any[]=[],versionByCut=new Map<string,string>();
for(const c of plan.cuts){
  const selected=selections.find((s:any)=>s.cutId===c.id),meta=await measure(path.join(root,selected.path),selected.path,24);
  const reuse=selected.reuse,receipt=selected.receipt;
  const sources=reuse?.versionId?[reuse.versionId]:reuse?.generatedCutId?[versionByCut.get(reuse.generatedCutId)!]:[];
  if(sources.some((v:any)=>!v))throw new Error('Reuse source must precede placement.');
  const versions=[];let vid='';
  if(reuse){vid=id();versions.push(versionSchema.parse({...meta,id:vid,path:selected.path,provenance:{provider:'Existing project still / reuse',model:'Retained selected image',tool:'Reuse with recorded source version',prompt:c.imagePrompt,createdAt:new Date().toISOString(),sourceVersionIds:sources}}));}
  else for(const r of receiptRows.filter((r:any)=>r.cutId===c.id)){
    const rel=r.sha256===selected.sha256?selected.path:`storyboard-v2/rejected/${c.id}-${r.sha256.slice(0,12)}.png`;
    if(await sha(path.join(root,rel))!==r.sha256)throw new Error('Previous image missing or changed.');
    const measured=await measure(path.join(root,rel),rel,24),versionId=id();
    const sourceIds=new Set<string>();
    for(const ref of r.referenced_image_paths??[]){
      const normalized=path.resolve(ref);
      const original=before.assets.flatMap(a=>a.versions).find(v=>path.resolve(root,v.path)===normalized);
      if(original)sourceIds.add(original.id);
      const other=selections.find((s:any)=>path.resolve(root,s.path)===normalized);
      if(other?.cutId===c.id&&versions.length)sourceIds.add(versions.at(-1)!.id);
      else if(other&&versionByCut.has(other.cutId))sourceIds.add(versionByCut.get(other.cutId)!);
    }
    versions.push(versionSchema.parse({...measured,id:versionId,path:rel,provenance:{provider:'OpenAI built-in image tool',model:r.modelAlias,tool:'image_gen.imagegen',prompt:r.prompt,createdAt:r.collectedAt,sourceVersionIds:[...sourceIds]}}));
    if(r.sha256===selected.sha256)vid=versionId;
  }
  if(!vid)throw new Error('Selected version not found.');versionByCut.set(c.id,vid);
  assets.push(assetSchema.parse({id:id(),name:c.id+' — '+c.title,kind:'image',role:'render',sceneId:c.sceneId,shotId:c.id,activeVersionId:vid,versions,outdated:false}));
}
await fs.copyFile(path.join(root,'project.json'),path.join(out,'project-immediately-before-apply.json'));
await fs.copyFile(path.resolve('video-skills/cinematic-3d-storytelling/references/director.md'),path.join(out,'director-instructions.md'));
const updated=await store.mutate(projectId,p=>{
  p.plan={...p.plan,...treatment.plan};p.scenes=treatment.scenes!;p.assets.push(...assets);
  // The old image/video timeline and native sound sidecars remain in the saved manifest snapshot.
  // Narration is scene-owned audio, not duplicated as music clips.
  p.clips=assets.map(a=>{const c=plan.cuts.find((x:any)=>x.id===a.shotId);return {...makeClip(a.sceneId,a,c.startFrame,c.durationFrames,'visual'),fit:'cover' as const,motion:'none' as const};});
  p.transitions=[];reopenReview(p,'storyboard');p.production={status:'awaiting-review',stage:'images'};
  p.jobs.push({...job,resultApplied:true,log:'60 image clips placed. Same four accepted audio assets and story. Native playback and creator approval pending; no video requested.'});
  for(const r of receiptRows){const costId='imagegen-'+r.sha256;if(!p.costs.some(x=>x.id===costId))p.costs.push({id:costId,provider:'OpenAI built-in image tool',model:r.modelAlias,amount:null,unit:'USD',status:'unpriced',scope:r.cutId,receipt:'storyboard-v2/image-receipts.json',notes:'Actual returned image, including retained previous attempts. Billing not exposed; unknown is not zero.'});}
  for(const f of ['787642db-a7a8-4af1-b7f7-feb929a45d2d','999d92fa-f5cc-44a2-87f8-3239b3df9779','747f4dad-79b1-9108-8ddc-320da3481192'])if(!p.costs.some(x=>x.id===f))p.costs.push({id:f,provider:'OpenAI built-in image tool',amount:null,unit:'USD',status:'unpriced',scope:'Rejected output; no image returned',notes:'No billed amount returned. Request preserved in storyboard-v2 image failure records.'});
},before.revision);
if(totalFrames(updated)!==3445||updated.clips.length!==60||updated.clips.some(c=>updated.assets.find(a=>a.id===c.assetId)?.kind!=='image'))throw new Error('Applied image board failed coverage check.');
for(const s of updated.scenes){if(directionIssue(updated,s))throw new Error('Applied timing invalid.');if(sceneFrames(updated,s)!==lock.audio.find((a:any)=>a.sceneId===s.id).frames)throw new Error('Audio frame duration changed.');}
for(const a of lock.audio)if(await sha(path.join(root,a.path))!==a.sha256)throw new Error('Audio bytes changed.');
const receipt={projectId,previousRevision:before.revision,revision:updated.revision,cuts:60,scenes:plan.scenes,frames:3445,fps:24,aspectRatio:'9:16',audioHashesUnchanged:true,storyAndSceneWordsUnchanged:true,imagesOnly:true,videoGenerated:false,status:'awaiting-review',nativePlayback:'pending',preview:'storyboard-v2/review.html',snapshot:'storyboard-v2/project-immediately-before-apply.json',directorOverride:'storyboard-v2/director-instructions.md',frozenSkillSnapshotPreserved:true,historicalExportPreserved:'latest-export.json',createdAt:new Date().toISOString()};
await fs.writeFile(path.join(out,'applied.json'),JSON.stringify(receipt,null,2));
await fs.writeFile(path.join(root,'latest-storyboard.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt));
