import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { durableWrite } from '../server/persistence.ts';
import { newProject, projectSchema } from '../shared/project.ts';

test('Windows EPERM replacement recovers without losing the project or its backup', async () => {
  await fs.mkdir(path.resolve('data/persistence-tests'), { recursive: true });
  const folder = await fs.mkdtemp(path.resolve('data/persistence-tests/lock-'));
  const file = path.join(folder, 'project.json');
  const p = newProject('Before'); await durableWrite(file, JSON.stringify(p));
  const next = { ...p, name: 'After the locked save', revision: 1 };
  await durableWrite(file, JSON.stringify(next), { delays: [0], rename: async () => { throw Object.assign(new Error('Locked by Windows reader'), { code: 'EPERM' }); } });
  assert.equal(projectSchema.parse(JSON.parse(await fs.readFile(file, 'utf8'))).name, 'After the locked save');
  assert.equal(JSON.parse(await fs.readFile(`${file}.bak`, 'utf8')).name, 'Before');
  assert.equal((await fs.readdir(folder)).some(name => name.endsWith('.tmp') || name.endsWith('.pending')), false);
});
test('version-one projects migrate without losing narration or asset references', () => {
  const original = newProject('Existing video');
  const legacy: any = structuredClone(original); legacy.schemaVersion = 1;
  delete legacy.skill; delete legacy.plan; delete legacy.production; delete legacy.transitions;
  legacy.settings = { fps: 30, aspectRatio: '9:16' };
  legacy.scenes[0] = { id: legacy.scenes[0].id, title: 'Original scene', narration: 'Keep these words.', direction: 'Keep the setting.', estimatedFrames: 180, audioAssetId: null, approved: true };
  const migrated = projectSchema.parse(legacy);
  assert.equal(migrated.schemaVersion, 2); assert.equal(migrated.scenes[0].narration, 'Keep these words.');
  assert.equal(migrated.settings.approvals, 'auto_review'); assert.equal(migrated.settings.resolution, '720');
});
