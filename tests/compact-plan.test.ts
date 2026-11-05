import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newProject,newScene,projectSchema,totalFrames,type Project} from '../shared/project.ts';
import {applyCompactPlan,assertBudget,type CompactPlan} from '../shared/compact-plan.ts';
import {populateSourceReferences} from '../shared/source-timeline.ts';

function fixture(){
 const p=newProject('Compact plan','chatgpt');p.settings.fps=24;
 p.sourceVideo={path:'media/original.mp4',proxyPath:'media/proxy.mp4',name:'source',fps:25,durationSeconds:12,width:640,height:360,analysis:'test',importedAt:'now',hasAudio:true};
 p.scenes=[0,1,2].map((n)=>({...newScene(`Original ${n+1}`),number:n+1,estimatedFrames:48,source:{referenceId:`SH${n+1}`,startSeconds:n*2,endSeconds:n*2+2,verified:false,motion:'low' as const,route:'veo' as const,status:'candidate' as const,notes:''}}));
 p.costs=[{id:'past',provider:'Higgsfield',amount:60,unit:'Higgsfield credits',status:'recorded',scope:'history',notes:''}];populateSourceReferences(p);return p;
}
test('compact plan actually removes redundant footage and coalesces reference playback with traceable cut IDs',()=>{
 const p=fixture(),before=totalFrames(p);
 const plan:CompactPlan={projectId:p.id,baseRevision:p.revision,rationale:'Reviewed test',budget:{higgsfieldTotalCap:500,higgsfieldRetryReserve:80,pricingBasis:'Recorded rate'},groups:[{anchor:1,title:'One coherent setup',segments:[{startSeconds:0,endSeconds:2,referenceId:'SH1',originalSceneNumber:1},{startSeconds:2,endSeconds:4,referenceId:'SH2',originalSceneNumber:2}],provider:'veo',reason:'Remove repeat and merge coverage',jobDurations:[4],plannedCredits:0}]};
 const result=applyCompactPlan(p,plan);projectSchema.parse(p);
 assert.equal(p.scenes.length,1);assert.equal(totalFrames(p),96);assert.ok(totalFrames(p)<before);assert.equal(p.clips.length,2);
 assert.deepEqual(p.scenes[0].source!.originalSceneNumbers,[1,2]);assert.equal(result.audit[2].newNumbers.length,0);assert.equal(p.scenes[0].generationPlan!.nativeSeconds.length,1);
 assert.equal(p.estimatedCostUsd,null);assert.equal(assertBudget(p).spent,60);
});
test('credit budget includes historical spending and retry reserve and rejects over-budget plans',()=>{
 const p=fixture();p.productionBudget={higgsfieldCreditCap:500,higgsfieldRetryReserve:80,pricingBasis:'test'};
 p.scenes[0].generationPlan={mode:'generate',state:'planned',provider:'higgsfield',nativeSeconds:[8],estimatedCredits:361,reason:'test'};
 assert.throws(()=>assertBudget(p),/exceeds/);
 p.scenes[0].generationPlan.estimatedCredits=297.5;assert.equal(assertBudget(p).unallocated,62.5);
 p.costs.push({id:'unknown',provider:'Higgsfield',amount:null,unit:'Higgsfield credits',status:'unpriced',scope:'unknown',notes:''});assert.throws(()=>assertBudget(p),/unknown Higgsfield/);
});
test('compact plans reject overlapping ranges and stale revisions before publication',()=>{
 const p=fixture(),base:CompactPlan={projectId:p.id,baseRevision:p.revision+1,rationale:'test',budget:{higgsfieldTotalCap:500,higgsfieldRetryReserve:80,pricingBasis:'test'},groups:[]};
 assert.throws(()=>applyCompactPlan(p,base),/changed/);
 base.baseRevision=p.revision;base.groups=[{anchor:1,title:'overlap',segments:[{startSeconds:0,endSeconds:3,referenceId:'a',originalSceneNumber:1},{startSeconds:2,endSeconds:4,referenceId:'b',originalSceneNumber:2}],provider:'veo',reason:'test',jobDurations:[4],plannedCredits:0}];
 assert.throws(()=>applyCompactPlan(p,base),/overlapping/);
});
