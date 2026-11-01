import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProject,newScene,shotSchema,resultSchema,jobSchema,assetSchema,id} from '../shared/project.ts';
import {directorBasis,directorPlanningInstructions,directorTreatmentIssue,directionBasis,usesDirectorFirst,writerOwnsStory,workflowSummary} from '../shared/audio-led.ts';
import {nextProductionTask,validatePlanResult,validateProductionResult} from '../server/production.ts';
import {observationDisplay} from '../shared/observer.ts';

function fixture(){
  const p=newProject('Director-first fixture');p.settings.fps=24;p.production.status='running';
  p.skill={id:'cinematic-3d-storytelling',name:'Storytelling',content:'metadata:\n  workflow: director-first-cuts-v3\n'};
  p.plan.story='A person escapes.';p.scenes[0].narration='He takes the key and opens the door.';p.plan.fullNarration=p.scenes[0].narration;
  const scenes=p.scenes.map(s=>({...s,narration:'He grabs the key. The door opens.',direction:'Approach, grasp, opening and result.',spokenStyle:'Build expectation, decisive accent, relief.',
    shots:[0,1,2].map(i=>shotSchema.parse({id:s.id+'-'+i,title:'Cut '+i,purpose:'Development '+i,startFrame:i*60,durationFrames:60,narrationAnchor:i===0?'grabs the key':'The door opens',startState:'Phase '+i,endState:'Phase '+(i+1)}))}));
  const result=resultSchema.parse({summary:'Treatment',plan:{story:p.plan.story,fullNarration:scenes.map(s=>s.narration).join(' ')},scenes});
  const job=jobSchema.parse({id:id(),action:'storyboard',scope:'project',sceneId:p.scenes[0].id,clipIds:[],instructions:'Treatment',revision:0,status:'running',createdAt:'fixture'});
  return {p,result,job};
}
test('director treatment precedes narration and final timing preserves treated events',()=>{
  const {p,result,job}=fixture();assert.equal(nextProductionTask(p)?.scope,'project');
  validateProductionResult(p,job,result);p.scenes=result.scenes!;Object.assign(p.plan,result.plan);
  assert.equal(directorTreatmentIssue(p),null);assert.equal(nextProductionTask(p)?.action,'audio');
  const s=p.scenes[0],v=id(),a=assetSchema.parse({id:id(),name:'Voice',kind:'audio',sceneId:s.id,activeVersionId:v,versions:[{id:v,path:'media/voice.wav',durationFrames:144,provenance:{createdAt:'fixture'}}]});p.assets.push(a);s.audioAssetId=a.id;
  assert.equal(nextProductionTask(p)?.scope,undefined);assert.equal(nextProductionTask(p)?.action,'storyboard');
  const timing=resultSchema.parse({summary:'Timing',sceneUpdates:[{id:s.id,directionBasis:directionBasis(p,s)!,shots:s.shots.map((shot,i)=>({...shot,startFrame:i*48,durationFrames:48}))}]});
  const timingJob={...job,scope:'scene' as const};validateProductionResult(p,timingJob,timing);Object.assign(s,timing.sceneUpdates[0]);
  assert.equal(directorTreatmentIssue(p),null);assert.equal(nextProductionTask(p)?.action,'images');
  timing.sceneUpdates[0].shots![1].endState='Different event';assert.throws(()=>validateProductionResult(p,timingJob,timing),/preserve the treated/);
  s.spokenStyle='Changed meaning';assert.ok(directorTreatmentIssue(p));assert.equal(nextProductionTask(p)?.scope,'project');
});
test('writing cannot forge treatment; treatment cannot contain media or silently rewrite recorded speech',()=>{
  const {p,result,job}=fixture();const forged=structuredClone(result);forged.plan!.directorBasis='claimed';assert.throws(()=>validatePlanResult(p,forged),/cannot certify/);
  const bad=structuredClone(result);bad.assets.push({name:'Unexpected',kind:'image',path:'media/extra.png',sceneId:p.scenes[0].id,prompt:'',startFrame:0});assert.throws(()=>validateProductionResult(p,job,bad),/without media/);
  const s=p.scenes[0],v=id();p.assets.push(assetSchema.parse({id:'voice',name:'Voice',kind:'audio',sceneId:s.id,activeVersionId:v,versions:[{id:v,path:'media/voice.wav',durationFrames:144,provenance:{createdAt:'fixture'}}]}));s.audioAssetId='voice';
  assert.throws(()=>validateProductionResult(p,job,result),/recorded narration/);
});
test('partial plan results preserve omitted factual and treatment metadata',()=>{
  const parsed=resultSchema.parse({summary:'Hook only',plan:{hook:'New hook'}});
  assert.deepEqual(parsed.plan,{hook:'New hook'});
  const {p,result,job}=fixture();p.plan.classification='factual';result.plan!.classification='fiction';
  assert.throws(()=>validateProductionResult(p,job,result),/factual classification/);
});

