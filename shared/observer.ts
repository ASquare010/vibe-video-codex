import type { Project } from './project';

export type ObservationStep = 'thinking' | 'audio' | 'images' | 'video' | 'render' | 'processing-audio' | 'processing-video' | 'editing' | 'research';
export type Observation = {
  threadId: string | null; status: 'idle' | 'running' | 'completed' | 'interrupted' | 'failed' | 'unknown' | 'unavailable';
  label: string; checkedAt: string; updatedAt?: string; message?: string;
  step?: ObservationStep;
  messages: { id: string; text: string }[];
  activity: { id: string; label: string; status: 'running' | 'completed' | 'failed' }[];
};

// A saved production stage is context, never evidence that a chat is still running.
export function observationDisplay(project: Project, observation: Observation | null): { label: string; detail?: string; detailTitle?: string; attention?: boolean; progress?: { ready: number; total: number } } {
  if (!observation) return { label: 'Checking Codex status…' };
  if (observation.status !== 'running') {
    if (['completed', 'idle'].includes(observation.status) && ['paused', 'failed'].includes(project.production.status)) {
      const stage = { plan: 'planning', audio: 'audio generation', images: 'image generation', video: 'video generation', render: 'rendering' }[project.production.stage];
      const reason = project.production.error?.split(/(?<=[.!?])\s/)[0];
      return { label: `${project.production.status === 'paused' ? 'Paused' : 'Needs attention'} · ${stage}`, detail: reason ? reason.length > 160 ? `${reason.slice(0, 157)}…` : reason : 'Continue in your main chat when ready', detailTitle: project.production.error, attention: true };
    }
    return { label: observation.label, detail: observation.status === 'idle' ? 'Idle · continue in your main chat' : undefined, attention: observation.status === 'failed' };
  }
  const producing = ['running', 'drafting'].includes(project.production.status);
  const step = observation.step ?? (producing ? project.production.stage === 'plan' ? 'thinking' : project.production.stage : 'thinking');
  const label = { thinking: producing && project.production.stage === 'plan' ? 'Thinking · planning the video' : 'Thinking', audio: 'Generating audio · in progress', images: 'Generating images · in progress', video: 'Generating video · in progress', render: 'Rendering the video · in progress', 'processing-audio': 'Processing audio · in progress', 'processing-video': 'Processing video · in progress', editing: 'Updating the video', research: 'Researching · in progress' }[step];
  const usable = project.assets.filter(a => !a.archived && !a.outdated);
  if (step === 'audio' || step === 'processing-audio') {
    const ready = project.scenes.filter(s => usable.some(a => a.id === s.audioAssetId && a.kind === 'audio')).length, total = project.scenes.length;
    return { label, detail: `${ready} of ${total} scene audio files ready`, progress: { ready, total } };
  }
  if (step === 'images' || step === 'video') {
    const shots = project.scenes.flatMap(s => s.shots).filter(s => step === 'images' || s.media === 'video');
    const assets = usable.filter(a => a.kind === (step === 'images' ? 'image' : 'video'));
    const ready = shots.filter(s => assets.some(a => a.shotId === s.id)).length;
    return shots.length ? { label, detail: `${ready} of ${shots.length} planned ${step === 'images' ? 'images' : 'videos'} ready`, progress: { ready, total: shots.length } } : { label, detail: `${assets.length} ${step === 'images' ? 'images' : 'videos'} ready` };
  }
  return { label, detail: step === 'thinking' ? 'Working in your main Codex chat' : undefined };
}
