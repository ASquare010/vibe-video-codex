import type { Project } from './project';
export type ReviewSurface = 'storyboard' | 'skill';

// A content identifier for review freshness, not a security or permission token.
export function reviewFingerprint(p: Project, surface: ReviewSurface): string {
  const { approved, ...plan } = p.plan;
  const content = JSON.stringify(surface === 'skill' ? p.skill : { plan, skill: p.skill, scenes: p.scenes.map(({ approved, audioAssetId, ...scene }) => scene) });
  let a = 2166136261, b = 2246822507;
  for (let i = 0; i < content.length; i++) { const n = content.charCodeAt(i); a = Math.imul(a ^ n, 16777619); b = Math.imul(b ^ n, 3266489909); }
  return `${content.length}-${(a >>> 0).toString(16)}-${(b >>> 0).toString(16)}`;
}
export function isReviewApproved(p: Project, surface: ReviewSurface) { return p.review.approvals[surface]?.fingerprint === reviewFingerprint(p, surface); }
export function canApproveReview(p: Project, surface: ReviewSurface) {
  return surface === 'skill' ? !!p.skill?.content.trim() : p.scenes.every(s => s.narration.trim() && s.direction.trim());
}
export function approveReview(p: Project, surface: ReviewSurface) {
  if (!canApproveReview(p, surface)) throw new Error(surface === 'skill' ? 'Choose a project skill before approving it.' : 'Add narration and direction for each scene before approving the storyboard.');
  p.review.approvals[surface] = { fingerprint: reviewFingerprint(p, surface), approvedAt: new Date().toISOString() };
  if (surface === 'storyboard') { p.plan.approved = true; p.scenes.forEach(s => { s.approved = true; }); }
}
export function reopenReview(p: Project, surface: ReviewSurface) {
  p.review.approvals[surface] = null;
  if (surface === 'storyboard') { p.plan.approved = false; p.scenes.forEach(s => { s.approved = false; }); }
}
