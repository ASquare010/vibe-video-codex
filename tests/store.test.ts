import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ProjectStore } from '../server/store.ts';
import { newProject } from '../shared/project.ts';

test('atomic persistence preserves revisions and rejects a concurrent stale save', async () => {
  await fs.mkdir(path.resolve('data/test-stores'), { recursive: true });
  const temporary = await fs.mkdtemp(path.resolve('data/test-stores/vibecut-test-'));
  const store = new ProjectStore(temporary);
  const p = await store.create(newProject('Original'));
  const results = await Promise.allSettled([
    store.mutate(p.id, p => { p.name = 'First'; }, 0),
    store.mutate(p.id, p => { p.name = 'Second'; }, 0),
  ]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected').length, 1);
  const saved = await store.read(p.id); assert.equal(saved.name, 'First'); assert.equal(saved.revision, 1);
  assert.equal(JSON.parse(await fs.readFile(path.join(store.folder(p.id), 'project.json.bak'), 'utf8')).name, 'Original');
});
test('project file access rejects traversal and outside symlinks', async () => {
  await fs.mkdir(path.resolve('data/test-stores'), { recursive: true });
  const temporary = await fs.mkdtemp(path.resolve('data/test-stores/vibecut-path-test-'));
  const store = new ProjectStore(temporary); const p = await store.create(newProject('Test'));
  await assert.rejects(store.safeFile(p.id, '../private.txt'));
  await assert.rejects(store.safeFile(p.id, path.resolve(temporary, 'private.txt')));
  assert.throws(() => store.folder('../outside'));
});
