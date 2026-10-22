import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { newProject, id, makeClip } from '../shared/project.ts';
import { ProjectStore } from '../server/store.ts';
import { runMedia, ffmpegPath, importMedia } from '../server/media.ts';

export async function createFixtures(destination: string) {
  await fs.mkdir(destination, { recursive: true });
  const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const svg = await fs.readFile(path.resolve('public/demo-poster.svg'), 'utf8');
    await page.setContent(`<html><body style="margin:0">${svg}</body></html>`);
    await page.screenshot({ path: path.join(destination, 'mountain-lake.png') });
  } finally { await browser.close(); }
  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=220:sample_rate=48000:duration=6', '-af', 'volume=0.035,afade=t=in:d=0.5,afade=t=out:st=5:d=1', path.join(destination, 'ambient-tone.wav')]);
  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-loop', '1', '-framerate', '30', '-i', path.join(destination, 'mountain-lake.png'), '-t', '2', '-vf', 'scale=640:360', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', path.join(destination, 'lake-video.mp4')]);
}
if (process.argv[1]?.endsWith('demo.ts')) {
  const store = new ProjectStore(path.resolve(process.env.VIBECUT_DATA_DIR || 'data/projects'));
  await fs.mkdir(store.root, { recursive: true });
  const fixtures = path.resolve('data/fixtures');
  await createFixtures(fixtures);
  const p = newProject('The quiet between places', 'chatgpt', 'A film about a mountain lake before the world wakes. Muted blues, warm morning light, a slow camera and space to breathe.');
  p.scenes[0].title = 'Before the world wakes';
  p.scenes[0].narration = 'Before the world wakes, there is a moment when the mountains hold their breath.';
  p.scenes[0].approved = true;
  p.theme = 'Quiet, cinematic landscapes. Muted slate blue and a warm horizon. Slow, deliberate movement. Keep the lake and mountains consistent.';
  await store.create(p);
  await importMedia(store, p.id, p.scenes[0].id, path.join(fixtures, 'ambient-tone.wav'), 'ambient-tone.wav');
  await importMedia(store, p.id, p.scenes[0].id, path.join(fixtures, 'mountain-lake.png'), 'mountain-lake.png');
  const current = await store.mutate(p.id, draft => {
    draft.clips[0].durationFrames = 180; draft.clips[0].motion = 'zoom-in';
    const text = makeClip(draft.scenes[0].id, null, 0, 180, 'text');
    text.text = 'The quiet between places'; text.fontSize = 50; text.y = 24; draft.clips.push(text);
    // The tone is a labelled test fixture, not generated speech or a generation result.
    draft.assets[0].name = 'Ambient tone · demo fixture';
  });
  console.log(`Demo project created: ${current.id}\nThe audio is a synthetic test tone, not narration. No AI generation was used.`);
}
