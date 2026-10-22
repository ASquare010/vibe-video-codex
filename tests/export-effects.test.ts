import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ProjectStore } from '../server/store.ts';
import { importMedia, ffmpegPath, runMedia, measure } from '../server/media.ts';
import { renderProject } from '../server/export.ts';
import { id, newProject, makeClip } from '../shared/project.ts';

test('all transition types render distinct intermediate frames without changing narration timing', async () => {
  await fs.mkdir(path.resolve('data/effect-tests'), { recursive: true });
  const root = await fs.mkdtemp(path.resolve('data/effect-tests/run-')), store = new ProjectStore(root), initial = newProject('Transition fixture', 'chatgpt');
  await store.create(initial);
  for (const color of ['red', 'blue']) {
    const file = path.join(root, `${color}.png`);
    await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=${color}:s=64x64`, '-frames:v', '1', file]);
    await importMedia(store, initial.id, initial.scenes[0].id, file, `${color}.png`);
  }
  const p = await store.read(initial.id); p.settings.resolution = '420'; p.scenes[0].estimatedFrames = 60;
  p.clips = p.assets.map((a, i) => makeClip(p.scenes[0].id, a, i * 30, 30));
  const pixels: Record<string, number[]> = {};
  for (const type of ['crossfade', 'dip-black', 'wipe-left', 'slide-left'] as const) {
    p.transitions = [{ id: id(), fromClipId: p.clips[0].id, toClipId: p.clips[1].id, type, durationFrames: 15 }];
    const relative = await renderProject(store, p), file = path.join(store.folder(p.id), relative);
    assert.equal((await measure(file)).durationFrames, 60);
    const frame = await runMedia(ffmpegPath(), ['-v', 'error', '-ss', '1.2', '-i', file, '-frames:v', '1', '-vf', 'scale=1:1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
    pixels[type] = [...frame];
  }
  assert.ok(pixels.crossfade[0] > 30 && pixels.crossfade[2] > 30, JSON.stringify(pixels));
  assert.ok(pixels['dip-black'][0] < 15 && pixels['dip-black'][2] > 100, JSON.stringify(pixels));
  for (const type of ['wipe-left', 'slide-left']) assert.ok(pixels[type][0] > 40 && pixels[type][2] > 40, JSON.stringify(pixels));
});
