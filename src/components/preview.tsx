import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { activeVersion, sceneFrames, sceneStart, totalFrames, dimensions, type Project, type Clip, type Annotation } from '../../shared/project';
import { transformAt, visualState, isText, trackOrder, clipFilter } from '../../shared/composition';
import {buildPlaybackIndex,playbackWindow} from '../../shared/playback-index';
import { mediaUrl } from '../lib/api';

export function usePlayback(project: Project | null) {
  const [frame, setFrame] = useState(0), [playing, setPlaying] = useState(false), [buffering,setBuffering]=useState(false);
  const frameRef = useRef(frame); frameRef.current = frame;
  const fps = project?.settings.fps ?? 30;
  const total = useMemo(() => project ? totalFrames(project) : 1, [project]);
  useEffect(() => {
    if (frame >= total) { setFrame(Math.max(0, total - 1)); setPlaying(false); }
  }, [total, frame]);
  useEffect(() => {
    if (!playing || buffering) return;
    const first = performance.now(), start = frameRef.current;
    let raf = 0;
    const tick = () => {
      const next = start + Math.floor((performance.now() - first) * fps / 1000);
      if (next >= total) { setFrame(total - 1); setPlaying(false); return; }
      setFrame(next); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf);
  }, [playing, total, fps, buffering]);
  const seek = useCallback((value: number) => { setPlaying(false); setFrame(Math.max(0, Math.min(total - 1, Math.round(value)))); }, [total]);
  return { frame, playing, setPlaying, buffering, setBuffering, seek, toggle: () => { if (frame >= total - 1) setFrame(0); setPlaying(p => !p); } };
}
export function SyncedMedia({ url, time, playing, volume = 1, speed = 1, video = false, style, onError, onBuffering }: { url: string; time: number; playing: boolean; volume?: number; speed?: number; video?: boolean; style?: CSSProperties; onError: (message?:string) => void; onBuffering?: (waiting:boolean)=>void }) {
  const ref=useRef<HTMLMediaElement|null>(null),pending=useRef<Promise<void>|null>(null),alive=useRef(true);
  const desired=useRef({time,playing,volume,speed,onError,onBuffering});desired.current={time,playing,volume,speed,onError,onBuffering};
  const reported=useRef<boolean|null>(null);
  const waiting=()=>{if(!alive.current)return;const m=ref.current,value=!!m&&(m.readyState<2||m.seeking);if(reported.current!==value){reported.current=value;desired.current.onBuffering?.(value);}};
  const failed=()=>{if(!alive.current)return;const m=ref.current;if(!m?.error||m.error.code===1)return;desired.current.onError(`Could not play ${video?'video':'sound'} (${decodeURIComponent(url.split('path=')[1]||url)}). ${m.error.message||'Media decoding failed.'}`);};
  const sync=()=>{
    const m=ref.current,d=desired.current;if(!m)return;
    m.volume=d.volume;m.playbackRate=d.speed;
    if(m.readyState>=1&&!m.seeking&&Number.isFinite(d.time)&&Math.abs(m.currentTime-d.time)>(d.playing?.25:.03)){
      // Repeated seeks while decoding keep a valid video permanently buffering.
      if(!d.playing||m.readyState>=2)m.currentTime=Math.max(0,Math.min(d.time,Number.isFinite(m.duration)?Math.max(0,m.duration-.001):d.time));
    }
    if(!d.playing){if(!m.paused)m.pause();return;}
    if(m.paused&&m.readyState>=2&&!m.seeking&&!pending.current){
      const attempt=m.play();pending.current=attempt;
      void attempt.catch((e:DOMException)=>{
        // Scene changes, pauses and seeks legitimately interrupt play(). This is not a codec error.
        if(!alive.current||!desired.current.playing||e.name==='AbortError')return;
        if(e.name==='NotAllowedError'){desired.current.onError('Press Play again to enable sound in this browser.');return;}
        desired.current.onError(`Could not start ${video?'video':'sound'}: ${e.message}`);
      }).finally(()=>{if(pending.current===attempt)pending.current=null;});
    }
  };
  useEffect(()=>{alive.current=true;reported.current=null;const media=ref.current;if(media&&media.getAttribute("src")!==url)media.setAttribute("src",url);waiting();return()=>{alive.current=false;pending.current=null;if(media){media.pause();media.removeAttribute("src");media.load();}};},[url]);
  useEffect(sync,[time,playing,volume,speed,url]);
  const ready=()=>{sync();waiting();};
  const events={onLoadedMetadata:ready,onLoadedData:ready,onCanPlay:ready,onSeeked:ready,onSeeking:waiting,onWaiting:waiting,onError:failed};
  return video ? <video ref={ref as React.Ref<HTMLVideoElement>} src={url} style={style} muted playsInline preload="auto" {...events}/> : <audio ref={ref as React.Ref<HTMLAudioElement>} src={url} preload="auto" {...events}/>;
}
export const clipTransform = transformAt;
export function Preview({ project: p, frame, playing, selected, select, annotationMode, paths, setPaths, stageRef, reportError, editClip, onBuffering }: {
  project: Project; frame: number; playing: boolean; selected: string | null; select: (id: string) => void;
  annotationMode: boolean; paths: Annotation['paths']; setPaths: (paths: Annotation['paths']) => void;
  stageRef: React.RefObject<HTMLDivElement | null>; reportError: (message: string) => void; onBuffering?: (waiting:boolean)=>void;
  editClip?: (id: string, change: Partial<Clip>) => void;
}) {
  const index=useMemo(()=>buildPlaybackIndex(p),[p]);
  const frameWindow=playbackWindow(index,frame,p.settings.fps),scene=frameWindow.scene.scene;
  const [readyMedia,setReadyMedia]=useState<Record<string,boolean>>({});
  const decodedMedia=useRef(new Set<string>());
  const mediaKey=(c:Clip)=>`${c.id}:${c.versionId}`;
  const activePictures=frameWindow.active.filter(e=>e.clip.track==='visual');
  const waitingPicture=activePictures.some(e=>index.assets.get(e.clip.assetId!)?.kind==='video'&&!decodedMedia.current.has(mediaKey(e.clip)));
  const hold=waitingPicture&&!activePictures.some(e=>index.incoming.get(e.clip.id)?.type==='dip-black')?frameWindow.previous:undefined;
  const clips=frameWindow.entries.filter(e=>e.end>frame||e.clip.id===hold?.clip.id).map(e=>e.clip).sort((a,b)=>trackOrder.indexOf(a.track)-trackOrder.indexOf(b.track)||((a.id===hold?.clip.id?-1:0)-(b.id===hold?.clip.id?-1:0))||((index.starts.get(a.sceneId)||0)+a.startFrame)-((index.starts.get(b.sceneId)||0)+b.startFrame));
  const retainedKeys=clips.map(mediaKey).sort().join("|");
  useEffect(()=>{const keep=new Set(retainedKeys.split("|").filter(Boolean));for(const key of decodedMedia.current)if(!keep.has(key))decodedMedia.current.delete(key);setReadyMedia(old=>{const entries=Object.entries(old).filter(([key])=>keep.has(key));return entries.length===Object.keys(old).length?old:Object.fromEntries(entries);});},[retainedKeys]);
  const loading=frameWindow.active.some(e=>['video','audio'].includes(index.assets.get(e.clip.assetId!)?.kind||'')&&!readyMedia[mediaKey(e.clip)]);
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
  const failed = (message?:string) => reportError(message||'This image could not be loaded.');
  const reportWaiting=useRef(onBuffering);reportWaiting.current=onBuffering;
  const buffer=(key:string,value:boolean)=>{if(!value)decodedMedia.current.add(key);setReadyMedia(old=>old[key]===!value?old:{...old,[key]:!value});};
  useEffect(()=>{reportWaiting.current?.(loading);},[loading]);
  useEffect(()=>()=>{reportWaiting.current?.(false);},[]);
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
    <div className="monitor-stage" ref={stageRef} style={{ width: Math.max(1, bounds.width), height: Math.max(1, bounds.height), containerType: 'inline-size' }} data-testid="preview-stage" data-frame={frame}>
      {clips.map(clip => {
        const state = visualState(p, clip, frame,index);
        if (isText(clip)) { if(!state.active)return null; const pos = dragging?.id === clip.id ? dragging : clip; return <div key={clip.id} data-clip-id={clip.id} className={`preview-text ${selected === clip.id ? 'text-selected' : ''}`} onPointerDown={e => moveText(e, clip)} style={{ color: clip.color, fontSize: `${clip.fontSize / 12.8}cqw`, fontFamily: clip.fontFamily, fontWeight: clip.fontWeight, textAlign: clip.textAlign, opacity: state.opacity, left: `${50 + pos.x}%`, top: `${50 + pos.y}%`, transform: `translate(-50%,-50%) rotate(${clip.rotation}deg)`, WebkitTextStroke: `${clip.outlineWidth / 12.8}cqw ${clip.outlineColor}`, paintOrder: 'stroke fill', textShadow: clip.shadow ? '1px 2px 1px #000b' : 'none' }}>{clip.text}</div>; }
        const asset = index.assets.get(clip.assetId!)!, version = asset.versions.find(v => v.id === clip.versionId)!;
        const time = (state.elapsed * clip.speed + clip.sourceIn) / p.settings.fps;
        const transform = clipTransform(clip, state.local);
        const hasFilter=clip.brightness!==0||clip.contrast!==1||clip.saturation!==1||clip.blur!==0||clip.temperature!==0;
        const style: CSSProperties = { objectFit: clip.fit, filter: hasFilter ? `${clipFilter(clip)}${clip.temperature ? ` url(#temperature-${clip.id})` : ''}` : undefined, transform: `translate(${transform.x + state.slide}%,${transform.y}%) scale(${transform.scale}) rotate(${clip.rotation}deg)` };
        const key=mediaKey(clip),fallback=hold?.clip.id===clip.id;
        if (asset.kind === 'audio') return <SyncedMedia key={key} url={mediaUrl(p.id, version.path)} time={time} volume={clip.volume} speed={clip.speed} playing={playing && state.active} onError={failed} onBuffering={v=>buffer(key,v)}/>;
        return <div key={key} data-clip-id={clip.id} data-active={state.active} data-hold={!!fallback} aria-hidden={!state.active} className="preview-layer" style={{ pointerEvents:state.active?undefined:'none',opacity: fallback ? clip.opacity : state.active && (asset.kind!=='video'||decodedMedia.current.has(key)) ? state.opacity : 0, clipPath: state.reveal < 1 ? `inset(0 ${(1 - state.reveal) * 100}% 0 0)` : undefined }} onClick={() => select(clip.id)}>
          {!!clip.temperature && <svg width="0" height="0" aria-hidden="true"><filter id={`temperature-${clip.id}`} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={`${1 + clip.temperature * 0.12} 0 0 0 0 0 1 0 0 0 0 0 ${1 - clip.temperature * 0.12} 0 0 0 0 0 1 0`}/></filter></svg>}
          {asset.kind === 'image' ? <img src={mediaUrl(p.id, version.path)} alt={asset.name} style={style} draggable={false} onError={()=>failed()}/> : <SyncedMedia video url={mediaUrl(p.id, version.path)} time={time} speed={clip.speed} playing={playing && state.active} style={style} onError={failed} onBuffering={v=>buffer(key,v)}/>}
          {clip.vignette > 0 && <div className="preview-vignette" style={{ background: `radial-gradient(ellipse,transparent 30%,rgba(0,0,0,${clip.vignette}) 100%)` }}/>}
          {state.active && selected === clip.id && !annotationMode && <div className="selection-frame"><i/><i/><i/><i/></div>}
        </div>;
      })}
      {loading && <div className="preview-buffering" role="status">Loading clip…</div>}
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
  for (const node of stage.querySelectorAll<HTMLElement>('[data-clip-id]:not([data-active="false"])')) {
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
