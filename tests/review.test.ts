import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newProject, id, invalidateNarration, projectSchema } from '../shared/project.ts';
import { approveReview, isReviewApproved } from '../shared/review.ts';

test('review approvals follow document content while notes and canvas edits leave them intact', () => {
  const p = newProject('Review fixture'); p.scenes[0].narration = 'The door opened.'; p.scenes[0].direction = 'An empty corridor.';
  p.skill = { id: 'fixture', name: 'Fixture style', content: 'A calm narrator.' };
  approveReview(p, 'storyboard'); approveReview(p, 'skill');
  const prior = structuredClone(p);
  p.review.comments.push({ id: id(), anchor: { surface: 'storyboard', sceneId: p.scenes[0].id, label: 'Opening', quote: 'The door' }, type: 'suggestion', body: 'Hold the pause.', createdAt: new Date().toISOString(), resolved: false });
  p.settings.aspectRatio = '9:16'; invalidateNarration(p, prior);
  assert.equal(isReviewApproved(p, 'storyboard'), true); assert.equal(p.plan.approved, true);
  p.scenes[0].narration = 'The door stayed closed.'; invalidateNarration(p, prior);
  assert.equal(isReviewApproved(p, 'storyboard'), false); assert.equal(p.plan.approved, false);
  assert.equal(isReviewApproved(p, 'skill'), true);
  p.skill.content = 'A hurried narrator.'; assert.equal(isReviewApproved(p, 'skill'), false);
  assert.equal(projectSchema.parse(p).review.comments[0].anchor.quote, 'The door');
});

test('approving freshly edited narration survives save invalidation, and blank drafts cannot be approved', () => {
  const p = newProject('Review fixture'); const old = structuredClone(p);
  assert.throws(() => approveReview(p, 'storyboard'), /narration and direction/);
  p.scenes[0].narration = 'A new complete line.'; p.scenes[0].direction = 'A clear visual.'; approveReview(p, 'storyboard');
  invalidateNarration(p, old);
  assert.equal(p.plan.approved, true); assert.equal(p.scenes[0].approved, true);
});
