import { activeVersion, type Project, type Job, type AgentResult } from '../shared/project.ts';
import { directorBasis, directorPlanningInstructions, directorTreatmentIssue, directionIssue, usesAudioLedCuts, usesDirectorFirst, writerOwnsStory } from '../shared/audio-led.ts';

export function validatePlanResult(p: Project, result: AgentResult) {
  if (usesDirectorFirst(p) && result.plan?.directorBasis !== undefined) throw new Error('A writing draft cannot certify the director treatment.');
  if (!result.plan?.story?.trim() || !result.plan.fullNarration?.trim() || !result.scenes?.length || !result.scenes.every(s => s.narration.trim())) throw new Error('The draft needs the complete story and exact narration for every scene.');
  if (usesAudioLedCuts(p)) {
    const normalized = (s: string) => s.replace(/\s+/g, ' ').trim();
    if (normalized(result.scenes.map(s => s.narration).join(' ')) !== normalized(result.plan.fullNarration)) throw new Error('Scene narration must preserve the full script without missing or repeated words.');
  } else if (!result.scenes.every(s => s.direction.trim() && s.spokenStyle.trim() && s.audioPrompt.trim() && s.shots.length && s.shots.every(shot => shot.imagePrompt.trim() && shot.videoPrompt.trim()))) throw new Error('The whole-video draft must include narration, voice direction and planned shot prompts.');
}

export function validateProductionResult(p: Project, job: Job, result: AgentResult) {
  if (usesDirectorFirst(p) && job.action === 'storyboard' && job.scope === 'project') {
    if (result.assets.length || result.sceneUpdates.length || result.settings || result.clipUpdates.length || result.newClips.length || result.removeClipIds.length || result.transitions) throw new Error('Director treatment returns the full spoken plan and scenes, without media, settings or placement edits.');
    validatePlanResult(p,{...result,plan:result.plan?{...result.plan,directorBasis:undefined}:undefined});
    if(result.plan?.classification!==undefined&&result.plan.classification!==p.plan.classification)throw new Error('Director treatment must preserve factual classification.');
    if (!result.scenes || result.scenes.length!==p.scenes.length || result.scenes.some((s,i)=>s.id!==p.scenes[i].id)) throw new Error('Preserve the existing ordered scene IDs during treatment.');
    if (writerOwnsStory(p)) {
      for (const key of ['synopsis','hook','story','fullNarration','researchNotes','targetSeconds'] as const) {
        if (result.plan?.[key] !== undefined && result.plan[key] !== p.plan[key]) throw new Error('The director must preserve the writer story and exact script; return story or wording changes to the writer.');
      }
      if (result.scenes.some((s,i)=>s.narration!==p.scenes[i].narration)) throw new Error('The director must preserve every writer scene narration exactly, even before recording.');
    }
    const shotIds=new Set<string>();
    for(const s of result.scenes) {
      if(!s.direction.trim()||!s.spokenStyle.trim()||s.shots.length<3) throw new Error('Each treated scene needs direction, performance and at least three provisional cuts.');
      for(const shot of s.shots) {
        if(shotIds.has(shot.id)||!shot.purpose.trim()||!shot.narrationAnchor.trim()||!s.narration.includes(shot.narrationAnchor)||!shot.startState.trim()||!shot.endState.trim()) throw new Error('Provisional cuts need unique IDs, a purpose, exact narration anchor and action states.');
        shotIds.add(shot.id);
      }
      const old=p.scenes.find(o=>o.id===s.id)!;
      const audio=p.assets.find(a=>a.id===old.audioAssetId&&!a.archived&&!a.outdated);
      if(audio&&(old.narration!==s.narration||old.spokenStyle!==s.spokenStyle||old.audioPrompt!==s.audioPrompt)) throw new Error('Director treatment cannot silently rewrite recorded narration or its delivery.');
      s.approved=p.production.status==='running'||old.approved;
    }
    // Application evidence, not an LLM's claim that its draft has been directed.
    result.plan!.directorBasis=directorBasis({...p,plan:{...p.plan,...result.plan},scenes:result.scenes});
    return;
  }
  if (p.production.status !== 'running') return;
  const scene = p.scenes.find(s => s.id === job.sceneId)!;
  if (usesAudioLedCuts(p) && job.action === 'storyboard') {
    const update = result.sceneUpdates.find(s => s.id === scene.id);
    if (!update || result.assets.length || (update.narration !== undefined && update.narration !== scene.narration) || (update.audioAssetId !== undefined && update.audioAssetId !== scene.audioAssetId)) throw new Error('Direction must return the cut plan while preserving accepted narration; do not generate media in this stage.');
    const issue = directionIssue(p, { ...scene, ...update });
    if (issue) throw new Error(issue);
    if (usesDirectorFirst(p) && directorTreatmentIssue({...p,scenes:p.scenes.map(s=>s.id===scene.id?{...s,...update}:s)})) throw new Error('Final timing must preserve the treated script, performance and cut events; change only timing and measured-audio basis.');
    return;
  }
  if (!['audio', 'images', 'video'].includes(job.action)) return;
  if (usesDirectorFirst(p) && directorTreatmentIssue(p)) throw new Error('Complete the current director treatment before media generation.');
  if (usesDirectorFirst(p) && directorTreatmentIssue({...p,scenes:p.scenes.map(s=>({...s,...result.sceneUpdates.find(u=>u.id===s.id)}))})) throw new Error('Media generation must preserve treated narration, performance and events.');
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

export function nextProductionTask(p: Project): { action: Job['action']; sceneId: string; scope?: Job['scope']; instructions: string } | null {
  if (p.sourceVideo || p.production.status !== 'running') return null;
  if (usesDirectorFirst(p) && directorTreatmentIssue(p)) return {
    action:'storyboard',scope:'project',sceneId:p.scenes[0].id,
    instructions:`Use references/director.md for the PRE-NARRATION TREATMENT of the complete story. ${directorPlanningInstructions(p)} Preserve the existing ordered scene IDs. Return plan.story/fullNarration and the complete scenes array with exact narration, spokenStyle, soundDesign, direction and at least three provisional cuts per scene. Each cut has purpose, exact narrationAnchor, startState/endState and provisional timing. Plan unspoken action and sound space where useful. No media or image/video prompts are required. Do not rewrite current recorded narration. The app stamps the treatment basis after validation.`
  };
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
      instructions: `${usesDirectorFirst(p)?'FINAL TIMING ONLY: Preserve the treated scene direction, performance, cut IDs/purposes/anchors/states/sound/media and order. Adjust provisional frame intervals to the selected measured audio. If essential visual coverage is missing, return the concern for a project-scoped director revision that preserves the story, narration and accepted audio instead of stretching the old cuts. ':''}${writerOwnsStory(p)?'Retain at least two purposeful subsecond inserts per scene using references/director.md, allowing the complete movement and its result to read across the sequence. ':''}Direct the measured narration for ${pending.title} using references/director.md in the selected skill. Return sceneUpdates with direction, at least three meaningful shots, and directionBasis {audioVersionId: the selected audio activeVersionId, narration: exact unchanged scene narration, fps: current project fps}. Save uneven frame intervals covering the audio exactly, essential short inserts, exact narration anchors, incoming/outgoing states and previous/current/next continuity. Preserve complete scene speech and audioAssetId. Image/video prompts may remain empty. Camera composition belongs to the image prompt writer; camera travel belongs to animation. This stage returns a direction plan only, with no generated assets.`,
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
