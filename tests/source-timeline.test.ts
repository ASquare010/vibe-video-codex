import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {newProject,newScene,projectSchema,activeVersion,jobSchema,id} from '../shared/project.ts';
import {populateSourceReferences,excludeSourceRanges} from '../shared/source-timeline.ts';
import {ProjectStore} from '../server/store.ts';
import {analyzeSource} from '../server/source.ts';
import {applyResult,ffmpegPath,runMedia} from '../server/media.ts';

test('reference picture and sound use the right source offset and excluded credits never become clips',()=>{
 const p=newProject('References','chatgpt');p.settings.fps=24;p.sourceVideo={path:'media/original.mp4',proxyPath:'media/proxy.mp4',name:'source',fps:25,durationSeconds:20,width:1920,height:1080,analysis:'test',importedAt:'now',hasAudio:true};
 p.scenes=[{...newScene('Story'),number:7,estimatedFrames:120,source:{referenceId:'SH7',startSeconds:10,endSeconds:15,verified:true,motion:'high',route:'seedance',status:'ready',notes:''}},{...newScene('Credits'),number:8,estimatedFrames:120,source:{referenceId:'SH8',startSeconds:15,endSeconds:20,verified:true,motion:'low',route:'unassigned',status:'excluded',notes:''}}];
 excludeSourceRanges(p,[{startSeconds:15,endSeconds:20,reason:'Ending credits'}]);populateSourceReferences(p);projectSchema.parse(p);
 assert.equal(p.scenes.length,1);assert.equal(p.scenes[0].number,7);assert.equal(p.clips.length,2);
 assert.ok(p.clips.every(c=>c.sourceIn===240&&c.durationFrames===120));
 assert.ok(p.assets.every(a=>a.role==='source-reference'&&activeVersion(a).path==='media/proxy.mp4'));
 const ids=p.clips.map(c=>c.id);populateSourceReferences(p);assert.deepEqual(p.clips.map(c=>c.id),ids);
});

test('a completed generated result replaces its own reference in place and preserves source evidence and native sound',async()=>{
 const root=await fs.mkdtemp(path.resolve('data/reference-result-')),store=new ProjectStore(root),initial=newProject('Result replacement','chatgpt');await store.create(initial);
 const file=path.join(root,'source.mp4');await runMedia(ffmpegPath(),['-v','error','-y','-f','lavfi','-i','color=c=green:s=96x64:r=24:d=1','-f','lavfi','-i','sine=frequency=440:duration=1','-c:v','libx264','-c:a','aac','-shortest',file]);
 let p=await analyzeSource(store,initial.id,file,'source.mp4');const scene=p.scenes[0],referenceId=p.clips.find(c=>c.track==='visual')!.id,originalAssets=p.assets.map(a=>a.id);
 const job=jobSchema.parse({id:id(),action:'video',sceneId:scene.id,clipIds:[],instructions:'Fixture',revision:p.revision,scope:'scene',status:'completed',createdAt:'now'});
 p=await store.mutate(p.id,p=>{p.jobs.push(job);});const folder=path.join(store.folder(p.id),'jobs',job.id);await fs.mkdir(folder);
 await fs.writeFile(path.join(folder,'input.json'),JSON.stringify({project:p}));
 await fs.copyFile(file,path.join(store.folder(p.id),'media/render.mp4'));
 await fs.writeFile(path.join(folder,'result.json'),JSON.stringify({summary:'Rendered fixture',assets:[{name:'Ready render',kind:'video',sceneId:scene.id,path:'media/render.mp4',provider:'Fixture',model:'Local',prompt:'test'}]}));
 const done=await applyResult(store,p.id,job.id);projectSchema.parse(done);
 assert.equal(done.clips.filter(c=>c.track==='visual').length,1);assert.equal(done.clips.find(c=>c.track==='visual')!.id,referenceId);
 assert.ok(done.assets.filter(a=>originalAssets.includes(a.id)).every(a=>a.role==='source-reference'));
 assert.ok(done.clips.every(c=>done.assets.find(a=>a.id===c.assetId)?.role==='render'));
 assert.equal(done.clips.filter(c=>c.track==='music').length,1);assert.equal(done.scenes[0].source!.status,'review');
});
