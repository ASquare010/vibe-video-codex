/** Apply a reviewed compact scene plan. Does not generate media or spend credits. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {ProjectStore} from '../server/store.ts';
import {applyCompactPlan,type CompactPlan} from '../shared/compact-plan.ts';
import {projectSchema} from '../shared/project.ts';
const arg=(key:string)=>{const i=process.argv.indexOf(key);return i<0?undefined:process.argv[i+1];};
const file=arg('--plan');if(!file)throw new Error('Use --plan reviewed-plan.json [--apply]');
const plan:CompactPlan=JSON.parse(await fs.readFile(file,'utf8')),store=new ProjectStore(path.resolve(process.env.VIBECUT_DATA_DIR||'data/projects'));
const before=await store.read(plan.projectId),draft=structuredClone(before),result=applyCompactPlan(draft,plan);projectSchema.parse(draft);
const summary={beforeScenes:before.scenes.length,afterScenes:draft.scenes.length,seconds:draft.plan.targetSeconds,futureJobs:draft.scenes.reduce((n,s)=>n+(s.generationPlan?.nativeSeconds.length??0),0),removedOldCandidates:result.audit.filter(a=>!a.newNumbers.length).length,budget:result.budget};
if(process.argv.includes('--apply')){
 const folder=path.join(store.folder(before.id),'revisions');await fs.writeFile(path.join(folder,`before-compact-r${before.revision}.json`),JSON.stringify(before,null,2));
 await fs.writeFile(path.join(folder,'compact-scene-plan.json'),JSON.stringify(plan,null,2));await fs.writeFile(path.join(folder,'compact-scene-map.json'),JSON.stringify(result.audit,null,2));
 await fs.writeFile(path.join(folder,'compact-edit-report.json'),JSON.stringify({...summary,reason:plan.rationale,createdAt:new Date().toISOString()},null,2));
 await store.mutate(before.id,p=>{Object.assign(p,draft);},before.revision);
}
console.log(JSON.stringify({...summary,applied:process.argv.includes('--apply')}));
