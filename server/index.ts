import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { z } from 'zod';
import { activeVersion, clampSceneClips, invalidateNarration, jobSchema, newProject, projectSchema, skillSchema, cleanTransitions } from '../shared/project.ts';
import { ProjectStore, HttpError } from './store.ts';
import { CodexClient, AgentManager } from './codex.ts';
import { applyResult, importMedia } from './media.ts';
import { renderProject } from './export.ts';
import { SkillCatalog } from './skills.ts';
import { ThreadObserver } from './observer.ts';
import { writeAgentGuide } from './handoff.ts';

try { process.loadEnvFile(); } catch { /* .env is optional */ }
const app = express();
const server = createServer(app);
const store = new ProjectStore(path.resolve(process.env.VIBECUT_DATA_DIR || 'data/projects'));
const codex = new CodexClient();
const agents = new AgentManager(store, codex);
const observer = new ThreadObserver(codex);
const skills = new SkillCatalog();
const upload = multer({ dest: path.join(os.tmpdir(), 'vibecut-imports'), limits: { fileSize: 512 * 1024 * 1024, files: 1 } });
const exports = new Map<string, { status: string; message?: string; path?: string }>();
app.disable('x-powered-by');
app.use((req, res, next) => {
  if (!/^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/.test(req.headers.host || '')) { res.status(403).json({ error: 'Local access only' }); return; }
  const origin = req.headers.origin;
  if ((origin && origin !== `http://${req.headers.host}`) || req.headers['sec-fetch-site'] === 'cross-site') { res.status(403).json({ error: 'Cross-origin access is disabled' }); return; }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});
