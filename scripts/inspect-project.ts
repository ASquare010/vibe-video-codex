import { chromium, expect } from '@playwright/test';
import path from 'node:path';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1050 } });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:4310/#project=${process.argv[2]}`);
  await expect(page.locator('.agent-live-status')).toContainText('Codex finished', { timeout: 20000 });
  await expect(page.getByRole('tab', { name: 'Motion & color', exact: true })).toHaveCount(0);
  await page.screenshot({ path: path.resolve('data/recovered-project.png'), fullPage: true });
  await page.getByRole('radio', { name: 'Editor', exact: true }).click();
  await page.getByTestId('timeline-clip').first().click();
  await expect(page.getByLabel('Camera motion', { exact: true })).toBeVisible();
  await page.screenshot({ path: path.resolve('data/properties-project.png'), fullPage: true });
  const p = await (await page.request.get(`http://127.0.0.1:4310/api/projects/${process.argv[2]}`)).json();
  console.log(JSON.stringify({ errors, scenes: p.scenes.length, shots: p.scenes.reduce((n: number, s: any) => n + s.shots.length, 0), status: p.production.status }));
} finally { await browser.close(); }
