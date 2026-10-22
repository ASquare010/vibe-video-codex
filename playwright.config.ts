import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', fullyParallel: false, workers: 1, timeout: 120000,
  use: { actionTimeout: 15000, baseURL: 'http://127.0.0.1:4311', channel: process.platform === 'win32' ? 'msedge' : undefined, headless: true, viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4311', reuseExistingServer: false, timeout: 60000, env: { PORT: '4311', VIBECUT_DATA_DIR: 'data/e2e-projects', CODEX_BIN: 'vibecut-test-codex-unavailable' } },
});
