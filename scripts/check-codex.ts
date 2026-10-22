import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs/promises';
import { CodexClient, AgentManager } from '../server/codex.ts';
import { ProjectStore } from '../server/store.ts';
import { newProject } from '../shared/project.ts';

await fs.mkdir(path.resolve('data/codex-checks'), { recursive: true });
const directory = await fs.mkdtemp(path.resolve('data/codex-checks/run-'));
const store = new ProjectStore(directory);
const p = await store.create(newProject('VibeCut persistence check'));
const first = new CodexClient(), second = new CodexClient();
try {
  const manager = new AgentManager(store, first);
  const threadId = await manager.ensureThread(p);
  assert.equal((await store.read(p.id)).conversation.threadId, threadId);
  first.close();
  // Codex holds a single-writer lock while a thread is loaded in a process.
  await new Promise(resolve => setTimeout(resolve, 750));
  await second.connect();
  const resumed = await second.rpc('thread/resume', { threadId, excludeTurns: true });
  assert.equal(resumed.thread.id, threadId);
  await second.rpc('thread/archive', { threadId });
  await store.mutate(p.id, p => { p.archived = true; });
  console.log(JSON.stringify({ connected: true, newThread: true, resumeAfterRestart: true, inferenceTurns: 0 }));
} finally { first.close(); second.close(); }
