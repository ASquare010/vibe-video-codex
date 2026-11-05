import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProject,newScene,projectSchema,id,makeClip,type Asset} from '../shared/project.ts';
import {restoreSourceStructure} from '../shared/restore-source-structure.ts';
function fixture(){
 const original=newProject('Continuity','chatgpt');original.settings.fps=24;original.sourceVideo={path:'media/source.mp4',proxyPath:'media/proxy.mp4',name:'source',fps:25,durationSeconds:10,width:1280,height:720,analysis:'',importedAt:'now',hasAudio:true};
 original.scenes=[1,2,3].map((n)=>({...newScene(`Scene${n}`),number:n,estimatedFrames:48,source:{referenceId:`SH${n}`,startSeconds:(n-1)*2,endSeconds:n*2,verified:true,motion:'low' as const,route:'veo' as const,status:'ready' as const,notes:''}}));
 const current=structuredClone(original);current.scenes=current.scenes.filter(s=>s.number!==2);current.revision=7;
 for(const n of [1,3]){const s=current.scenes.find(s=>s.number===n)!,v=id();const a:Asset={id:id(),name:`render${n}`,sceneId:s.id,kind:'video',role:'render',versions:[{id:v,path:`media/render${n}.mp4`,durationFrames:96,provenance:{prompt:'test',createdAt:'now',sourceVersionIds:[]}}],activeVersionId:v,outdated:false};s.estimatedFrames=96;current.assets.push(a);current.clips.push(makeClip(s.id,a,0,96));}
 current.costs=[{id:'paid',provider:'Higgsfield',amount:10,unit:'Higgsfield credits',status:'recorded',scope:'test',notes:''}];return {current,original};
}
test('restoring source coverage preserves exact keeper placement and costs, archives other renders and restores picture plus sound',()=>{
 const {current:p,original}=fixture(),keeper=structuredClone(p.clips.find(c=>c.sceneId===p.scenes[0].id)),costs=structuredClone(p.costs),bad=p.assets.find(a=>a.sceneId===p.scenes[1].id)!;
 restoreSourceStructure(p,original,{projectId:p.id,baseRevision:7,scopeEnd:6,reuse:[{target:1,from:1,exact:true}],removeNumbers:[]});projectSchema.parse(p);
 assert.deepEqual(p.clips.find(c=>c.id===keeper!.id),keeper);assert.deepEqual(p.costs,costs);assert.equal(p.assets.find(a=>a.id===bad.id)!.archived,true);
 assert.deepEqual(p.scenes.map(s=>s.number),[1,2,3]);for(const n of [2,3]){const s=p.scenes.find(s=>s.number===n)!;const clips=p.clips.filter(c=>c.sceneId===s.id);assert.equal(clips.length,2);assert.ok(clips.every(c=>p.assets.find(a=>a.id===c.assetId)!.role==='source-reference'));}
});
test('visually verified internal camera cuts get unused stable numbers and ordered source offsets without changing existing numbers',()=>{
 const {current:p,original}=fixture();restoreSourceStructure(p,original,{projectId:p.id,baseRevision:7,scopeEnd:6,reuse:[],removeNumbers:[],splits:[{number:2,cuts:[2.5,3.25],newNumbers:[4,5]}]});projectSchema.parse(p);
 assert.deepEqual(p.scenes.map(s=>s.number),[1,2,4,5,3]);assert.deepEqual(p.scenes.map(s=>s.source!.startSeconds),[0,2,2.5,3.25,4]);assert.equal(p.scenes.find(s=>s.number===2)!.id,original.scenes[1].id);
 assert.throws(()=>restoreSourceStructure(p,original,{projectId:p.id,baseRevision:8,scopeEnd:6,reuse:[],removeNumbers:[]}),/revision mismatch/);
});
