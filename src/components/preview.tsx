import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { activeVersion, sceneFrames, sceneStart, totalFrames, dimensions, type Project, type Clip, type Annotation } from '../../shared/project';
import { transformAt, visualState, isText, trackOrder, clipFilter } from '../../shared/composition';
import { mediaUrl } from '../lib/api';

export function usePlayback(project: Project | null) {
  const [frame, setFrame] = useState(0), [playing, setPlaying] = useState(false);
  const frameRef = useRef(frame); frameRef.current = frame;
  const total = project ? totalFrames(project) : 1;
  useEffect(() => {
    if (frame >= total) { setFrame(Math.max(0, total - 1)); setPlaying(false); }
  }, [total, frame]);
  useEffect(() => {
    if (!playing) return;
    const first = performance.now(), start = frameRef.current;
    let raf = 0;
    const tick = () => {
      const next = start + Math.floor((performance.now() - first) * 30 / 1000);
      if (next >= total) { setFrame(total - 1); setPlaying(false); return; }
      setFrame(next); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [playing, total]);
  const seek = (value: number) => { setPlaying(false); setFrame(Math.max(0, Math.min(total - 1, Math.round(value)))); };
  return { frame, playing, setPlaying, seek, toggle: () => { if (frame >= total - 1) setFrame(0); setPlaying(p => !p); } };
}
function SyncedMedia({ url, time, playing, volume = 1, speed = 1, video = false, style, onError }: { url: string; time: number; playing: boolean; volume?: number; speed?: number; video?: boolean; style?: CSSProperties; onError: () => void }) {
  const ref = useRef<HTMLMediaElement | null>(null);
  useEffect(() => {
    const media = ref.current; if (!media) return;
    if (Number.isFinite(time) && Math.abs(media.currentTime - time) > (playing ? 0.12 : 0.01)) media.currentTime = time;
    media.volume = volume;
    media.playbackRate = speed;
    if (playing && media.paused) void media.play().catch(onError);
    if (!playing && !media.paused) media.pause();
  }, [time, playing, volume, speed, onError]);
  return video ? <video ref={node => { ref.current = node; }} src={url} style={style} muted playsInline preload="auto" onError={onError} /> : <audio ref={node => { ref.current = node; }} src={url} preload="auto" onError={onError} />;
}
export const clipTransform = transformAt;
export function Preview({ project: p, frame, playing, selected, select, annotationMode, paths, setPaths, stageRef, reportError, editClip }: {
  project: Project; frame: number; playing: boolean; selected: string | null; select: (id: string) => void;
  annotationMode: boolean; paths: Annotation['paths']; setPaths: (paths: Annotation['paths']) => void;
  stageRef: React.RefObject<HTMLDivElement | null>; reportError: (message: string) => void;
  editClip?: (id: string, change: Partial<Clip>) => void;
}) {
  const scene = p.scenes.find(s => frame >= sceneStart(p, s.id) && frame < sceneStart(p, s.id) + sceneFrames(p, s)) ?? p.scenes[0];
  const local = frame - sceneStart(p, scene.id);
  const clips = p.clips.filter(c => visualState(p, c, frame).active).sort((a, b) => trackOrder.indexOf(a.track) - trackOrder.indexOf(b.track) || a.startFrame - b.startFrame);
  const audio = p.assets.find(a => a.id === scene.audioAssetId);
  const parent = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 800, height: 450 });
  const [drawing, setDrawing] = useState(false);
  const [dragging, setDragging] = useState<{ id: string; x: number; y: number } | null>(null);
  const pathRef = useRef(paths); pathRef.current = paths;
  const aspect = p.settings.aspectRatio.split(':').map(Number).reduce((a, b) => a / b);
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) => { const { width, height } = entry.contentRect; setBounds({ width: Math.min(width - 48, (height - 40) * aspect), height: Math.min((width - 48) / aspect, height - 40) }); });
    if (parent.current) ro.observe(parent.current); return () => ro.disconnect();
  }, [aspect]);
  const failed = () => reportError('This media could not be played. Check its file and browser codec support.');
  const moveText = (e: React.PointerEvent, clip: Clip) => {
    if (annotationMode || !editClip) return;
    e.stopPropagation(); select(clip.id);
    const box = stageRef.current!.getBoundingClientRect(), x = e.clientX, y = e.clientY;
    let next = { x: clip.x, y: clip.y };
    const move = (ev: PointerEvent) => { next = { x: Math.max(-100, Math.min(100, clip.x + (ev.clientX - x) / box.width * 100)), y: Math.max(-100, Math.min(100, clip.y + (ev.clientY - y) / box.height * 100)) }; setDragging({ id: clip.id, ...next }); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setDragging(null); editClip(clip.id, next); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  };
  const point = (e: React.PointerEvent<SVGSVGElement>): [number, number] => { const r = e.currentTarget.getBoundingClientRect(); return [Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))]; };
  return <div className="monitor-canvas" ref={parent}>
    <div className="monitor-stage" ref={stageRef} style={{ width: Math.max(1, bounds.width), height: Math.max(1, bounds.height), containerType: 'inline-size' }} data-testid="preview-stage">
      {audio && <SyncedMedia key={`${scene.id}-${audio.activeVersionId}`} url={mediaUrl(p.id, activeVersion(audio).path)} time={Math.max(0, local / 30)} playing={playing} onError={failed} />}
      {clips.map(clip => {
        const state = visualState(p, clip, frame);
        if (isText(clip)) { const pos = dragging?.id === clip.id ? dragging : clip; return <div key={clip.id} data-clip-id={clip.id} className={`preview-text ${selected === clip.id ? 'text-selected' : ''}`} onPointerDown={e => moveText(e, clip)} style={{ color: clip.color, fontSize: `${clip.fontSize / 12.8}cqw`, fontFamily: clip.fontFamily, fontWeight: clip.fontWeight, textAlign: clip.textAlign, opacity: state.opacity, left: `${50 + pos.x}%`, top: `${50 + pos.y}%`, transform: `translate(-50%,-50%) rotate(${clip.rotation}deg)`, WebkitTextStroke: `${clip.outlineWidth / 12.8}cqw ${clip.outlineColor}`, paintOrder: 'stroke fill', textShadow: clip.shadow ? '1px 2px 1px #000b' : 'none' }}>{clip.text}</div>; }
        const asset = p.assets.find(a => a.id === clip.assetId)!, version = asset.versions.find(v => v.id === clip.versionId)!;
        const time = (state.elapsed * clip.speed + clip.sourceIn) / 30;
        const transform = clipTransform(clip, state.local);
        const style: CSSProperties = { objectFit: clip.fit, filter: `${clipFilter(clip)} url(#temperature-${clip.id})`, transform: `translate(${transform.x + state.slide}%,${transform.y}%) scale(${transform.scale}) rotate(${clip.rotation}deg)` };
        if (asset.kind === 'audio') return <SyncedMedia key={clip.id} url={mediaUrl(p.id, version.path)} time={time} volume={clip.volume} playing={playing} onError={failed}/>;
        return <div key={clip.id} data-clip-id={clip.id} className="preview-layer" style={{ opacity: state.opacity, clipPath: state.reveal < 1 ? `inset(0 ${(1 - state.reveal) * 100}% 0 0)` : undefined }} onClick={() => select(clip.id)}>
          <svg width="0" height="0" aria-hidden="true"><filter id={`temperature-${clip.id}`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={`${1 + clip.temperature * 0.12} 0 0 0 0 0 1 0 0 0 0 0 ${1 - clip.temperature * 0.12} 0 0 0 0 0 1 0`}/></filter></svg>
          {asset.kind === 'image' ? <img src={mediaUrl(p.id, version.path)} alt={asset.name} style={style} draggable={false} onError={failed}/> : <SyncedMedia video url={mediaUrl(p.id, version.path)} time={time} speed={clip.speed} playing={playing && state.elapsed < clip.durationFrames - 1} style={style} onError={failed}/>}
          {clip.vignette > 0 && <div className="preview-vignette" style={{ background: `radial-gradient(ellipse,transparent 30%,rgba(0,0,0,${clip.vignette}) 100%)` }}/>}
          {selected === clip.id && !annotationMode && <div className="selection-frame"><i/><i/><i/><i/></div>}
        </div>;
      })}
      {annotationMode && <svg className="annotation-canvas" viewBox="0 0 1000 1000" preserveAspectRatio="none"
        onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setDrawing(true); setPaths([...paths, [point(e)]]); }}
        onPointerMove={e => { if (drawing) setPaths(pathRef.current.map((p, i, all) => i === all.length - 1 ? [...p, point(e)] : p)); }}
        onPointerUp={() => setDrawing(false)} onPointerCancel={() => setDrawing(false)}>
        {paths.map((path, i) => <polyline key={i} points={path.map(([x, y]) => `${x * 1000},${y * 1000}`).join(' ')} fill="none" stroke="#ff645c" strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>)}
      </svg>}
    </div>
  </div>;
}

