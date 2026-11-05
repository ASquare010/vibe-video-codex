/** Local, reversible scene controls. No generation calls. Run --help for usage. */
import path from 'node:path';
import { ProjectStore } from '../server/store.ts';
import { sceneNumber, sceneFrames } from '../shared/project.ts';
import { retimeSourceScene } from '../shared/rerender.ts';
const args = process.argv.slice(2);
const value = (key: string) => { const i=args.indexOf(key); return i<0 ? undefined : args[i+1]; };
if (args.includes('--help')) { console.log('npx tsx tools/edit_scene.ts --project UUID --scene 7 [--data-dir data/projects] [--speed 1.15] [--fade-in 3] [--fade-out 3] [--contrast 0.95] [--note "..."]\nWith no edits, prints scene details. Speed retimes the entire source scene and placed native sound. Fades/contrast affect visual placements only.'); }
else {
  const projectId=value('--project'), number=Number(value('--scene'));
  if (!projectId || !Number.isInteger(number) || number<1) throw new Error('Use --project UUID --scene NUMBER; see --help');
  const store=new ProjectStore(path.resolve(value('--data-dir') || process.env.VIBECUT_DATA_DIR || 'data/projects'));
  let p=await store.read(projectId); const scene=p.scenes.find(s=>sceneNumber(p,s)===number);
  if (!scene) throw new Error(`Scene ${number} not found`);
  const numeric = (key: string, min: number, max: number, integer=false) => { const raw=value(key);if(raw===undefined)return undefined;const n=Number(raw);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw new Error(`Invalid ${key}`);return n; };
  const speed=numeric('--speed',1,1.25), fadeIn=numeric('--fade-in',0,3600,true), fadeOut=numeric('--fade-out',0,3600,true), contrast=numeric('--contrast',0,3), note=value('--note');
  if ([speed,fadeIn,fadeOut,contrast,note].some(v=>v!==undefined)) p=await store.mutate(p.id,p=>{
    const s=p.scenes.find(s=>s.id===scene.id)!;
    if (speed!==undefined) { if (!s.source || s.audioAssetId || !p.clips.some(c=>c.sceneId===s.id)) throw new Error('Scene speedup needs a source take with separately placed native audio'); retimeSourceScene(p,s.id,speed); }
    for(const c of p.clips.filter(c=>c.sceneId===s.id&&['visual','overlay'].includes(c.track))){if(fadeIn!==undefined)c.fadeInFrames=fadeIn;if(fadeOut!==undefined)c.fadeOutFrames=fadeOut;if(contrast!==undefined)c.contrast=contrast;}
    if(note!==undefined){if(!s.source)throw new Error('Source notes require a source scene');s.source.notes=note;}
  },p.revision);
  const s=p.scenes.find(s=>s.id===scene.id)!;console.log(JSON.stringify({scene:s,seconds:sceneFrames(p,s)/p.settings.fps,placements:p.clips.filter(c=>c.sceneId===s.id),revision:p.revision},null,2));
}
