import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { id, newProject } from '../shared/project.ts';
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
