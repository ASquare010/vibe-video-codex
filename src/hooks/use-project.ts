import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { cleanTransitions, type Project } from '../../shared/project';

const editable = (p: Project) => ({ name: p.name, theme: p.theme, settings: p.settings, skill: p.skill, plan: p.plan, review: p.review, transitions: p.transitions, scenes: p.scenes, clips: p.clips, annotations: p.annotations, archivedAssetIds: p.assets.filter(a => a.archived).map(a => a.id).sort() });
const restore = (p: Project, snapshot: ReturnType<typeof editable>): Project => {
  const { archivedAssetIds, ...fields } = snapshot;
  return { ...p, ...fields, assets: p.assets.map(a => ({ ...a, archived: archivedAssetIds.includes(a.id) })) };
};
export function useProject(projectId: string, onEvent: (event: any) => void) {
  const [project, setProject] = useState<Project | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState('');
  const [historyCount, setHistoryCount] = useState([0, 0]);
  const current = useRef<Project | null>(null), base = useRef<Project | null>(null);
  const isDirty = useRef(false), isSaving = useRef(false), hasConflict = useRef(false);
  const editSequence = useRef(0);
  const history = useRef<ReturnType<typeof editable>[]>([]), future = useRef<ReturnType<typeof editable>[]>([]);
  const eventCallback = useRef(onEvent); eventCallback.current = onEvent;
  const receive = useCallback((p: Project) => {
    if (current.current && p.revision < current.current.revision) return;
    if (isSaving.current) return;
    if (isDirty.current && base.current && JSON.stringify(editable(p)) !== JSON.stringify(editable(base.current))) {
      hasConflict.current = true; setConflict(true); return;
    }
    current.current = isDirty.current && current.current ? restore(p, editable(current.current)) : p;
    base.current = p;
    setProject(current.current);
  }, []);
  const reload = useCallback(async () => {
    try {
      const p = await api(`/api/projects/${projectId}`);
      current.current = base.current = p;
      isDirty.current = false; hasConflict.current = false;
      history.current = []; future.current = [];
      setHistoryCount([0, 0]); setDirty(false); setConflict(false); setProject(p); setError('');
    } catch (e) { setError((e as Error).message); }
  }, [projectId]);
  useEffect(() => {
    void reload();
    const events = new EventSource(`/api/projects/${projectId}/events`);
    events.onmessage = message => { const e = JSON.parse(message.data); if (e.type === 'project') receive(e.project); else if (e.type === 'invalid') setError(e.message); eventCallback.current(e); };
    events.onopen = () => { void api(`/api/projects/${projectId}`).then(receive).catch(() => {}); };
    return () => events.close();
  }, [projectId, reload, receive]);
  const edit = useCallback((update: (draft: Project) => void) => {
    if (!current.current) return;
    history.current.push(structuredClone(editable(current.current))); history.current = history.current.slice(-100); future.current = [];
    const p = structuredClone(current.current); update(p); cleanTransitions(p);
    current.current = p; isDirty.current = true; editSequence.current++;
    setProject(p); setDirty(true); setHistoryCount([history.current.length, 0]);
  }, []);
  const save = useCallback(async function persist(): Promise<Project | null> {
    if (!current.current || !isDirty.current) return current.current;
    if (hasConflict.current) throw new Error('Resolve the external change before saving. Download your draft to keep it.');
    if (isSaving.current) {
      while (isSaving.current) await new Promise(resolve => setTimeout(resolve, 30));
      return persist();
    }
    isSaving.current = true; setSaving(true);
    const seq = editSequence.current;
    try {
      const p = await api(`/api/projects/${projectId}`, 'PUT', current.current);
      base.current = p;
      if (seq === editSequence.current) { current.current = p; isDirty.current = false; setDirty(false); }
      else current.current = restore(p, editable(current.current!));
      setProject(current.current); setError(''); return p;
    } catch (e) { setError((e as Error).message); if ((e as Error).message.includes('changed')) { hasConflict.current = true; setConflict(true); } throw e; }
    finally { isSaving.current = false; setSaving(false); }
  }, [projectId]);
  useEffect(() => {
    if (!dirty || conflict || saving) return;
    const timeout = setTimeout(() => { void save().catch(() => {}); }, 900);
    return () => clearTimeout(timeout);
  }, [project, dirty, conflict, saving, save]);
  const undoRedo = useCallback((redo: boolean) => {
    const source = redo ? future : history, destination = redo ? history : future;
    if (!source.current.length || !current.current) return;
    destination.current.push(structuredClone(editable(current.current)));
    current.current = restore(current.current, source.current.pop()!);
    editSequence.current++; isDirty.current = true; setDirty(true); setProject(current.current); setHistoryCount([history.current.length, future.current.length]);
  }, []);
  const action = useCallback(async (suffix: string, body?: unknown) => {
    await save();
    const p = await api(`/api/projects/${projectId}/${suffix}`, 'POST', body);
    receive(p); return p;
  }, [save, receive, projectId]);
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => { if (isDirty.current) e.preventDefault(); };
    window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard);
  }, []);
  return { project, edit, save, action, reload, receive, dirty, saving, conflict, error, setError, undo: () => undoRedo(false), redo: () => undoRedo(true), canUndo: historyCount[0] > 0, canRedo: historyCount[1] > 0 };
}
