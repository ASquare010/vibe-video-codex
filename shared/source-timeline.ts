import { activeVersion, cleanTransitions, id, makeClip, newScene, nextSceneNumber, sceneFrames, sceneNumber, type Asset, type Project, type Scene } from './project';

const IMAGE_PREVIEW_TOOL = 'Photographic image preview (no generated motion)';
export function isImagePreview(asset: Asset | undefined) {
  return asset?.kind === 'image' && activeVersion(asset).provenance.tool === IMAGE_PREVIEW_TOOL;
}
export type ImagePreviewSpan = {assetId:string;versionId:string;startFrame:number;durationFrames:number};

// A still-image stage preserves source sound/timing and never claims generated video.
export function placeSceneImagePreviews(p:Project,sceneId:string,spans:ImagePreviewSpan[]){
  const scene=p.scenes.find(s=>s.id===sceneId);if(!scene?.source)throw Error('Image previews need a source scene');
  const length=sceneFrames(p,scene),ordered=[...spans].sort((a,b)=>a.startFrame-b.startFrame);
  let cursor=0;const pictures=ordered.map(s=>{
    if(!Number.isInteger(s.startFrame)||!Number.isInteger(s.durationFrames)||s.durationFrames<1||s.startFrame!==cursor)throw Error('Image preview spans must cover the scene exactly, without gaps or overlaps');
    cursor+=s.durationFrames;
    const asset=p.assets.find(a=>a.id===s.assetId),version=asset?.versions.find(v=>v.id===s.versionId);
    if(!asset||asset.sceneId!==sceneId||asset.kind!=='image'||asset.role==='source-reference'||asset.outdated||asset.archived||/^(HELD|SUPPORT)(?:[ ·:]|$)|\b(identity|material)[ -]only\b/i.test(asset.name)||!version||asset.activeVersionId!==version.id)throw Error('Use a current registered scene photograph, not a held/outdated/source/support asset');
    return {span:s,asset,version};
  });
  if(!ordered.length||cursor!==length)throw Error('Image preview duration must preserve the full scene');
  const current=p.clips.filter(c=>c.sceneId===sceneId&&c.track==='visual');
  if(current.some(c=>{const a=p.assets.find(a=>a.id===c.assetId);return a?.role!=='source-reference'&&!isImagePreview(a);}))throw Error('Preserve the selected video or custom visual edit');
  if(current.length===pictures.length&&pictures.every(({span,version})=>current.some(c=>{const a=p.assets.find(a=>a.id===c.assetId);return isImagePreview(a)&&activeVersion(a!).provenance.sourceVersionIds.includes(version.id)&&c.startFrame===span.startFrame&&c.durationFrames===span.durationFrames;})))return false;
  const oldIds=new Set(current.map(c=>c.id));p.clips=p.clips.filter(c=>!oldIds.has(c.id));
  for(const {span,asset,version} of pictures){
    let preview=p.assets.find(a=>a.sceneId===sceneId&&isImagePreview(a)&&activeVersion(a).provenance.sourceVersionIds.includes(version.id));
    if(!preview){const vid=id();preview={id:id(),name:`Image preview · ${asset.name}`,kind:'image',role:'render',sceneId,outdated:false,activeVersionId:vid,versions:[{...structuredClone(version),id:vid,provenance:{...version.provenance,tool:IMAGE_PREVIEW_TOOL,createdAt:new Date().toISOString(),sourceVersionIds:[version.id]}}]};p.assets.push(preview);}
    const clip=makeClip(sceneId,preview,span.startFrame,span.durationFrames);clip.motion='none';clip.fit='contain';p.clips.push(clip);
  }
  scene.approved=false;const note='[image-preview] Selected photographs shown as held-image previews; no generated motion or video approval. Source audio and scene duration preserved.';
  if(!scene.source.notes.includes(note))scene.source.notes+='\n'+note;
  cleanTransitions(p);return true;
}

export type Exclusion = { startSeconds: number; endSeconds: number; reason: string };
export function excludeSourceRanges(p: Project, ranges: Exclusion[]) {
  if (!p.sourceVideo) return;
  const result: Scene[] = []; let next = nextSceneNumber(p);
  for (const scene of p.scenes) {
    if (!scene.source) { result.push(scene); continue; }
    let parts = [[scene.source.startSeconds, scene.source.endSeconds]];
    for (const x of ranges) parts = parts.flatMap(([a,b]) => x.endSeconds <= a || x.startSeconds >= b ? [[a,b]] : [[a,Math.min(b,x.startSeconds)],[Math.max(a,x.endSeconds),b]].filter(([lo,hi]) => hi-lo >= 1/p.settings.fps));
    for (let i=0;i<parts.length;i++) {
      const [startSeconds,endSeconds]=parts[i], unchanged = startSeconds===scene.source.startSeconds && endSeconds===scene.source.endSeconds;
      const s = i===0 ? scene : { ...structuredClone(scene), id:id(), number:next++, audioAssetId:null, shots:[] };
      s.source={...s.source!,startSeconds,endSeconds};
      if(!unchanged) s.estimatedFrames=Math.max(1,Math.round((endSeconds-startSeconds)*p.settings.fps));
      result.push(s);
    }
  }
  if(!result.length) throw new Error('Exclusions remove the entire video');
  const keep=new Set(result.map(s=>s.id)); p.scenes=result;
  p.clips=p.clips.filter(c=>keep.has(c.sceneId)); p.annotations=p.annotations.filter(a=>keep.has(a.sceneId));
  p.assets.filter(a=>!keep.has(a.sceneId)).forEach(a=>{a.archived=true;});
  p.sourceVideo.exclusions=ranges; cleanTransitions(p);
}