app.use(express.json({ limit: '8mb' }));
app.get('/api/health', async (_req, res) => res.json(await codex.status()));
app.get('/api/projects', async (_req, res) => res.json(await store.list()));
app.get('/api/skills', async (_req, res) => res.json(await skills.list()));
app.put('/api/skills/:id', async (req, res) => {
  const skill = skillSchema.parse(req.body);
  if (skill.id !== req.params.id) throw new HttpError(400, 'Skill ID mismatch');
  res.json(await skills.save(skill));
});
app.post('/api/projects', async (req, res) => {
  const data = z.object({ name: z.string().trim().min(1).max(120), runtime: z.enum(['codex', 'chatgpt']).default('codex'), idea: z.string().max(20000).default(''), skillId: z.string().default('cinematic-story'), targetSeconds: z.number().min(1).max(3600).default(90), autoProduce: z.boolean().default(false) }).parse(req.body);
  const initial = newProject(data.name, data.runtime, data.idea);
  initial.skill = await skills.read(data.skillId); initial.plan.targetSeconds = data.targetSeconds;
  const p = await store.create(initial);
  res.status(201).json(p);
  if (data.runtime === 'codex') {
    agents.ensureThread(p).catch(error => store.mutate(p.id, current => { current.conversation.error = error.message; })).catch(() => {});
  }
});
app.get('/api/projects/:id', async (req, res) => res.json(await store.read(req.params.id)));
app.get('/api/projects/:id/observation', async (req, res) => {
  const p = await store.read(req.params.id);
  res.json(await observer.read(p.conversation.runtime === 'codex' ? p.conversation.threadId : null));
});
app.post('/api/projects/:id/codex-link', async (req, res) => {
  const value = z.string().trim().parse(req.body.threadId).replace(/^codex:\/\/threads\//, '').replace(/\/$/, '');
  const threadId = z.string().uuid().parse(value);
  res.json(await store.mutate(req.params.id, current => { current.conversation.threadId = threadId; current.conversation.mode = 'observe'; current.conversation.error = null; }));
});
app.put('/api/projects/:id', async (req, res) => {
  const draft = projectSchema.parse(req.body);
  if (draft.id !== req.params.id) throw new HttpError(400, 'Project ID mismatch');
  res.json(await store.mutate(draft.id, async p => {
    const before = structuredClone(p);
    p.name = draft.name; p.settings = draft.settings; p.theme = draft.theme;
    p.skill = draft.skill; p.plan = draft.plan; p.transitions = draft.transitions;
    p.review = draft.review;
    p.scenes = draft.scenes; p.clips = draft.clips; p.annotations = draft.annotations;
    invalidateNarration(p, before);
    cleanTransitions(p);
    if (p.scenes.some(s => s.approved && !before.scenes.find(old => old.id === s.id)?.approved)) {
      await fs.writeFile(path.join(store.folder(p.id), 'revisions', `storyboard-r${p.revision + 1}.json`), JSON.stringify({ revision: p.revision + 1, approvedAt: new Date().toISOString(), theme: p.theme, scenes: p.scenes }, null, 2));
    }
  }, draft.revision));
});
app.post('/api/projects/:id/archive', async (req, res) => res.json(await store.mutate(req.params.id, p => { p.archived = z.boolean().parse(req.body.archived); })));
app.post('/api/projects/:id/reconnect', async (req, res) => { await agents.ensureThread(await store.read(req.params.id)); res.json(await store.read(req.params.id)); });
app.post('/api/projects/:id/produce', async (req, res) => res.status(202).json(await agents.produce(req.params.id)));
app.post('/api/projects/:id/production/pause', async (req, res) => {
  const p = await store.mutate(String(req.params.id), p => { p.production.status = 'paused'; p.jobs.filter(j => j.status === 'queued').forEach(j => { j.status = 'cancelled'; }); });
  const running = p.jobs.find(j => ['running', 'awaiting-approval'].includes(j.status));
  if (running) await agents.cancel(p.id, running.id);
  res.json(await store.read(p.id));
});
app.post('/api/projects/:id/link', async (req, res) => {
  const url = z.string().url().parse(req.body.url);
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || parsed.hostname !== 'chatgpt.com' || !/^\/c\/[\w-]+\/?$/.test(parsed.pathname)) throw new HttpError(400, 'Use a ChatGPT conversation URL, such as https://chatgpt.com/c/…');
  res.json(await store.mutate(req.params.id, p => {
    if (p.conversation.runtime !== 'chatgpt') throw new HttpError(400, 'This project already uses Codex');
    p.conversation.url = parsed.origin + parsed.pathname; p.conversation.threadId = parsed.pathname.split('/')[2];
  }));
});
app.post('/api/projects/:id/folder', async (req, res) => {
  await store.read(req.params.id);
  const folder = store.folder(req.params.id);
  const executable = process.platform === 'win32' ? 'explorer.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const child = spawn(executable, [folder], { windowsHide: true, detached: true, stdio: 'ignore' });
  child.on('error', () => {}); child.unref(); res.json({ folder });
});
app.post('/api/projects/:id/import', upload.single('file'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose a media file');
  try { res.json(await importMedia(store, String(req.params.id), z.string().parse(req.body.sceneId), req.file.path, req.file.originalname)); }
  finally { await fs.unlink(req.file.path).catch(() => {}); }
});
app.get('/api/projects/:id/media', async (req, res) => {
  const relative = z.string().parse(req.query.path);
  const p = await store.read(req.params.id);
  if (!p.assets.some(a => a.versions.some(v => v.path === relative)) && !p.annotations.some(a => a.imagePath === relative) && !/^exports\/[\da-f-]+\/film\.mp4$/.test(relative)) throw new HttpError(404, 'Media is not registered in this project');
  res.sendFile(await store.safeFile(p.id, relative));
});
app.post('/api/projects/:id/versions', async (req, res) => {
  const data = z.object({ assetId: z.string(), versionId: z.string() }).parse(req.body);
  res.json(await store.mutate(req.params.id, p => {
    const asset = p.assets.find(a => a.id === data.assetId);
    if (!asset || !asset.versions.some(v => v.id === data.versionId)) throw new HttpError(404, 'Version not found');
    asset.activeVersionId = data.versionId; asset.outdated = false;
    for (const clip of p.clips.filter(c => c.assetId === asset.id)) {
      clip.versionId = data.versionId;
      const duration = activeVersion(asset).durationFrames;
      if (duration) { clip.sourceIn = Math.min(clip.sourceIn, Math.max(0, duration - Math.ceil(clip.speed))); clip.durationFrames = Math.min(clip.durationFrames, Math.floor((duration - clip.sourceIn) / clip.speed)); }
    }
    p.clips = p.clips.filter(c => c.durationFrames > 0);
    if (asset.kind === 'audio') {
      const scene = p.scenes.find(s => s.id === asset.sceneId)!;
      scene.audioAssetId = asset.id;
      p.assets.filter(a => a.sceneId === scene.id && a.kind !== 'audio').forEach(a => { a.outdated = true; });
      clampSceneClips(p, asset.sceneId);
    }
    cleanTransitions(p);
  }));
});
app.post('/api/projects/:id/jobs', async (req, res) => {
  const data = jobSchema.pick({ action: true, sceneId: true, clipIds: true, instructions: true, scope: true }).parse(req.body);
  res.status(202).json(await agents.queue(req.params.id, data));
});
app.post('/api/projects/:id/jobs/:jobId/cancel', async (req, res) => res.json(await agents.cancel(req.params.id, req.params.jobId)));
app.post('/api/projects/:id/jobs/:jobId/apply', async (req, res) => res.json(await applyResult(store, req.params.id, req.params.jobId)));
app.get('/api/projects/:id/requests', async (req, res) => {
  const p = await store.read(req.params.id);
  res.json([...codex.requests.values()].filter(r => r.params?.threadId === p.conversation.threadId));
});
app.post('/api/projects/:id/requests/:requestId', async (req, res) => {
  const p = await store.read(req.params.id);
  if (codex.requests.get(req.params.requestId)?.params.threadId !== p.conversation.threadId) throw new HttpError(404, 'Request not found');
  const data = z.object({ approved: z.boolean(), answers: z.record(z.string(), z.object({ answers: z.array(z.string()) })).optional() }).parse(req.body);
  codex.respond(req.params.requestId, data.approved, data.answers);
  res.json(await store.mutate(p.id, p => { p.jobs.filter(j => j.status === 'awaiting-approval').forEach(j => { j.status = 'running'; }); }));
});
app.get('/api/projects/:id/context', async (req, res) => {
  const p = await store.read(req.params.id);
  res.json({ text: `Continue this VibeCut video project. You are the creative brain; the editor is your harness. Apply the project's selected skill. Draft the COMPLETE film first: full story, every scene's exact narration, voice/audio direction, visual direction, continuity, shot image prompts and video prompts. Production order: ALL scene audio (one narration per scene), measure audio, ALL planned images, then planned image-to-video shots. A scene may have multiple images. Fit placements to measured narration. Preserve source files and versions. Record actual models/tools as asset provenance; never invent tool success.\nLocal project folder: ${store.folder(p.id)}\nCanonical project state:\n${JSON.stringify(p, null, 2)}\nIf you can access local files, edit project.json using schemaVersion 2, preserve stable IDs and increment revision; the UI validates and watches the manifest. A web-only ChatGPT chat cannot access these local files; return files for manual import.` });
});
app.post('/api/projects/:id/annotations', async (req, res) => {
  const data = z.object({ id: z.string().uuid(), image: z.string().max(7_000_000) }).parse(req.body);
  if (!data.image.startsWith('data:image/png;base64,')) throw new HttpError(400, 'Use a PNG annotation frame');
  const relative = `annotations/${data.id}.png`;
  const p = await store.read(req.params.id);
  if (!p.annotations.some(a => a.id === data.id)) throw new HttpError(404, 'Save the annotation before attaching its frame');
  await fs.writeFile(path.join(store.folder(p.id), relative), Buffer.from(data.image.split(',')[1], 'base64'));
  res.json(await store.mutate(p.id, current => { current.annotations.find(a => a.id === data.id)!.imagePath = relative; }));
});
app.post('/api/projects/:id/export', async (req, res) => {
  const p = await store.read(req.params.id);
  if (exports.get(p.id)?.status === 'running') throw new HttpError(409, 'An export is already running');
  if (p.assets.some(a => a.outdated && !a.archived) && req.body.allowOutdated !== true) throw new HttpError(409, 'Some assets are outdated. Review them or explicitly keep them for this export.');
  const status = { status: 'running', message: 'Rendering saved timeline' };
  exports.set(p.id, status); res.status(202).json(status);
  void renderProject(store, p).then(relative => {
    const result = { status: 'completed', path: relative }; exports.set(p.id, result); store.emit('change', { projectId: p.id, type: 'export', ...result });
  }).catch(error => { const result = { status: 'failed', message: error.message }; exports.set(p.id, result); store.emit('change', { projectId: p.id, type: 'export', ...result }); });
});
app.get('/api/projects/:id/export', async (req, res) => { await store.read(req.params.id); res.json(exports.get(req.params.id) ?? { status: 'idle' }); });
app.get('/api/projects/:id/events', async (req, res) => {
  await store.read(req.params.id);
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.write(': connected\n\n');
  const send = (event: any) => { if (event.projectId === req.params.id) res.write(`data: ${JSON.stringify(event)}\n\n`); };
  store.on('change', send);
  const heartbeat = setInterval(() => res.write(': keepalive\n\n'), 20000);
  req.on('close', () => { clearInterval(heartbeat); store.off('change', send); });
});

