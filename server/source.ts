import fs from 'node:fs/promises';
import path from 'node:path';
import { sourceVideoSchema, sourceShotSchema, newScene, type Project } from '../shared/project.ts';
import { ProjectStore, HttpError } from './store.ts';
import { populateSourceReferences, excludeSourceRanges, type Exclusion } from '../shared/source-timeline.ts';
import { runMedia, ffmpegPath, probePath } from './media.ts';

// Local analysis only. Scores propose cuts; an agent must inspect actual camera changes.
export function cutBoundaries(text: string, duration: number) {
  const times = [...text.matchAll(/pts_time:([\d.]+)/g)].map(m => Number(m[1]));
  const unique = [...new Set(times.filter(t => t > 0 && t < duration))].sort((a, b) => a - b);
  if (unique.length > 2000) throw new HttpError(400, 'More than 2,000 cut candidates; analyze a shorter source or adjust the detector');
  return [0, ...unique, duration];
}
export async function analyzeSource(store: ProjectStore, projectId: string, file: string, name: string, exclusions: Exclusion[] = []) {
  const before = await store.read(projectId);
  const empty = (p: Project) => !p.sourceVideo && !p.assets.length && !p.clips.length && p.scenes.length === 1 && !p.scenes[0].narration.trim() && !p.scenes[0].shots.length;
  if (!empty(before)) throw new HttpError(409, 'Import a source into a new empty project so existing scenes and renders stay intact');
  if (!/\.(mp4|mov|mkv|webm)$/i.test(name)) throw new HttpError(400, 'Choose MP4, MOV, MKV or WebM');
  const metadata = JSON.parse((await runMedia(probePath(), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file])).toString());
  const v = metadata.streams.find((s: any) => s.codec_type === 'video');
  const duration = Number(metadata.format.duration), [num, den] = String(v?.avg_frame_rate || '').split('/').map(Number);
  if (!v || !Number.isFinite(duration) || duration <= 0 || duration > 3600 || !(num / den > 0)) throw new HttpError(400, 'Use a video with valid timing, up to one hour');
  const relative = `media/source-${crypto.randomUUID()}`;
  const folder = path.join(store.folder(projectId), relative); await fs.mkdir(folder);
  const original = `original${path.extname(name).toLowerCase()}`;
  await fs.copyFile(file, path.join(folder, original));
  const raw = (await runMedia(ffmpegPath(), ['-v', 'error', '-i', file, '-an', '-vf', "scale=320:-2,select='gt(scene,0.30)',metadata=print:file=-", '-f', 'null', '-'], 8 * 1024 * 1024)).toString();
  const rawBounds = cutBoundaries(raw, duration); let bounds=rawBounds; let refinement="Structural verification unavailable; manual sequence review required.";
  await fs.writeFile(path.join(folder, 'cut-detection.txt'), raw);
  await fs.writeFile(path.join(folder,'raw-boundaries.json'),JSON.stringify(rawBounds));
  try {
    const python=path.resolve(process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python');
    await fs.stat(python);
    await runMedia(python,[path.resolve('tools/refine_source_cuts.py'),'--source',file,'--candidates',path.join(folder,'raw-boundaries.json'),'--fps',String(num/den),'--out',path.join(folder,'boundary-analysis.json'),'--ffmpeg',ffmpegPath()]);
    const report=JSON.parse(await fs.readFile(path.join(folder,'boundary-analysis.json'),'utf8'));bounds=report.boundaries;
    refinement=`Structural frame-persistence pass retained ${bounds.length-2} boundary candidates; ${report.events.length} transient light events remain inside the footage. Mandatory Codex second pass must group continuous action and verify all proposed generation boundaries using previous/current/next frames.`;
  } catch(error) {await fs.writeFile(path.join(folder,'boundary-analysis-unavailable.txt'),String((error as Error).message));}

  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-i', file, '-vf', 'scale=640:-2,fps=12', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '25', '-c:a', 'aac', '-ac', '1', '-ar', '16000', '-b:a', '48k', '-movflags', '+faststart', path.join(folder, 'proxy.mp4')]);
  const source = sourceVideoSchema.parse({ path: `${relative}/${original}`, proxyPath: `${relative}/proxy.mp4`, name: path.basename(name), fps: num / den, durationSeconds: duration, width: v.width, height: v.height, importedAt: new Date().toISOString(), hasAudio: metadata.streams.some((s:any)=>s.codec_type==='audio'), analysis: `Local scene-score threshold0.30 at320px. ${refinement} Proxy640px/12fps; inspect native action frames. Camera cuts and production scenes are separate: no candidate is generation-ready until reviewed.` });
  const scenes = bounds.slice(0, -1).map((start, i) => ({ ...newScene(`Scene ${String(i + 1).padStart(3, '0')}`), number: i + 1, estimatedFrames: Math.max(1, Math.round((bounds[i + 1] - start) * 24)), direction: 'Inspect this source camera take before preparing its realistic remake.', source: sourceShotSchema.parse({ referenceId: `SH${String(i + 1).padStart(4, '0')}`, startSeconds: start, endSeconds: bounds[i + 1] }) }));
  return store.mutate(projectId, p => { if (!empty(p)) throw new HttpError(409, 'Project changed during source analysis; analysis files are preserved'); p.settings.fps = 24; p.sourceVideo = source; p.scenes = scenes; p.plan.targetSeconds = duration; excludeSourceRanges(p,exclusions); populateSourceReferences(p); }, before.revision);
}
