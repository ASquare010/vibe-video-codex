import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import readline from 'node:readline';
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { id, resultSchema, jobSchema, sceneFrames, type Job, type Project } from '../shared/project.ts';
import { ProjectStore, HttpError } from './store.ts';
import { measure, applyResult } from './media.ts';
import { nextProductionTask, validateProductionResult } from './production.ts';

type Message = { id?: string | number; method?: string; params?: any; result?: any; error?: { message: string } };
export class CodexClient extends EventEmitter {
  private child?: ChildProcessWithoutNullStreams;
  private ready?: Promise<void>;
  private nextId = 1;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; timer: NodeJS.Timeout }>();
  requests = new Map<string, Message>();
  async connect() {
    if (this.ready) return this.ready;
    this.ready = (async () => {
      const child = spawn(process.env.CODEX_BIN || 'codex', ['app-server', '--listen', 'stdio://'], { windowsHide: true, stdio: 'pipe' });
      this.child = child;
      const close = (error: Error) => {
        for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(error); }
        this.pending.clear(); this.requests.clear(); this.ready = undefined; this.child = undefined;
        this.emit('disconnect', error.message);
      };
      child.on('error', close);
      child.on('exit', () => close(new Error('Codex disconnected. Reconnect to continue this project.')));
      // Drain diagnostics; never expose configuration or credentials through health responses.
      child.stderr.on('data', () => {});
      readline.createInterface({ input: child.stdout }).on('line', line => {
        let msg: Message;
        try { msg = JSON.parse(line); } catch { return; }
        if (msg.id !== undefined && !msg.method) {
          const pending = this.pending.get(Number(msg.id));
          if (!pending) return;
          clearTimeout(pending.timer); this.pending.delete(Number(msg.id));
          if (msg.error) pending.reject(new Error(msg.error.message)); else pending.resolve(msg.result);
        } else if (msg.id !== undefined && msg.method) {
          this.requests.set(String(msg.id), msg); this.emit('request', msg);
        } else this.emit('notification', msg);
      });
      await this.rpc('initialize', { clientInfo: { name: 'vibecut', title: 'VibeCut', version: '0.1.0' } });
      this.send({ method: 'initialized', params: {} });
    })().catch(error => { this.child?.kill(); this.ready = undefined; throw error; });
    return this.ready;
  }
  private send(message: Message) { this.child?.stdin.write(`${JSON.stringify(message)}\n`); }
  rpc(method: string, params: any = {}, timeout = 30000): Promise<any> {
    if (!this.child) return Promise.reject(new Error('Codex is not connected'));
    const requestId = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(requestId); reject(new Error(`Codex timed out while handling ${method}`)); }, timeout);
      this.pending.set(requestId, { resolve, reject, timer }); this.send({ id: requestId, method, params });
    });
  }
  async status() {
    try {
      await this.connect();
      const account = await this.rpc('account/read', { refreshToken: false });
      return { available: !!account.account || !account.requiresOpenaiAuth, message: account.account || !account.requiresOpenaiAuth ? 'Codex connected' : 'Sign in with codex login to enable generation' };
    } catch (e) { return { available: false, message: (e as Error).message }; }
  }
  respond(requestId: string, approved: boolean, answers?: Record<string, { answers: string[] }>) {
    const request = this.requests.get(requestId);
    if (!request) throw new HttpError(404, 'This request is no longer pending');
    let result: any;
    if (request.method === 'item/tool/requestUserInput') result = { answers: answers ?? {} };
    else if (request.method === 'item/permissions/requestApproval') result = { permissions: approved ? request.params.permissions : {}, scope: 'turn' };
    else if (request.method === 'mcpServer/elicitation/request') result = { action: approved ? 'accept' : 'decline', content: null };
    else if (request.method === 'item/commandExecution/requestApproval' || request.method === 'item/fileChange/requestApproval') result = { decision: approved ? 'accept' : 'decline' };
    else { this.send({ id: request.id, error: { message: 'This request is not supported by the VibeCut client' } }); this.requests.delete(requestId); return; }
    this.send({ id: request.id, result }); this.requests.delete(requestId);
  }
  close() { this.child?.kill(); }
}

