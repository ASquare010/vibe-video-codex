/** Import reviewed source timing and existing renders without calling a generation provider.
 * npx tsx tools/import_source.ts --manifest /path/to/import.json [--data-dir data/projects]
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { newProject, newScene, id, sourceShotSchema, costEntrySchema, makeClip, projectSchema, type Asset } from '../shared/project.ts';
import { populateSourceReferences, excludeSourceRanges } from '../shared/source-timeline.ts';
import { retimeSourceScene } from '../shared/rerender.ts';
import { ProjectStore } from '../server/store.ts';
import { measure, runMedia, ffmpegPath, probePath } from '../server/media.ts';
import { SkillCatalog } from '../server/skills.ts';

const manifestSchema = z.object({
  name: z.string(), source: z.string(), proxy: z.string(), fps: z.number().positive(), durationSeconds: z.number().positive(), width: z.number(), height: z.number(), analysis: z.string(),
  costs: z.array(costEntrySchema).default([]),
  exclusions: z.array(z.object({startSeconds:z.number().nonnegative(),endSeconds:z.number().positive(),reason:z.string()}).refine(x=>x.endSeconds>x.startSeconds)).default([]),
  scenes: z.array(z.object({ number: z.number().int().positive(), title: z.string(), direction: z.string().default('Inspect this camera take before generation.'), source: sourceShotSchema, postSpeed: z.number().min(1).max(1.25).default(1), media: z.array(z.object({ path: z.string(), provider: z.string().optional(), model: z.string().optional(), tool: z.string().default('Imported existing render'), prompt: z.string().default(''), durationFrames: z.number().int().positive().optional(), sourceIn: z.number().int().nonnegative().default(0), place: z.boolean().default(true), embeddedAudio: z.boolean().default(true) })).default([]) })).min(1),
});
export async function importSourceManifest(value: unknown, dataRoot: string) {
  const m = manifestSchema.parse(value), p = newProject(m.name, 'codex');
  p.settings.fps = 24; p.settings.resolution = '720'; p.settings.videoResolution = '720';
  p.skill = await new SkillCatalog().read('video-rerender'); p.costs = m.costs;
  p.plan.synopsis = 'Realistic source-video remake; camera cuts and spatial action guide generation.';
  p.plan.classification = 'inspired'; p.plan.targetSeconds = m.durationSeconds;
  p.scenes = m.scenes.map(s => ({ ...newScene(s.title), number: s.number, direction: s.direction, source: s.source, estimatedFrames: Math.max(1, Math.round((s.source.endSeconds - s.source.startSeconds) * 24)) }));
  const store = new ProjectStore(path.resolve(dataRoot)); await fs.mkdir(store.root, { recursive: true });
  const folder = store.folder(p.id); await fs.mkdir(path.join(folder, 'media', 'source'), { recursive: true });
  // A failed import leaves its own unpublished folder for recovery; never touches existing projects.
  const sourceRel = `media/source/original${path.extname(m.source).toLowerCase()}`;
  await fs.copyFile(m.source, path.join(folder, sourceRel)); await fs.copyFile(m.proxy, path.join(folder, 'media/source/proxy.mp4'));
  p.sourceVideo = { path: sourceRel, proxyPath: 'media/source/proxy.mp4', name: path.basename(m.source), fps: m.fps, durationSeconds: m.durationSeconds, width: m.width, height: m.height, analysis: m.analysis, importedAt: new Date().toISOString() };
  for (let i = 0; i < m.scenes.length; i++) {
    const source = m.scenes[i], scene = p.scenes[i];
    for (const media of source.media) {
      const info = await measure(media.path, media.path, 24);
      const relative = `media/scene-${scene.number}-${id()}${path.extname(media.path).toLowerCase()}`;
      await fs.copyFile(media.path, path.join(folder, relative));
      const versionId = id(), provenance = { provider: media.provider, model: media.model, tool: media.tool, prompt: media.prompt, createdAt: new Date().toISOString(), sourceVersionIds: [] };
      const asset: Asset = { id: id(), name: path.basename(media.path), kind: info.kind, sceneId: scene.id, versions: [{ ...info, id: versionId, path: relative, provenance }], activeVersionId: versionId, outdated: false };
      p.assets.push(asset);
      if (!media.place) continue;
      const duration = media.durationFrames ?? info.durationFrames ?? scene.estimatedFrames;
      scene.estimatedFrames = duration;
      const clip = makeClip(scene.id, asset, 0, duration, info.kind === 'audio' ? 'music' : 'visual'); clip.sourceIn = media.sourceIn; p.clips.push(clip);
      if (info.kind === 'video' && media.embeddedAudio) {
        const probe = JSON.parse((await runMedia(probePath(), ['-v','error','-show_streams','-of','json',media.path])).toString());
        if (probe.streams.some((s: any) => s.codec_type === 'audio')) {
          const audioRel = relative.replace(/\.[^.]+$/, '.wav');
          await runMedia(ffmpegPath(), ['-v','error','-y','-i',media.path,'-map','0:a:0','-c:a','pcm_s16le',path.join(folder,audioRel)]);
          const audioId = id(), audio: Asset = { id: id(), name: `${asset.name} · native dialogue & effects`, kind: 'audio', sceneId: scene.id, versions: [{ ...(await measure(path.join(folder, audioRel), audioRel, 24)), id: audioId, path: audioRel, provenance: { ...provenance, tool: 'Extracted native generated audio', sourceVersionIds: [versionId] } }], activeVersionId: audioId, outdated: false };
          p.assets.push(audio); const placement = makeClip(scene.id, audio, 0, duration, 'music'); placement.sourceIn = media.sourceIn; p.clips.push(placement);
        }
      }
    }
    if (source.postSpeed !== 1) retimeSourceScene(p, scene.id, source.postSpeed);
  }
  const sourceProbe=JSON.parse((await runMedia(probePath(),['-v','error','-show_streams','-of','json',m.proxy])).toString());
  p.sourceVideo.hasAudio=sourceProbe.streams.some((s:any)=>s.codec_type==='audio');
  excludeSourceRanges(p,m.exclusions);populateSourceReferences(p);
  // Validate everything before publishing canonical state. Store.create owns directory creation.
  const valid = projectSchema.parse(p);
  for (const child of ['jobs','exports','revisions','annotations']) await fs.mkdir(path.join(folder, child));
  const { writeAgentGuide } = await import('../server/handoff.ts'); await writeAgentGuide(folder, valid);
  await fs.copyFile(path.resolve('tools/import_source.ts'), path.join(folder, 'revisions/import-tool.ts.txt'));
  await fs.writeFile(path.join(folder, 'revisions/import-manifest.json'), JSON.stringify(m,null,2));
  await store.write(valid); return valid;
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const arg = (name: string) => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
  const input = arg('--manifest'); if (!input) throw new Error('Use --manifest import.json [--data-dir data/projects]');
  const p = await importSourceManifest(JSON.parse(await fs.readFile(input,'utf8')), arg('--data-dir') || process.env.VIBECUT_DATA_DIR || 'data/projects');
  console.log(JSON.stringify({ projectId: p.id, scenes: p.scenes.length, url: `http://127.0.0.1:4310/#project=${p.id}` }));
}
