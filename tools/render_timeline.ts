/** Local export only. Optional --scene uses its persistent scene number. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {ProjectStore} from '../server/store.ts';
import {renderProject} from '../server/export.ts';
import {sceneNumber,totalFrames} from '../shared/project.ts';
const arg=(key:string)=>{const i=process.argv.indexOf(key);return i<0?undefined:process.argv[i+1];};
const projectId=arg('--project');if(!projectId)throw new Error('Use --project UUID [--scene NUMBER]');
const store=new ProjectStore(path.resolve(process.env.VIBECUT_DATA_DIR||'data/projects'));
let p=await store.read(projectId);const number=arg('--scene'),through=arg('--through-source');if(number!==undefined&&through!==undefined)throw new Error('Choose --scene OR --through-source');
if(through!==undefined){const end=Number(through);if(!Number.isFinite(end)||end<=0)throw new Error('Invalid source scope');const scenes=p.scenes.filter(s=>s.source&&s.source.endSeconds<=end+1e-5),sceneIds=new Set(scenes.map(s=>s.id)),clips=p.clips.filter(c=>sceneIds.has(c.sceneId)),clipIds=new Set(clips.map(c=>c.id));if(!scenes.length)throw new Error('Empty source scope');p={...p,scenes,clips,assets:p.assets.filter(a=>sceneIds.has(a.sceneId)),transitions:p.transitions.filter(t=>clipIds.has(t.fromClipId)&&clipIds.has(t.toClipId)),jobs:[],annotations:[],review:{...p.review,comments:[]}};}
if(number!==undefined){
 const scene=p.scenes.find(s=>sceneNumber(p,s)===Number(number));if(!scene)throw new Error('Scene not found');
 const clips=p.clips.filter(c=>c.sceneId===scene.id),ids=new Set(clips.map(c=>c.id));
 p={...p,scenes:[scene],clips,transitions:p.transitions.filter(t=>ids.has(t.fromClipId)&&ids.has(t.toClipId)),assets:p.assets.filter(a=>a.sceneId===scene.id),jobs:[],annotations:[],review:{...p.review,comments:[]}};
}
let last=-1;store.on('change',e=>{if(e.type==='export'){const count=Number(e.message?.match(/\((\d+)\//)?.[1]);if(count===p.scenes.length||count-last>=20){last=count;console.log(e.message);}}});
const relative=await renderProject(store,p),file=path.join(store.folder(p.id),relative);
const receipt={projectId:p.id,revision:p.revision,scene:number?Number(number):null,throughSourceSeconds:through?Number(through):null,frames:totalFrames(p),fps:p.settings.fps,file,referenceScenes:p.scenes.filter(s=>p.clips.some(c=>c.sceneId===s.id&&p.assets.find(a=>a.id===c.assetId)?.role==='source-reference')).length,createdAt:new Date().toISOString()};
await fs.writeFile(path.join(store.folder(p.id),number?`scene-${number}-latest-export.json`:through?`through-source-${through}-latest-export.json`:'latest-export.json'),JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt));