export async function captureAnnotation(p: Project, frame: number, stage: HTMLDivElement, paths: Annotation['paths']) {
  const scene = p.scenes.find(s => frame >= sceneStart(p, s.id) && frame < sceneStart(p, s.id) + sceneFrames(p, s))!;
  const local = frame - sceneStart(p, scene.id);
  const [width, height] = dimensions(p.settings.aspectRatio, p.settings.resolution);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, width, height);
  for (const node of stage.querySelectorAll<HTMLElement>('[data-clip-id]')) {
    const clip = p.clips.find(c => c.id === node.dataset.clipId)!;
    ctx.save(); ctx.globalAlpha = clip.opacity;
    if (isText(clip)) { ctx.fillStyle = clip.color; ctx.font = `${clip.fontWeight} ${clip.fontSize * width / 1280}px ${clip.fontFamily}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; if (clip.outlineWidth) { ctx.strokeStyle = clip.outlineColor; ctx.lineWidth = clip.outlineWidth * width / 640; ctx.strokeText(clip.text, width * (0.5 + clip.x / 100), height * (0.5 + clip.y / 100)); } ctx.fillText(clip.text, width * (0.5 + clip.x / 100), height * (0.5 + clip.y / 100)); }
    else {
      const media = node.querySelector('img, video') as HTMLImageElement | HTMLVideoElement;
      const iw = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth, ih = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight;
      if (!iw || !ih) throw new Error('Wait for the preview frame to load before saving the annotation');
      const fit = clip.fit === 'cover' ? Math.max(width / iw, height / ih) : Math.min(width / iw, height / ih);
      const transform = clipTransform(clip, local);
      ctx.translate(width * (0.5 + transform.x / 100), height * (0.5 + transform.y / 100)); ctx.scale(transform.scale, transform.scale);
      ctx.beginPath(); ctx.rect(-width / 2, -height / 2, width, height); ctx.clip();
      ctx.drawImage(media, -iw * fit / 2, -ih * fit / 2, iw * fit, ih * fit);
    }
    ctx.restore();
  }
  ctx.strokeStyle = '#ff645c'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const path of paths) { ctx.beginPath(); path.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x * width, y * height) : ctx.lineTo(x * width, y * height)); ctx.stroke(); }
  return canvas.toDataURL('image/png');
}
