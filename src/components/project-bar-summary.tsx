import { useEffect, useState } from 'react';
import { costTotals, type Project } from '../../shared/project';
import type { Observation } from '../../shared/observer';
import { api } from '../lib/api';

export function ProjectBarSummary({ project: p }: { project: Project }) {
  const [status, setStatus] = useState<Observation['status']>('idle');
  useEffect(() => {
    let disposed = false, timer: ReturnType<typeof setTimeout>;
    setStatus('idle');
    const poll = async () => {
      try { const value = await api<Observation>(`/api/projects/${p.id}/observation`); if (!disposed) setStatus(value.status); }
      catch { if (!disposed) setStatus('unavailable'); }
      if (!disposed) timer = setTimeout(poll, 4000);
    };
    void poll(); return () => { disposed = true; clearTimeout(timer); };
  }, [p.id, p.conversation.threadId]);
  const usd = p.estimatedCostUsd ?? (p.costs.some(c => c.unit === 'USD' && c.amount !== null) ? costTotals(p.costs).usd : null);
  const label = status === 'running' ? 'Working' : status === 'completed' ? 'Done' : 'Idle';
  return <div className="project-bar-summary">
    <span className="project-cost" aria-label="Estimated video cost" title="Recorded dollar estimate so far. Costs without a recorded USD amount are excluded.">Est. cost <strong>{usd === null ? '—' : `$${usd.toFixed(2)}`}</strong></span>
    <span className={`codex-bar-status${label === 'Working' ? ' is-working' : label === 'Done' ? ' is-done' : ''}`} role="status" aria-label="Codex status" aria-live="polite"><i/>Codex {label}</span>
  </div>;
}
