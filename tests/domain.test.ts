import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newProject, newScene, id, makeClip, sceneFrames, splitClip, projectSchema, clampSceneClips, invalidateNarration, removeAsset, type Asset } from '../shared/project.ts';

function media(kind: Asset['kind'], sceneId: string, durationFrames?: number): Asset {
  const versionId = id(); return { id: id(), name: kind, kind, sceneId, activeVersionId: versionId, outdated: false, versions: [{ id: versionId, path: `media/${id()}.${kind === 'image' ? 'png' : kind === 'video' ? 'mp4' : 'wav'}`, durationFrames, provenance: { createdAt: new Date().toISOString(), prompt: '', sourceVersionIds: [] } }] };
}
test('each new project has independent conversation state and one initial scene', () => {
  const a = newProject('A'), b = newProject('B');
  assert.notEqual(a.id, b.id); assert.equal(a.conversation.threadId, null); assert.equal(a.scenes.length, 1);
});
test('measured narration overrides estimates; multiple images must fit inside it', () => {
  const p = newProject('Test'), s = p.scenes[0];
  const voice = media('audio', s.id, 600), image = media('image', s.id);
  p.assets.push(voice, image); s.audioAssetId = voice.id;
  p.clips = [makeClip(s.id, image, 0, 150), makeClip(s.id, image, 150, 180), makeClip(s.id, image, 330, 270)];
  assert.equal(sceneFrames(p, s), 600); assert.equal(projectSchema.safeParse(p).success, true);
  p.clips[2].durationFrames = 271;
  assert.equal(projectSchema.safeParse(p).success, false);
});
test('split video preserves exact source offsets and frame count', () => {
  const p = newProject('Test'), s = p.scenes[0], video = media('video', s.id, 180);
  p.assets.push(video); const clip = makeClip(s.id, video, 10, 140); clip.sourceIn = 20; p.clips.push(clip);
  const next = splitClip(p, clip.id, 60);
  assert.deepEqual(next.clips.map(c => [c.startFrame, c.durationFrames, c.sourceIn]), [[10, 50, 20], [60, 90, 70]]);
  assert.equal(next.assets.length, 1); assert.equal(projectSchema.safeParse(next).success, true);
});
test('split still image does not create a meaningless media offset', () => {
  const p = newProject('Test'), s = p.scenes[0], image = media('image', s.id);
  p.assets.push(image); const clip = makeClip(s.id, image, 0, 180); p.clips.push(clip);
  assert.equal(splitClip(p, clip.id, 90).clips[1].sourceIn, 0);
  assert.equal(splitClip(p, clip.id, 0), p);
});
test('shorter narration clamps all placements, removing clips outside the scene', () => {
  const p = newProject('Test'), s = p.scenes[0], voice = media('audio', s.id, 65), image = media('image', s.id);
  p.assets.push(voice, image); p.clips = [makeClip(s.id, image, 0, 90), makeClip(s.id, image, 100, 50)]; s.audioAssetId = voice.id;
  clampSceneClips(p, s.id);
  assert.equal(p.clips.length, 1); assert.equal(p.clips[0].durationFrames, 65); projectSchema.parse(p);
});
test('changing narration only invalidates media in the affected scene', () => {
  const old = newProject('Test'); old.scenes.push(newScene('Second'));
  old.assets = old.scenes.map(s => media('image', s.id));
  const next = structuredClone(old); next.scenes[0].narration = 'A changed line.';
  invalidateNarration(next, old);
  assert.equal(next.assets[0].outdated, true); assert.equal(next.assets[1].outdated, false);
});
test('schema rejects dangling versions, source overruns and mismatched tracks', () => {
  const p = newProject('Test'), s = p.scenes[0], video = media('video', s.id, 60);
  p.assets.push(video); const clip = makeClip(s.id, video, 0, 61); p.clips.push(clip);
  assert.equal(projectSchema.safeParse(p).success, false);
  clip.durationFrames = 60; clip.versionId = 'missing'; assert.equal(projectSchema.safeParse(p).success, false);
  clip.versionId = video.activeVersionId; clip.track = 'music'; assert.equal(projectSchema.safeParse(p).success, false);
});

test('deleting media removes its placements and joins, preserves narration timing and retains source versions for undo', () => {
  const p = newProject('Delete fixture'), scene = p.scenes[0], voice = media('audio', scene.id, 600), image = media('image', scene.id), video = media('video', scene.id, 300);
  p.assets.push(voice, image, video); scene.audioAssetId = voice.id;
  const picture = makeClip(scene.id, image, 0, 180), motion = makeClip(scene.id, video, 180, 300), music = makeClip(scene.id, voice, 0, 600, 'music');
  p.clips = [picture, motion, music]; p.transitions = [{ id: id(), fromClipId: picture.id, toClipId: motion.id, type: 'crossfade', durationFrames: 15 }];
  const versions = structuredClone(p.assets.map(a => a.versions));
  removeAsset(p, voice.id);
  assert.equal(scene.audioAssetId, null); assert.equal(sceneFrames(p, scene), 600); assert.equal(scene.estimatedFrames, 600); assert.equal(voice.archived, true);
  assert.deepEqual(p.clips.map(c => c.id), [picture.id, motion.id]); projectSchema.parse(p);
  removeAsset(p, image.id); assert.equal(p.transitions.length, 0); assert.deepEqual(p.clips.map(c => c.id), [motion.id]);
  removeAsset(p, video.id); assert.equal(p.clips.length, 0); assert.ok(p.assets.every(a => a.archived));
  assert.deepEqual(p.assets.map(a => a.versions), versions); projectSchema.parse(p);
});
