import { sceneStart, type Project, type Clip } from './project';

export function transformAt(clip: Clip, localFrame: number) {
  const t = Math.max(0, Math.min(1, (localFrame - clip.startFrame) / clip.durationFrames));
  const amount = clip.motionAmount;
  const zoom = clip.motion === 'zoom-in' ? 1 + amount * t : clip.motion === 'zoom-out' ? 1 + amount * (1 - t) : 1;
  const dx = clip.motion === 'pan-left' ? amount * 100 * (0.5 - t) : clip.motion === 'pan-right' ? amount * 100 * (t - 0.5) : 0;
  const dy = clip.motion === 'pan-up' ? amount * 100 * (0.5 - t) : clip.motion === 'pan-down' ? amount * 100 * (t - 0.5) : 0;
  return clip.motion === 'custom' ? { scale: clip.scale + (clip.endScale - clip.scale) * t, x: clip.x + (clip.endX - clip.x) * t, y: clip.y + (clip.endY - clip.y) * t } : { scale: clip.scale * zoom, x: clip.x + dx, y: clip.y + dy };
}
export function visualState(p: Project, clip: Clip, globalFrame: number) {
  const local = globalFrame - sceneStart(p, clip.sceneId), elapsed = local - clip.startFrame;
  const incoming = p.transitions.find(t => t.toClipId === clip.id);
  const outgoing = p.transitions.find(t => t.fromClipId === clip.id);
  const afterEnd = elapsed - clip.durationFrames;
  const hold = outgoing && outgoing.type !== 'dip-black' && afterEnd >= 0 && afterEnd < outgoing.durationFrames;
  let opacity = clip.opacity, reveal = 1, slide = 0;
  if (clip.fadeInFrames) opacity *= Math.min(1, Math.max(0, elapsed / clip.fadeInFrames));
  if (clip.fadeOutFrames) opacity *= Math.min(1, Math.max(0, (clip.durationFrames - elapsed) / clip.fadeOutFrames));
  if (incoming && elapsed >= 0 && elapsed < incoming.durationFrames) {
    const progress = elapsed / incoming.durationFrames;
    if (incoming.type === 'crossfade') opacity *= progress;
    if (incoming.type === 'dip-black') opacity *= Math.min(1, progress * 2);
    if (incoming.type === 'wipe-left') reveal = progress;
    if (incoming.type === 'slide-left') slide = (1 - progress) * 100;
  }
  if (outgoing?.type === 'dip-black' && elapsed > clip.durationFrames - outgoing.durationFrames / 2) opacity *= Math.max(0, (clip.durationFrames - elapsed) / (outgoing.durationFrames / 2));
  return { active: elapsed >= 0 && (elapsed < clip.durationFrames || !!hold), elapsed: Math.min(clip.durationFrames - 1, Math.max(0, elapsed)), local, opacity, reveal, slide };
}
export const isText = (clip: Clip) => clip.track === 'text' || clip.track === 'caption';
export const trackOrder = ['visual', 'overlay', 'text', 'caption', 'music'];
export function clipFilter(clip: Clip) { return `brightness(${1 + clip.brightness}) contrast(${clip.contrast}) saturate(${clip.saturation}) blur(${clip.blur}px)`; }
