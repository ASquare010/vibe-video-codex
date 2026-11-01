import { activeVersion, sceneFrames, type Project, type Scene } from './project.ts';

// A saved project's skill is intentionally frozen. New snapshots opt in explicitly.
export function usesAudioLedCuts(p: Pick<Project, 'skill' | 'sourceVideo'>) {
  return !p.sourceVideo && p.skill?.id === 'cinematic-3d-storytelling' && /^  workflow: (?:audio-led-cuts-v2|director-first-cuts-v3)\s*$/m.test(p.skill.content);
}

export function usesDirectorFirst(p: Pick<Project, 'skill' | 'sourceVideo'>) {
  return usesAudioLedCuts(p) && /^  workflow: director-first-cuts-v3\s*$/m.test(p.skill!.content);
}

export function writerOwnsStory(p: Pick<Project, 'skill' | 'sourceVideo'>) {
  return usesDirectorFirst(p) && /^  story-owner: writer\s*$/m.test(p.skill!.content);
}

// The saved skill opts in; historical projects retain their original direction policy.
export function directorPlanningInstructions(p: Pick<Project, 'skill' | 'sourceVideo'>) {
  return writerOwnsStory(p)
    ? "Read the writer's story and exact narration as read-only input. Preserve the story, explanations, event order, ending and every scene's words; return story problems to the writer. Direct staging, provisional cuts and performance before recording. Each scene needs at least three meaningful cuts, including at least two brief cuts, usually around 0.5–1.5 seconds, that clarify action, clues, reactions or consequences. Give longer coverage to establishment or major movement; finalize readable, complete movements against measured audio without changing speech or stretching quick actions to the provider's native duration."
    : 'Reshape the unrecorded spoken draft and visual developments together, preserving facts and the existing ordered scene IDs.';
}

// Timing and provider prompts evolve downstream; the directed events and words stay fixed.
export function directorBasis(p: Pick<Project, 'plan' | 'scenes' | 'theme'>) {
  return JSON.stringify({story:p.plan.story,fullNarration:p.plan.fullNarration,theme:p.theme,scenes:p.scenes.map(s=>({
    id:s.id,narration:s.narration,direction:s.direction,spokenStyle:s.spokenStyle,audioPrompt:s.audioPrompt,
    purpose:s.purpose,soundDesign:s.soundDesign,continuity:s.continuity,
    shots:s.shots.map(({id,purpose,narrationAnchor,startState,endState,sound,media})=>({id,purpose,narrationAnchor,startState,endState,sound,media}))
  }))});
}

export function directorTreatmentIssue(p: Project): string | null {
  return p.plan.directorBasis===directorBasis(p)?null:'Direct the whole story, provisional cuts and performance before recording narration.';
}

export function workflowSummary(p: Pick<Project, 'skill' | 'sourceVideo'>) {
  return usesDirectorFirst(p)
    ? `${writerOwnsStory(p)?'writer story and exact script -> director staging, provisional cuts and performance (script unchanged)':'story draft -> director treatment of spoken script, provisional cuts and performance'} -> all scene narration -> final timing against measured audio -> image prompts/images -> selected-image animation prompts/videos -> director assembly/review`
    : usesAudioLedCuts(p)
      ? 'story -> all measured scene narration -> director timing/cuts -> image prompts/images -> animation prompts/videos -> director assembly/review'
      : 'complete plan -> all scene narration -> images -> videos -> assembly/review';
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
