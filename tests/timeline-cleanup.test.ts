import {test} from 'node:test';import assert from 'node:assert/strict';
import {newProject,newScene,id,makeClip,projectSchema,totalFrames,type Asset} from '../shared/project.ts';import {closeTimelineGaps} from '../shared/timeline-cleanup.ts';import {buildPlaybackIndex,playbackWindow} from '../shared/playback-index.ts';import {visualState} from '../shared/composition.ts';
function asset(sceneId:string,kind:Asset['kind']='video'):Asset{const v=id();return {id:id(),name:kind,sceneId,kind,outdated:false,activeVersionId:v,versions:[{id:v,path:`media/${v}.mp4`,durationFrames:500,provenance:{createdAt:'now',prompt:'',sourceVersionIds:[]}}]};}
test('cleanup removes empty rows, ripple-closes gaps, and keeps paired native sound and source offsets together',()=>{
 const p=newProject('Gaps');p.settings.fps=24;const a=p.scenes[0];a.number=1;a.estimatedFrames=96;a.source={referenceId:'SH1',startSeconds:10,endSeconds:14,verified:true,motion:'low',route:'veo',status:'review',notes:''};const empty={...newScene('Empty'),number:7,estimatedFrames:24},b={...newScene('Next'),number:12,estimatedFrames:48};p.scenes.push(empty,b);
 const picture=asset(a.id),sound=asset(a.id,'audio'),unused=asset(empty.id),next=asset(b.id);p.assets.push(picture,sound,unused,next);
 for(const at of [12,60])for(const m of [picture,sound]){const c=makeClip(a.id,m,at,24,m.kind==='audio'?'music':'visual');c.speed=1.25;c.sourceIn=at;p.clips.push(c);}
 p.clips.push(makeClip(b.id,next,24,24));const originals=structuredClone(p.clips);p.costs.push({id:'paid',provider:'Cloud',amount:4,unit:'USD',status:'recorded',scope:'history',notes:''});const costs=structuredClone(p.costs);
 p.annotations.push({id:id(),sceneId:a.id,clipId:p.clips[2].id,frame:70,paths:[],note:'contact'});const report=closeTimelineGaps(p,70);projectSchema.parse(p);
 assert.deepEqual(p.scenes.map(s=>s.number),[1,12]);assert.equal(totalFrames(p),72);assert.equal(report.removedScenes,1);assert.equal(report.frame,34);assert.equal(p.annotations[0].frame,34);assert.equal(unused.archived,true);assert.deepEqual(p.costs,costs);assert.equal(a.source.startSeconds,10);
 for(const c of p.clips){const old=originals.find(x=>x.id===c.id)!;assert.equal(c.sourceIn,old.sourceIn);assert.equal(c.speed,old.speed);assert.equal(c.durationFrames,old.durationFrames);}
 assert.deepEqual(p.clips.filter(c=>c.sceneId===a.id).map(c=>c.startFrame),[0,0,24,24]);const again=closeTimelineGaps(p);assert.equal(again.removedFrames,0);assert.equal(again.removedScenes,0);
});
test('a spanning sound is split at removed picture time; narration and in-flight scenes keep their timing',()=>{
 const p=newProject('Sound');const s=p.scenes[0];s.estimatedFrames=90;const v=asset(s.id),a=asset(s.id,'audio');p.assets.push(v,a);p.clips=[makeClip(s.id,v,10,20),makeClip(s.id,v,50,20),makeClip(s.id,a,0,90,'music')];closeTimelineGaps(p);projectSchema.parse(p);assert.deepEqual(p.clips.filter(c=>c.track==='music').map(c=>[c.startFrame,c.durationFrames,c.sourceIn]),[[0,20,10],[20,20,50]]);
 const n=newProject('Narration');n.assets.push(asset(n.scenes[0].id,'audio'));n.scenes[0].audioAssetId=n.assets[0].id;const before=totalFrames(n);closeTimelineGaps(n);assert.equal(totalFrames(n),before);projectSchema.parse(n);
 const blank=newProject('Blank');blank.scenes.push(newScene());closeTimelineGaps(blank);assert.equal(blank.scenes.length,1);assert.equal(totalFrames(blank),1);projectSchema.parse(blank);
});
test('indexed playback matches transition timing and warms a bounded set of next media',()=>{
 const p=newProject('Index');p.settings.fps=24;p.scenes=[];
 for(let i=0;i<426;i++){const s={...newScene(),number:i+1,estimatedFrames:24};p.scenes.push(s);const v=asset(s.id);p.assets.push(v);p.clips.push(makeClip(s.id,v,0,24));}
 const index=buildPlaybackIndex(p);assert.equal(index.total,426*24);for(const f of [0,23,24,120,9000]){const win=playbackWindow(index,f,24);assert.equal(win.active.length,1);assert.ok(win.entries.length<=4);for(const e of win.active)assert.deepEqual(visualState(p,e.clip,f,index),visualState(p,e.clip,f));}
 const next=playbackWindow(index,23,24);assert.equal(next.entries[1].clip.id,p.clips[1].id);assert.equal(playbackWindow(index,24,24).previous!.clip.id,p.clips[0].id);
});
