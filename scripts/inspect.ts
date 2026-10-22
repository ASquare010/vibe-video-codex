import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
const base = process.env.VIBECUT_URL || 'http://127.0.0.1:4310';
const browser = await chromium.launch({ channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(base); await page.getByRole('heading', { name: /A good story starts/ }).waitFor();
  await page.screenshot({ path: path.resolve('data/dashboard-screenshot.png'), fullPage: true });
  const projects = await (await page.request.get(`${base}/api/projects`)).json();
  const demo = projects.find((p: any) => p.name === 'The quiet between places');
  if (demo) {
    await page.goto(`${base}/#project=${demo.id}`); await page.getByTestId('preview-stage').waitFor();
    await page.getByRole('button', { name: 'Inspect mountain-lake.png', exact: true }).click();
    await page.getByRole('heading', { name: 'mountain-lake.png', exact: true }).waitFor();
    await page.screenshot({ path: path.resolve('data/demo-editor-screenshot.png'), fullPage: true });
  }
  console.log(JSON.stringify({ errors, projects: projects.length }));
} finally { await browser.close(); }
