import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CodexClient, AgentManager } from '../server/codex.ts';
import { ProjectStore } from '../server/store.ts';
import { ffmpegPath, runMedia } from '../server/media.ts';
import { newProject, newScene, id, shotSchema, sceneFrames, resultSchema, jobSchema } from '../shared/project.ts';
import { nextProductionTask, validateProductionResult } from '../server/production.ts';

test('create-and-produce completes the whole draft, all scene audio, images, then videos with shot lineage', async () => {
  await fs.mkdir(path.resolve('data/production-tests'), { recursive: true });
  const folder = await fs.mkdtemp(path.resolve('data/production-tests/run-'));
  const tone = path.join(folder, 'tone.wav'), image = path.join(folder, 'frame.png'), video = path.join(folder, 'motion.mp4');
  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=330:duration=1', tone]);
  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=navy:s=64x64', '-frames:v', '1', image]);
  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-loop', '1', '-i', image, '-t', '1', '-r', '30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', video]);
  const order: string[] = [];
  class FixtureCodex extends CodexClient {
    override async status() { return { available: true, message: 'Test fixture transport' }; }
    override async rpc(method: string, params: any = {}) {
      if (method === 'thread/start') return { thread: { id: 'production-fixture-thread' } };
      if (['thread/inject_items', 'thread/name/set', 'thread/resume'].includes(method)) return {};
      if (method !== 'turn/start') throw new Error(`Unexpected ${method}`);
      const jobId = params.input[0].text.match(/jobs\/([\da-f-]+)\/input.json/)[1];
      const { project: p, job } = JSON.parse(await fs.readFile(path.join(params.cwd, 'jobs', jobId, 'input.json'), 'utf8'));
      order.push(job.action);
      const scene = p.scenes.find((s: any) => s.id === job.sceneId);
      if (job.action === 'plan') {
        await fs.writeFile(path.join(params.cwd, 'jobs', jobId, 'result.json'), JSON.stringify(resultSchema.parse({ summary: 'Whole-film protocol fixture', scenes: p.scenes, plan: { story: 'A consistent two-scene story.', fullNarration: p.scenes.map((s: any) => s.narration).join('\n\n') } })));
        const turnId = id(); setTimeout(() => this.emit('notification', { method: 'turn/completed', params: { threadId: params.threadId, turn: { id: turnId, status: 'completed' } } }), 25);
        return { turn: { id: turnId } };
      }
      const filename = `media/${jobId}.${job.action === 'audio' ? 'wav' : job.action === 'images' ? 'png' : 'mp4'}`;
      await fs.copyFile(job.action === 'audio' ? tone : job.action === 'images' ? image : video, path.join(params.cwd, filename));
      const sourceImage = p.assets.find((a: any) => a.kind === 'image' && a.sceneId === scene.id);
      const result = resultSchema.parse({ summary: 'Protocol fixture only', assets: job.action === 'images' ? scene.shots.map((shot: any, index: number) => ({ name: `Fixture image ${index + 1}`, kind: 'image', path: filename, sceneId: scene.id, shotId: shot.id, startFrame: index * 15, durationFrames: 15 })) : [{ name: 'Fixture asset', kind: job.action === 'audio' ? 'audio' : 'video', path: filename, sceneId: scene.id, shotId: job.action === 'audio' ? undefined : scene.shots[0].id, sourceImageId: job.action === 'video' ? sourceImage.id : undefined, replaceClipId: job.action === 'video' ? p.clips.find((c: any) => c.assetId === sourceImage.id)?.id : undefined, durationFrames: 30 }] });
      await fs.writeFile(path.join(params.cwd, 'jobs', jobId, 'result.json'), JSON.stringify(result));
      const turnId = id(); setTimeout(() => this.emit('notification', { method: 'turn/completed', params: { threadId: params.threadId, turn: { id: turnId, status: 'completed' } } }), 25);
      return { turn: { id: turnId } };
    }
  }
  const store = new ProjectStore(folder), p = newProject('Full production fixture');
  p.conversation.mode = 'managed';
  p.scenes.push(newScene('Second scene'));
  p.scenes.forEach(s => { s.narration = 'Exact approved words.'; s.direction = 'A consistent setting'; s.spokenStyle = 'Calm narration'; s.audioPrompt = 'A steady intimate voice'; s.shots = [shotSchema.parse({ id: id(), title: 'Planned video shot', imagePrompt: 'A navy frame fixture', videoPrompt: 'Hold the fixture' }), shotSchema.parse({ id: id(), title: 'Planned still shot', imagePrompt: 'A second navy frame fixture', videoPrompt: 'A slow editorial push', media: 'image' })]; });
  await store.create(p);
  const manager = new AgentManager(store, new FixtureCodex());
  await manager.queue(p.id, { action: 'plan', scope: 'project', produceAfterPlan: true, sceneId: p.scenes[0].id, clipIds: [], instructions: 'Create the entire fixture film' });
  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) { const current = await store.read(p.id); if (['completed', 'failed'].includes(current.production.status)) break; await new Promise(resolve => setTimeout(resolve, 50)); }
  const saved = await store.read(p.id);
  assert.equal(saved.production.status, 'completed', JSON.stringify(saved.jobs.map(j => j.error)));
  assert.deepEqual(order, ['plan', 'audio', 'audio', 'images', 'images', 'video', 'video']);
  assert.equal(saved.clips.length, 4);
  for (const scene of saved.scenes) {
    assert.equal(sceneFrames(saved, scene), 30);
    const placements = saved.clips.filter(c => c.sceneId === scene.id);
    assert.equal(placements.length, 2); assert.equal(placements.reduce((total, c) => total + c.durationFrames, 0), 30);
    const placement = saved.clips.find(c => c.sceneId === scene.id)!;
    const asset = saved.assets.find(a => a.id === placement.assetId)!;
    assert.equal(asset.kind, 'video'); assert.equal(asset.versions[0].provenance.sourceVersionIds.length, 1);
  }
  assert.equal(nextProductionTask(saved), null);
});

test('production stops on unidentified or incomplete shots instead of repeating billable work', () => {
  const p = newProject('Missing shot fixture'); p.production.status = 'running';
  const scene = p.scenes[0]; scene.shots = [shotSchema.parse({ id: id(), title: 'First' }), shotSchema.parse({ id: id(), title: 'Second' })];
  const job = jobSchema.parse({ id: id(), action: 'images', sceneId: scene.id, clipIds: [], instructions: '', revision: 0, status: 'running', createdAt: new Date().toISOString() });
  const proposal = resultSchema.parse({ summary: 'Incomplete fixture', assets: [{ name: 'Only one', kind: 'image', sceneId: scene.id, path: 'media/fixture.png', shotId: scene.shots[0].id }] });
  assert.throws(() => validateProductionResult(p, job, proposal), /missing planned shot IDs/);
  proposal.assets.push({ ...proposal.assets[0], shotId: scene.shots[1].id });
  assert.doesNotThrow(() => validateProductionResult(p, job, proposal));
});
