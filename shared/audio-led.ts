import { activeVersion, sceneFrames, type Project, type Scene } from './project.ts';

// A saved project's skill is intentionally frozen. Only explicit v2 snapshots opt in.
export function usesAudioLedCuts(p: Pick<Project, 'skill' | 'sourceVideo'>) {
  return !p.sourceVideo && p.skill?.id === 'cinematic-3d-storytelling' && /^  workflow: audio-led-cuts-v2\s*$/m.test(p.skill.content);
}

export function directionBasis(p: Project, scene: Scene) {
  const audio = p.assets.find(a => a.id === scene.audioAssetId && a.kind === 'audio' && !a.outdated && !a.archived);
  if (!audio || !activeVersion(audio).durationFrames) return null;
  return { audioVersionId: audio.activeVersionId, narration: scene.narration, fps: p.settings.fps };
}

export function directionIssue(p: Project, scene: Scene): string | null {
  const basis = directionBasis(p, scene);
  if (!basis || !scene.directionBasis || basis.audioVersionId !== scene.directionBasis.audioVersionId || basis.narration !== scene.directionBasis.narration || basis.fps !== scene.directionBasis.fps) return 'Direction must use the current measured narration and frame rate.';
  if (!scene.direction.trim() || scene.shots.length < 3) return 'Direct at least three meaningful cuts for this scene.';
  if (new Set(scene.shots.map(s => s.id)).size !== scene.shots.length) return 'Directed cut IDs must be unique.';
  let cursor = 0;
  for (const shot of [...scene.shots].sort((a, b) => a.startFrame - b.startFrame)) {
    if (shot.startFrame !== cursor) return 'Directed cuts must cover the scene without gaps or overlaps.';
    if (!shot.narrationAnchor.trim() || !scene.narration.includes(shot.narrationAnchor) || !shot.startState.trim() || !shot.endState.trim()) return 'Every directed cut needs an exact narration anchor and incoming/outgoing state.';
    cursor += shot.durationFrames;
  }
  return cursor === sceneFrames(p, scene) ? null : 'Directed cut coverage must equal the measured scene duration.';
}
