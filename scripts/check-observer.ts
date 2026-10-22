import assert from 'node:assert/strict';
import { CodexClient } from '../server/codex.ts';
import { ThreadObserver } from '../server/observer.ts';
const client = new CodexClient();
try {
  const value = await new ThreadObserver(client).read(process.argv[2]);
  assert.equal(value.status, 'completed'); assert.ok(value.messages.length > 0);
  console.log(JSON.stringify({ status: value.status, publicMessages: value.messages.length, readOnly: true, inferenceTurns: 0 }));
} finally { client.close(); }
