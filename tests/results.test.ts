import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ProjectStore } from '../server/store.ts';
import { applyResult, ffmpegPath, importMedia, runMedia } from '../server/media.ts';
import { id, newProject, newScene, makeClip, jobSchema, shotSchema, resultSchema, type Project, type AgentResult } from '../shared/project.ts';

async function setup() {
  await fs.mkdir(path.resolve('data/result-tests'), { recursive: true });
  const root = await fs.mkdtemp(path.resolve('data/result-tests/run-'));
  const store = new ProjectStore(root), p = newProject('Result fixture', 'chatgpt');
  p.scenes[0].narration = 'Test narration.'; p.scenes[0].approved = true; await store.create(p);
  const folder = store.folder(p.id);
  const audio = path.join(folder, 'media', 'tone.wav');
  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=1', audio]);
  await importMedia(store, p.id, p.scenes[0].id, audio, 'tone.wav');
  const image = path.join(folder, 'media', 'fixture.png');
  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=navy:s=64x64', '-frames:v', '1', image]);
  return { store, p: await store.read(p.id), folder };
}
async function proposal(store: ProjectStore, p: Project, result: AgentResult) {
  const jobId = id(), folder = path.join(store.folder(p.id), 'jobs', jobId);
  await fs.mkdir(folder);
  await fs.writeFile(path.join(folder, 'input.json'), JSON.stringify({ project: p }));
  await fs.writeFile(path.join(folder, 'result.json'), JSON.stringify(result));
  await store.mutate(p.id, current => { current.jobs.push({ id: jobId, action: 'images', sceneId: p.scenes[0].id, clipIds: [], instructions: 'Protocol fixture', scope: 'scene', activity: [], status: 'completed', revision: p.revision, createdAt: new Date().toISOString(), log: '', resultApplied: false }); });
  return jobId;
}
test('real result files are measured, audio-bounded, provenance-preserving and versioned without overwriting', async () => {
  const { store, p } = await setup();
  const result: AgentResult = { summary: 'Test fixture', sceneUpdates: [], clipUpdates: [], newClips: [], removeClipIds: [], assets: [{ name: 'Fixture', sceneId: p.scenes[0].id, kind: 'image', path: 'media/fixture.png', model: 'test-fixture-model', tool: 'Test fixture', prompt: 'Test only', startFrame: 0, durationFrames: 100 }] };
  const jobId = await proposal(store, p, result);
  let saved = await applyResult(store, p.id, jobId);
  const image = saved.assets.find(a => a.kind === 'image')!;
  assert.equal(saved.clips[0].durationFrames, 30);
  assert.equal(image.versions[0].provenance.model, 'test-fixture-model');
  await assert.rejects(applyResult(store, p.id, jobId), /pending result/);
  await fs.copyFile(path.join(store.folder(p.id), 'media/fixture.png'), path.join(store.folder(p.id), 'media/alternate.png'));
  const next = structuredClone(result); next.assets[0].sourceAssetId = image.id; next.assets[0].path = 'media/alternate.png';
  const nextId = await proposal(store, saved, next);
  saved = await applyResult(store, p.id, nextId);
  const versioned = saved.assets.find(a => a.id === image.id)!;
  assert.equal(versioned.versions.length, 2); assert.equal(versioned.activeVersionId, image.activeVersionId);
  assert.equal(versioned.versions[0].path, 'media/fixture.png'); assert.equal(saved.clips.length, 1);
});

test('a whole-video draft applies every scene and exposes complete shot direction before any media', async () => {
  await fs.mkdir(path.resolve('data/result-tests'), { recursive: true });
  const store = new ProjectStore(await fs.mkdtemp(path.resolve('data/result-tests/plan-'))), p = newProject('Full draft fixture');
  await store.create(p);
  const scenes = ['Opening discovery', 'Escalation', 'Resolution'].map(title => ({ ...newScene(title), purpose: title, narration: `Exact words for ${title}.`, spokenStyle: 'Calm storyteller', audioPrompt: 'A steady intimate voice', direction: 'A consistent blue room', imagePrompt: 'Wide room', videoPrompt: 'Slow reveal', continuity: 'Same room and narrator', shots: [shotSchema.parse({ id: id(), title: `${title} shot`, imagePrompt: 'Standalone blue room image direction', videoPrompt: 'A slow camera push in the same room' })] }));
  scenes[0].id = p.scenes[0].id;
  const job = jobSchema.parse({ id: id(), action: 'plan', scope: 'project', sceneId: p.scenes[0].id, clipIds: [], instructions: 'Draft all scenes', revision: 0, status: 'completed', createdAt: new Date().toISOString() });
  const folder = path.join(store.folder(p.id), 'jobs', job.id); await fs.mkdir(folder);
  await fs.writeFile(path.join(folder, 'input.json'), JSON.stringify({ project: await store.read(p.id) }));
  const creatorClip = { ...makeClip(p.scenes[0].id, null, 0, 30, 'text'), text: 'Keep my timeline edit' };
  await store.mutate(p.id, current => { current.clips.push(creatorClip); current.settings.aspectRatio = '9:16'; current.settings.imageResolution = '720'; });
  await fs.writeFile(path.join(folder, 'result.json'), JSON.stringify(resultSchema.parse({ summary: 'Complete plan fixture', scenes, settings: p.settings, plan: { story: 'A discovery changes the room, and is resolved.', fullNarration: scenes.map(s => s.narration).join('\n\n') } })));
  await store.mutate(p.id, current => { current.jobs.push(job); });
  const saved = await applyResult(store, p.id, job.id, { activateVersions: true });
  assert.equal(saved.scenes.length, 3); assert.equal(saved.production.status, 'awaiting-review');
  assert.equal(saved.assets.length, 0); assert.equal(saved.plan.approved, false);
  assert.equal(saved.settings.aspectRatio, '9:16'); assert.equal(saved.settings.imageResolution, '720'); assert.equal(saved.clips[0].text, 'Keep my timeline edit');
  assert.ok(saved.scenes.every(s => s.shots[0].imagePrompt && s.shots[0].videoPrompt && s.spokenStyle));
});
test('a stale or escaping result is kept without changing the newer scene', async () => {
  const { store, p } = await setup();
  const result: AgentResult = { summary: 'Test fixture', sceneUpdates: [], clipUpdates: [], newClips: [], removeClipIds: [], assets: [{ name: 'Fixture', sceneId: p.scenes[0].id, kind: 'image', path: 'media/fixture.png', prompt: '', startFrame: 0 }] };
  const jobId = await proposal(store, p, result);
  await store.mutate(p.id, current => { current.scenes[0].direction = 'Newer direction'; });
  await assert.rejects(applyResult(store, p.id, jobId), /changed while Codex/);
  assert.equal((await store.read(p.id)).assets.length, 1);
  const saved = await store.read(p.id); result.assets[0].path = '../../private.png';
  const escapingId = await proposal(store, saved, result);
  await assert.rejects(applyResult(store, p.id, escapingId), /inside the project/);
});
