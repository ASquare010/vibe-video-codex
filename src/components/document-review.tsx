import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, MapPin, Maximize2, MessageSquare, Minimize2, Pencil, Save, Trash2, Undo2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Field, FieldGroup, FieldLabel, FieldDescription } from './ui/field';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Alert, AlertDescription } from './ui/alert';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from './ui/empty';
import { Separator } from './ui/separator';
import { cn } from '../lib/utils';
import { id, type Project, type ReviewAnchor, type ReviewComment } from '../../shared/project';
import { approveReview, canApproveReview, isReviewApproved, reopenReview, type ReviewSurface } from '../../shared/review';

export function DocumentReview({ project: p, surface, edit, save, saving, dirty, onExpandedChange, children }: {
  project: Project; surface: ReviewSurface; edit: (update: (p: Project) => void) => void;
  save: () => Promise<Project | null>; saving: boolean; dirty: boolean; onExpandedChange: (value: boolean) => void;
  children: (comment: (anchor: ReviewAnchor) => void) => ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null), bodyInput = useRef<HTMLTextAreaElement>(null), native = useRef(false);
  const expandedCallback = useRef(onExpandedChange); expandedCallback.current = onExpandedChange;
  const [expanded, setExpanded] = useState(false), [anchor, setAnchor] = useState<ReviewAnchor | null>(null);
  const [body, setBody] = useState(''), [type, setType] = useState<ReviewComment['type']>('comment'), [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('open'), [error, setError] = useState('');
  const label = surface === 'skill' ? 'Project skill' : 'Storyboard';
  const defaultAnchor: ReviewAnchor = { surface, label: surface === 'skill' ? p.skill?.name ?? 'Project skill' : 'Whole storyboard', skillId: surface === 'skill' ? p.skill?.id : undefined, quote: '' };
  const currentAnchor = anchor?.surface === surface ? anchor : defaultAnchor;
  const comments = p.review.comments.filter(c => c.anchor.surface === surface);
  const open = comments.filter(c => !c.resolved).length;
  const approved = isReviewApproved(p, surface);
  const changeExpanded = (value: boolean) => { setExpanded(value); expandedCallback.current(value); };
  const enter = () => {
    changeExpanded(true);
    if (root.current?.requestFullscreen && !document.fullscreenElement) {
      native.current = true;
      void root.current.requestFullscreen().catch(() => { native.current = false; });
    }
  };
  const exit = () => { if (document.fullscreenElement === root.current) void document.exitFullscreen().catch(() => {}); native.current = false; changeExpanded(false); };
  useEffect(() => {
    const changed = () => { if (native.current && document.fullscreenElement !== root.current) { native.current = false; setExpanded(false); expandedCallback.current(false); } };
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.fullscreenElement) { setExpanded(false); expandedCallback.current(false); } };
    document.addEventListener('fullscreenchange', changed); window.addEventListener('keydown', escape);
    return () => { document.removeEventListener('fullscreenchange', changed); window.removeEventListener('keydown', escape); expandedCallback.current(false); };
  }, []);
  const persist = async () => { try { await save(); setError(''); } catch (e) { setError((e as Error).message); } };
  const comment = (value: ReviewAnchor) => { setAnchor(value); setEditingId(null); if (!expanded) enter(); setTimeout(() => bodyInput.current?.focus(), 50); };
  const captureSelection = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement) || !target.closest('.review-document-content')) return;
    const input = target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement ? target : null;
    const quote = input ? input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0).trim() : window.getSelection()?.toString().trim();
    if (!quote || body.trim()) return;
    const field = input ?? target.closest<HTMLElement>('[id]');
    const scene = target.closest<HTMLElement>('[data-review-scene]'), shot = target.closest<HTMLElement>('[data-review-shot]');
    setAnchor({ surface, label: `${scene?.dataset.reviewTitle || defaultAnchor.label} · ${input?.labels?.[0]?.textContent || field?.dataset.reviewLabel || target.getAttribute('aria-label') || 'Selected text'}`, sceneId: scene?.dataset.reviewScene, shotId: shot?.dataset.reviewShot, skillId: surface === 'skill' ? p.skill?.id : undefined, fieldId: field?.id || undefined, quote: quote.slice(0, 10000) });
  };
  const submit = () => {
    if (!body.trim()) return;
    edit(p => {
      const existing = p.review.comments.find(c => c.id === editingId);
      if (existing) { existing.body = body.trim(); existing.type = type; existing.anchor = currentAnchor; }
      else p.review.comments.push({ id: id(), anchor: currentAnchor, type, body: body.trim(), createdAt: new Date().toISOString(), resolved: false });
    });
    setBody(''); setEditingId(null); setAnchor(null); void persist();
  };
  const goTo = (value: ReviewAnchor) => {
    if (value.skillId && value.skillId !== p.skill?.id) { setError('This note refers to a different project skill. Its original wording is preserved.'); return; }
    const target = document.getElementById(value.fieldId || (value.shotId ? `shot-${value.shotId}` : value.sceneId ? `scene-${value.sceneId}` : surface === 'skill' ? 'skill-content' : 'film-synopsis'));
    if (!target || !root.current?.contains(target)) return;
    for (let node: HTMLElement | null = target; node && node !== root.current; node = node.parentElement) if (node instanceof HTMLDetailsElement) node.open = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.focus({ preventScroll: true });
    if ((target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) && value.quote) { const at = target.value.indexOf(value.quote); if (at >= 0) target.setSelectionRange(at, at + value.quote.length); }
    target.setAttribute('data-review-highlight', 'true'); setTimeout(() => target.removeAttribute('data-review-highlight'), 2000);
  };
  return <div ref={root} className={cn('document-review', expanded && 'is-fullscreen')} aria-label={`${label} review`} data-testid="document-review">
    <div className="document-review-toolbar"><div className="review-title"><strong>{label}</strong><Badge variant={approved ? 'secondary' : 'outline'}>{approved ? 'Approved' : p.review.approvals[surface] ? 'Needs review' : 'Draft'}</Badge>{expanded && <span role="status">{saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'Saved locally'}</span>}</div><div className="toolbar-group">
      {expanded && <><Button size="sm" variant="outline" onClick={() => void persist()} disabled={saving}><Save data-icon="inline-start"/>Save changes</Button><Button size="sm" disabled={saving || (!approved && !canApproveReview(p, surface))} onClick={() => { edit(p => approved ? reopenReview(p, surface) : approveReview(p, surface)); void persist(); }}><Check data-icon="inline-start"/>{approved ? 'Reopen review' : `Approve ${surface === 'skill' ? 'skill' : 'storyboard'}`}</Button></>}
      <Button size="sm" variant="ghost" aria-label={`Comments on ${label.toLowerCase()}`} onClick={() => comment(currentAnchor)}><MessageSquare data-icon="inline-start"/>Comments{open > 0 ? ` (${open})` : ''}</Button>
      <Button size="sm" variant="outline" aria-label={expanded ? 'Exit full screen' : `Full screen ${label.toLowerCase()}`} onClick={expanded ? exit : enter}>{expanded ? <Minimize2 data-icon="inline-start"/> : <Maximize2 data-icon="inline-start"/>}{expanded ? 'Exit full screen' : 'Full screen'}</Button>
    </div></div>
    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
    <div className="document-review-body"><div className="review-document-content" onSelectCapture={e => captureSelection(e.target)} onMouseUp={e => captureSelection(e.target)}>{children(comment)}</div>
      {expanded && <aside className="review-notes" aria-label="Review comments"><header><div><strong>Comments & suggestions</strong><small>Select wording to attach a note, or use a scene’s comment button.</small></div><Badge variant="outline">{open} open</Badge></header>
        <form onSubmit={e => { e.preventDefault(); submit(); }} className="review-comment-form"><FieldGroup><Field><FieldLabel>Attach to</FieldLabel><button type="button" className="review-anchor" onClick={() => goTo(currentAnchor)}><MapPin/>{currentAnchor.label}</button>{currentAnchor.quote && <blockquote className="review-quote">{currentAnchor.quote}</blockquote>}</Field><Field><FieldLabel htmlFor="review-note-type">Note type</FieldLabel><ToggleGroup id="review-note-type" type="single" variant="outline" size="sm" value={type} onValueChange={value => { if (value) setType(value as ReviewComment['type']); }}><ToggleGroupItem value="comment">Comment</ToggleGroupItem><ToggleGroupItem value="suggestion">Suggestion</ToggleGroupItem><ToggleGroupItem value="pointer">Pointer</ToggleGroupItem></ToggleGroup></Field><Field><FieldLabel htmlFor="review-comment-body">{editingId ? 'Edit note' : 'Your note'}</FieldLabel><Textarea ref={bodyInput} id="review-comment-body" value={body} onChange={e => setBody(e.target.value)} rows={4} maxLength={5000} placeholder={type === 'suggestion' ? 'Suggest different wording, a visual change, or story direction…' : 'Leave a comment or point something out…'}/><FieldDescription>Saved in this project for Codex to read. No message is sent automatically.</FieldDescription></Field></FieldGroup><Button type="submit" size="sm" disabled={!body.trim() || saving}>{editingId ? 'Save note' : 'Post note'}</Button>{editingId && <Button type="button" size="sm" variant="ghost" onClick={() => { setEditingId(null); setBody(''); }}>Cancel</Button>}</form>
        <Separator/><div className="review-notes-filter"><span>Review notes</span><ToggleGroup type="single" size="sm" value={filter} onValueChange={v => { if (v) setFilter(v); }}><ToggleGroupItem value="open">Open</ToggleGroupItem><ToggleGroupItem value="all">All</ToggleGroupItem></ToggleGroup></div>
        <div className="review-note-list">{comments.filter(c => filter === 'all' || !c.resolved).map(note => <article key={note.id} className={cn('review-note', note.resolved && 'is-resolved')} data-testid="review-note"><header><Badge variant="outline">{note.type}</Badge><span>{note.resolved ? 'Resolved' : new Date(note.createdAt).toLocaleDateString()}</span></header><Button variant="link" className="review-note-location" onClick={() => goTo(note.anchor)}><MapPin data-icon="inline-start"/>{note.anchor.label}</Button>{note.anchor.quote && <blockquote className="review-quote">{note.anchor.quote}</blockquote>}<p>{note.body}</p><div className="review-note-actions"><Button size="sm" variant="ghost" onClick={() => { edit(p => { p.review.comments.find(c => c.id === note.id)!.resolved = !note.resolved; }); void persist(); }}>{note.resolved ? <Undo2 data-icon="inline-start"/> : <Check data-icon="inline-start"/>}{note.resolved ? 'Reopen' : 'Resolve'}</Button><Button size="icon-xs" variant="ghost" aria-label="Edit review note" onClick={() => { setEditingId(note.id); setAnchor(note.anchor); setType(note.type); setBody(note.body); bodyInput.current?.focus(); }}><Pencil/></Button><Button size="icon-xs" variant="ghost" aria-label="Delete review note" onClick={() => { edit(p => { p.review.comments = p.review.comments.filter(c => c.id !== note.id); }); void persist(); }}><Trash2/></Button></div></article>)}
        {!comments.some(c => filter === 'all' || !c.resolved) && <Empty><EmptyHeader><EmptyTitle>No {filter === 'open' ? 'open ' : ''}notes</EmptyTitle><EmptyDescription>Comments, suggestions and pointers will appear here.</EmptyDescription></EmptyHeader></Empty>}
        </div><p className="review-approval-note">Approval records this version of the document. Production stays in the main Codex chat.</p>
      </aside>}
    </div>
  </div>;
}
