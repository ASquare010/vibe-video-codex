import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { newProject, newScene, id, makeClip, projectSchema, sceneNumber, costTotals, type Asset } from '../shared/project.ts';
import { retimeSourceScene } from '../shared/rerender.ts';
import { cutBoundaries, analyzeSource } from '../server/source.ts';
import { ProjectStore } from '../server/store.ts';
import { runMedia, ffmpegPath, probePath, measure } from '../server/media.ts';
import { renderProject } from '../server/export.ts';
import { nextProductionTask } from '../server/production.ts';

test('persistent scene numbers survive reordering and duplicate cost receipts are rejected', () => {
  const p = newProject('Remake'); p.scenes.push(newScene('Second'));
  const saved = projectSchema.parse(p); saved.scenes.reverse();
  assert.equal(sceneNumber(saved, saved.scenes[0]), 2);
  const c = { id: 'job-1', provider: 'Cloud', amount: 2, unit: 'USD' as const, status: 'estimate' as const, scope: 'test', notes: '' };
  saved.costs = [c, c]; assert.equal(projectSchema.safeParse(saved).success, false);
  assert.deepEqual(costTotals([c, { ...c, id:'higgs', unit:'Higgsfield credits', amount: 20 }, { ...c, id:'unknown', amount: null }]), { usd: 2, higgsfield: 20, unpriced: 1 });
});
test('local candidate parser keeps all camera candidates without inventing action cuts', () => {
  assert.deepEqual(cutBoundaries('frame:0 pts:10 pts_time:1.25\nframe:1 pts:20 pts_time:2.5\nframe:2 pts_time:2.5', 4), [0, 1.25, 2.5, 4]);
});
test('scene speedup shortens picture and placed native audio together at 24fps', () => {
  const p = newProject('Remake'), s = p.scenes[0]; p.settings.fps = 24; s.estimatedFrames = 240;
  s.source = { referenceId: 'SH7', startSeconds: 10, endSeconds: 20, verified: true, motion: 'high', route: 'seedance', status:'review', notes:'' };
  for (const kind of ['video','audio'] as const) {
    const vid = id(), a: Asset = { id:id(), name:kind, kind, sceneId:s.id, activeVersionId:vid, outdated:false, versions:[{ id:vid, path:`media/${kind}.mp4`, durationFrames:240, provenance:{ prompt:'', createdAt:'now', sourceVersionIds:[] } }] };
    p.assets.push(a); p.clips.push(makeClip(s.id,a,0,240,kind==='video'?'visual':'music'));
  }
  retimeSourceScene(p,s.id,1.15); projectSchema.parse(p);
  assert.equal(s.estimatedFrames,208); assert.deepEqual(p.clips.map(c=>[c.durationFrames,c.speed]),[[208,1.15],[208,1.15]]);
  assert.ok(p.assets.every(a=>a.versions[0].durationFrames===240));
});
test('real source analysis is local; 24fps retimed export keeps sound and measured duration', async () => {
  const root = await fs.mkdtemp(path.resolve('data/rerender-test-')), store = new ProjectStore(root), p = newProject('Local source fixture','chatgpt');
  await store.create(p); const file = path.join(root,'source.mp4');
  await runMedia(ffmpegPath(),['-v','error','-y','-f','lavfi','-i','color=c=red:s=96x64:r=24:d=1','-f','lavfi','-i','color=c=blue:s=96x64:r=24:d=1','-f','lavfi','-i','sine=frequency=440:duration=2','-filter_complex','[0:v][1:v]concat=n=2:v=1:a=0[v]','-map','[v]','-map','2:a','-c:v','libx264','-c:a','aac',file]);
  const result = await analyzeSource(store,p.id,file,'source.mp4');
  assert.equal(result.settings.fps,24); assert.equal(result.scenes.length,2); assert.equal(result.scenes[0].source!.verified,false);
  assert.equal(nextProductionTask({...result,production:{status:'running',stage:'audio'}}),null);
  result.clips=[];result.assets=[];result.scenes = [result.scenes[0]]; result.scenes[0].estimatedFrames=48; result.settings.resolution='420';
  const rel='media/fixture.mp4'; await fs.copyFile(file,path.join(store.folder(p.id),rel));
  const wav='media/fixture.wav'; await runMedia(ffmpegPath(),['-v','error','-y','-i',file,'-vn',path.join(store.folder(p.id),wav)]);
  for (const [kind,relative] of [['video',rel],['audio',wav]] as const) {
    const v=id(),a:Asset={ id:id(),name:kind,kind,sceneId:result.scenes[0].id,activeVersionId:v,outdated:false,versions:[{...(await measure(path.join(store.folder(p.id),relative),relative,24)),id:v,path:relative,provenance:{createdAt:'now',prompt:'',sourceVersionIds:[]}}]};
    result.assets.push(a);result.clips.push(makeClip(a.sceneId,a,0,48,kind==='video'?'visual':'music'));
  }
  retimeSourceScene(result,result.scenes[0].id,1.15); projectSchema.parse(result);
  const relative = await renderProject(store,result), output=path.join(store.folder(p.id),relative);
  const probe=JSON.parse((await runMedia(probePath(),['-v','error','-show_streams','-of','json',output])).toString());
  assert.equal(probe.streams.find((s:any)=>s.codec_type==='video').r_frame_rate,'24/1');
  assert.ok(probe.streams.some((s:any)=>s.codec_type==='audio'));
  assert.equal((await measure(output,output,24)).durationFrames,result.scenes[0].estimatedFrames);
});