// One shared proxy file, distinct logical assets per scene. No hundreds of physical copies.
export function sourceAsset(p: Project, scene: Scene, kind: 'video'|'audio'): Asset {
  const source=p.sourceVideo!;
  const old=p.assets.find(a=>a.sceneId===scene.id&&a.role==='source-reference'&&a.kind===kind&&activeVersion(a).path===source.proxyPath);
  if(old){old.archived=false;return old;}
  const vid=id(), asset:Asset={id:id(),name:`Reference · Scene ${sceneNumber(p,scene)}${kind==='audio'?' · sound':''}`,role:'source-reference',kind,sceneId:scene.id,outdated:false,activeVersionId:vid,versions:[{id:vid,path:source.proxyPath,durationFrames:Math.floor(source.durationSeconds*p.settings.fps+1e-5),...(kind==='video'?{width:Math.min(640,source.width),height:Math.round(Math.min(640,source.width)*source.height/source.width)}:{}),provenance:{tool:'Source timeline reference',prompt:'Original source, pending its realistic render',createdAt:source.importedAt,sourceVersionIds:[]}}]};
  p.assets.push(asset);return asset;
}
export function populateSourceReferences(p: Project) {
  if(!p.sourceVideo)return;
  for(const s of p.scenes){
    if(!s.source||s.source.status==='excluded'||p.clips.some(c=>c.sceneId===s.id&&c.track==='visual'))continue;
    const video=sourceAsset(p,s,'video'),audio=p.sourceVideo.hasAudio?sourceAsset(p,s,'audio'):undefined;
    const parts=s.source.segments??[s.source];let cursor=0;
    for(const part of parts){const sourceIn=Math.round(part.startSeconds*p.settings.fps),duration=Math.min(Math.round(part.endSeconds*p.settings.fps)-sourceIn,activeVersion(video).durationFrames!-sourceIn);if(duration<1)continue;
      const c=makeClip(s.id,video,cursor,duration);c.sourceIn=sourceIn;p.clips.push(c);
      if(audio){const c=makeClip(s.id,audio,cursor,duration,'music');c.sourceIn=sourceIn;p.clips.push(c);}cursor+=duration;
    }
    if(cursor)s.estimatedFrames=cursor;
  }
}
// Completed media replaces only this scene's reference placements. Original references stay available.
export function placeSourceRender(p:Project,asset:Asset,audio?:Asset,options:{sourceIn?:number;durationFrames?:number;speed?:number}={}){
  const scene=p.scenes.find(s=>s.id===asset.sceneId)!;if(!scene?.source)throw new Error('Render needs a source scene');
  const refs=p.clips.filter(c=>c.sceneId===scene.id&&(p.assets.find(a=>a.id===c.assetId)?.role==='source-reference'||isImagePreview(p.assets.find(a=>a.id===c.assetId))));
  const refIds=new Set(refs.map(c=>c.id)), first=refs.find(c=>c.track==='visual');
  const version=activeVersion(asset),sourceIn=options.sourceIn??0,speed=options.speed??1;
  const duration=Math.min(options.durationFrames??Math.floor((version.durationFrames!-sourceIn)/speed),Math.floor((version.durationFrames!-sourceIn)/speed),audio?Math.floor((activeVersion(audio).durationFrames!-sourceIn)/speed):Infinity);
  if(!Number.isFinite(duration)||duration<1)throw new Error('Render has no usable frames');
  const inherited=refs.flatMap(c=>c.versionId?[c.versionId]:[]);version.provenance.sourceVersionIds=[...new Set([...version.provenance.sourceVersionIds,...inherited])];
  asset.role='render';if(audio)audio.role='render';
  p.clips=p.clips.filter(c=>!refIds.has(c.id));
  const clip=makeClip(scene.id,asset,first?.startFrame??0,duration);if(first)clip.id=first.id;clip.sourceIn=sourceIn;clip.speed=speed;p.clips.push(clip);
  if(audio){const c=makeClip(scene.id,audio,clip.startFrame,duration,'music');c.sourceIn=sourceIn;c.speed=speed;p.clips.push(c);}
  scene.estimatedFrames=clip.startFrame+duration;scene.source.status='review';if(scene.generationPlan)scene.generationPlan.state='rendered';
  p.clips=p.clips.filter(c=>c.sceneId!==scene.id||c.startFrame<scene.estimatedFrames).map(c=>c.sceneId===scene.id?{...c,durationFrames:Math.min(c.durationFrames,scene.estimatedFrames-c.startFrame)}:c);cleanTransitions(p);
}
