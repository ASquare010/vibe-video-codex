/** Local scene topology edits. No generation. Split a portion, then join it to its actual neighbor. */
import path from 'node:path';
import fs from 'node:fs/promises';
import {ProjectStore} from '../server/store.ts';
import {sceneFrames} from '../shared/project.ts';
import {joinScenes,splitSceneAt} from '../shared/scene-editing.ts';
const value=(key:string)=>{const i=process.argv.indexOf(key);return i<0?undefined:process.argv[i+1];};
if(process.argv.includes('--help')){console.log('tools/edit_scenes.ts --project UUID --join 12,13 [--apply]\n--split-scene 17 --at-seconds LOCAL_EDIT_SECONDS [--source-seconds VERIFIED_SOURCE_TIME] [--apply]\nWithout --apply, validates a copy and reports proposed changes. Applied edits save a full revision backup.');process.exit(0);}
const projectId=value('--project');if(!projectId)throw new Error('Use --project UUID; see --help');
const store=new ProjectStore(path.resolve('data/projects')),before=await store.read(projectId);
function change(p:typeof before){if(value('--join')){const numbers=value('--join')!.split(',').map(Number);return joinScenes(p,numbers.map(n=>{const s=p.scenes.find(s=>s.number===n);if(!s)throw new Error(`Scene ${n} not found`);return s.id;}));}
 const number=Number(value('--split-scene')),seconds=Number(value('--at-seconds')),s=p.scenes.find(s=>s.number===number);if(!s||!Number.isFinite(seconds))throw new Error('Choose a valid saved scene and local edit seconds');const source=value('--source-seconds');return splitSceneAt(p,s.id,Math.round(seconds*p.settings.fps),source?{sourceSeconds:Number(source)}:{});}
const draft=structuredClone(before),proposal=change(draft);
if(!process.argv.includes('--apply'))console.log(JSON.stringify({dryRun:true,proposal,scenes:draft.scenes.length}));
else{await fs.writeFile(path.join(store.folder(projectId),'revisions',`before-topology-r${before.revision}.json`),JSON.stringify(before,null,2));let applied;const saved=await store.mutate(projectId,p=>{applied=change(p);},before.revision);console.log(JSON.stringify({revision:saved.revision,result:applied}));}
