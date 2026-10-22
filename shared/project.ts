import { z } from 'zod';
import { isReviewApproved } from './review';

export const id = () => crypto.randomUUID();
const frame = z.number().int().nonnegative();
export const provenanceSchema = z.object({
  provider: z.string().optional(), model: z.string().optional(), tool: z.string().optional(),
  prompt: z.string().default(''), createdAt: z.string(), jobId: z.string().optional(),
  sourceVersionIds: z.array(z.string()).default([]),
});
export const versionSchema = z.object({
  id: z.string(), path: z.string().refine(p => !p.includes('..') && !/^(?:[a-z]:|[\\/])/i.test(p), 'Use a relative project path'),
  durationFrames: frame.optional(), width: z.number().optional(), height: z.number().optional(),
  provenance: provenanceSchema, waveform: z.array(z.number()).optional(),
});
export const assetSchema = z.object({
  id: z.string(), name: z.string(), kind: z.enum(['image', 'video', 'audio']),
  sceneId: z.string(), versions: z.array(versionSchema).min(1), activeVersionId: z.string(),
  outdated: z.boolean().default(false),
  shotId: z.string().optional(), archived: z.boolean().optional(),
});
export const shotSchema = z.object({
  id: z.string(), title: z.string(), purpose: z.string().default(''), narrationAnchor: z.string().default(''),
  startFrame: frame.default(0), durationFrames: frame.min(1).default(90),
  imagePrompt: z.string().default(''), videoPrompt: z.string().default(''), camera: z.string().default(''),
  startState: z.string().default(''), endState: z.string().default(''), sound: z.string().default(''),
  media: z.enum(['image', 'video']).default('video'),
});
export const sceneSchema = z.object({
  id: z.string(), title: z.string(), narration: z.string(), direction: z.string(),
  purpose: z.string().default(''), spokenStyle: z.string().default(''), audioPrompt: z.string().default(''),
  imagePrompt: z.string().default(''), videoPrompt: z.string().default(''), soundDesign: z.string().default(''), continuity: z.string().default(''),
  shots: z.array(shotSchema).default([]),
  estimatedFrames: frame.min(1).default(180), audioAssetId: z.string().nullable().default(null),
  approved: z.boolean().default(false),
});
export const clipSchema = z.object({
  id: z.string(), sceneId: z.string(), assetId: z.string().nullable(), versionId: z.string().nullable(),
  track: z.enum(['visual', 'overlay', 'text', 'caption', 'music']), startFrame: frame, durationFrames: frame.min(1),
  sourceIn: frame.default(0), text: z.string().default(''),
  scale: z.number().min(0.1).max(5).default(1), x: z.number().min(-100).max(100).default(0), y: z.number().min(-100).max(100).default(0),
  opacity: z.number().min(0).max(1).default(1), volume: z.number().min(0).max(1).default(1),
  motion: z.enum(['none', 'zoom-in', 'zoom-out', 'pan-left', 'pan-right', 'pan-up', 'pan-down', 'custom']).default('none'),
  motionAmount: z.number().min(0).max(1).default(0.08), endScale: z.number().min(0.1).max(5).default(1.1),
  endX: z.number().min(-100).max(100).default(0), endY: z.number().min(-100).max(100).default(0),
  rotation: z.number().min(-360).max(360).default(0), speed: z.number().min(0.25).max(4).default(1),
  brightness: z.number().min(-1).max(1).default(0), contrast: z.number().min(0).max(3).default(1),
  saturation: z.number().min(0).max(3).default(1), temperature: z.number().min(-1).max(1).default(0),
  blur: z.number().min(0).max(20).default(0), vignette: z.number().min(0).max(1).default(0),
  fadeInFrames: frame.default(0), fadeOutFrames: frame.default(0),
  fit: z.enum(['cover', 'contain']).default('cover'),
  fontSize: z.number().min(10).max(160).default(48), color: z.string().regex(/^#[\da-f]{6}$/i).default('#ffffff'),
  fontFamily: z.enum(['Arial', 'Georgia', 'Verdana', 'Courier New', 'Trebuchet MS']).default('Arial'),
  fontWeight: z.enum(['400', '700']).default('400'), textAlign: z.enum(['left', 'center', 'right']).default('center'),
  outlineWidth: z.number().min(0).max(12).default(0), outlineColor: z.string().regex(/^#[\da-f]{6}$/i).default('#000000'),
  shadow: z.boolean().default(true),
});
export const transitionSchema = z.object({
  id: z.string(), fromClipId: z.string(), toClipId: z.string(),
  type: z.enum(['crossfade', 'dip-black', 'wipe-left', 'slide-left']), durationFrames: frame.min(1).max(120).default(15),
});
export const videoPlanSchema = z.object({
  synopsis: z.string().default(''), classification: z.enum(['fiction', 'factual', 'inspired']).default('fiction'),
  hook: z.string().default(''), story: z.string().default(''), fullNarration: z.string().default(''), researchNotes: z.string().default(''),
  targetSeconds: z.number().min(1).max(3600).default(90), approved: z.boolean().default(false),
});
export const skillSchema = z.object({ id: z.string(), name: z.string(), content: z.string().max(100000) });
export const reviewAnchorSchema = z.object({
  surface: z.enum(['storyboard', 'skill']), label: z.string(), fieldId: z.string().optional(),
  sceneId: z.string().optional(), shotId: z.string().optional(), skillId: z.string().optional(), quote: z.string().max(10000).default(''),
});
const reviewApprovalSchema = z.object({ fingerprint: z.string(), approvedAt: z.string() }).nullable().default(null);
export const reviewSchema = z.object({
  approvals: z.object({ storyboard: reviewApprovalSchema, skill: reviewApprovalSchema }).prefault({}),
  comments: z.array(z.object({ id: z.string(), anchor: reviewAnchorSchema, type: z.enum(['comment', 'suggestion', 'pointer']), body: z.string().trim().min(1).max(5000), createdAt: z.string(), resolved: z.boolean().default(false) })).default([]),
});
export const settingsSchema = z.object({
  fps: z.literal(30), aspectRatio: z.enum(['16:9', '9:16', '1:1']),
  resolution: z.enum(['420', '480', '720', '1080', '2160']).default('720'),
  imageResolution: z.enum(['420', '480', '720', '1080', '2160']).default('1080'),
  videoResolution: z.enum(['420', '480', '720', '1080', '2160']).default('720'),
  approvals: z.enum(['auto_review', 'user']).default('auto_review'), autoApply: z.boolean().default(true),
});
export const annotationSchema = z.object({
  id: z.string(), sceneId: z.string(), clipId: z.string().nullable(), frame: frame,
  paths: z.array(z.array(z.tuple([z.number(), z.number()]))), note: z.string(), imagePath: z.string().optional(),
});
export const jobSchema = z.object({
  id: z.string(), action: z.enum(['chat', 'plan', 'storyboard', 'audio', 'images', 'video', 'edit']),
  sceneId: z.string(), clipIds: z.array(z.string()), instructions: z.string(), revision: frame,
  scope: z.enum(['project', 'scene']).default('scene'),
  produceAfterPlan: z.boolean().optional(),
  status: z.enum(['queued', 'running', 'awaiting-approval', 'completed', 'failed', 'cancelled']),
  createdAt: z.string(), log: z.string().default(''), error: z.string().optional(),
  applyError: z.string().optional(),
  resultAvailable: z.boolean().optional(),
  turnId: z.string().optional(), resultApplied: z.boolean().default(false),
  activity: z.array(z.object({ id: z.string(), label: z.string(), status: z.enum(['running', 'completed', 'failed']), detail: z.string().default(''), at: z.string() })).default([]),
});
export const resultSchema = z.object({
  summary: z.string(),
  sceneUpdates: z.array(sceneSchema.partial().required({ id: true })).default([]),
  scenes: z.array(sceneSchema).optional(), plan: videoPlanSchema.optional(),
  clipUpdates: z.array(clipSchema.partial().required({ id: true })).default([]),
  settings: settingsSchema.partial().optional(),
  newClips: z.array(clipSchema).default([]), removeClipIds: z.array(z.string()).default([]),
  transitions: z.array(transitionSchema).optional(), startProduction: z.boolean().optional(),
  assets: z.array(z.object({
    name: z.string(), kind: z.enum(['image', 'video', 'audio']), path: z.string(), sceneId: z.string(),
    sourceAssetId: z.string().optional(), sourceImageId: z.string().optional(), provider: z.string().optional(), model: z.string().optional(),
    tool: z.string().optional(), prompt: z.string().default(''),
    startFrame: frame.default(0), durationFrames: frame.min(1).optional(), shotId: z.string().optional(), replaceClipId: z.string().optional(),
  })).default([]),
});
const currentProjectSchema = z.object({
  schemaVersion: z.literal(2), id: z.string().uuid(), name: z.string().min(1).max(120),
  revision: frame, createdAt: z.string(), updatedAt: z.string(), archived: z.boolean().default(false),
  settings: settingsSchema,
  theme: z.string().default(''),
  skill: skillSchema.nullable().default(null), plan: videoPlanSchema.prefault({}),
  review: reviewSchema.prefault({}),
  production: z.object({ status: z.enum(['idle', 'drafting', 'awaiting-review', 'running', 'paused', 'failed', 'completed']).default('idle'), stage: z.enum(['plan', 'audio', 'images', 'video', 'render']).default('plan'), error: z.string().optional() }).prefault({}),
  conversation: z.object({
    runtime: z.enum(['codex', 'chatgpt']), threadId: z.string().nullable(), url: z.string().nullable(), error: z.string().nullable(),
    mode: z.enum(['observe', 'managed']).default('observe'),
  }),
  scenes: z.array(sceneSchema).min(1), assets: z.array(assetSchema), clips: z.array(clipSchema),
  annotations: z.array(annotationSchema), jobs: z.array(jobSchema),
  transitions: z.array(transitionSchema).default([]),
}).superRefine((p, ctx) => {
  const sceneIds = new Set(p.scenes.map(s => s.id));
  for (const collection of [p.scenes, p.assets, p.clips, p.jobs, p.annotations]) {
    if (new Set(collection.map(x => x.id)).size !== collection.length) ctx.addIssue({ code: 'custom', message: 'Duplicate IDs' });
  }
  for (const asset of p.assets) {
    if ((!sceneIds.has(asset.sceneId) && !asset.archived) || !asset.versions.some(v => v.id === asset.activeVersionId)) ctx.addIssue({ code: 'custom', message: 'Invalid asset reference' });
  }
  for (const scene of p.scenes) {
    const audio = p.assets.find(a => a.id === scene.audioAssetId);
    if (scene.audioAssetId && (!audio || audio.kind !== 'audio' || audio.sceneId !== scene.id || !audio.versions.find(v => v.id === audio.activeVersionId)?.durationFrames)) {
      ctx.addIssue({ code: 'custom', message: 'Scene narration must reference measured audio in that scene' });
    }
  }
  for (const clip of p.clips) {
    const scene = p.scenes.find(s => s.id === clip.sceneId);
    const asset = p.assets.find(a => a.id === clip.assetId);
    const version = asset?.versions.find(v => v.id === clip.versionId);
    if (!scene || clip.startFrame + clip.durationFrames > sceneFrames(p, scene)) ctx.addIssue({ code: 'custom', message: 'Clip exceeds scene audio length' });
    if (!['text', 'caption'].includes(clip.track) && (!asset || !version || asset.sceneId !== clip.sceneId)) ctx.addIssue({ code: 'custom', message: 'Invalid clip asset reference' });
    if (asset && ((clip.track === 'music') !== (asset.kind === 'audio'))) ctx.addIssue({ code: 'custom', message: 'Media does not match track' });
    if (version?.durationFrames && clip.sourceIn + Math.ceil(clip.durationFrames * clip.speed) > version.durationFrames) ctx.addIssue({ code: 'custom', message: 'Clip exceeds source media duration' });
  }
  for (const transition of p.transitions) {
    const from = p.clips.find(c => c.id === transition.fromClipId), to = p.clips.find(c => c.id === transition.toClipId);
    if (!from || !to || from.sceneId !== to.sceneId || from.track !== to.track || !['visual', 'overlay'].includes(from.track) || from.startFrame + from.durationFrames !== to.startFrame) ctx.addIssue({ code: 'custom', message: 'Transitions must join adjacent visual clips in the same scene' });
  }
});
export const projectSchema = z.preprocess(value => {
  if (value && typeof value === 'object' && 'schemaVersion' in value && value.schemaVersion === 1) return { ...value, schemaVersion: 2 };
  return value;
}, currentProjectSchema);
export type Project = z.infer<typeof projectSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Clip = z.infer<typeof clipSchema>;
export type Job = z.infer<typeof jobSchema>;
export type Version = z.infer<typeof versionSchema>;
export type Annotation = z.infer<typeof annotationSchema>;
export type AgentResult = z.infer<typeof resultSchema>;
export type VideoSkill = z.infer<typeof skillSchema>;
export type Transition = z.infer<typeof transitionSchema>;
export type Shot = z.infer<typeof shotSchema>;
export type ReviewAnchor = z.infer<typeof reviewAnchorSchema>;
export type ReviewComment = z.infer<typeof reviewSchema>['comments'][number];

export function newScene(title = 'Scene 01'): Scene {
  return sceneSchema.parse({ id: id(), title, narration: '', direction: '', estimatedFrames: 180, audioAssetId: null, approved: false });
}
export function newProject(name: string, runtime: 'codex' | 'chatgpt' = 'codex', idea = ''): Project {
  const now = new Date().toISOString();
  return projectSchema.parse({ schemaVersion: 2, id: id(), name, revision: 0, createdAt: now, updatedAt: now, archived: false,
    settings: { fps: 30, aspectRatio: '16:9' }, theme: '',
    conversation: { runtime, threadId: null, url: null, error: null },
    scenes: [{ ...newScene(), direction: idea }], assets: [], clips: [], annotations: [], jobs: [] });
}
export function activeVersion(asset: Asset) { return asset.versions.find(v => v.id === asset.activeVersionId)!; }
export function sceneFrames(p: Pick<Project, 'assets'>, scene: Scene): number {
  const audio = p.assets.find(a => a.id === scene.audioAssetId);
  return audio ? activeVersion(audio).durationFrames ?? scene.estimatedFrames : scene.estimatedFrames;
}
export function sceneStart(p: Project, sceneId: string) {
  let start = 0;
  for (const scene of p.scenes) { if (scene.id === sceneId) return start; start += sceneFrames(p, scene); }
  return start;
}
export function totalFrames(p: Project) { return p.scenes.reduce((n, s) => n + sceneFrames(p, s), 0); }
export function timecode(frames: number, fps = 30) {
  const secs = Math.floor(Math.max(0, frames) / fps);
  return `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}:${(Math.max(0, frames) % fps).toString().padStart(2, '0')}`;
}
export function makeClip(sceneId: string, asset: Asset | null, startFrame: number, durationFrames: number, track: Clip['track'] = 'visual'): Clip {
  return clipSchema.parse({ id: id(), sceneId, assetId: asset?.id ?? null, versionId: asset?.activeVersionId ?? null, startFrame, durationFrames, track });
}
export function splitClip(p: Project, clipId: string, at: number): Project {
  const clip = p.clips.find(c => c.id === clipId);
  if (!clip || at <= clip.startFrame || at >= clip.startFrame + clip.durationFrames) return p;
  const left = at - clip.startFrame;
  return { ...p, clips: p.clips.flatMap(c => c.id !== clipId ? [c] : [
    { ...c, durationFrames: left },
    { ...c, id: id(), startFrame: at, durationFrames: c.durationFrames - left, sourceIn: c.assetId && p.assets.find(a => a.id === c.assetId)?.kind !== 'image' ? c.sourceIn + Math.round(left * c.speed) : c.sourceIn },
  ]) };
}
export function clampSceneClips(p: Project, sceneId: string) {
  const duration = sceneFrames(p, p.scenes.find(s => s.id === sceneId)!);
  p.clips = p.clips.filter(c => c.sceneId !== sceneId || c.startFrame < duration).map(c => c.sceneId === sceneId ? { ...c, durationFrames: Math.min(c.durationFrames, duration - c.startFrame) } : c);
}
export function invalidateNarration(p: Project, old: Project) {
  for (const s of p.scenes) {
    const previous = old.scenes.find(o => o.id === s.id);
    if (previous?.narration !== s.narration || previous?.spokenStyle !== s.spokenStyle || previous?.audioPrompt !== s.audioPrompt) {
      p.plan.approved = false;
      if (p.production.status === 'running') { p.production.status = 'paused'; p.production.error = 'Script changed during production. Review the plan before resuming.'; }
      s.approved = false;
      p.assets.filter(a => a.sceneId === s.id).forEach(a => { a.outdated = true; });
    } else if (previous.direction !== s.direction || previous.imagePrompt !== s.imagePrompt || previous.videoPrompt !== s.videoPrompt || previous.continuity !== s.continuity || JSON.stringify(previous.shots) !== JSON.stringify(s.shots)) {
      p.assets.filter(a => a.sceneId === s.id && a.kind !== 'audio').forEach(a => { a.outdated = true; });
    }
  }
  if (p.theme !== old.theme) p.assets.forEach(a => { a.outdated = true; });
  if (p.skill?.content !== old.skill?.content) p.assets.forEach(a => { a.outdated = true; });
  if (p.review.approvals.storyboard) {
    p.plan.approved = isReviewApproved(p, 'storyboard');
    if (p.plan.approved) p.scenes.forEach(s => { s.approved = true; });
  }
  if (p.production.status === 'running' && (p.skill?.content !== old.skill?.content || p.theme !== old.theme)) p.production = { ...p.production, status: 'paused', error: 'Project direction changed. Review the plan before resuming production.' };
}

export function dimensions(aspectRatio: Project['settings']['aspectRatio'], resolution: string): [number, number] {
  const short = Number(resolution), long = Math.round(short * 16 / 9 / 2) * 2;
  return aspectRatio === '9:16' ? [short, long] : aspectRatio === '1:1' ? [short, short] : [long, short];
}
export function cleanTransitions(p: Project) {
  p.transitions = p.transitions.filter(t => { const a = p.clips.find(c => c.id === t.fromClipId), b = p.clips.find(c => c.id === t.toClipId); return a && b && a.sceneId === b.sceneId && a.track === b.track && ['visual', 'overlay'].includes(a.track) && a.startFrame + a.durationFrames === b.startFrame; }).map(t => ({ ...t, durationFrames: Math.min(t.durationFrames, p.clips.find(c => c.id === t.fromClipId)!.durationFrames, p.clips.find(c => c.id === t.toClipId)!.durationFrames) }));
}
