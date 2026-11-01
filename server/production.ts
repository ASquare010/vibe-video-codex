import { activeVersion, type Project, type Job, type AgentResult } from '../shared/project.ts';
import { directionIssue, usesAudioLedCuts } from '../shared/audio-led.ts';

export function validatePlanResult(p: Project, result: AgentResult) {
  if (!result.plan?.story.trim() || !result.plan.fullNarration.trim() || !result.scenes?.length || !result.scenes.every(s => s.narration.trim())) throw new Error('The draft needs the complete story and exact narration for every scene.');
  if (usesAudioLedCuts(p)) {
    const normalized = (s: string) => s.replace(/\s+/g, ' ').trim();
    if (normalized(result.scenes.map(s => s.narration).join(' ')) !== normalized(result.plan.fullNarration)) throw new Error('Scene narration must preserve the full script without missing or repeated words.');
  } else if (!result.scenes.every(s => s.direction.trim() && s.spokenStyle.trim() && s.audioPrompt.trim() && s.shots.length && s.shots.every(shot => shot.imagePrompt.trim() && shot.videoPrompt.trim()))) throw new Error('The whole-video draft must include narration, voice direction and planned shot prompts.');
}

export function validateProductionResult(p: Project, job: Job, result: AgentResult) {
  if (p.production.status !== 'running') return;
  const scene = p.scenes.find(s => s.id === job.sceneId)!;
  if (usesAudioLedCuts(p) && job.action === 'storyboard') {
    const update = result.sceneUpdates.find(s => s.id === scene.id);
    if (!update || result.assets.length || (update.narration !== undefined && update.narration !== scene.narration) || (update.audioAssetId !== undefined && update.audioAssetId !== scene.audioAssetId)) throw new Error('Direction must return the cut plan while preserving accepted narration; do not generate media in this stage.');
    const issue = directionIssue(p, { ...scene, ...update });
    if (issue) throw new Error(issue);
    return;
  }
  if (!['audio', 'images', 'video'].includes(job.action)) return;
  if (usesAudioLedCuts(p) && ['images', 'video'].includes(job.action)) {
    const issue = directionIssue(p, scene);
    if (issue) throw new Error(issue);
    const update = result.sceneUpdates.find(s => s.id === scene.id);
    if ((update?.narration !== undefined && update.narration !== scene.narration) || (update?.audioAssetId !== undefined && update.audioAssetId !== scene.audioAssetId)) throw new Error('Visual production must preserve accepted narration.');
    if ((update?.direction !== undefined && update.direction !== scene.direction) || (update?.directionBasis !== undefined && JSON.stringify(update.directionBasis) !== JSON.stringify(scene.directionBasis))) throw new Error('Prompt writers must preserve the director plan and its measured-audio basis.');
    if (update?.shots && (update.shots.length !== scene.shots.length || scene.shots.some(s => !update.shots!.some(t => t.id === s.id && t.startFrame === s.startFrame && t.durationFrames === s.durationFrames && t.narrationAnchor === s.narrationAnchor && t.startState === s.startState && t.endState === s.endState && t.media === s.media)))) throw new Error('Prompt writers must preserve the director cut IDs, timing and action states. Return coverage concerns to the director.');
    if (result.assets.some(a => !a.prompt.trim())) throw new Error('Generated media must retain its resolved provider prompt.');
  }
  const expected = job.action === 'audio' ? 'audio' : job.action === 'images' ? 'image' : 'video';
  const returned = result.assets.filter(a => a.sceneId === scene.id && a.kind === expected);
  if (job.action === 'audio') {
    if (returned.length !== 1) throw new Error('Production needs exactly one complete narration file for this scene. The result is preserved for review.');
    return;
  }
  const required = scene.shots.filter(s => job.action === 'images' || s.media === 'video').filter(s => !p.assets.some(a => !a.archived && !a.outdated && a.sceneId === scene.id && a.kind === expected && a.shotId === s.id));
  if (required.some(shot => !returned.some(a => a.shotId === shot.id))) throw new Error('The generation result is missing planned shot IDs. Production stopped to avoid repeating generation; the result and files are preserved for review.');
  if (job.action === 'video' && returned.some(a => !p.assets.some(image => image.id === a.sourceImageId && image.kind === 'image' && image.sceneId === scene.id && image.shotId === a.shotId && !image.outdated))) throw new Error('Video results must identify their accepted source image for each shot. Production stopped; the files are preserved for review.');
}

