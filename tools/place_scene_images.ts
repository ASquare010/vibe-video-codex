/** Place already-registered selected scene photographs. No generation or inference. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {ProjectStore} from '../server/store.ts';
import {SkillCatalog} from '../server/skills.ts';
import {placeSceneImagePreviews,type ImagePreviewSpan} from '../shared/source-timeline.ts';
import {totalFrames} from '../shared/project.ts';

const at=process.argv.indexOf('--plan');if(at<0)throw Error('Use --plan PLAN.json [--apply]');
const file=path.resolve(process.argv[at+1]),plan=JSON.parse(await fs.readFile(file,'utf8')) as {
  projectId:string;expectedRevision:number;refreshSkill?:boolean;
  scenes:{sceneId:string;number:number;spans:(ImagePreviewSpan&{sha256:string;phase?:string;sourceTime?:number})[]}[];
};
const store=new ProjectStore(path.resolve('data/projects')),before=await store.read(plan.projectId),base=store.folder(plan.projectId),relative=path.relative(base,file);
if(relative.startsWith('..')||path.isAbsolute(relative))throw Error('Save the plan inside its project');
if(new Set(plan.scenes.map(s=>s.sceneId)).size!==plan.scenes.length)throw Error('Duplicate scene entries');
for(const row of plan.scenes){
 const scene=before.scenes.find(s=>s.id===row.sceneId);if(!scene||scene.number!==row.number)throw Error('Scene identity changed');
 for(const span of row.spans){const asset=before.assets.find(a=>a.id===span.assetId),version=asset?.versions.find(v=>v.id===span.versionId);if(!version)throw Error('Missing registered version');const bytes=await fs.readFile(await store.safeFile(before.id,version.path));if(crypto.createHash('sha256').update(bytes).digest('hex')!==span.sha256)throw Error('Photograph changed: '+asset!.name);}
}
const preview=structuredClone(before),changes=plan.scenes.filter(s=>placeSceneImagePreviews(preview,s.sceneId,s.spans));
if(changes.length&&before.revision!==plan.expectedRevision)throw Error('Project changed; refresh the placement plan before applying');
if(totalFrames(preview)!==totalFrames(before))throw Error('Preview changed project timing');
const report={projectId:before.id,revision:before.revision,scenes:changes.map(s=>s.number),images:changes.reduce((n,s)=>n+s.spans.length,0),generatedRequests:0,approved:false};
if(!process.argv.includes('--apply')){console.log(JSON.stringify({status:'dry-run',...report}));process.exit(0);}
const skill=plan.refreshSkill?await new SkillCatalog().read('video-rerender'):undefined;
if(!changes.length&&(!skill||before.skill?.content===skill.content)){console.log(JSON.stringify({status:'unchanged',...report}));process.exit(0);}
const saved=await store.mutate(before.id,p=>{for(const row of changes)placeSceneImagePreviews(p,row.sceneId,row.spans);if(skill)p.skill=skill;},before.revision);
const receipt={...report,revision:saved.revision,createdAt:new Date().toISOString(),plan:relative.replaceAll('\\','/'),
 previousVisuals:before.clips.filter(c=>changes.some(s=>s.sceneId===c.sceneId)&&c.track==='visual'),
 previousTransitions:before.transitions.filter(t=>before.clips.some(c=>changes.some(s=>s.sceneId===c.sceneId)&&(c.id===t.fromClipId||c.id===t.toClipId))),
 audioPreserved:true,durationFrames:totalFrames(saved)};
await fs.writeFile(path.join(path.dirname(file),`placement-receipt-rev${saved.revision}.json`),JSON.stringify(receipt,null,2));
await fs.writeFile(path.join(path.dirname(file),'placement-receipt.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify({status:'applied',...report,revision:saved.revision}));