const watcher = await store.init();
for (const p of await store.list()) await writeAgentGuide(store.folder(p.id), p);
// A restart never retries a potentially billable task without the user's instruction.
for (const p of await store.list()) if (p.jobs.some(j => ['running', 'queued', 'awaiting-approval'].includes(j.status)) || ['running', 'drafting'].includes(p.production.status)) {
  await store.mutate(p.id, current => {
    current.jobs.filter(j => ['running', 'queued', 'awaiting-approval'].includes(j.status)).forEach(j => { j.status = 'failed'; j.error = 'The app restarted. Check remote tool activity before retrying.'; });
    if (['running', 'drafting'].includes(current.production.status)) current.production = { ...current.production, status: 'paused', error: 'The app restarted. Check remote tool activity, then resume production when ready.' };
  });
}
if (process.argv.includes('--production')) {
  app.use(express.static(path.resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true, hmr: { server } }, appType: 'spa' });
  app.use(vite.middlewares);
}
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = error instanceof HttpError ? error.status : error instanceof z.ZodError || error instanceof multer.MulterError ? 400 : 500;
  res.status(status).json({ error: error instanceof z.ZodError ? error.issues.map(i => i.message).join('; ') : error.message || 'Unexpected error' });
});
const port = Number(process.env.PORT || 4310);
server.listen(port, '127.0.0.1', () => console.log(`VibeCut: http://127.0.0.1:${port}`));
const shutdown = () => { codex.close(); void watcher.close(); server.close(); process.exit(0); };
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown);
