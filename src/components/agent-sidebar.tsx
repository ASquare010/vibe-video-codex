import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, RefreshCw, Settings2, Sparkles, Wrench } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Message, MessageContent, MessageHeader } from './ui/message';
import { Bubble, BubbleContent } from './ui/bubble';
import { MessageScrollerProvider, MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton } from './ui/message-scroller';
import { Trace, TraceLine, TraceIcon, TraceTitle, TraceCollapsible, TraceCollapsibleTrigger, TraceCollapsibleContent } from './ui/trace';
import { api } from '../lib/api';
import { cn } from '../lib/utils';
import type { Project, Job } from '../../shared/project';
import type { Observation } from '../../shared/observer';

export const actionNames: Record<Job['action'], string> = { chat: 'Working on your video', plan: 'Drafting the complete video', storyboard: 'Writing scene directions', audio: 'Generating narration', images: 'Generating scene images', video: 'Animating scene images', edit: 'Editing your selection' };
export function AgentSidebar({ project: p, act, settings }: { project: Project; act: (suffix: string, body?: unknown) => Promise<unknown>; settings: () => void }) {
  const [observation, setObservation] = useState<Observation | null>(null), [copied, setCopied] = useState(false), [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let disposed = false, timer: ReturnType<typeof setTimeout>;
    setObservation(null);
    const poll = async () => {
      try { const value = await api<Observation>(`/api/projects/${p.id}/observation`); if (!disposed) setObservation(value); }
      catch { if (!disposed) setObservation(v => ({ threadId: p.conversation.threadId, messages: v?.messages ?? [], activity: [], status: 'unavailable', label: 'Status unavailable', checkedAt: new Date().toISOString() })); }
      if (!disposed) timer = setTimeout(poll, 4000);
    };
    void poll(); return () => { disposed = true; clearTimeout(timer); };
  }, [p.id, p.conversation.threadId, refresh]);
  const active = observation?.status === 'running';
  const pending = p.jobs.filter(j => !j.resultApplied && (j.applyError || (j.status === 'completed' && j.action !== 'chat' && j.resultAvailable !== false) || j.error?.includes('changed while Codex worked')));
  const messages = observation?.messages.length ? observation.messages : p.jobs.filter(j => j.log).map(j => ({ id: j.id, text: j.log }));
  const openUrl = p.conversation.runtime === 'chatgpt' ? p.conversation.url || 'https://chatgpt.com/' : p.conversation.threadId ? `codex://threads/${p.conversation.threadId}` : 'codex://threads/new';
  const copy = async () => { const value = await api<{ text: string }>(`/api/projects/${p.id}/context`); await navigator.clipboard.writeText(value.text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return <aside className="agent-sidebar" aria-label="Codex progress"><header className="agent-header"><div className={cn('agent-logo', active && 'is-working')}><Sparkles/></div><div><strong>Codex</strong><small>Progress & results</small></div><Button variant="ghost" size="icon-sm" aria-label="Codex connection settings" onClick={settings}><Settings2/></Button></header>
    <div className={cn('agent-live-status', active && 'is-working')} role="status" aria-live="polite"><span className="agent-status-light"/><div><strong>{observation?.label || 'Checking Codex status…'}</strong><small>{observation?.updatedAt ? `Last update ${new Date(observation.updatedAt).toLocaleTimeString()}` : observation?.checkedAt ? `Checked ${new Date(observation.checkedAt).toLocaleTimeString()}` : 'Reading saved conversation history'}</small></div><Button variant="ghost" size="icon-sm" aria-label="Refresh Codex status" onClick={() => setRefresh(v => v + 1)}><RefreshCw/></Button></div>
    {pending.map(job => <Alert key={job.id} className="agent-error"><AlertDescription><strong>Codex finished. Its output needs review.</strong>{(job.applyError || job.error) && <p>{job.applyError || job.error}</p>}{job.resultAvailable !== false ? <Button size="sm" variant="outline" onClick={() => void act(`jobs/${job.id}/apply`)}>Apply saved result</Button> : <p>Continue in the main Codex chat to correct the output.</p>}</AlertDescription></Alert>)}
    <div className="agent-messages"><MessageScrollerProvider autoScroll><MessageScroller><MessageScrollerViewport><MessageScrollerContent className="agent-transcript">
      {observation?.activity.length ? <MessageScrollerItem messageId="activity"><TraceCollapsible><TraceCollapsibleTrigger><TraceLine><TraceIcon><Wrench/></TraceIcon><TraceTitle>Recent activity</TraceTitle></TraceLine></TraceCollapsibleTrigger><TraceCollapsibleContent><Trace>{observation.activity.map(step => <TraceLine key={step.id} status={step.status === 'failed' ? 'error' : active && step.status === 'running' ? 'running' : undefined}><TraceIcon>{step.status === 'completed' ? <Check/> : <Wrench/>}</TraceIcon><TraceTitle>{step.label}</TraceTitle></TraceLine>)}</Trace></TraceCollapsibleContent></TraceCollapsible></MessageScrollerItem> : null}
      {messages.map(message => <MessageScrollerItem key={message.id} messageId={message.id}><Message><MessageContent><MessageHeader>CODEX</MessageHeader><Bubble variant="ghost"><BubbleContent><div className="agent-reply">{message.text}</div></BubbleContent></Bubble></MessageContent></Message></MessageScrollerItem>)}
      {!messages.length && <MessageScrollerItem messageId="monitor-note"><Message><MessageContent><Bubble variant="ghost"><BubbleContent>Prompt in the main Codex chat. This panel shows its saved replies and progress; changes to the project appear in the editor automatically.</BubbleContent></Bubble></MessageContent></Message></MessageScrollerItem>}
    </MessageScrollerContent></MessageScrollerViewport><MessageScrollerButton/></MessageScroller></MessageScrollerProvider></div>
    <div className="agent-monitor-footer"><Badge variant="outline">Read-only monitor</Badge><p>Prompts and approvals stay in the main {p.conversation.runtime === 'chatgpt' ? 'ChatGPT' : 'Codex'} chat.</p><div className="flex gap-2"><Button size="sm" asChild><a href={openUrl}><ExternalLink data-icon="inline-start"/>Open {p.conversation.runtime === 'chatgpt' ? 'ChatGPT' : 'Codex'} chat</a></Button><Button size="sm" variant="outline" onClick={() => void copy()}><Copy data-icon="inline-start"/>{copied ? 'Copied' : 'Copy context'}</Button></div></div>
  </aside>;
}
