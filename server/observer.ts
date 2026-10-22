import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { CodexClient } from './codex.ts';
import type { Observation, ObservationStep } from '../shared/observer.ts';

function toolStep(item: any): ObservationStep | undefined {
  if (item.type === 'webSearch') return 'research';
  if (item.type === 'fileChange') return 'editing';
  if (item.type === 'commandExecution' && /\bffmpeg\b|\bffprobe\b/i.test(item.command ?? '')) return /\.(wav|mp3|m4a|ogg|flac)\b/i.test(item.command) && !/\.(mp4|mov|webm)\b/i.test(item.command) ? 'processing-audio' : 'processing-video';
  if (item.type !== 'mcpToolCall') return undefined;
  const name = `${item.server ?? ''} ${item.tool ?? ''}`;
  if (/video|animate|lipsync/i.test(name)) return 'video';
  if (/imagegen|image_gen|generate.?image/i.test(name)) return 'images';
  if (/audio|speech|narrat|text.?to.?speech|\btts\b/i.test(name)) return 'audio';
  return undefined;
}

export function publicHistory(turns: any[]): Pick<Observation, 'messages' | 'activity'> {
  const items = turns.slice().reverse().flatMap(t => t.items ?? []);
  return {
    messages: items.filter(i => i.type === 'agentMessage' && typeof i.text === 'string').slice(-20).map(i => ({ id: i.id, text: i.text.slice(-30000) })),
    activity: items.filter(i => ['commandExecution', 'mcpToolCall', 'fileChange', 'webSearch'].includes(i.type)).slice(-18).map(i => ({ id: i.id, label: i.type === 'mcpToolCall' ? `${i.server ?? 'Tool'} · ${i.tool ?? 'Working'}` : i.type === 'fileChange' ? 'Updating project files' : i.type === 'webSearch' ? 'Researching' : 'Running a local tool', status: i.status === 'failed' ? 'failed' : i.status === 'inProgress' ? 'running' : 'completed' })),
  };
}

export async function readRolloutTail(filename: string, threadId: string, root = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')) {
  if (!path.basename(filename).endsWith(`${threadId}.jsonl`)) return null;
  const real = await fs.realpath(filename);
  if (!['sessions', 'archived_sessions'].some(folder => { const relative = path.relative(path.join(root, folder), real); return relative && !relative.startsWith('..') && !path.isAbsolute(relative); })) return null;
  const file = await fs.open(real, 'r');
  try {
    const stat = await file.stat(), buffer = Buffer.alloc(Math.min(stat.size, 1024 * 1024));
    await file.read(buffer, 0, buffer.length, stat.size - buffer.length);
    let terminal: Observation['status'] | undefined;
    const messages: Observation['messages'] = [];
    for (const line of buffer.toString('utf8').split('\n')) {
      let record: any; try { record = JSON.parse(line); } catch { continue; }
      const e = record.payload;
      if (record.type === 'event_msg' && e) {
        if (e.type === 'task_started') terminal = 'running';
        if (e.type === 'task_complete') terminal = 'completed';
        if (e.type === 'turn_aborted') terminal = 'interrupted';
      }
      if (record.type === 'response_item' && e?.type === 'message' && e.role === 'assistant' && e.channel !== 'analysis' && (!e.phase || ['commentary', 'final_answer'].includes(e.phase))) {
        const text = (e.content ?? []).filter((c: any) => c.type === 'output_text').map((c: any) => c.text).join('\n');
        if (text) messages.push({ id: e.id ?? `${record.timestamp}-${messages.length}`, text: text.slice(-30000) });
      }
    }
    if (terminal === 'running' && Date.now() - stat.mtimeMs > 120000) terminal = 'unknown';
    return { status: terminal, messages: messages.slice(-20), modifiedAt: stat.mtime.toISOString() };
  } finally { await file.close(); }
}

export class ThreadObserver {
  private cache = new Map<string, { at: number; value: Promise<Observation> }>();
  constructor(private client: Pick<CodexClient, 'connect' | 'rpc'>) {}
  read(threadId: string | null): Promise<Observation> {
    if (!threadId) return Promise.resolve({ threadId, status: 'idle', label: 'No Codex chat linked', checkedAt: new Date().toISOString(), messages: [], activity: [] });
    const existing = this.cache.get(threadId);
    if (existing && Date.now() - existing.at < 3500) return existing.value;
    const value = this.fetch(threadId); this.cache.set(threadId, { at: Date.now(), value }); return value;
  }
  private async fetch(threadId: string): Promise<Observation> {
    const checkedAt = new Date().toISOString();
    try {
      await this.client.connect();
      const { thread } = await this.client.rpc('thread/read', { threadId, includeTurns: false });
      const response = await this.client.rpc('thread/turns/list', { threadId, limit: 8, sortDirection: 'desc', itemsView: 'full' }).catch(e => { if (/before first user message/i.test(e.message)) return { data: [] }; throw e; });
      const turns = response.data ?? [], publicItems = publicHistory(turns);
      const tail = thread.path ? await readRolloutTail(thread.path, threadId).catch(() => null) : null;
      const latest = turns[0];
      const status: Observation['status'] = tail?.status ?? (thread.status?.type === 'active' ? 'running' : latest?.status === 'inProgress' ? 'unknown' : latest?.status ?? 'idle');
      const activeTool = status === 'running' ? (latest?.items ?? []).filter((item: any) => item.status === 'inProgress').map(toolStep).filter(Boolean).at(-1) : undefined;
      return { threadId, status, step: activeTool, label: ({ running: 'Codex is working', completed: 'Codex finished', interrupted: 'Codex stopped', failed: 'Codex needs attention', unknown: 'Waiting for a fresh status', idle: 'Ready in Codex', unavailable: 'Status unavailable' })[status], checkedAt, updatedAt: tail?.modifiedAt ?? (latest?.completedAt ? new Date(latest.completedAt * 1000).toISOString() : undefined), messages: tail?.messages.length ? tail.messages : publicItems.messages, activity: publicItems.activity };
    } catch (e) { return { threadId, status: 'unavailable', label: 'Status unavailable', checkedAt, message: (e as Error).message, messages: [], activity: [] }; }
  }
}
