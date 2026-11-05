import { activeVersion, sceneFrames, cleanTransitions, type Project } from './project';

// Retime the entire take and every separately placed sound together; no interpolated frames.
export function retimeSourceScene(p: Project, sceneId: string, factor: number) {
  const scene = p.scenes.find(s => s.id === sceneId);
  if (!scene?.source || scene.audioAssetId || !Number.isFinite(factor) || factor < 1 || factor > 1.25) return;
  const clips = p.clips.filter(c => c.sceneId === sceneId);
  if (!clips.length || clips.some(c => c.speed * factor > 4)) return;
  const length = Math.max(1, Math.floor(sceneFrames(p, scene) / factor));
  for (const c of clips) {
    const a = p.assets.find(a => a.id === c.assetId);
    const v = a?.versions.find(v => v.id === c.versionId) ?? (a ? activeVersion(a) : undefined);
    c.startFrame = Math.floor(c.startFrame / factor);
    c.durationFrames = Math.max(1, Math.min(Math.floor(c.durationFrames / factor), length - c.startFrame));
    if (a && a.kind !== 'image') { c.speed *= factor; if (v?.durationFrames) c.durationFrames = Math.min(c.durationFrames, Math.floor((v.durationFrames - c.sourceIn) / c.speed)); }
    c.fadeInFrames = Math.floor(c.fadeInFrames / factor); c.fadeOutFrames = Math.floor(c.fadeOutFrames / factor);
  }
  p.clips = p.clips.filter(c => c.durationFrames > 0 && (c.sceneId !== sceneId || c.startFrame < length));
  scene.estimatedFrames = length;
  for (const t of p.transitions) if (clips.some(c => c.id === t.fromClipId)) t.durationFrames = Math.max(1, Math.floor(t.durationFrames / factor));
  cleanTransitions(p);
}
