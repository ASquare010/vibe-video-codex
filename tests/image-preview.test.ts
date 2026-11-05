import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProject,newScene,id,projectSchema,makeClip,activeVersion,type Asset} from '../shared/project.ts';
import {populateSourceReferences,placeSceneImagePreviews,placeSourceRender,isImagePreview} from '../shared/source-timeline.ts';

function fixture(){
 const p=newProject('Image stage','chatgpt');p.settings.fps=24;
 p.sourceVideo={path:'media/source.mp4',proxyPath:'media/proxy.mp4',name:'source',fps:24,durationSeconds:10,width:1280,height:720,analysis:'fixture',importedAt:'now',hasAudio:true};
 const s={...newScene('Action'),number:7,estimatedFrames:120,source:{referenceId:'S7',startSeconds:1,endSeconds:6,verified:false,motion:'high' as const,route:'minimax' as const,status:'analyzed' as const,notes:''}};
 p.scenes=[s];populateSourceReferences(p);
 const pictures=[0,1].map(i=>{const vid=id();const a:Asset={id:id(),name:'Photo '+i,kind:'image',sceneId:s.id,activeVersionId:vid,outdated:false,versions:[{id:vid,path:`media/photo-${i}.png`,width:1280,height:720,provenance:{tool:'Original generator',prompt:'actual prompt',createdAt:'now',sourceVersionIds:[]}}]};p.assets.push(a);return a;});
 const spans=pictures.map((a,i)=>({assetId:a.id,versionId:a.activeVersionId,startFrame:i*60,durationFrames:60}));
 return {p,s,pictures,spans};
}

test('scene images replace only the source picture, retaining sound, length, original assets and unapproved state',()=>{
 const {p,s,pictures,spans}=fixture(),sound=structuredClone(p.clips.filter(c=>c.track==='music')),original=structuredClone(p.assets);
 assert.equal(placeSceneImagePreviews(p,s.id,spans),true);projectSchema.parse(p);
 assert.deepEqual(p.clips.filter(c=>c.track==='music'),sound);assert.equal(s.estimatedFrames,120);assert.equal(s.approved,false);
 assert.equal(p.clips.filter(c=>c.track==='visual').length,2);
 assert.ok(p.clips.filter(c=>c.track==='visual').every(c=>isImagePreview(p.assets.find(a=>a.id===c.assetId))&&c.motion==='none'&&c.fit==='contain'));
 for(const a of original)assert.deepEqual(p.assets.find(v=>v.id===a.id),a);
 assert.ok(pictures.every(a=>activeVersion(a).provenance.tool==='Original generator'));
});

test('repeated image placement is idempotent and retains user overlays',()=>{
 const {p,s,spans}=fixture();const overlay=makeClip(s.id,null,0,10,'text');overlay.text='User note';p.clips.push(overlay);
 placeSceneImagePreviews(p,s.id,spans);const snapshot=JSON.stringify(p);
 assert.equal(placeSceneImagePreviews(p,s.id,spans),false);assert.equal(JSON.stringify(p),snapshot);assert.ok(p.clips.includes(overlay));
});

test('image previews cannot replace selected video/custom edits or use held photographs',()=>{
 const {p,s,pictures,spans}=fixture();pictures[0].outdated=true;
 assert.throws(()=>placeSceneImagePreviews(p,s.id,spans),/held\/outdated/);pictures[0].outdated=false;
 pictures[0].name='SUPPORT EMPTY SET - NOT A SHOT';assert.throws(()=>placeSceneImagePreviews(p,s.id,spans),/support/);pictures[0].name='Photo';
 const a={...pictures[0],id:id(),kind:'video' as const};p.assets.push(a);p.clips.push(makeClip(s.id,a,0,60));
 assert.throws(()=>placeSceneImagePreviews(p,s.id,spans),/Preserve/);
});

test('image preview spans must preserve duration and exact scene coverage',()=>{
 const {p,s,spans}=fixture();assert.throws(()=>placeSceneImagePreviews(p,s.id,[{...spans[0],durationFrames:10}]),/full scene/);
 assert.throws(()=>placeSceneImagePreviews(p,s.id,[spans[0],{...spans[1],startFrame:70}]),/gaps or overlaps/);
});

test('a subsequent video/native soundtrack replaces the photographs once, retaining their source assets',()=>{
 const {p,s,spans}=fixture();placeSceneImagePreviews(p,s.id,spans);const previewIds=p.assets.filter(isImagePreview).map(a=>a.id);
 const make=(kind:'video'|'audio'):Asset=>{const vid=id();return {id:id(),name:kind,kind,sceneId:s.id,activeVersionId:vid,outdated:false,versions:[{id:vid,path:'media/result.'+(kind==='video'?'mp4':'wav'),durationFrames:120,provenance:{createdAt:'now',prompt:'',sourceVersionIds:[]}}]};};
 const video=make('video'),audio=make('audio');p.assets.push(video,audio);placeSourceRender(p,video,audio);projectSchema.parse(p);
 assert.equal(p.clips.filter(c=>c.track==='visual').length,1);assert.equal(p.clips.find(c=>c.track==='visual')!.assetId,video.id);
 assert.equal(p.clips.filter(c=>c.track==='music').length,1);assert.equal(p.clips.find(c=>c.track==='music')!.assetId,audio.id);
 assert.ok(previewIds.every(x=>p.assets.some(a=>a.id===x)));assert.equal(s.approved,false);
});
