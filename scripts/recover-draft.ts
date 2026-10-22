import path from 'node:path';
import { ProjectStore } from '../server/store.ts';
import { applyResult } from '../server/media.ts';
const store = new ProjectStore(path.resolve('data/projects'));
const recovered = await applyResult(store, process.argv[2], process.argv[3]);
console.log(JSON.stringify({ project: recovered.id, scenes: recovered.scenes.length, shots: recovered.scenes.reduce((n, s) => n + s.shots.length, 0), retainedClips: recovered.clips.length, retainedAspectRatio: recovered.settings.aspectRatio, status: recovered.production.status, generatedMedia: false }));
