import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { id, newProject, shotSchema } from '../shared/project.ts';
import { observationDisplay, type Observation } from '../shared/observer.ts';
import { ThreadObserver, readRolloutTail } from '../server/observer.ts';
import { AgentManager, CodexClient } from '../server/codex.ts';
import { ProjectStore } from '../server/store.ts';

test('observer reads saved history without resuming, subscribing or starting a turn', async () => {
  const calls: string[] = [];
  const observer = new ThreadObserver({ connect: async () => {}, rpc: async (method: string) => { calls.push(method); if (method === 'thread/read') return { thread: { status: { type: 'notLoaded' } } }; if (method === 'thread/turns/list') return { data: [{ id: 'finished', status: 'completed', items: [{ type: 'reasoning', text: 'Private reasoning is never displayed' }, { type: 'agentMessage', id: 'reply', text: 'The whole draft is saved.' }] }] }; throw new Error('Unexpected write'); } });
  const result = await observer.read(id());
  assert.equal(result.status, 'completed'); assert.equal(result.messages.length, 1);
  assert.deepEqual(calls, ['thread/read', 'thread/turns/list']);
});

test('durable completion ends activity, stale starts become unknown, and outside session files are ignored', async () => {
  await fs.mkdir(path.resolve('data/observer-tests'), { recursive: true });
  const root = await fs.mkdtemp(path.resolve('data/observer-tests/run-')), thread = id(), folder = path.join(root, 'sessions'); await fs.mkdir(folder);
  const file = path.join(folder, `rollout-${thread}.jsonl`);
  const record = (type: string, payload: unknown) => JSON.stringify({ timestamp: new Date().toISOString(), type, payload });
  await fs.writeFile(file, ['truncated partial record', record('event_msg', { type: 'task_started' }), record('response_item', { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Draft saved.' }] }), record('event_msg', { type: 'task_complete' })].join('\n'));
  assert.equal((await readRolloutTail(file, thread, root))?.status, 'completed');
  assert.equal((await readRolloutTail(file, thread, root))?.messages[0].text, 'Draft saved.');
  await fs.writeFile(file, record('event_msg', { type: 'task_started' })); const stale = new Date(Date.now() - 180000); await fs.utimes(file, stale, stale);
  assert.equal((await readRolloutTail(file, thread, root))?.status, 'unknown');
  const outside = path.join(root, `outside-${thread}.jsonl`); await fs.writeFile(outside, record('event_msg', { type: 'task_complete' }));
  assert.equal(await readRolloutTail(outside, thread, root), null);
});

test('read-only projects reject generation requests before connecting to Codex', async () => {
  await fs.mkdir(path.resolve('data/observer-tests'), { recursive: true });
  const store = new ProjectStore(await fs.mkdtemp(path.resolve('data/observer-tests/project-'))), p = await store.create(newProject('Monitor fixture'));
  class NoTurns extends CodexClient { override async status(): Promise<any> { throw new Error('Must not connect'); } }
  const manager = new AgentManager(store, new NoTurns());
  await assert.rejects(manager.queue(p.id, { action: 'plan', sceneId: p.scenes[0].id, clipIds: [], instructions: 'Draft' }), /read-only Codex monitor/);
  await assert.rejects(manager.produce(p.id), /main Codex chat/);
  assert.equal((await store.read(p.id)).jobs.length, 0);
});

test('current production step counts ready assets, while completion and stale status always end generating', () => {
  const p = newProject('Step fixture'), scene = p.scenes[0];
  scene.shots = [shotSchema.parse({ id: 'still', title: 'Still', media: 'image' }), shotSchema.parse({ id: 'motion', title: 'Motion', media: 'video' })];
  const asset = (assetId: string, kind: 'audio' | 'image' | 'video', shotId?: string) => ({ id: assetId, name: assetId, kind, sceneId: scene.id, shotId, outdated: false, activeVersionId: 'v1', versions: [{ id: 'v1', path: 'media/fixture.wav', provenance: { prompt: '', createdAt: new Date().toISOString(), sourceVersionIds: [] } }] });
  p.assets = [asset('voice', 'audio'), asset('first', 'image', 'still'), asset('motion-old', 'video', 'motion')];
  p.assets[2].outdated = true; scene.audioAssetId = 'voice';
  p.production = { status: 'running', stage: 'audio' };
  const observation: Observation = { threadId: id(), status: 'running', label: 'Codex is working', checkedAt: new Date().toISOString(), messages: [], activity: [] };
  assert.match(observationDisplay(p, observation).label, /Generating audio/);
  assert.deepEqual(observationDisplay(p, observation).progress, { ready: 1, total: 1 });
  p.production.stage = 'images';
  assert.deepEqual(observationDisplay(p, observation).progress, { ready: 1, total: 2 });
  p.production.stage = 'video';
  assert.deepEqual(observationDisplay(p, observation).progress, { ready: 0, total: 1 });
  assert.match(observationDisplay(p, { ...observation, step: 'processing-audio' }).label, /Processing audio/);
  for (const status of ['completed', 'unknown', 'unavailable', 'interrupted'] as const) {
    const result = observationDisplay(p, { ...observation, status, label: status });
    assert.equal(result.label, status); assert.equal(result.progress, undefined);
  }
  p.production.status = 'idle';
  assert.equal(observationDisplay(p, observation).label, 'Thinking');
  p.production = { status: 'paused', stage: 'images', error: 'Image provider connection failed. All accepted assets are saved.' };
  const paused = observationDisplay(p, { ...observation, status: 'completed', label: 'Codex finished' });
  assert.equal(paused.label, 'Paused · image generation'); assert.equal(paused.detail, 'Image provider connection failed.'); assert.equal(paused.attention, true);
  assert.equal(observationDisplay(p, observation).label, 'Thinking');
});

test('only an in-progress public tool supplies the live step; previous and completed tools do not', async () => {
  let status = 'inProgress';
  const observer = new ThreadObserver({ connect: async () => {}, rpc: async (method: string) => method === 'thread/read' ? { thread: { status: { type: status === 'inProgress' ? 'active' : 'idle' } } } : { data: [{ status, items: [{ type: 'mcpToolCall', status: 'inProgress', server: 'image_gen', tool: 'imagegen' }] }, { status: 'completed', items: [{ type: 'mcpToolCall', status: 'inProgress', server: 'voice', tool: 'generate_audio' }] }] } });
  assert.equal((await observer.read(id())).step, 'images');
  status = 'completed';
  const result = await observer.read(id()); assert.equal(result.status, 'completed'); assert.equal(result.step, undefined);
});
