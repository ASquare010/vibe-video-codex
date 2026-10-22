import { CodexClient } from '../server/codex.ts';
import fs from 'node:fs/promises';
const client = new CodexClient();
try {
  await client.connect();
  const { thread } = await client.rpc('thread/read', { threadId: process.argv[2], includeTurns: false });
  const turns = await client.rpc('thread/turns/list', { threadId: thread.id, limit: 3, sortDirection: 'desc', itemsView: 'full' }).catch(e => ({ error: e.message }));
  console.log(JSON.stringify({ id: thread.id, path: thread.path, status: thread.status, responseKeys: Object.keys(turns), turns: (turns.data ?? []).map((t: any) => ({ id: t.id, status: t.status, items: t.items?.length, final: t.items?.filter((i: any) => i.type === 'agentMessage').slice(-1).map((i: any) => i.text?.slice(0, 120)) })) }));
  if (thread.path) {
    const file = await fs.open(thread.path, 'r');
    try { const stat = await file.stat(); const b = Buffer.alloc(Math.min(180000, stat.size)); await file.read(b, 0, b.length, stat.size - b.length); console.log(JSON.stringify(b.toString().split('\n').flatMap(line => { try { const r = JSON.parse(line); return r.type === 'event_msg' ? [{ type: r.payload?.type, turnId: r.payload?.turn_id }] : []; } catch { return []; } }).slice(-10))); } finally { await file.close(); }
  }
} finally { client.close(); }
