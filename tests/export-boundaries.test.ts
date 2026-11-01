import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {ProjectStore} from '../server/store.ts';
import {ffmpegPath,probePath,runMedia} from '../server/media.ts';
import {renderProject} from '../server/export.ts';
import {assetSchema,id,makeClip,newProject,newScene} from '../shared/project.ts';

// Actual Apollo cut lengths expose fractional-second boundaries missed by round-second fixtures.
for(const fps of [24,30] as const) for(const kind of ['video','image'] as const) {
  test(`${fps}fps ${kind} exports preserve every frame across adjacent cuts and scenes`,async()=>{
    const parent=path.resolve('data/export-boundary-tests');await fs.mkdir(parent,{recursive:true});
    const root=await fs.mkdtemp(path.join(parent,'run-')),store=new ProjectStore(root),p=newProject('Exact cut boundaries');
    p.settings.fps=fps;p.settings.resolution='420';p.scenes.push(newScene('Second scene'));
    const lengths=[[89,65,93,91],[31,91,70,101,114]];
    p.scenes.forEach((s,i)=>s.estimatedFrames=lengths[i].reduce((a,b)=>a+b,0));
    await store.create(p);
    const colors=['red','lime','blue'];
    const media=await Promise.all(colors.map(async(color)=>{
      const rel=`media/${color}.${kind==='image'?'png':'mp4'}`,file=path.join(store.folder(p.id),rel);
      await runMedia(ffmpegPath(),['-v','error','-y','-f','lavfi','-i',`color=c=${color}:s=64x64:r=${fps}:d=10`,
        ...(kind==='image'?['-frames:v','1']:['-c:v','libx264','-pix_fmt','yuv420p']),file]);
      return rel;
    }));
    const expected:number[]=[];
    for(const [si,scene] of p.scenes.entries()) {
      let start=0;
      for(const [i,duration] of lengths[si].entries()) {
        const channel=i%3,v=id(),a=assetSchema.parse({id:id(),sceneId:scene.id,name:colors[channel],kind,activeVersionId:v,
          versions:[{id:v,path:media[channel],durationFrames:fps*10,provenance:{createdAt:'fixture'}}]});
        p.assets.push(a);const c=makeClip(scene.id,a,start,duration);
        if(kind==='video'){c.sourceIn=5;c.speed=i%2===0?1:1.25;}
        p.clips.push(c);expected.push(...Array(duration).fill(channel));start+=duration;
      }
    }
    const relative=await renderProject(store,p),file=path.join(store.folder(p.id),relative);
    const probe=JSON.parse((await runMedia(probePath(),['-v','error','-count_frames','-show_streams','-of','json',file])).toString());
    const video=probe.streams.find((s:any)=>s.codec_type==='video');
    assert.equal(Number(video.nb_read_frames),expected.length);assert.equal(video.avg_frame_rate,`${fps}/1`);
    const pixels=await runMedia(ffmpegPath(),['-v','error','-i',file,'-vf','scale=1:1','-vsync','0','-pix_fmt','rgb24','-f','rawvideo','-']);
    assert.equal(pixels.length,expected.length*3);
    for(const [n,channel] of expected.entries()) {
      const rgb=[...pixels.subarray(n*3,n*3+3)];
      assert.ok(rgb[channel]>150&&rgb.filter((_,i)=>i!==channel).every(c=>c<45),`frame ${n}: expected ${colors[channel]}, got ${rgb}`);
    }
  });
}

test('intentional uncovered frames stay black and a one-frame insert stays exactly one frame',async()=>{
  const parent=path.resolve('data/export-boundary-tests');await fs.mkdir(parent,{recursive:true});
  const root=await fs.mkdtemp(path.join(parent,'run-')),store=new ProjectStore(root),p=newProject('Intentional gaps');
  p.settings.fps=24;p.settings.resolution='420';p.scenes[0].estimatedFrames=95;await store.create(p);
  const relative='media/white.png';await runMedia(ffmpegPath(),['-v','error','-y','-f','lavfi','-i','color=c=white:s=64x64','-frames:v','1',path.join(store.folder(p.id),relative)]);
  const v=id(),a=assetSchema.parse({id:id(),sceneId:p.scenes[0].id,name:'White',kind:'image',activeVersionId:v,versions:[{id:v,path:relative,provenance:{createdAt:'fixture'}}]});
  p.assets.push(a);p.clips=[makeClip(a.sceneId,a,3,86),makeClip(a.sceneId,a,92,1)];
  const file=path.join(store.folder(p.id),await renderProject(store,p));
  const pixels=await runMedia(ffmpegPath(),['-v','error','-i',file,'-vf','scale=1:1','-vsync','0','-pix_fmt','rgb24','-f','rawvideo','-']);
  assert.equal(pixels.length,95*3);
  for(let n=0;n<95;n++)assert.ok((n>=3&&n<89)||n===92?pixels[n*3]>230:pixels[n*3]<10,`unexpected coverage at frame ${n}`);
});

test('text overlays appear only on their exact fractional-second frame interval',async()=>{
  const parent=path.resolve('data/export-boundary-tests');await fs.mkdir(parent,{recursive:true});
  const root=await fs.mkdtemp(path.join(parent,'run-')),store=new ProjectStore(root),p=newProject('Text boundaries');
  p.settings.fps=24;p.settings.resolution='420';p.scenes[0].estimatedFrames=95;await store.create(p);
  const relative='media/black.png';await runMedia(ffmpegPath(),['-v','error','-y','-f','lavfi','-i','color=c=black:s=64x64','-frames:v','1',path.join(store.folder(p.id),relative)]);
  const v=id(),a=assetSchema.parse({id:id(),sceneId:p.scenes[0].id,name:'Black',kind:'image',activeVersionId:v,versions:[{id:v,path:relative,provenance:{createdAt:'fixture'}}]});
  p.assets.push(a);p.clips=[makeClip(a.sceneId,a,0,95)];
  for(const [start,duration] of [[31,2],[92,1]]) {
    const c=makeClip(a.sceneId,null,start,duration,'text');c.text='BOUNDARY';c.fontSize=180;c.shadow=false;p.clips.push(c);
  }
  const file=path.join(store.folder(p.id),await renderProject(store,p));
  const pixels=await runMedia(ffmpegPath(),['-v','error','-i',file,'-vf','scale=1:1','-vsync','0','-pix_fmt','rgb24','-f','rawvideo','-']);
  assert.equal(pixels.length,95*3);
  for(let n=0;n<95;n++)assert.ok(n===31||n===32||n===92?pixels[n*3]>5:pixels[n*3]<4,`unexpected title at frame ${n}: ${pixels[n*3]}`);
});