export function nextProductionTask(p: Project): { action: Job['action']; sceneId: string; instructions: string } | null {
  if (p.sourceVideo || p.production.status !== 'running') return null;
  for (const scene of p.scenes) {
    const audio = p.assets.find(a => a.id === scene.audioAssetId && a.kind === 'audio' && !a.archived);
    if (!audio || audio.outdated || !activeVersion(audio).durationFrames) return {
      action: 'audio', sceneId: scene.id,
      instructions: `Generate the complete approved narration for scene ${scene.title}. Use its exact words and spoken/audio direction plus the project skill. Return one real measured audio file for this scene. Preserve the narrator identity. All scene narration must finish before any new visuals.`,
    };
  }
  if (usesAudioLedCuts(p)) {
    const pending = p.scenes.find(scene => directionIssue(p, scene));
    if (pending) return {
      action: 'storyboard', sceneId: pending.id,
      instructions: `Direct the measured narration for ${pending.title} using references/director.md in the selected skill. Return sceneUpdates with direction, at least three meaningful shots, and directionBasis {audioVersionId: the selected audio activeVersionId, narration: exact unchanged scene narration, fps: current project fps}. Save uneven frame intervals covering the audio exactly, essential short inserts, exact narration anchors, incoming/outgoing states and previous/current/next continuity. Preserve complete scene speech and audioAssetId. Image/video prompts may remain empty. Camera composition belongs to the image prompt writer; camera travel belongs to animation. This stage returns a direction plan only, with no generated assets.`,
    };
  }
  for (const scene of p.scenes) {
    const images = p.assets.filter(a => a.sceneId === scene.id && a.kind === 'image' && !a.outdated && !a.archived);
    // Replacing a preview archives its image, but a finished selected video means
    // that cut no longer needs image generation. Do not resubmit already paid work.
    const finishedVideos = p.assets.filter(a => a.sceneId === scene.id && a.kind === 'video' && !a.outdated && !a.archived);
    const missing = scene.shots.length ? scene.shots.filter(s => !images.some(a => a.shotId === s.id) && !(s.media === 'video' && finishedVideos.some(a => a.shotId === s.id))).length : images.length || finishedVideos.length ? 0 : 1;
    if (missing) return { action: 'images', sceneId: scene.id, instructions: `${usesAudioLedCuts(p) ? "First use templates/image.md as the LLM prompt-writer instructions for each missing directed cut, with its narration and previous/current/next packet. Resolve and save imagePrompt before provider submission; do not send the meta-template to the image model or change cut membership/timing/states. " : ''}Generate all missing planned images for scene ${scene.title}, not just the first shot. Use every shot's standalone image prompt and real accepted references. Include the actual provider prompt, shotId and directed frame timing for each returned image. Reuse accepted images rather than duplicating them.` };
  }
  for (const scene of p.scenes) {
    const videos = p.assets.filter(a => a.sceneId === scene.id && a.kind === 'video' && !a.outdated && !a.archived);
    const required = scene.shots.filter(s => s.media === 'video');
    const missing = required.length ? required.filter(s => !videos.some(a => a.shotId === s.id)).length : scene.shots.length ? 0 : videos.length ? 0 : 1;
    if (missing) return { action: 'video', sceneId: scene.id, instructions: `${usesAudioLedCuts(p) ? "First use templates/animation.md as the LLM prompt-writer instructions for each missing cut, its actual selected image, narration and adjacent state. Resolve and save videoPrompt before provider submission. Preserve the director plan, essential brief inserts and action count; native model duration does not set the edit duration. Record any selected source interval and justified playback rate without changing narration. " : ''}Animate the missing planned video shots in scene ${scene.title} from their accepted images using each shot's video prompt. Honor the selected skill's actual budget and clip limits. Include the actual provider prompt, shotId, sourceImageId and replaceClipId to replace its still placement without altering narration timing. Source clips may be longer but placements must fit. Keep all stills and source versions.` };
  }
  return null;
}
