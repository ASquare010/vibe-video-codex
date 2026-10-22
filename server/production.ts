import { activeVersion, type Project, type Job, type AgentResult } from '../shared/project.ts';

export function validateProductionResult(p: Project, job: Job, result: AgentResult) {
  if (p.production.status !== 'running' || !['audio', 'images', 'video'].includes(job.action)) return;
  const scene = p.scenes.find(s => s.id === job.sceneId)!;
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
  if (p.production.status !== 'running') return null;
  for (const scene of p.scenes) {
    const audio = p.assets.find(a => a.id === scene.audioAssetId);
    if (!audio || audio.outdated || !activeVersion(audio).durationFrames) return {
      action: 'audio', sceneId: scene.id,
      instructions: `Generate the complete approved narration for scene ${scene.title}. Use its exact words and spoken/audio direction plus the project skill. Return one real measured audio file for this scene. Preserve the narrator identity. All scene narration must finish before any new visuals.`,
    };
  }
  for (const scene of p.scenes) {
    const images = p.assets.filter(a => a.sceneId === scene.id && a.kind === 'image' && !a.outdated);
    const missing = scene.shots.length ? scene.shots.filter(s => !images.some(a => a.shotId === s.id)).length : images.length ? 0 : 1;
    if (missing) return { action: 'images', sceneId: scene.id, instructions: `Generate all missing planned images for scene ${scene.title}, not just the first shot. Use every shot's standalone image prompt and real accepted references. Distribute placements across the measured narration. Include shotId and frame timing for each returned image. Reuse accepted images rather than duplicating them.` };
  }
  for (const scene of p.scenes) {
    const videos = p.assets.filter(a => a.sceneId === scene.id && a.kind === 'video' && !a.outdated);
    const required = scene.shots.filter(s => s.media === 'video');
    const missing = required.length ? required.filter(s => !videos.some(a => a.shotId === s.id)).length : scene.shots.length ? 0 : videos.length ? 0 : 1;
    if (missing) return { action: 'video', sceneId: scene.id, instructions: `Animate the missing planned video shots in scene ${scene.title} from their accepted images using each shot's video prompt. Honor the selected skill's actual budget and clip limits. Include shotId, sourceImageId and replaceClipId to replace its still placement without altering narration timing. Source clips may be longer but placements must fit. Keep all stills and source versions.` };
  }
  return null;
}
