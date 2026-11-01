import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProject,newScene,id,assetSchema,shotSchema,resultSchema,jobSchema} from '../shared/project.ts';
import {directionBasis,directionIssue,usesAudioLedCuts} from '../shared/audio-led.ts';
import {nextProductionTask,validatePlanResult,validateProductionResult} from '../server/production.ts';
import {observationDisplay} from '../shared/observer.ts';

function fixture() {
  const p=newProject('Audio-led protocol');p.settings.fps=24;p.production.status='running';
  p.skill={id:'cinematic-3d-storytelling',name:'Storytelling',content:'metadata:\n  workflow: audio-led-cuts-v2\n'};
  const s=p.scenes[0];s.narration='He approached the door and took the key.';
  const v=id(),a=assetSchema.parse({id:id(),sceneId:s.id,name:'Narration',kind:'audio',activeVersionId:v,versions:[{id:v,path:'media/voice.wav',durationFrames:192,provenance:{createdAt:'fixture'}}]});
  p.assets.push(a);s.audioAssetId=a.id;
  const directed={...s,direction:'A continuous room; approach, grasp, then reveal.',directionBasis:directionBasis(p,s)!,shots:[
    shotSchema.parse({id:'approach',title:'Approach',startFrame:0,durationFrames:72,narrationAnchor:'He approached',startState:'Person at room entrance',endState:'Hand reaches toward key'}),
    shotSchema.parse({id:'contact',title:'Essential grasp',startFrame:72,durationFrames:24,narrationAnchor:'took the key',startState:'Hand reaching toward key',endState:'Key held in hand'}),
    shotSchema.parse({id:'reveal',title:'Inside-door reveal',startFrame:96,durationFrames:96,narrationAnchor:'the door',startState:'Same person holds key beside closed door',endState:'Door partly opens toward established room'})]};
  return {p,s,a,directed};
}
const job=(sceneId:string,action:'storyboard'|'images')=>jobSchema.parse({id:id(),sceneId,action,clipIds:[],instructions:'fixture',revision:0,status:'running',createdAt:'fixture'});

test('new writing accepts complete scene speech without premature visual prompts',()=>{
  const {p,s}=fixture();const story={...newScene('Story only'),narration:s.narration};
  const result=resultSchema.parse({summary:'Script',plan:{story:'Complete event',fullNarration:s.narration},scenes:[story]});
  assert.doesNotThrow(()=>validatePlanResult(p,result));
  result.plan!.fullNarration+=' Extra words.';assert.throws(()=>validatePlanResult(p,result),/missing or repeated/);
});

test('partial prompt and speed results preserve omitted narration, source offsets and settings',()=>{
  const parsed=resultSchema.parse({summary:'Only requested fields',sceneUpdates:[{id:'scene',imagePrompt:'Resolved'}],clipUpdates:[{id:'clip',speed:1.5}],settings:{videoResolution:'1080'}});
  assert.deepEqual(parsed.sceneUpdates,[{id:'scene',imagePrompt:'Resolved'}]);
  assert.deepEqual(parsed.clipUpdates,[{id:'clip',speed:1.5}]);
  assert.deepEqual(parsed.settings,{videoResolution:'1080'});
});

test('essential inserts have variable durations; gaps, repeats and stale audio are rejected',()=>{
  const {p,s,a,directed}=fixture();assert.equal(directionIssue(p,directed),null);
  for(const frames of [19,24,48]) { // About 0.8, 1 and 2 seconds at 24 fps; no fixed insert target.
    const varied=structuredClone(directed);varied.shots[1].durationFrames=frames;
    varied.shots[2].startFrame=72+frames;varied.shots[2].durationFrames=192-72-frames;
    assert.equal(directionIssue(p,varied),null);
    assert.doesNotThrow(()=>validateProductionResult(p,job(s.id,'storyboard'),resultSchema.parse({summary:'Variable timing',sceneUpdates:[varied]})));
  }
  assert.doesNotThrow(()=>validateProductionResult(p,job(s.id,'storyboard'),resultSchema.parse({summary:'Direction',sceneUpdates:[directed]})));
  const gap=structuredClone(directed);gap.shots[1].startFrame++;assert.match(directionIssue(p,gap)!,/gaps or overlaps/);
  const duplicate=structuredClone(directed);duplicate.shots[1].id=duplicate.shots[0].id;assert.match(directionIssue(p,duplicate)!,/unique/);
  a.activeVersionId=id();a.versions.push({...a.versions[0],id:a.activeVersionId});assert.match(directionIssue(p,directed)!,/current measured/);
});

test('all narration precedes direction, which precedes images; frozen skill stays on its old route',()=>{
  const {p,s,directed}=fixture();assert.equal(nextProductionTask(p)?.action,'storyboard');
  const second=newScene('Second');second.narration='Another thought.';p.scenes.push(second);
  assert.equal(nextProductionTask(p)?.action,'audio');p.scenes.pop();
  Object.assign(s,directed);assert.equal(nextProductionTask(p)?.action,'images');
  s.directionBasis=undefined;p.skill!.content='Previously saved skill text.';
  assert.equal(usesAudioLedCuts(p),false);assert.equal(nextProductionTask(p)?.action,'images');
});

test('direction cannot alter accepted speech, and image writers cannot remove the contact cut',()=>{
  const {p,s,directed}=fixture();
  assert.throws(()=>validateProductionResult(p,job(s.id,'storyboard'),resultSchema.parse({summary:'Invalid rewrite',sceneUpdates:[{...directed,narration:'Different event.'}]})),/preserving accepted narration/);
  Object.assign(s,directed);
  assert.throws(()=>validateProductionResult(p,job(s.id,'images'),resultSchema.parse({summary:'Dropped essential insert',sceneUpdates:[{id:s.id,shots:[s.shots[0],s.shots[2]]}]})),/preserve the director cut/);
});

test('archived images do not incorrectly satisfy pending shot work',()=>{
  const {p,s,directed}=fixture();Object.assign(s,directed);
  for(const shot of s.shots){const v=id();p.assets.push(assetSchema.parse({id:id(),sceneId:s.id,shotId:shot.id,name:'Rejected',kind:'image',activeVersionId:v,archived:true,versions:[{id:v,path:'media/rejected.png',provenance:{createdAt:'fixture'}}]}));}
  assert.equal(nextProductionTask(p)?.action,'images');
});

test('the director stage is displayed as timing work rather than image generation',()=>{
  const {p}=fixture();p.production.stage='direction';
  const display=observationDisplay(p,{threadId:'fixture',status:'running',label:'Working',checkedAt:'fixture',messages:[],activity:[]});
  assert.equal(display.label,'Directing scene timing and cuts');assert.equal(display.progress,undefined);
});
