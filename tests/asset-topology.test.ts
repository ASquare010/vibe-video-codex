import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProject,newScene,id,type Asset} from '../shared/project.ts';
import {applyAssetTopology} from '../server/asset-topology.ts';
test('scene split clones retain canonical media and provenance without trusting proposed paths or tool claims',()=>{
 const p=newProject('Topology'),s=p.scenes[0],v=id(),a:Asset={id:id(),sceneId:s.id,name:'Original',kind:'video',activeVersionId:v,outdated:false,versions:[{id:v,path:'media/original.mp4',durationFrames:240,width:864,height:480,provenance:{tool:'Trusted import',createdAt:'now',prompt:'source',sourceVersionIds:[]}}]};p.assets.push(a);const draft=structuredClone(p),next={...newScene('Next'),number:2};draft.scenes.push(next);const clone=structuredClone(a);clone.id=id();clone.sceneId=next.id;clone.versions[0].id=id();clone.activeVersionId=clone.versions[0].id;clone.versions[0].provenance.tool='Untrusted claim';draft.assets.push(clone);applyAssetTopology(p,draft);assert.equal(p.assets[1].sceneId,next.id);assert.equal(p.assets[1].versions[0].provenance.tool,'Trusted import');assert.deepEqual(p.assets[1].versions[0].provenance.sourceVersionIds,[v]);
 const bad=structuredClone(draft);bad.assets[1].id=id();bad.assets[1].versions[0].path='media/unregistered.mp4';assert.throws(()=>applyAssetTopology(structuredClone(p),bad),/New media must be imported/);
});
