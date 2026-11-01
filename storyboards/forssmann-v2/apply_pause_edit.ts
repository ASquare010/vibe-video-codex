/** Adopt authorized quiet-gap-only audio derivatives and retime existing image placements. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ProjectStore} from '../../server/store.ts';
import {measure} from '../../server/media.ts';
import {id,versionSchema,resultSchema,jobSchema,totalFrames} from '../../shared/project.ts';
import {directionBasis,directorTreatmentIssue,directionIssue} from '../../shared/audio-led.ts';
import {reopenReview} from '../../shared/review.ts';
import {validateProductionResult} from '../../server/production.ts';
const projectId='761bb19c-3366-42b3-bb34-274cc9f0f625';
const store=new ProjectStore(path.resolve('data/projects')),root=store.folder(projectId),folder=path.join(root,'storyboard-v3');
const read=async(f:string)=>JSON.parse(await fs.readFile(path.join(folder,f),'utf8'));
const sha=async(f:string)=>createHash('sha256').update(await fs.readFile(f)).digest('hex');
const plan=await read('plan.json'),lock=await read('preservation-lock.json'),report=await read('audio-edit-report.json');
if(await fs.stat(path.join(folder,'applied.json')).then(()=>true,()=>false))throw new Error('Already applied; do not duplicate versions.');
const before=await store.read(projectId);
if(before.revision!==report.sourceRevision||before.jobs.some(j=>j.status==='running'||j.status==='queued'))throw new Error('Project changed or producer active.');
const words=(scenes:typeof before.scenes)=>scenes.map(({id,title,narration,spokenStyle,audioPrompt})=>({id,title,narration,spokenStyle,audioPrompt}));
if(JSON.stringify(words(before.scenes))!==JSON.stringify(lock.sceneWords)||before.clips.length!==60)throw new Error('Creator changed the locked board.');
const candidate=structuredClone(before);
for(const a of lock.audio){
  const asset=candidate.assets.find(x=>x.id===a.assetId)!,old=asset.versions.find(v=>v.id===a.sourceVersionId)!;
  if(asset.activeVersionId!==old.id||await sha(path.join(root,old.path))!==a.sourceSha256||await sha(path.join(root,a.path))!==a.sha256)throw new Error('Audio changed since preparation.');
  const meta=await measure(path.join(root,a.path),a.path,24);
  if(meta.durationFrames!==a.frames)throw new Error('Measured derivative does not match the timing map.');
  asset.versions.push(versionSchema.parse({...meta,id:a.versionId,path:a.path,provenance:{provider:'Higgsfield / local PCM edit',model:old.provenance.model,tool:'prepare_narration.py; tempo 1.0; quiet gaps only; frame-grid silence trim/pad',prompt:'Creator requested removal of excessive pauses. Preserve every retained PCM sample and its articulation speed. Conservative -48dB candidate gaps, minimum 0.65sec, retain 0.30sec and 0.12sec edges. Exact edit map in storyboard-v3/audio-edit-report.json.',createdAt:new Date().toISOString(),sourceVersionIds:[old.id]}}));
  asset.activeVersionId=a.versionId;
}
const scenes=candidate.scenes.map(s=>({...s,estimatedFrames:lock.audio.find((a:any)=>a.sceneId===s.id).frames,
  direction:'Authorized pause-only narration cleanup; exact writer words and selected images retained. '+plan.cuts.filter((c:any)=>c.sceneId===s.id).map((c:any)=>`${c.id} frames ${c.startFrame}..${c.startFrame+c.durationFrames-1}: ${c.plannedAction} Mapped speech context: ${c.speechWindow.recognizedContext}`).join('\n'),
  shots:s.shots.map(shot=>{const c=plan.cuts.find((c:any)=>c.id===shot.id);return {...shot,startFrame:c.startFrame,durationFrames:c.durationFrames,purpose:c.plannedAction}}),
  directionBasis:directionBasis(candidate,s)!,approved:false}));
const result=resultSchema.parse({summary:'Same 60 images and exact story; adopt pause-only audio derivatives and retime cuts against the edit map.',plan:{story:before.plan.story,fullNarration:before.plan.fullNarration},scenes});
const job=jobSchema.parse({id:id(),action:'storyboard',scope:'project',sceneId:scenes[0].id,clipIds:[],instructions:'Creator authorized removing excessive audio pauses. Preserve speech words/rate and all four scenes; retime existing images, no generated media.',revision:before.revision,status:'completed',createdAt:new Date().toISOString()});
validateProductionResult(before,job,result);
candidate.scenes=result.scenes!;candidate.plan={...candidate.plan,...result.plan};
if(directorTreatmentIssue(candidate)||candidate.scenes.some(s=>directionIssue(candidate,s)))throw new Error('Updated director/audio timing basis invalid.');
await fs.copyFile(path.join(root,'project.json'),path.join(folder,'project-immediately-before-apply.json'));
const updated=await store.mutate(projectId,p=>{
  p.assets=candidate.assets;p.scenes=candidate.scenes;p.plan=candidate.plan;
  p.clips=p.clips.map(clip=>{const a=p.assets.find(a=>a.id===clip.assetId)!;const c=plan.cuts.find((c:any)=>c.id===a.shotId);if(!c||a.kind!=='image')throw new Error('Unexpected placement');return {...clip,startFrame:c.startFrame,durationFrames:c.durationFrames};});
  p.transitions=[];reopenReview(p,'storyboard');p.production={status:'awaiting-review',stage:'images'};
  p.jobs.push({...job,resultApplied:true,log:'Four pause-only WAV derivatives adopted; existing 60 image clips retimed. Original audio files and versions retained. No generated speech, images or video.'});
},before.revision);
if(totalFrames(updated)!==2908)throw new Error('Wrong final duration');
const receipt={projectId,previousRevision:before.revision,revision:updated.revision,cuts:60,scenes:plan.scenes,frames:2908,seconds:2908/24,fps:24,aspectRatio:'9:16',audioEdited:'Quiet gaps only; retained PCM exact; tempo 1.0',removedSeconds:report.removedSeconds,originalAudioPreserved:true,storyAndSceneWordsUnchanged:true,selectedImagesUnchanged:true,videoGenerated:false,status:'awaiting-review',nativePlayback:'pending',preview:'storyboard-v3/review.html',fullAudio:'audio-pause-cleanup/Doctor-Holden-pause-cleaned.wav',snapshot:'storyboard-v3/project-immediately-before-apply.json',historicalExportPreserved:'latest-export.json',createdAt:new Date().toISOString()};
for(const name of [path.join(folder,'applied.json'),path.join(root,'latest-storyboard.json'),path.join(root,'latest-audio.json')])await fs.writeFile(name,JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt));
