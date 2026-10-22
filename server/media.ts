import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import { id, activeVersion, clampSceneClips, invalidateNarration, makeClip, sceneFrames, resultSchema, projectSchema, cleanTransitions, type Asset, type Project, type Version } from '../shared/project.ts';
import { HttpError, ProjectStore } from './store.ts';

export const ffmpegPath = () => process.env.FFMPEG_PATH || ffmpeg || 'ffmpeg';
const probePath = () => process.env.FFPROBE_PATH || ffprobe.path;
export function runMedia(executable: string, args: string[], maxBytes = 16 * 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const process = spawn(executable, args, { windowsHide: true });
    const output: Buffer[] = []; let size = 0; let error = '';
    process.stdout.on('data', (data: Buffer) => { size += data.length; if (size > maxBytes) { process.kill(); reject(new Error('Media output exceeds the allowed size')); } else output.push(data); });
    process.stderr.on('data', data => { error = (error + data.toString()).slice(-5000); });
    const timer = setTimeout(() => { process.kill(); reject(new Error('Media processing timed out')); }, 10 * 60 * 1000);
    process.on('error', e => { clearTimeout(timer); reject(e); });
    process.on('exit', code => { clearTimeout(timer); if (code === 0) resolve(Buffer.concat(output)); else reject(new Error(error || 'Media tool failed')); });
  });
}
export async function measure(file: string, originalName = file): Promise<{ kind: Asset['kind']; durationFrames?: number; width?: number; height?: number; waveform?: number[] }> {
  const data = JSON.parse((await runMedia(probePath(), ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file])).toString());
  const video = data.streams?.find((s: any) => s.codec_type === 'video');
  const audio = data.streams?.find((s: any) => s.codec_type === 'audio');
  const still = /\.(png|jpe?g|webp|bmp)$/i.test(originalName);
  if (video && still) return { kind: 'image', width: video.width, height: video.height };
  const duration = Number(data.format?.duration ?? video?.duration ?? audio?.duration);
  if (!Number.isFinite(duration) || duration < 1 / 30) throw new HttpError(400, 'This file does not have a valid media duration');
  const durationFrames = Math.floor(duration * 30 + 1e-5);
  if (video) return { kind: 'video', durationFrames, width: video.width, height: video.height };
  if (!audio) throw new HttpError(400, 'Use an image, audio file or video');
  const pcm = await runMedia(ffmpegPath(), ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', '500', '-f', 'f32le', 'pipe:1']);
  const samples = new Float32Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength));
  const waveform = Array.from({ length: 120 }, (_, i) => {
    const from = Math.floor(i * samples.length / 120), to = Math.max(from + 1, Math.floor((i + 1) * samples.length / 120));
    let peak = 0; for (let j = from; j < to; j++) peak = Math.max(peak, Math.abs(samples[j] || 0)); return Math.min(1, peak);
  });
  return { kind: 'audio', durationFrames, waveform };
}
export function attachAsset(p: Project, asset: Asset, place = false) {
  p.assets.push(asset);
  const scene = p.scenes.find(s => s.id === asset.sceneId)!;
  if (asset.kind === 'audio' && !scene.audioAssetId) {
    scene.audioAssetId = asset.id; clampSceneClips(p, scene.id);
  } else if (place && asset.kind !== 'audio') {
    const start = p.clips.filter(c => c.sceneId === scene.id && c.track === 'visual').reduce((m, c) => Math.max(m, c.startFrame + c.durationFrames), 0);
    const duration = Math.min(sceneFrames(p, scene) - start, activeVersion(asset).durationFrames ?? 120);
    if (duration > 0) p.clips.push(makeClip(scene.id, asset, start, duration));
  }
}
export async function importMedia(store: ProjectStore, projectId: string, sceneId: string, file: string, name: string) {
  const allowed = /\.(png|jpe?g|webp|bmp|mp4|mov|webm|mkv|wav|mp3|m4a|aac|ogg|flac)$/i;
  if (!allowed.test(name)) throw new HttpError(400, 'Supported files: PNG, JPG, WebP, MP4, MOV, WebM, WAV, MP3, M4A, OGG, FLAC');
  const metadata = await measure(file, name);
  const relative = `media/${id()}${path.extname(name).toLowerCase()}`;
  const destination = path.join(store.folder(projectId), relative);
  await fs.copyFile(file, destination);
  const version: Version = { ...metadata, id: id(), path: relative, provenance: { prompt: '', tool: 'Imported file', createdAt: new Date().toISOString(), sourceVersionIds: [] } };
  const asset: Asset = { id: id(), name: path.basename(name), kind: metadata.kind, sceneId, versions: [version], activeVersionId: version.id, outdated: false };
  return store.mutate(projectId, p => {
    if (!p.scenes.some(s => s.id === sceneId)) throw new HttpError(400, 'Scene not found');
    attachAsset(p, asset, true);
  });
}
export async function applyResult(store: ProjectStore, projectId: string, jobId: string, options: { activateVersions?: boolean } = {}) {
  const before = await store.read(projectId);
  const job = before.jobs.find(j => j.id === jobId);
  if (!job || (job.status !== 'completed' && !(job.status === 'failed' && job.error?.includes('changed while Codex worked'))) || job.resultApplied) throw new HttpError(409, 'There is no pending result to apply');
  const resultFile = await store.safeFile(projectId, `jobs/${jobId}/result.json`);
  const result = resultSchema.parse(JSON.parse(await fs.readFile(resultFile, 'utf8')));
  if (job.action === 'plan' && result.startProduction) throw new HttpError(400, 'Draft results cannot start production directly. The app continues automatically only when the creator chose full production.');
  const rawInput = JSON.parse(await fs.readFile(await store.safeFile(projectId, `jobs/${jobId}/input.json`), 'utf8'));
  const input = { project: projectSchema.parse(rawInput.project) };
  if (job.scope === 'scene' && (result.scenes || result.plan || result.settings || result.sceneUpdates.some(s => s.id !== job.sceneId) || result.assets.some(a => a.sceneId !== job.sceneId))) throw new HttpError(400, 'Result tried to change a scene outside its scope');
  if (job.scope === 'scene' && result.removeClipIds.some(id => before.clips.some(c => c.id === id && c.sceneId !== job.sceneId))) throw new HttpError(400, 'Result tried to remove a placement outside its scope');
  const prepared = await Promise.all(result.assets.map(async a => {
    const file = await store.safeFile(projectId, a.path);
    const metadata = await measure(file);
    if (metadata.kind !== a.kind) throw new HttpError(400, 'Result media type does not match its file');
    return { proposal: a, metadata };
  }));
  return store.mutate(projectId, p => {
    if (p.jobs.find(j => j.id === jobId)?.resultApplied) throw new HttpError(409, 'Result already applied');
    const scopedScenes = (v: Project) => job.scope === 'project' ? v.scenes : v.scenes.filter(s => s.id === job.sceneId);
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    const conflict = (area: string) => { throw new HttpError(409, `${area} changed while Codex worked. The completed result is saved; review the conflicting edits before applying it.`); };
    const sceneContent = (v: Project) => scopedScenes(v).map(({ audioAssetId, approved, ...s }) => s);
    if ((result.scenes || result.assets.length) && (!same(sceneContent(p), sceneContent(input.project)) || p.skill?.content !== input.project.skill?.content || p.theme !== input.project.theme)) conflict('Story or creative direction');
    const delta = (original: any, patch: any) => Object.fromEntries(Object.entries(patch).filter(([key, value]) => key !== 'id' && !same(original?.[key], value)));
    const changedWrite = (current: any, original: any, patch: any) => Object.entries(delta(original, patch)).some(([key, value]) => !same(current?.[key], original?.[key]) && !same(current?.[key], value));
    for (const update of result.sceneUpdates) if (changedWrite(p.scenes.find(s => s.id === update.id), input.project.scenes.find(s => s.id === update.id), update)) conflict('Scene text');
    for (const update of result.clipUpdates) if (changedWrite(p.clips.find(c => c.id === update.id), input.project.clips.find(c => c.id === update.id), update)) conflict('Selected clip');
    for (const clipId of [...result.removeClipIds, ...result.assets.flatMap(a => a.replaceClipId ? [a.replaceClipId] : [])]) if (!same(p.clips.find(c => c.id === clipId), input.project.clips.find(c => c.id === clipId))) conflict('Selected clip');
    if (result.settings && changedWrite(p.settings, input.project.settings, result.settings)) conflict('Project settings');
    if (result.plan && changedWrite(p.plan, input.project.plan, result.plan)) conflict('Video plan');
    if (result.transitions && !same(p.transitions, input.project.transitions) && !same(p.transitions, result.transitions)) conflict('Transitions');
    if (result.scenes && p.scenes.some(s => !result.scenes!.some(next => next.id === s.id) && (p.clips.some(c => c.sceneId === s.id) || p.assets.some(a => a.sceneId === s.id && !a.archived)))) conflict('A scene with existing media');
    const old = structuredClone(p);
    if (result.scenes) {
      const ids = new Set(result.scenes.map(s => s.id));
      p.assets.filter(a => !ids.has(a.sceneId)).forEach(a => { a.archived = true; });
      p.clips = p.clips.filter(c => ids.has(c.sceneId)); p.annotations = p.annotations.filter(a => ids.has(a.sceneId));
      p.scenes = result.scenes.map(s => ({ ...s, audioAssetId: old.scenes.find(o => o.id === s.id)?.audioAssetId ?? null }));
    }
    for (const change of result.sceneUpdates) {
      const scene = p.scenes.find(s => s.id === change.id);
      if (!scene) throw new HttpError(400, 'Scene update references a missing scene');
      Object.assign(scene, delta(input.project.scenes.find(s => s.id === change.id), change));
    }
    if (result.settings) Object.assign(p.settings, delta(input.project.settings, result.settings));
    invalidateNarration(p, old);
    if (result.plan) Object.assign(p.plan, delta(input.project.plan, result.plan));
    if (job.action === 'plan') { p.plan.approved = false; p.production = { status: 'awaiting-review', stage: 'plan' }; }
    for (const change of result.clipUpdates) {
      const target = p.clips.find(c => c.id === change.id && (job.scope === 'project' || c.sceneId === job.sceneId));
      if (!target) throw new HttpError(400, 'Clip update references a missing or out-of-scope placement');
      Object.assign(target, delta(input.project.clips.find(c => c.id === change.id), change));
    }
    p.clips = p.clips.filter(c => !result.removeClipIds.includes(c.id));
    if (job.scope === 'scene' && result.newClips.some(c => c.sceneId !== job.sceneId)) throw new HttpError(400, 'New placement is outside the selected scene');
    p.clips.push(...result.newClips);
    if (result.transitions) {
      if (job.scope === 'scene' && result.transitions.some(t => [t.fromClipId, t.toClipId].some(id => !p.clips.some(c => c.id === id && c.sceneId === job.sceneId)))) throw new HttpError(400, 'Transition is outside the selected scene');
      p.transitions = job.scope === 'project' ? result.transitions : [...p.transitions.filter(t => p.clips.find(c => c.id === t.fromClipId)?.sceneId !== job.sceneId), ...result.transitions];
    }
    for (const { proposal: a, metadata } of prepared) {
      const source = p.assets.find(asset => asset.id === a.sourceAssetId);
      if (a.sourceAssetId && (!source || source.kind !== a.kind || source.sceneId !== a.sceneId)) throw new HttpError(400, 'Invalid source asset for version');
      const image = p.assets.find(asset => asset.id === a.sourceImageId && asset.kind === 'image');
      const version: Version = { ...metadata, id: id(), path: a.path.replaceAll('\\', '/'), provenance: {
        prompt: a.prompt, provider: a.provider, model: a.model, tool: a.tool, jobId, createdAt: new Date().toISOString(), sourceVersionIds: source ? [source.activeVersionId] : image ? [image.activeVersionId] : [],
      } };
      if (source) {
        source.versions.push(version);
        if (options.activateVersions) {
          source.activeVersionId = version.id; source.outdated = false;
          for (const clip of p.clips.filter(c => c.assetId === source.id)) { clip.versionId = version.id; if (version.durationFrames) clip.durationFrames = Math.min(clip.durationFrames, Math.floor((version.durationFrames - clip.sourceIn) / clip.speed)); }
          p.clips = p.clips.filter(c => c.durationFrames > 0);
          if (source.kind === 'audio') { p.scenes.find(s => s.id === source.sceneId)!.audioAssetId = source.id; p.assets.filter(a => a.sceneId === source.sceneId && a.kind !== 'audio').forEach(a => { a.outdated = true; }); clampSceneClips(p, source.sceneId); }
        }
      }
      else {
        attachAsset(p, { id: id(), name: a.name, kind: a.kind, sceneId: a.sceneId, shotId: a.shotId, versions: [version], activeVersionId: version.id, outdated: false });
        if (a.kind === 'audio' && options.activateVersions) { p.scenes.find(s => s.id === a.sceneId)!.audioAssetId = p.assets.at(-1)!.id; p.assets.filter(asset => asset.sceneId === a.sceneId && asset.kind !== 'audio').forEach(asset => { asset.outdated = true; }); clampSceneClips(p, a.sceneId); }
      }
      // New generated visuals are placed according to the agent's audio-bounded shot plan.
      if (!source && a.kind !== 'audio') {
        const asset = p.assets.at(-1)!;
        const scene = p.scenes.find(s => s.id === a.sceneId)!;
        const available = sceneFrames(p, scene) - a.startFrame;
        const duration = Math.min(a.durationFrames ?? available, available, version.durationFrames ?? available);
        if (duration <= 0) throw new HttpError(400, 'Generated visual is outside the scene audio');
        const replace = p.clips.find(c => c.id === a.replaceClipId || (a.kind === 'video' && a.shotId && p.assets.find(source => source.id === c.assetId)?.shotId === a.shotId));
        if (replace && replace.sceneId === a.sceneId) {
          replace.assetId = asset.id; replace.versionId = version.id; replace.sourceIn = 0;
          replace.durationFrames = Math.min(replace.durationFrames, version.durationFrames ?? replace.durationFrames);
        } else p.clips.push(makeClip(a.sceneId, asset, a.startFrame, duration));
      }
    }
    cleanTransitions(p);
    if (result.startProduction) {
      if (job.scope !== 'project' || !p.scenes.every(s => s.narration.trim() && s.direction.trim() && s.shots.length && s.shots.every(shot => shot.imagePrompt.trim() && shot.videoPrompt.trim()))) throw new HttpError(409, 'Finish the whole-video draft before starting production');
      p.plan.approved = true; p.scenes.forEach(s => { s.approved = true; }); p.production = { status: 'running', stage: 'audio' };
    }
    const applied = p.jobs.find(j => j.id === jobId)!;
    applied.resultApplied = true; applied.status = 'completed'; delete applied.error; delete applied.applyError;
    applied.resultAvailable = true;
  });
}
