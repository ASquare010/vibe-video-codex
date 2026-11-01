import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {ProjectStore} from '../../server/store.ts';
import {renderProject} from '../../server/export.ts';
import {ffmpegPath,probePath,runMedia} from '../../server/media.ts';
import {activeVersion,sceneFrames,totalFrames} from '../../shared/project.ts';

// Project-specific repair: render existing placements only; no provider calls or manifest edits.
const store=new ProjectStore(path.resolve('data/projects'));
const projectId='34dd7600-10be-483d-8b19-4bc92f818408',root=store.folder(projectId);
const latest=path.join(root,'latest-export.json'),previous=JSON.parse(await fs.readFile(latest,'utf8'));
if(previous.boundaryRepair?.kind==='frame-grid-v1') {
  console.log(JSON.stringify({alreadyRepaired:true,film:previous.film}));
} else {
  const manifest=await fs.readFile(path.join(root,'project.json'),'utf8'),p=await store.read(projectId);
  const sha=(bytes:Buffer|string)=>crypto.createHash('sha256').update(bytes).digest('hex');
  const mediaFiles=[...new Set([
    ...p.clips.filter(c=>c.assetId).map(c=>p.assets.find(a=>a.id===c.assetId)!.versions.find(v=>v.id===c.versionId)!.path),
    ...p.scenes.map(s=>activeVersion(p.assets.find(a=>a.id===s.audioAssetId)!).path)
  ])];
  const mediaHashes=await Promise.all(mediaFiles.map(async f=>({path:f,sha256:sha(await fs.readFile(path.join(root,f)))})));
  const oldHash=sha(await fs.readFile(previous.film));assert.equal(oldHash,previous.sha256);
  const relative=await renderProject(store,p),film=path.join(root,relative),folder=path.dirname(film);
  const probe=JSON.parse((await runMedia(probePath(),['-v','error','-count_frames','-show_streams','-of','json',film])).toString());
  const video=probe.streams.find((s:any)=>s.codec_type==='video'),audio=probe.streams.find((s:any)=>s.codec_type==='audio');
  assert.equal(Number(video.nb_read_frames),totalFrames(p));assert.equal(video.avg_frame_rate,`${p.settings.fps}/1`);
  assert.equal(video.width,previous.width);assert.equal(video.height,previous.height);assert.ok(audio);
  const decodeLog=await new Promise<string>((resolve,reject)=>{
    const child=spawn(ffmpegPath(),['-hide_banner','-i',film,'-map','0:v:0','-map','0:a:0',
      '-vf','blackdetect=d=0.01:pix_th=0.10:pic_th=0.98','-f','null','-'],{windowsHide:true});
    let log='';child.stdout.resume();child.stderr.on('data',d=>{log+=d.toString();});
    const timer=setTimeout(()=>{child.kill();reject(Error('Decode check timed out'));},10*60*1000);
    child.on('error',e=>{clearTimeout(timer);reject(e);});
    child.on('exit',code=>{clearTimeout(timer);code===0?resolve(log):reject(Error(log));});
  });
  const blackIntervals=decodeLog.split(/\r?\n/).filter(line=>line.includes('black_start:'));
  assert.deepEqual(blackIntervals,[],'This film has no intended black intervals');
  const audioProof=[];
  for(const [i,s] of p.scenes.entries()) {
    const source=activeVersion(p.assets.find(a=>a.id===s.audioAssetId)!).path;
    const samples=Math.round(sceneFrames(p,s)*48000/p.settings.fps);
    const expected=await runMedia(ffmpegPath(),['-v','error','-i',path.join(root,source),'-af',`apad,atrim=end_sample=${samples},asetpts=N/SR/TB`,'-ar','48000','-ac','2','-f','s16le','-'],64*1024*1024);
    const actual=await runMedia(ffmpegPath(),['-v','error','-i',path.join(folder,`scene-${i}.mkv`),'-map','0:a:0','-ar','48000','-ac','2','-f','s16le','-'],64*1024*1024);
    const old=await runMedia(ffmpegPath(),['-v','error','-i',path.join(path.dirname(previous.film),`scene-${i}.mkv`),'-map','0:a:0','-ar','48000','-ac','2','-f','s16le','-'],64*1024*1024);
    assert.ok(expected.equals(actual)&&old.equals(actual),`Narration differs in ${s.id}`);
    audioProof.push({sceneId:s.id,source,sourceFileSha256:sha(await fs.readFile(path.join(root,source))),expectedSamples:samples,
      expectedBytes:expected.length,renderedBytes:actual.length,retainedPcmExact:true,previousIntermediatePcmExact:true,
      expectedPcmSha256:sha(expected),renderedPcmSha256:sha(actual)});
  }
  const priorChecks=JSON.parse(await fs.readFile(path.resolve('evaluations/apollo-12-parent-review/black-frame-source-comparison.json'),'utf8'));
  const boundaries=[];
  for(const c of priorChecks) {
    const pixel=await runMedia(ffmpegPath(),['-v','error','-i',film,'-vf',`select=eq(n\\,${c.exportFrame}),scale=1:1`,'-vsync','0','-frames:v','1','-pix_fmt','rgb24','-f','rawvideo','-']);
    assert.equal(pixel.length,3);assert.ok(Math.max(...pixel)>20,`Still black at ${c.exportFrame}`);
    boundaries.push({cutId:c.cut,frame:c.exportFrame,seconds:c.seconds,rgb:[...pixel],repaired:true});
  }
  for(const item of mediaHashes)assert.equal(sha(await fs.readFile(path.join(root,item.path))),item.sha256,`Source changed: ${item.path}`);
  assert.equal(await fs.readFile(path.join(root,'project.json'),'utf8'),manifest,'Project changed during export; do not publish stale receipt');
  const reportFolder=path.join(root,'review/boundary-export-fix');await fs.mkdir(reportFolder,{recursive:true});
  await fs.writeFile(path.join(reportFolder,'previous-latest-export.json'),JSON.stringify(previous,null,2));
  await fs.writeFile(path.join(reportFolder,'decode-and-blackdetect.log'),decodeLog);
  const boundaryRepair={kind:'frame-grid-v1',previousFilm:previous.film,previousSha256:oldHash,blackIntervals,
    repairedBoundaries:boundaries,sourceMediaUnchanged:true,projectManifestUnchanged:true,mediaHashes};
  const receipt={...previous,revision:p.revision,film,relative,sha256:sha(await fs.readFile(film)),audioProof,boundaryRepair,
    decode:'full video and audio decode passed; no near-black intervals found',verifiedAt:new Date().toISOString()};
  await fs.writeFile(path.join(reportFolder,'verification.json'),JSON.stringify(receipt,null,2));
  await fs.writeFile(path.join(folder,'verification.json'),JSON.stringify(receipt,null,2));
  const temporary=latest+'.boundary-fix.tmp';await fs.writeFile(temporary,JSON.stringify(receipt,null,2));await fs.rename(temporary,latest);
  await fs.writeFile(path.resolve('evaluations/apollo-12-parent-review/export-boundary-fix.json'),JSON.stringify({
    film,relative,frames:video.nb_read_frames,seconds:totalFrames(p)/p.settings.fps,width:video.width,height:video.height,
    sha256:receipt.sha256,previousSha256:oldHash,nearBlackIntervals:0,repairedBoundaries:boundaries,
    unchangedAudioScenes:audioProof.length,sourceMediaUnchanged:true,projectManifestUnchanged:true,
    listening:'pending',nativeMotion:'pending',creatorApproval:false},null,2));
  console.log(JSON.stringify({film,frames:video.nb_read_frames,repairedBoundaries:boundaries.length,blackIntervals:0,unchangedAudioScenes:audioProof.length}));
}
