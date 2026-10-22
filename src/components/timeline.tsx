import { useEffect, useRef, useState } from 'react';
import { Scissors, Trash2, ZoomIn, ZoomOut, Type, Image as ImageIcon, Mic, Layers2, Music2, Magnet, MousePointer2, Captions, Blend, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { sceneStart, sceneFrames, totalFrames, timecode, type Project, type Clip, type Transition, activeVersion } from '../../shared/project';
import { mediaUrl } from '../lib/api';
import { cn } from '../lib/utils';

export function Waveform({ peaks }: { peaks: number[] }) { return <svg className="waveform" viewBox="0 0 600 48" preserveAspectRatio="none" aria-label="Audio waveform">{peaks.map((peak, i) => <line key={i} x1={i * 5 + 2} x2={i * 5 + 2} y1={24 - Math.max(1, peak * 22)} y2={24 + Math.max(1, peak * 22)} stroke="currentColor" strokeWidth="2.2"/>)}</svg>; }
const tracks = [{ id: 'visual', name: 'Picture', icon: ImageIcon }, { id: 'overlay', name: 'Overlay', icon: Layers2 }, { id: 'text', name: 'Text', icon: Type }, { id: 'caption', name: 'Captions', icon: Captions }, { id: 'narration', name: 'Narration', icon: Mic }, { id: 'music', name: 'Music / SFX', icon: Music2 }];
export function Timeline({ project: p, frame, seek, selected, select, edit, split, remove, addText, addAsset, tool, setTool, cutAt, addCaption, addTransition, selectTransition }: {
  project: Project; frame: number; seek: (f: number) => void; selected: string[]; select: (ids: string[]) => void;
  edit: (f: (p: Project) => void) => void; split: () => void; remove: () => void; addText: () => void; addAsset: (assetId: string, track?: Clip['track'], at?: number) => void;
  tool: 'select' | 'razor'; setTool: (tool: 'select' | 'razor') => void; cutAt: (clipId: string, frame: number) => void; addCaption: () => void;
  addTransition: (from: string, to: string, type: Transition['type']) => void; selectTransition: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(72), [snapping, setSnapping] = useState(true);
  const [gesture, setGesture] = useState<{ clipId: string; startFrame: number; durationFrames: number; sourceIn: number } | null>(null);
  const gestureRef = useRef(gesture); gestureRef.current = gesture;
  const pixels = zoom / 30;
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(1000), [scrollLeft, setScrollLeft] = useState(0), [horizon, setHorizon] = useState(3600);
  useEffect(() => { const observer = new ResizeObserver(([entry]) => setViewportWidth(entry.contentRect.width)); if (viewport.current) observer.observe(viewport.current); return () => observer.disconnect(); }, []);
  const width = Math.max(viewportWidth, totalFrames(p) * pixels + viewportWidth, horizon * pixels);
  const drag = (e: React.PointerEvent, clip: Clip, mode: 'move' | 'left' | 'right') => {
    e.stopPropagation(); e.preventDefault();
    if (tool === 'razor' && mode === 'move') { const surface = e.currentTarget.closest('.timeline-surface')!.getBoundingClientRect(); cutAt(clip.id, Math.round((e.clientX - surface.left) / pixels)); return; }
    select(e.shiftKey ? [...new Set([...selected, clip.id])] : [clip.id]);
    const startX = e.clientX, duration = sceneFrames(p, p.scenes.find(s => s.id === clip.sceneId)!);
    const source = p.assets.find(a => a.id === clip.assetId)?.versions.find(v => v.id === clip.versionId)?.durationFrames;
    const markers = [0, duration, frame - sceneStart(p, clip.sceneId), ...p.clips.filter(c => c.id !== clip.id && c.sceneId === clip.sceneId && c.track === clip.track).flatMap(c => [c.startFrame, c.startFrame + c.durationFrames])];
    const snap = (value: number) => snapping ? markers.reduce((best, m) => Math.abs(m - value) < 6 / pixels && Math.abs(m - value) < Math.abs(best - value) ? m : best, value + 100000) : value;
    const snapValue = (value: number) => { const result = snap(value); return result === value + 100000 ? value : result; };
    gestureRef.current = { clipId: clip.id, startFrame: clip.startFrame, durationFrames: clip.durationFrames, sourceIn: clip.sourceIn };
    const move = (event: PointerEvent) => {
      const delta = Math.round((event.clientX - startX) / pixels);
      let start = clip.startFrame, len = clip.durationFrames, sourceIn = clip.sourceIn;
      if (mode === 'move') start = Math.max(0, Math.min(duration - len, snapValue(clip.startFrame + delta)));
      if (mode === 'right') len = Math.max(1, Math.min(duration - start, source ? Math.floor((source - sourceIn) / clip.speed) : Infinity, snapValue(start + clip.durationFrames + delta) - start));
      if (mode === 'left') {
        start = Math.max(0, source ? clip.startFrame - Math.floor(clip.sourceIn / clip.speed) : 0, Math.min(clip.startFrame + clip.durationFrames - 1, snapValue(clip.startFrame + delta)));
        len = clip.startFrame + clip.durationFrames - start;
        sourceIn = source ? clip.sourceIn + Math.round((start - clip.startFrame) * clip.speed) : 0;
      }
      const next = { clipId: clip.id, startFrame: start, durationFrames: len, sourceIn };
      gestureRef.current = next; setGesture(next);
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel);
      const changed = gestureRef.current;
      if (changed) edit(draft => { const target = draft.clips.find(c => c.id === clip.id); if (target) Object.assign(target, { startFrame: changed.startFrame, durationFrames: changed.durationFrames, sourceIn: changed.sourceIn }); });
      gestureRef.current = null; setGesture(null);
    };
    const cancel = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', cancel); gestureRef.current = null; setGesture(null); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', cancel);
  };
  return <section className="timeline-panel" aria-label="Video timeline">
    <div className="timeline-toolbar"><div className="toolbar-group"><span className="panel-eyebrow">TIMELINE</span><Button size="icon-sm" variant={tool === 'select' ? 'secondary' : 'ghost'} title="Selection tool (V)" aria-label="Selection tool" onClick={() => setTool('select')}><MousePointer2/></Button><Button size="icon-sm" variant={tool === 'razor' ? 'secondary' : 'ghost'} title="Razor (C): click a clip exactly where you want to cut" aria-label="Razor tool" onClick={() => setTool(tool === 'razor' ? 'select' : 'razor')}><Scissors/></Button><span className="header-divider"/><Button size="icon-sm" variant="ghost" title="Add text" aria-label="Add text" onClick={addText}><Type/></Button><Button size="icon-sm" variant="ghost" title="Add caption" aria-label="Add caption" onClick={addCaption}><Captions/></Button><Button size="icon-sm" variant="ghost" title="Delete selection" aria-label="Delete selection" disabled={!selected.length} onClick={remove}><Trash2/></Button><Button size="icon-sm" variant={snapping ? 'secondary' : 'ghost'} title="Snap clips to boundaries" aria-label="Toggle snapping" aria-pressed={snapping} onClick={() => setSnapping(s => !s)}><Magnet/></Button><span className="timeline-tool-hint">{tool === 'razor' ? 'Click a clip to cut here' : 'Drag to move · edges to trim'}</span></div><div className="toolbar-group"><span className="time-readout">{timecode(frame)}</span><span className="timeline-hint">30 fps</span><Button size="icon-sm" variant="ghost" aria-label="Zoom out" onClick={() => setZoom(z => Math.max(16, z / 1.4))}><ZoomOut/></Button><input aria-label="Timeline zoom" type="range" min="16" max="180" value={zoom} onChange={e => setZoom(Number(e.target.value))}/><Button size="icon-sm" variant="ghost" aria-label="Zoom in" onClick={() => setZoom(z => Math.min(180, z * 1.4))}><ZoomIn/></Button></div></div>
    <div className="timeline-body"><div className="track-labels"><div className="ruler-label">TRACKS</div><div className="scene-label">SCENES</div>{tracks.map(track => <div className="track-label" key={track.id}><track.icon/><span>{track.name}</span><small>{track.id === 'narration' ? 'A1' : track.id === 'music' ? 'A2' : `V${tracks.indexOf(track) + 1}`}</small></div>)}</div>
      <div className="timeline-scroll" ref={viewport} onScroll={e => { const element = e.currentTarget; setScrollLeft(element.scrollLeft); if (element.scrollLeft + element.clientWidth > width - 400) setHorizon(h => Math.max(h + 1800, (width + viewportWidth) / pixels)); }}><div className={cn('timeline-surface', tool === 'razor' && 'razor-active')} style={{ width, backgroundSize: `${zoom}px 100%` }}>
        <div className="ruler" data-testid="timeline-ruler" onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const bounds = e.currentTarget.getBoundingClientRect(); seek((e.clientX - bounds.left) / pixels);
        }} onPointerMove={e => { if (e.buttons === 1) seek((e.clientX - e.currentTarget.getBoundingClientRect().left) / pixels); }}>
          {Array.from({ length: Math.ceil(viewportWidth / zoom) + 3 }, (_, offset) => { const i = Math.max(0, Math.floor(scrollLeft / zoom) - 1) + offset; return <span key={i} style={{ left: i * zoom }}>{Math.floor(i / 60) > 0 ? `${Math.floor(i / 60)}:` : ''}{i % 60 < 10 ? '0' : ''}{i % 60}s</span>; })}
        </div>
        <div className="scene-markers">{p.scenes.map((s, i) => <button key={s.id} style={{ left: sceneStart(p, s.id) * pixels, width: sceneFrames(p, s) * pixels }} onClick={() => seek(sceneStart(p, s.id))}><span>{String(i + 1).padStart(2, '0')}</span>{s.title}</button>)}</div>
        {tracks.map(track => <div key={track.id} className={cn('timeline-track', track.id)} data-testid={`track-${track.id}`}
          onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const assetId = e.dataTransfer.getData('vibecut/asset'); if (assetId && track.id !== 'narration') addAsset(assetId, track.id as Clip['track'], Math.round((e.clientX - e.currentTarget.getBoundingClientRect().left) / pixels)); }}
          onPointerDown={e => { if (e.target === e.currentTarget) { select([]); seek((e.clientX - e.currentTarget.getBoundingClientRect().left) / pixels); } }}>
          {track.id === 'narration' ? p.scenes.map(s => {
            const asset = p.assets.find(a => a.id === s.audioAssetId); if (!asset) return null;
            return <div key={s.id} className="narration-clip" style={{ left: sceneStart(p, s.id) * pixels, width: sceneFrames(p, s) * pixels }} title="Narration anchors this scene’s duration"><span><Mic/>{asset.name}</span><Waveform peaks={activeVersion(asset).waveform ?? []}/></div>;
          }) : p.clips.filter(c => c.track === track.id).map(original => {
            const clip = gesture?.clipId === original.id ? { ...original, ...gesture } : original;
            const asset = p.assets.find(a => a.id === clip.assetId), version = asset?.versions.find(v => v.id === clip.versionId);
            return <div key={clip.id} role="button" tabIndex={0} aria-label={`Timeline clip ${asset?.name ?? clip.text}`} data-testid="timeline-clip" aria-pressed={selected.includes(clip.id)}
              onKeyDown={e => { if (e.key === 'Enter') select([clip.id]); }}
              className={cn('timeline-clip', selected.includes(clip.id) && 'selected', clip.track)} style={{ left: (sceneStart(p, clip.sceneId) + clip.startFrame) * pixels, width: clip.durationFrames * pixels }} onPointerDown={e => drag(e, original, 'move')}>
              {asset?.kind === 'image' && <div className="clip-filmstrip" style={{ backgroundImage: `url("${mediaUrl(p.id, version!.path)}")` }}/>}
              <span className="clip-title">{asset?.name ?? clip.text}</span>
              {asset?.kind === 'audio' && <Waveform peaks={version?.waveform ?? []}/>}
              <span className="clip-time">{(clip.durationFrames / 30).toFixed(1)}s</span><i className="trim-handle left" title="Trim start" onPointerDown={e => drag(e, original, 'left')}/><i className="trim-handle right" title="Trim end" onPointerDown={e => drag(e, original, 'right')}/>
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
      </div></div>
    </div>
  </section>;
}