test('writer-owned direction preserves unrecorded words while adding staging and performance',()=>{
  const {p,result,job}=fixture();p.skill!.content+='  story-owner: writer\n';
  result.scenes![0].narration=p.scenes[0].narration;result.plan!.fullNarration=p.plan.fullNarration;
  result.scenes![0].shots.forEach((shot,i)=>shot.narrationAnchor=i===0?'takes the key':'opens the door');
  validateProductionResult(p,job,result);
  assert.equal(result.scenes![0].narration,p.scenes[0].narration);
  assert.notEqual(result.scenes![0].direction,p.scenes[0].direction);
  assert.notEqual(result.scenes![0].spokenStyle,p.scenes[0].spokenStyle);
  assert.ok(result.plan!.directorBasis);
});

test('writer-owned direction rejects story, wording and redistribution changes before recording',()=>{
  const {p,result,job}=fixture();p.skill!.content+='  story-owner: writer\n';
  assert.ok(p.scenes.every(s=>!s.audioAssetId));
  assert.throws(()=>validateProductionResult(p,job,result),/preserve the writer story and exact script/);
  result.plan!.fullNarration=p.plan.fullNarration;
  assert.throws(()=>validateProductionResult(p,job,result),/preserve the full script/);
  result.scenes![0].narration=p.scenes[0].narration;
  result.scenes![0].shots.forEach(shot=>shot.narrationAnchor='opens the door');
  for (const field of ['story','hook','researchNotes'] as const) {
    const changed=structuredClone(result);changed.plan![field]='Different story commitment';
    assert.throws(()=>validateProductionResult(p,job,changed),/preserve the writer story and exact script/);
  }
  const second=newScene('Next');second.narration='He escapes.';p.scenes.push(second);
  p.plan.fullNarration+=' '+second.narration;
  result.plan!.fullNarration=p.plan.fullNarration;
  result.scenes![0].narration=p.scenes[0].narration+' He';
  result.scenes!.push({...second,narration:'escapes.'});
  assert.equal(result.scenes!.map(s=>s.narration).join(' '),p.plan.fullNarration);
  assert.throws(()=>validateProductionResult(p,job,result),/preserve every writer scene narration exactly/);
});

test('new direction policy reaches task instructions without changing frozen snapshots',()=>{
  const {p,result,job}=fixture();assert.equal(writerOwnsStory(p),false);
  // A frozen v3 project still allows the original unrecorded rewrite.
  validateProductionResult(p,job,result);
  p.skill!.content+='  story-owner: writer\n';assert.equal(writerOwnsStory(p),true);
  assert.match(directorPlanningInstructions(p),/read-only input/);
  assert.match(nextProductionTask(p)!.instructions,/at least two brief cuts/);
  assert.match(workflowSummary(p),/script unchanged/);
  p.skill!.content='metadata:\n  workflow: audio-led-cuts-v2\n  story-owner: writer\n';assert.equal(writerOwnsStory(p),false);
});
test('frozen v2 and source routes do not opt into director-first; progress distinguishes treatment',()=>{
  const {p}=fixture();p.skill!.content='metadata:\n  workflow: audio-led-cuts-v2\n';assert.equal(usesDirectorFirst(p),false);assert.equal(nextProductionTask(p)?.action,'audio');
  p.skill!.content='metadata:\n  workflow: director-first-cuts-v3\n';p.production.stage='treatment';
  assert.equal(observationDisplay(p,{threadId:'fixture',status:'running',label:'Working',checkedAt:'fixture',messages:[],activity:[]}).label,'Directing the story, action and performance');
  p.sourceVideo={path:'source/a.mp4',proxyPath:'source/a.mp4',name:'Source',fps:24,durationSeconds:1,width:64,height:64,analysis:'fixture',importedAt:'fixture'};assert.equal(usesDirectorFirst(p),false);
});