export class AgentManager {
  private processing = new Set<string>();
  private resumed = new Set<string>();
  private connecting = new Map<string, Promise<string>>();
  private waiters = new Map<string, { resolve: (status: any) => void; reject: (error: Error) => void }>();
  private active = new Map<string, { projectId: string; jobId: string; log: string; activity: Job['activity']; turnId?: string; cancelRequested?: boolean }>();
  constructor(public store: ProjectStore, public client: CodexClient) {
    client.on('notification', (msg: Message) => {
      const params = msg.params ?? {};
      const threadId = params.threadId ?? params.thread?.id;
      const running = this.active.get(threadId);
      if (msg.method === 'serverRequest/resolved') {
        client.requests.delete(String(params.requestId));
        if (running) store.emit('change', { projectId: running.projectId, type: 'requests' });
      }
      if (!running) return;
      if (msg.method === 'turn/started') running.turnId = params.turn.id;
      if (msg.method === 'item/agentMessage/delta') {
        running.log = (running.log + params.delta).slice(-30000);
        store.emit('change', { projectId: running.projectId, type: 'agent', jobId: running.jobId, log: running.log });
      }
      if (msg.method === 'item/started' || msg.method === 'item/completed') {
        const item = params.item ?? {};
        if (item.type !== 'agentMessage' && item.type !== 'userMessage') {
          const label = item.type === 'mcpToolCall' ? `${item.server ?? 'Tool'} · ${item.tool ?? 'working'}` : item.type === 'commandExecution' ? 'Running a local command' : item.type === 'fileChange' ? 'Updating project files' : item.type === 'reasoning' ? 'Planning next steps' : (item.type ?? 'Working');
          const entry = { id: item.id ?? id(), label, status: (msg.method === 'item/started' ? 'running' : item.status === 'failed' ? 'failed' : 'completed') as 'running' | 'completed' | 'failed', detail: item.command ?? item.error?.message ?? '', at: new Date().toISOString() };
          const index = running.activity.findIndex(a => a.id === entry.id);
          if (index >= 0) running.activity[index] = entry; else running.activity.push(entry);
          running.activity = running.activity.slice(-150);
          store.emit('change', { projectId: running.projectId, type: 'activity', jobId: running.jobId, activity: running.activity, label });
        }
      }
      if (msg.method?.includes('guardianApprovalReview')) store.emit('change', { projectId: running.projectId, type: 'activity', jobId: running.jobId, label: msg.method.endsWith('started') ? 'Reviewing tool request automatically' : `Automatic review: ${params.review?.status ?? params.status ?? 'finished'}` });
      if (msg.method === 'turn/completed') this.waiters.get(threadId)?.resolve(params.turn);
    });
    client.on('request', (msg: Message) => {
      const running = this.active.get(msg.params?.threadId);
      if (running) {
        store.mutate(running.projectId, p => { const j = p.jobs.find(j => j.id === running.jobId); if (j) j.status = 'awaiting-approval'; }).catch(() => {});
        store.emit('change', { projectId: running.projectId, type: 'requests' });
      }
    });
    client.on('disconnect', (message: string) => { this.resumed.clear(); for (const w of this.waiters.values()) w.reject(new Error(message)); });
  }
  async ensureThread(p: Project): Promise<string> {
    const existing = this.connecting.get(p.id);
    if (existing) return existing;
    const pending = this.startThread(p);
    this.connecting.set(p.id, pending);
    try { return await pending; } finally { this.connecting.delete(p.id); }
  }
  private async startThread(input: Project) {
    // Re-read after queueing to avoid creating a second thread from a stale UI snapshot.
    const p = await this.store.read(input.id);
    if (p.conversation.runtime !== 'codex') throw new HttpError(409, 'ChatGPT projects use the conversation handoff. Copy project context and continue in your linked ChatGPT chat.');
    const status = await this.client.status();
    if (!status.available) throw new HttpError(503, status.message);
    if (p.conversation.threadId) {
      if (p.conversation.mode === 'observe') {
        await this.client.rpc('thread/read', { threadId: p.conversation.threadId, includeTurns: false });
        return p.conversation.threadId;
      }
      if (!this.resumed.has(p.conversation.threadId)) {
        await this.client.rpc('thread/resume', { threadId: p.conversation.threadId, cwd: this.store.folder(p.id), excludeTurns: true, approvalsReviewer: p.settings.approvals });
        this.resumed.add(p.conversation.threadId);
      }
      if (p.conversation.error) await this.store.mutate(p.id, current => { current.conversation.error = null; });
      return p.conversation.threadId;
    }
    // Omit the model: Codex uses the user's own configured default.
    const result = await this.client.rpc('thread/start', { cwd: this.store.folder(p.id), sandbox: 'workspace-write', approvalPolicy: 'on-request', approvalsReviewer: p.settings.approvals });
    const threadId = result.thread.id as string;
    // An empty thread has no durable rollout on some Codex releases. Seed real
    // project context without starting inference so a brand-new project survives restart.
    await this.client.rpc('thread/inject_items', { threadId, items: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text:
      `VibeCut project: ${p.name}. This is the persistent creative conversation for local project ${p.id}. The UI is a video editing harness; you choose generation tools and models. Each scene follows text -> measured audio -> multiple image placements -> optional video placements, bounded by the narration length. Record actual model/tool provenance on returned assets. Canonical state is project.json in the working folder. Initial idea: ${p.scenes[0].direction || 'The creator will provide direction next.'}`,
    }] }] });
    await this.client.rpc('thread/name/set', { threadId, name: p.name }).catch(() => {});
    this.resumed.add(threadId);
    await this.store.mutate(p.id, current => { current.conversation.threadId = threadId; current.conversation.error = null; });
    if (p.conversation.mode === 'observe') { await this.client.rpc('thread/unsubscribe', { threadId }); this.resumed.delete(threadId); }
    return threadId;
  }
  async queue(projectId: string, data: Pick<Job, 'action' | 'sceneId' | 'clipIds' | 'instructions'> & { scope?: Job['scope']; produceAfterPlan?: boolean }) {
    const p = await this.store.read(projectId);
    if (p.conversation.mode === 'observe') throw new HttpError(409, 'This project uses a read-only Codex monitor. Send prompts in its main Codex chat.');
    if (p.conversation.runtime !== 'codex') throw new HttpError(409, 'Use Copy context to continue this project in ChatGPT.');
    const scene = p.scenes.find(s => s.id === data.sceneId);
    if (!scene) throw new HttpError(400, 'Select a scene');
    if (data.clipIds.some(id => !p.clips.some(c => c.id === id && (data.scope === 'project' || c.sceneId === scene.id)))) throw new HttpError(400, 'Selected clips must belong to this scene');
    if (['images', 'video'].includes(data.action) && (!scene.audioAssetId || p.assets.find(a => a.id === scene.audioAssetId)?.outdated)) throw new HttpError(400, 'Create or approve current scene audio first. Its measured length sets the visual limit.');
    if (['audio', 'images', 'video'].includes(data.action) && !scene.approved) throw new HttpError(400, 'Approve this scene’s text before generating media');
    const updated = await this.store.mutate(projectId, current => {
      if (current.jobs.some(j => ['queued', 'running', 'awaiting-approval'].includes(j.status) && j.action === data.action && j.sceneId === data.sceneId)) throw new HttpError(409, 'This scene already has that task queued');
      if (data.action === 'plan') current.production = { status: 'drafting', stage: 'plan' };
      current.jobs.push(jobSchema.parse({ ...data, id: id(), revision: current.revision, status: 'queued', createdAt: new Date().toISOString(), log: '', resultApplied: false }));
    });
    void this.process(projectId);
    return updated;
  }
  async produce(projectId: string) {
    if ((await this.store.read(projectId)).conversation.mode === 'observe') throw new HttpError(409, 'Request production in the main Codex chat. The editor only observes progress.');
    const p = await this.store.mutate(projectId, current => {
      if (!current.scenes.every(s => s.narration.trim() && s.direction.trim() && (s.shots.length || (s.imagePrompt.trim() && s.videoPrompt.trim())))) throw new HttpError(409, 'Draft the complete video with narration, image prompts and video prompts before production.');
      if (current.jobs.some(j => ['queued', 'running', 'awaiting-approval'].includes(j.status))) throw new HttpError(409, 'Wait for the current request before starting full production');
      current.scenes.forEach(s => { s.approved = true; }); current.plan.approved = true;
      current.production = { status: 'running', stage: 'audio' };
    });
    void this.process(projectId); return p;
  }
  async process(projectId: string) {
    if (this.processing.has(projectId)) return;
    this.processing.add(projectId);
    try {
      for (;;) {
        const p = await this.store.read(projectId);
        let job = p.jobs.find(j => j.status === 'queued');
        if (!job) {
          const next = nextProductionTask(p);
          if (next) {
            await this.store.mutate(projectId, current => {
              if (current.production.status !== 'running') return;
              current.production.stage = next.action as 'audio' | 'images' | 'video';
              current.jobs.push(jobSchema.parse({ ...next, id: id(), clipIds: [], scope: 'scene', status: 'queued', revision: current.revision, createdAt: new Date().toISOString() }));
            });
            continue;
          }
          if (p.production.status === 'running') await this.store.mutate(projectId, current => { current.production = { status: 'completed', stage: 'video' }; });
          break;
        }
        const task = job;
        let threadId: string | undefined;
        let executionComplete = false;
        let resultAvailable = false;
        try {
          threadId = await this.ensureThread(p);
          if ((await this.store.read(projectId)).jobs.find(j => j.id === task.id)?.status !== 'queued') continue;
          const folder = path.join(this.store.folder(projectId), 'jobs', job.id);
          await fs.mkdir(folder, { recursive: true });
          await fs.writeFile(path.join(folder, 'input.json'), JSON.stringify({ project: p, job }, null, 2));
          await fs.writeFile(path.join(folder, 'result.schema.json'), JSON.stringify(z.toJSONSchema(resultSchema), null, 2));
          const starting = await this.store.mutate(projectId, current => { const j = current.jobs.find(j => j.id === job.id)!; if (j.status === 'queued') j.status = 'running'; });
          if (starting.jobs.find(j => j.id === job.id)?.status !== 'running') continue;
          const finished = new Promise<any>((resolve, reject) => this.waiters.set(threadId!, { resolve, reject }));
          // Attach the rejection handler before starting the turn (disconnect can happen immediately).
          finished.catch(() => {});
          this.active.set(threadId, { projectId, jobId: job.id, log: '', activity: [] });
          const latest = await this.store.read(projectId);
          if (latest.jobs.find(j => j.id === job.id)?.status !== 'running' || (latest.production.status === 'paused' && p.production.status === 'running')) {
            await this.store.mutate(projectId, current => { current.jobs.find(j => j.id === job.id)!.status = 'cancelled'; });
            continue;
          }
          const result = await this.client.rpc('turn/start', { threadId, cwd: this.store.folder(projectId), approvalsReviewer: p.settings.approvals, input: [{ type: 'text', text: this.instructions(p, job) }] });
          const active = this.active.get(threadId)!;
          active.turnId = result.turn.id;
          if (active.cancelRequested) await this.client.rpc('turn/interrupt', { threadId, turnId: active.turnId });
          await this.store.mutate(projectId, current => { current.jobs.find(j => j.id === job.id)!.turnId = result.turn.id; });
          const turn = await finished;
          executionComplete = turn.status === 'completed';
          if (turn.status === 'failed') throw new Error(turn.error?.message ?? 'Codex task failed');
          const resultExists = await fs.stat(path.join(folder, 'result.json')).then(() => true).catch(() => false);
          resultAvailable = resultExists;
          if (turn.status === 'completed' && (job.action !== 'chat' || resultExists)) {
            const proposed = resultSchema.parse(JSON.parse(await fs.readFile(path.join(folder, 'result.json'), 'utf8')));
            const expected = ({ audio: 'audio', images: 'image', video: 'video' } as Record<string, string>)[job.action];
            if (expected && !proposed.assets.some(a => a.kind === expected)) throw new Error(`Codex did not return a real ${expected} result`);
            if (job.action === 'plan' && (!proposed.plan?.story.trim() || !proposed.plan.fullNarration.trim() || !proposed.scenes?.length || !proposed.scenes.every(s => s.narration.trim() && s.direction.trim() && s.spokenStyle.trim() && s.audioPrompt.trim() && s.shots.length && s.shots.every(shot => shot.imagePrompt.trim() && shot.videoPrompt.trim())))) throw new Error('The whole-video draft must include the full story, every scene, exact narration, voice/audio direction, image prompts and video prompts.');
            validateProductionResult(p, job, proposed);
            for (const asset of proposed.assets) {
              const file = await this.store.safeFile(projectId, asset.path);
              if ((await measure(file)).kind !== asset.kind) throw new Error('Result media type does not match its file');
            }
          }
          await this.store.mutate(projectId, current => {
            const j = current.jobs.find(j => j.id === job.id)!;
            j.log = active.log;
            j.resultAvailable = resultAvailable;
            j.activity = active.activity;
            j.status = turn.status === 'completed' ? 'completed' : 'cancelled';
            if (turn.status !== 'completed' && current.production.status === 'running') current.production = { ...current.production, status: 'paused' };
          });
          if (turn.status === 'completed' && resultExists && (p.settings.autoApply || p.production.status === 'running' || job.produceAfterPlan)) {
            await applyResult(this.store, projectId, job.id, { activateVersions: true });
            if (job.action === 'plan' && job.produceAfterPlan) await this.produce(projectId);
          }
        } catch (e) {
          const log = threadId ? this.active.get(threadId)?.log : '';
          const activity = threadId ? this.active.get(threadId)?.activity : undefined;
          await this.store.mutate(projectId, current => {
            const j = current.jobs.find(j => j.id === task.id)!;
            j.status = executionComplete ? 'completed' : 'failed';
            j.resultAvailable = resultAvailable;
            if (executionComplete) j.applyError = (e as Error).message; else j.error = (e as Error).message;
            j.log = log ?? '';
            if (activity) j.activity = activity.map(step => step.status === 'running' ? { ...step, status: 'failed' } : step);
            if (['running', 'drafting'].includes(current.production.status)) current.production = { ...current.production, status: executionComplete ? job.action === 'plan' ? 'awaiting-review' : 'paused' : 'failed', error: j.applyError ?? j.error };
          }).catch(() => {});
        } finally {
          if (threadId) { this.active.delete(threadId); this.waiters.delete(threadId); }
        }
      }
    } finally { this.processing.delete(projectId); }
  }
  async cancel(projectId: string, jobId: string) {
    const p = await this.store.read(projectId);
    const job = p.jobs.find(j => j.id === jobId);
    if (!job) throw new HttpError(404, 'Task not found');
    if (job.status === 'queued') return this.store.mutate(projectId, p => { p.jobs.find(j => j.id === jobId)!.status = 'cancelled'; });
    const threadId = p.conversation.threadId;
    const active = threadId ? this.active.get(threadId) : undefined;
    if (!active || !threadId) return this.store.mutate(projectId, current => { const target = current.jobs.find(j => j.id === jobId)!; if (['queued', 'running', 'awaiting-approval'].includes(target.status)) target.status = 'cancelled'; });
    if (active.jobId !== jobId) throw new HttpError(409, 'Task is no longer running');
    active.cancelRequested = true;
    if (active.turnId) await this.client.rpc('turn/interrupt', { threadId, turnId: active.turnId });
    return this.store.read(projectId);
  }
  instructions(p: Project, job: Job) {
    const scene = p.scenes.find(s => s.id === job.sceneId)!;
    return `You are Codex, the main creative brain of VibeCut. This is your persistent project conversation, not a separate Director persona. The editor is your visual harness. You may plan the entire film, create/update scenes, settings, shots, captions, clips and media through structured results. Choose the actual tools and models yourself. Never invent a file, model, cost, duration, tool success or completed action.

USER REQUEST: ${job.instructions}
ACTION: ${job.action}. SCOPE: ${job.scope === 'project' ? 'ENTIRE VIDEO, all scenes' : `scene ${scene.id} (${scene.title})`}. Selected placements: ${job.clipIds.join(', ') || 'none'}.

Read jobs/${job.id}/input.json for the complete immutable project snapshot, selected skill, story, scenes, shot prompts, actual assets, annotations and settings. Read jobs/${job.id}/result.schema.json for the exact return contract. Write jobs/${job.id}/result.json when changing the project. This is applied automatically when autoApply is enabled. Do not race the UI by directly overwriting project.json.

WHOLE VIDEO FIRST: A plan request must draft the full video, not one scene. Return plan (synopsis, classification, hook, story, fullNarration, researchNotes, targetSeconds) plus scenes covering the complete narrative. Each scene needs a stable ID, title, purpose, exact narration, spokenStyle, audioPrompt, direction, imagePrompt, videoPrompt, soundDesign, continuity and shots. Every shot needs id, title, purpose, narrationAnchor, provisional startFrame/durationFrames, standalone imagePrompt, standalone videoPrompt, camera, startState, endState, sound and media (image or video). Several images/shots can cover a single scene's audio. Never generate audio/images/videos during drafting. Do not return an incomplete draft as ready for production.

PRODUCTION ORDER: full approved plan -> ALL scene audio (one asset per scene) -> measure every scene -> ALL required scene images -> planned image-to-video shots -> assembled full timeline. For a scene audio request use exact approved words and its voice direction; do not generate visuals yet. For scene images, cover all planned shots, not just the first image. For video, animate accepted images with their actual video prompts. Preserve approved narration, references and source files. Fit pictures to actual audio; source clips may be longer but placements must stay inside the audio. Scene ${scene.id} currently has ${sceneFrames(p, scene)} frames at 30 fps. Include shotId on visuals, sourceImageId on image-to-video results and replaceClipId to replace a still placement. Use sourceAssetId only for another version of the same media kind.

REQUESTED SIZES: aspect ${p.settings.aspectRatio}; images ${p.settings.imageResolution}p; video ${p.settings.videoResolution}p; export ${p.settings.resolution}p. Check actual callable capability limits; report a limitation rather than inventing size support. Put real returned files in media/ and use project-relative paths. The bridge measures them again. Record actual provider, model, tool and prompt where known.

CONTROL CONTRACT: project-scope results may return scenes (complete ordered scene list), sceneUpdates, settings, clipUpdates, newClips, removeClipIds and transitions. Preserve stable IDs and existing audio links when revising scenes. Change only the requested scope. A chat asking only for discussion needs no result file. A chat asking for changes should return the structured edit and explain what changed. Only set startProduction:true when the creator actually asks to produce/generate the film; never as part of a draft request. The app will then run all audio before images and video. Ask concise questions inside this conversation only when an essential decision cannot be inferred. Use the runtime's built-in question tool when available. Ordinary faithful execution needs no redundant approval; actual tool policy and the selected budget still apply.

SELECTED PROJECT SKILL (${p.skill?.name ?? 'Cinematic storyteller'}):
${p.skill?.content ?? 'Natural connected narration, clear causal story, purposeful images and video, consistent characters and locations. Plan the whole film before media.'}`;
  }
}
