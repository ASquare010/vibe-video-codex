import { chromium, expect } from '@playwright/test';
import path from 'node:path';
import { projectSchema } from '../shared/project';

const base = process.env.VIBECUT_URL || 'http://127.0.0.1:4310', projectId = process.argv[2];
if (!projectId) throw new Error('Pass the project ID to inspect');
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 2048, height: 1152 } }), errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  const p = projectSchema.parse(await (await page.request.get(`${base}/api/projects/${projectId}`)).json());
  await page.goto(`${base}/#project=${projectId}`);
  const library = page.getByRole('region', { name: 'Project media', exact: true });
  await expect(library.getByTestId('asset-item')).toHaveCount(p.assets.filter(a => !a.archived).length);
  await library.getByRole('radio', { name: 'Audio', exact: true }).click();
  await expect(library.getByTestId('asset-item')).toHaveCount(p.assets.filter(a => a.kind === 'audio' && !a.archived).length);
  await expect(page.getByTestId('track-narration').locator('.narration-clip')).toHaveCount(p.scenes.filter(s => s.audioAssetId).length);
  const aligned = await page.locator('.track-label').evaluateAll(labels => labels.every(label => {
    const id = label.getAttribute('data-testid')!.replace('label-', '');
    return Math.abs(label.getBoundingClientRect().y - document.querySelector(`[data-testid="track-${id}"]`)!.getBoundingClientRect().y) < 1;
  }));
  if (!aligned) throw new Error('Timeline rows are misaligned');
  const status = page.locator('.agent-live-status strong');
  await expect(status).not.toHaveText('Checking Codex status…', { timeout: 20000 });
  await library.getByRole('radio', { name: 'All', exact: true }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await page.screenshot({ path: path.resolve('data/current-timeline-library.png'), fullPage: true });
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(JSON.stringify({ scenes: p.scenes.length, assets: p.assets.filter(a => !a.archived).length, audio: p.assets.filter(a => a.kind === 'audio' && !a.archived).length, status: await status.textContent(), aligned, errors }));
} finally { await browser.close(); }
