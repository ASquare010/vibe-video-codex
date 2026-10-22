import { useEffect, useRef, useState } from 'react';
import { Scissors, Trash2, ZoomIn, ZoomOut, Type, Image as ImageIcon, Mic, Layers2, Music2, Magnet, MousePointer2, Captions, Blend } from 'lucide-react';
import { Button } from './ui/button';
import { sceneStart, sceneFrames, totalFrames, timecode, type Project, type Clip, type Transition, activeVersion } from '../../shared/project';
import { mediaUrl } from '../lib/api';
import { cn } from '../lib/utils';

export function Waveform({ peaks }: { peaks: number[] }) { return <svg className="waveform" viewBox="0 0 600 48" preserveAspectRatio="none" aria-label="Audio waveform">{peaks.map((peak, i) => <line key={i} x1={i * 5 + 2} x2={i * 5 + 2} y1={24 - Math.max(1, peak * 22)} y2={24 + Math.max(1, peak * 22)} stroke="currentColor" strokeWidth="2.2"/>)}</svg>; }
const allTracks = [{ id: 'visual', name: 'Picture', code: 'V1', icon: ImageIcon }, { id: 'narration', name: 'Narration', code: 'A1', icon: Mic }, { id: 'overlay', name: 'Overlay', code: 'V2', icon: Layers2 }, { id: 'text', name: 'Text', code: 'T', icon: Type }, { id: 'caption', name: 'Captions', code: 'CC', icon: Captions }, { id: 'music', name: 'Music / SFX', code: 'A2', icon: Music2 }];
type ClipGesture = Pick<Clip, 'id' | 'startFrame' | 'durationFrames' | 'sourceIn'>;
export function Timeline({ project: p, frame, seek, selected, select, edit, remove, addText, addAsset, tool, setTool, cutAt, addCaption, addTransition, selectTransition, inspectNarration }: {
  project: Project; frame: number; seek: (f: number) => void; selected: string[]; select: (ids: string[]) => void;
  edit: (f: (p: Project) => void) => void; remove: () => void; addText: () => void; addAsset: (assetId: string, track?: Clip['track'], at?: number) => void;
  tool: 'select' | 'razor'; setTool: (tool: 'select' | 'razor') => void; cutAt: (clipId: string, frame: number) => void; addCaption: () => void;
  addTransition: (from: string, to: string, type: Transition['type']) => void; selectTransition: (id: string) => void;
  inspectNarration: (assetId: string) => void;
}) {
  const [zoom, setZoom] = useState(72), [snapping, setSnapping] = useState(true);
  const tracks = allTracks.filter(track => ['visual', 'narration'].includes(track.id) || p.clips.some(c => c.track === track.id));
  const [gesture, setGesture] = useState<ClipGesture[] | null>(null);
  const gestureRef = useRef(gesture); gestureRef.current = gesture;
  const pixels = zoom / 30;
  const tickSeconds = [1, 2, 5, 10, 15, 30, 60, 120, 300].find(seconds => seconds * zoom >= 64) ?? 300;
  const tickPixels = tickSeconds * zoom;
  const viewport = useRef<HTMLDivElement>(null);
  const cleanupGesture = useRef<(() => void) | null>(null);
  const [viewportWidth, setViewportWidth] = useState(1000), [scrollLeft, setScrollLeft] = useState(0), [horizon, setHorizon] = useState(3600);
  useEffect(() => { const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width)); if (viewport.current) observer.observe(viewport.current); return () => observer.disconnect(); }, []);
  useEffect(() => () => cleanupGesture.current?.(), []);
  const width = Math.max(viewportWidth, totalFrames(p) * pixels + viewportWidth, horizon * pixels);
  const labelWidth = () => viewport.current?.querySelector('.track-labels')?.getBoundingClientRect().width ?? 119;
  // Keep the frame under the cursor fixed while zooming a long timeline.
  const zoomAt = (value: number, clientX?: number) => {
    const element = viewport.current; if (!element) return;
    const next = Math.max(16, Math.min(180, value));
    const offset = clientX === undefined ? Math.max(0, Math.min(element.clientWidth - labelWidth(), frame * pixels - element.scrollLeft)) : Math.max(0, clientX - element.getBoundingClientRect().left - labelWidth());
    const anchor = (element.scrollLeft + offset) / pixels;
    setZoom(next);
    requestAnimationFrame(() => { element.scrollLeft = Math.max(0, anchor * next / 30 - offset); });
  };
  useEffect(() => {
    const element = viewport.current; if (!element) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) { event.preventDefault(); zoomAt(zoom * Math.exp(-event.deltaY * 0.003), event.clientX); }
      else if (event.shiftKey || (!event.deltaX && element.scrollHeight <= element.clientHeight)) { event.preventDefault(); element.scrollLeft += (event.deltaX || event.deltaY) * (event.deltaMode === 1 ? 16 : 1); }
    };
    element.addEventListener('wheel', wheel, { passive: false }); return () => element.removeEventListener('wheel', wheel);
  }, [zoom]);
  // One pointer lifecycle for clips, trimming, scrubbing and middle-button panning.
  const followPointer = (e: React.PointerEvent, update: (event: PointerEvent) => void, finish?: () => void, autoPanUntil?: number) => {
    cleanupGesture.current?.();
    const target = e.currentTarget as HTMLElement, pointerId = e.pointerId;
    viewport.current?.focus({ preventScroll: true });
    target.setPointerCapture(pointerId); document.body.classList.add('timeline-gesturing'); window.getSelection()?.removeAllRanges();
    let lastEvent: PointerEvent | null = null, animation = 0;
    const move = (event: PointerEvent) => { if (event.pointerId === pointerId) { event.preventDefault(); lastEvent = event; update(event); } };
    const cleanup = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); window.removeEventListener('blur', cancel); window.removeEventListener('keydown', key);
      cancelAnimationFrame(animation); if (target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
      document.body.classList.remove('timeline-gesturing'); cleanupGesture.current = null; gestureRef.current = null; setGesture(null);
    };
    const up = (event: PointerEvent) => { if (event.pointerId !== pointerId) return; finish?.(); cleanup(); };
    const cancel = () => cleanup();
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') cancel(); };
    const pan = () => {
      const element = viewport.current;
      if (element && lastEvent && gestureRef.current) {
        const bounds = element.getBoundingClientRect(), edge = 36;
        const distance = lastEvent.clientX > bounds.right - edge ? lastEvent.clientX - (bounds.right - edge) : lastEvent.clientX < bounds.left + labelWidth() + edge ? lastEvent.clientX - (bounds.left + labelWidth() + edge) : 0;
        if (distance) {
          const before = element.scrollLeft, max = Math.max(0, autoPanUntil! * pixels - (element.clientWidth - labelWidth()) + edge);
          const next = before + Math.sign(distance) * Math.min(18, Math.abs(distance) / 3);
          element.scrollLeft = Math.max(0, distance > 0 ? Math.min(Math.max(before, max), next) : next);
          if (element.scrollLeft !== before) update(lastEvent);
        }
      }
      animation = requestAnimationFrame(pan);
    };
    if (autoPanUntil !== undefined) animation = requestAnimationFrame(pan);
    window.addEventListener('pointermove', move, { passive: false }); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel); window.addEventListener('blur', cancel); window.addEventListener('keydown', key);
    cleanupGesture.current = cleanup;
  };
  const scrub = (e: React.PointerEvent) => {
    if (e.button !== 0) return; e.preventDefault();
    const element = e.currentTarget;
    const update = (event: { clientX: number }) => seek(Math.round((event.clientX - element.getBoundingClientRect().left) / pixels));
    update(e); followPointer(e, update);
  };
  const drag = (e: React.PointerEvent, clip: Clip, mode: 'move' | 'left' | 'right') => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    viewport.current?.focus({ preventScroll: true });
    if (tool === 'razor' && mode === 'move') { const surface = e.currentTarget.closest('.timeline-surface')!.getBoundingClientRect(); cutAt(clip.id, Math.round((e.clientX - surface.left) / pixels)); return; }
    const ids = e.shiftKey ? [...new Set([...selected, clip.id])] : selected.includes(clip.id) ? selected : [clip.id];
    select(ids);
    const moving = mode === 'move' ? p.clips.filter(c => ids.includes(c.id)) : [clip];
    const startX = e.clientX, initialScroll = viewport.current!.scrollLeft, duration = sceneFrames(p, p.scenes.find(s => s.id === clip.sceneId)!);
    const source = p.assets.find(a => a.id === clip.assetId)?.versions.find(v => v.id === clip.versionId)?.durationFrames;
    const markers = [0, duration, frame - sceneStart(p, clip.sceneId), ...p.clips.filter(c => !moving.some(m => m.id === c.id) && c.sceneId === clip.sceneId && c.track === clip.track).flatMap(c => [c.startFrame, c.startFrame + c.durationFrames])];
    const snapValue = (value: number, altKey: boolean) => !snapping || altKey ? value : markers.reduce((best, m) => Math.abs(m - value) < 6 / pixels && (best === value || Math.abs(m - value) < Math.abs(best - value)) ? m : best, value);
    let started = false;
    const move = (event: PointerEvent) => {
      if (!started && Math.abs(event.clientX - startX) < 3) return;
      started = true;
      let delta = Math.round((event.clientX - startX + viewport.current!.scrollLeft - initialScroll) / pixels);
      let start = clip.startFrame, len = clip.durationFrames, sourceIn = clip.sourceIn;
      if (mode === 'move') {
        const left = snapValue(clip.startFrame + delta, event.altKey), right = snapValue(clip.startFrame + len + delta, event.altKey) - len;
        const leftDistance = Math.abs(left - clip.startFrame - delta), rightDistance = Math.abs(right - clip.startFrame - delta);
        delta = (rightDistance && (!leftDistance || rightDistance < leftDistance) ? right : left) - clip.startFrame;
        delta = Math.max(...moving.map(c => -c.startFrame), Math.min(...moving.map(c => sceneFrames(p, p.scenes.find(s => s.id === c.sceneId)!) - c.durationFrames - c.startFrame), delta));
        const next = moving.map(c => ({ id: c.id, startFrame: c.startFrame + delta, durationFrames: c.durationFrames, sourceIn: c.sourceIn }));
        gestureRef.current = next; setGesture(next); return;
      }
      if (mode === 'right') len = Math.max(1, Math.min(duration - start, source ? Math.floor((source - sourceIn) / clip.speed) : Infinity, snapValue(start + clip.durationFrames + delta, event.altKey) - start));
      if (mode === 'left') {
        start = Math.max(0, source ? clip.startFrame - Math.floor(clip.sourceIn / clip.speed) : 0, Math.min(clip.startFrame + clip.durationFrames - 1, snapValue(clip.startFrame + delta, event.altKey)));
        len = clip.startFrame + clip.durationFrames - start;
        sourceIn = source ? clip.sourceIn + Math.round((start - clip.startFrame) * clip.speed) : 0;
      }
      const next = [{ id: clip.id, startFrame: start, durationFrames: len, sourceIn }];
      gestureRef.current = next; setGesture(next);
    };
    followPointer(e, move, () => {
      const changes = gestureRef.current?.filter(c => { const original = moving.find(m => m.id === c.id)!; return c.startFrame !== original.startFrame || c.durationFrames !== original.durationFrames || c.sourceIn !== original.sourceIn; });
      if (changes?.length) edit(draft => { for (const change of changes) { const target = draft.clips.find(c => c.id === change.id); if (target) Object.assign(target, change); } });
    }, Math.max(...moving.map(c => sceneStart(p, c.sceneId) + sceneFrames(p, p.scenes.find(s => s.id === c.sceneId)!))));
  };
  return <section className="timeline-panel" aria-label="Video timeline">
    <div className="timeline-toolbar"><div className="toolbar-group"><span className="panel-eyebrow">TIMELINE</span><Button size="icon-sm" variant={tool === 'select' ? 'secondary' : 'ghost'} title="Selection tool (V)" aria-label="Selection tool" onClick={() => setTool('select')}><MousePointer2/></Button><Button size="icon-sm" variant={tool === 'razor' ? 'secondary' : 'ghost'} title="Razor (C): click a clip exactly where you want to cut" aria-label="Razor tool" onClick={() => setTool(tool === 'razor' ? 'select' : 'razor')}><Scissors/></Button><span className="header-divider"/><Button size="icon-sm" variant="ghost" title="Add text" aria-label="Add text" onClick={addText}><Type/></Button><Button size="icon-sm" variant="ghost" title="Add caption" aria-label="Add caption" onClick={addCaption}><Captions/></Button><Button size="icon-sm" variant="ghost" title="Delete selection" aria-label="Delete selection" disabled={!selected.length} onClick={remove}><Trash2/></Button><Button size="icon-sm" variant={snapping ? 'secondary' : 'ghost'} title="Snap clips to boundaries" aria-label="Toggle snapping" aria-pressed={snapping} onClick={() => setSnapping(s => !s)}><Magnet/></Button><span className="timeline-tool-hint">{tool === 'razor' ? 'Click a clip to cut here' : 'Drag to move · edges to trim · Shift-scroll to pan'}</span></div><div className="toolbar-group"><span className="time-readout">{timecode(frame)}</span><span className="timeline-hint">30 fps</span><Button size="icon-sm" variant="ghost" aria-label="Zoom out" onClick={() => zoomAt(zoom / 1.4)}><ZoomOut/></Button><input aria-label="Timeline zoom" type="range" min="16" max="180" value={zoom} onChange={e => zoomAt(Number(e.target.value))}/><Button size="icon-sm" variant="ghost" aria-label="Zoom in" onClick={() => zoomAt(zoom * 1.4)}><ZoomIn/></Button></div></div>
    <div className="timeline-body">
      <div className="timeline-scroll" ref={viewport} tabIndex={0} aria-label="Scrollable timeline. Drag clips to move, drag edges to trim, drag empty space to scrub. Shift-wheel or middle-drag to pan; Control-wheel to zoom."
        onPointerDownCapture={e => {
          if (e.button !== 1) return; e.preventDefault(); e.stopPropagation();
          const element = e.currentTarget, x = e.clientX, y = e.clientY, left = element.scrollLeft, top = element.scrollTop;
          followPointer(e, event => { element.scrollLeft = left + x - event.clientX; element.scrollTop = top + y - event.clientY; });
        }}
        onScroll={e => { const element = e.currentTarget; setScrollLeft(element.scrollLeft); if (element.scrollLeft + element.clientWidth > width - 400) setHorizon(h => Math.max(h + 1800, (width + viewportWidth) / pixels)); }}>
      <div className="timeline-content"><div className="track-labels"><div className="ruler-label">TRACKS</div><div className="scene-label">SCENES</div>{tracks.map(track => <div className="track-label" data-testid={`label-${track.id}`} key={track.id}><track.icon/><span>{track.name}<small className="track-description">{track.id === 'visual' ? 'Images & video' : track.id === 'narration' ? 'Scene audio' : ''}</small></span><small>{track.code}</small></div>)}</div>
      <div className={cn('timeline-surface', tool === 'razor' && 'razor-active')} style={{ width, backgroundSize: `${zoom}px 100%` }}>
        <div className="ruler" data-testid="timeline-ruler" onPointerDown={scrub}>
          {Array.from({ length: Math.ceil(viewportWidth / tickPixels) + 3 }, (_, offset) => { const i = (Math.max(0, Math.floor(scrollLeft / tickPixels) - 1) + offset) * tickSeconds; return <span key={i} style={{ left: i * zoom }}>{Math.floor(i / 60) > 0 ? `${Math.floor(i / 60)}:` : ''}{i % 60 < 10 ? '0' : ''}{i % 60}s</span>; })}
        </div>
        <div className="scene-markers">{p.scenes.map((s, i) => <button key={s.id} style={{ left: sceneStart(p, s.id) * pixels, width: sceneFrames(p, s) * pixels }} onClick={() => seek(sceneStart(p, s.id))}><span>{String(i + 1).padStart(2, '0')}</span>{s.title}</button>)}</div>
        {tracks.map(track => <div key={track.id} className={cn('timeline-track', track.id)} data-testid={`track-${track.id}`}
          onDragOver={e => { if (['visual', 'overlay', 'music'].includes(track.id) && e.dataTransfer.types.includes('vibecut/asset')) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } }} onDrop={e => { e.preventDefault(); const assetId = e.dataTransfer.getData('vibecut/asset'), asset = p.assets.find(a => a.id === assetId); if (asset && (track.id === 'music' ? asset.kind === 'audio' : ['visual', 'overlay'].includes(track.id) && asset.kind !== 'audio')) addAsset(assetId, track.id as Clip['track'], Math.round((e.clientX - e.currentTarget.getBoundingClientRect().left) / pixels)); }}
          onPointerDown={e => { if (e.target === e.currentTarget && e.button === 0) { select([]); scrub(e); } }}>
          {track.id === 'narration' ? p.scenes.map(s => {
            const asset = p.assets.find(a => a.id === s.audioAssetId); if (!asset) return null;
            return <button key={s.id} className="narration-clip" style={{ left: sceneStart(p, s.id) * pixels, width: sceneFrames(p, s) * pixels }} title={`${asset.name} · select audio properties; narration anchors this scene’s duration`} aria-label={`Inspect narration ${asset.name}`} onClick={() => inspectNarration(asset.id)}><span><Mic/><span>{asset.name}</span></span><Waveform peaks={activeVersion(asset).waveform ?? []}/></button>;
          }) : p.clips.filter(c => c.track === track.id).map(original => {
            const change = gesture?.find(c => c.id === original.id), clip = change ? { ...original, ...change } : original;
            const asset = p.assets.find(a => a.id === clip.assetId), version = asset?.versions.find(v => v.id === clip.versionId);
            return <div key={clip.id} role="button" tabIndex={0} aria-label={`Timeline clip ${asset?.name ?? clip.text}`} data-testid="timeline-clip" aria-pressed={selected.includes(clip.id)}
              onKeyDown={e => { if (e.key === 'Enter') select([clip.id]); }}
              className={cn('timeline-clip', selected.includes(clip.id) && 'selected', change && 'is-dragging', clip.track)} style={{ left: (sceneStart(p, clip.sceneId) + clip.startFrame) * pixels, width: clip.durationFrames * pixels }} onDragStart={e => e.preventDefault()} onPointerDown={e => drag(e, original, 'move')}>
              {asset?.kind === 'image' && <div className="clip-filmstrip" style={{ backgroundImage: `url("${mediaUrl(p.id, version!.path)}")` }}/>}
              <span className="clip-title">{asset?.name ?? clip.text}</span>
              {asset?.kind === 'audio' && <Waveform peaks={version?.waveform ?? []}/>}
              <span className="clip-time">{change ? `${timecode(clip.startFrame)} · ` : ''}{(clip.durationFrames / 30).toFixed(1)}s</span><i className="trim-handle left" title="Trim start" onPointerDown={e => drag(e, original, 'left')}/><i className="trim-handle right" title="Trim end" onPointerDown={e => drag(e, original, 'right')}/>
            </div>;
          })}
          {['visual', 'overlay'].includes(track.id) && p.clips.filter(c => c.track === track.id).map(from => {
            const to = p.clips.find(c => c.sceneId === from.sceneId && c.track === from.track && c.startFrame === from.startFrame + from.durationFrames);
            if (!to) return null;
            const transition = p.transitions.find(t => t.fromClipId === from.id && t.toClipId === to.id);
            return <button key={`join-${from.id}`} className={cn('transition-join', transition && 'has-transition')} style={{ left: (sceneStart(p, from.sceneId) + to.startFrame) * pixels - 9 }} aria-label={transition ? `Edit ${transition.type} transition` : 'Add transition at cut'} title="Drop a transition here, or click for a crossfade" onPointerDown={e => e.stopPropagation()} onClick={() => transition ? selectTransition(transition.id) : addTransition(from.id, to.id, 'crossfade')} onDragOver={e => { e.preventDefault(); e.stopPropagation(); }} onDrop={e => { e.preventDefault(); e.stopPropagation(); const type = e.dataTransfer.getData('vibecut/transition'); if (['crossfade', 'dip-black', 'wipe-left', 'slide-left'].includes(type)) addTransition(from.id, to.id, type as Transition['type']); }}><Blend/></button>;
          })}
        </div>)}
        <div className="playhead" style={{ left: frame * pixels }}><i/></div>
      </div></div></div>
    </div>
  </section>;
}
