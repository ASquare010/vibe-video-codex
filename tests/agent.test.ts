import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CodexClient, AgentManager } from '../server/codex.ts';
import { ProjectStore } from '../server/store.ts';
import { newProject } from '../shared/project.ts';

class TestCodex extends CodexClient {
  created = 0;
  resumed: string[] = [];
  turns: string[] = [];
  override async status() { return { available: true, message: 'Protocol test double' }; }
  override async rpc(method: string, params: any = {}) {
    if (method === 'thread/start') { this.created++; await new Promise(resolve => setTimeout(resolve, 20)); return { thread: { id: `test-thread-${this.created}` } }; }
    if (method === 'thread/resume') { this.resumed.push(params.threadId); return { thread: { id: params.threadId } }; }
    if (method === 'thread/inject_items' || method === 'thread/name/set') return {};
    if (method === 'turn/start') {
      this.turns.push(params.threadId);
      const turnId = `test-turn-${this.turns.length}`;
      setTimeout(() => this.emit('notification', { method: 'item/agentMessage/delta', params: { threadId: params.threadId, delta: 'Test response' } }), 10);
      setTimeout(() => this.emit('notification', { method: 'turn/completed', params: { threadId: params.threadId, turn: { id: turnId, status: 'completed' } } }), 30);
      return { turn: { id: turnId } };
    }
    throw new Error(`Unexpected protocol call: ${method}`);
  }
}
async function fixture() {
  await fs.mkdir(path.resolve('data/agent-tests'), { recursive: true });
  const directory = await fs.mkdtemp(path.resolve('data/agent-tests/run-'));
  const store = new ProjectStore(directory); const initial = newProject('Agent protocol test'); initial.conversation.mode = 'managed'; const p = await store.create(initial);
  const codex = new TestCodex(); const manager = new AgentManager(store, codex);
  return { store, p, codex, manager };
}
test('concurrent connection requests create exactly one persistent project thread', async () => {
  const { store, p, codex, manager } = await fixture();
  const threads = await Promise.all([manager.ensureThread(p), manager.ensureThread(p), manager.ensureThread(p)]);
  assert.equal(codex.created, 1); assert.equal(new Set(threads).size, 1);
  const saved = await store.read(p.id); assert.equal(saved.conversation.threadId, threads[0]);
  const restarted = new AgentManager(store, codex);
  assert.equal(await restarted.ensureThread(saved), threads[0]);
  assert.deepEqual(codex.resumed, [threads[0]]); assert.equal(codex.created, 1);
});
test('visual generation is blocked until current audio is measured and text approved', async () => {
  const { p, manager } = await fixture();
  await assert.rejects(manager.queue(p.id, { sceneId: p.scenes[0].id, action: 'images', clipIds: [], instructions: 'Create images' }), /audio first/);
});
test('queued direction turns reuse the same thread and persist actual completion events', async () => {
  const { p, manager, store, codex } = await fixture();
  await manager.queue(p.id, { sceneId: p.scenes[0].id, action: 'chat', clipIds: [], instructions: 'Discuss pacing' });
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const saved = await store.read(p.id);
    if (saved.jobs[0]?.status === 'completed') break;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  const saved = await store.read(p.id);
  assert.equal(saved.jobs[0].status, 'completed'); assert.equal(saved.jobs[0].log, 'Test response');
  assert.equal(codex.turns[0], saved.conversation.threadId);
});

test('a completed turn without valid output needs attention and is never left running', async () => {
  const { p, manager, store } = await fixture();
  await store.mutate(p.id, p => { p.scenes[0].narration = 'A line.'; p.scenes[0].approved = true; });
  await manager.queue(p.id, { sceneId: p.scenes[0].id, action: 'audio', clipIds: [], instructions: 'Generate narration' });
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    if ((await store.read(p.id)).jobs[0]?.applyError) break;
    await new Promise(resolve => setTimeout(resolve, 30));
  }
  const saved = await store.read(p.id);
  assert.equal(saved.jobs[0].status, 'completed'); assert.match(saved.jobs[0].applyError!, /result.json/);
});

test('stopping a queued task during connection prevents a later inference turn', async () => {
  const { p, manager, codex, store } = await fixture();
  const queued = await manager.queue(p.id, { sceneId: p.scenes[0].id, action: 'chat', clipIds: [], instructions: 'Cancelled fixture request' });
  await manager.cancel(p.id, queued.jobs[0].id);
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal((await store.read(p.id)).jobs[0].status, 'cancelled');
  assert.equal(codex.turns.length, 0);
});
