import {activeVersion,cleanTransitions,id,makeClip,nextSceneNumber,sceneFrames,sceneNumber,sceneStart,type Project,type Scene,type Clip} from './project';

function mutable(p:Project,ids:Set<string>){
 if(p.jobs.some(j=>j.sceneId&&ids.has(j.sceneId)&&['queued','running','awaiting-approval'].includes(j.status)))throw new Error('Finish the selected scenes’ active jobs before changing their boundaries.');
}
function parts(s:Scene){return s.source?.segments??(s.source?[{startSeconds:s.source.startSeconds,endSeconds:s.source.endSeconds,referenceId:s.source.referenceId,originalSceneNumber:s.number??0}]:[]);}
function detachVoice(p:Project,s:Scene){if(!s.audioAssetId)return;const a=p.assets.find(a=>a.id===s.audioAssetId)!,length=sceneFrames(p,s);p.clips.push(makeClip(s.id,a,0,length,'music'));s.estimatedFrames=length;s.audioAssetId=null;}
function changed(p:Project){p.plan.approved=false;p.review.approvals.storyboard=null;cleanTransitions(p);}

/** Join adjacent production scenes without changing global picture/sound timing or buying media. */
export function joinScenes(p:Project,sceneIds:string[]){
 const wanted=new Set(sceneIds),indices=p.scenes.flatMap((s,i)=>wanted.has(s.id)?[i]:[]);
 if(indices.length<2)throw new Error('Choose two adjacent scenes, or a scene with a following scene.');
 if(indices.length!==wanted.size||indices.at(-1)!-indices[0]+1!==indices.length)throw new Error('Join adjacent scenes only. Split a scene first when only part belongs to its neighbor.');
 mutable(p,wanted);const scenes=indices.map(i=>p.scenes[i]),anchor=scenes[0],removed=new Set(scenes.slice(1).map(s=>s.id));
 const offsets=new Map<string,number>();let length=0;
 for(const s of scenes){offsets.set(s.id,length);const n=sceneFrames(p,s);detachVoice(p,s);length+=n;}
 const oldNumbers=scenes.flatMap(s=>[sceneNumber(p,s),...(s.source?.originalSceneNumbers??[])]),segments=scenes.flatMap(parts);
 const shots=scenes.flatMap(s=>s.shots.length?s.shots.map(q=>({...q,startFrame:q.startFrame+offsets.get(s.id)!})):s.source?[{id:id(),title:`Source ${sceneNumber(p,s)} · ${s.title}`,purpose:s.purpose,narrationAnchor:'',startFrame:offsets.get(s.id)!,durationFrames:s.estimatedFrames,imagePrompt:s.imagePrompt,videoPrompt:s.videoPrompt,camera:s.direction,startState:s.continuity,endState:'',sound:s.soundDesign,media:'video' as const}]:[]);
 for(const c of p.clips)if(wanted.has(c.sceneId)){c.startFrame+=offsets.get(c.sceneId)!;c.sceneId=anchor.id;}
 for(const a of p.assets)if(wanted.has(a.sceneId))a.sceneId=anchor.id;
 for(const j of p.jobs)if(j.sceneId&&removed.has(j.sceneId))j.sceneId=anchor.id;
 for(const a of p.annotations)if(removed.has(a.sceneId))a.sceneId=anchor.id;
 for(const note of p.review.comments)if(note.anchor.sceneId&&removed.has(note.anchor.sceneId))note.anchor.sceneId=anchor.id;
 anchor.estimatedFrames=length;anchor.audioAssetId=null;anchor.shots=shots;anchor.approved=false;
 anchor.narration=scenes.map(s=>s.narration).filter(Boolean).join('\n');
 if(anchor.source&&segments.length){anchor.source={...anchor.source,startSeconds:segments[0].startSeconds,endSeconds:segments.at(-1)!.endSeconds,segments,originalSceneNumbers:[...new Set(oldNumbers)],status:'analyzed',notes:`${anchor.source.notes}\nJoined production coverage ${oldNumbers.join(', ')}. Original source intervals and camera setups retained; review the complete movement as one sequence.`};}
 if(anchor.generationPlan){anchor.generationPlan={...anchor.generationPlan,state:scenes.every(s=>s.generationPlan?.state==='rendered')?'rendered':'planned',nativeSeconds:[],estimatedCredits:scenes.reduce((n,s)=>n+(s.generationPlan?.state==='planned'?s.generationPlan.estimatedCredits:0),0),reason:'Joined production sequence; existing media and costs retained. Replan one coherent request rather than concatenating old prompts.'};}
 p.scenes=p.scenes.filter(s=>!removed.has(s.id));
 // Adjacent phases of the same physical media need one decoder, not a reload at every old row.
 coalesceSceneMedia(p,anchor.id);changed(p);
 return {sceneId:anchor.id,number:anchor.number,joinedNumbers:[...new Set(oldNumbers)],frames:length};
}

export function coalesceSceneMedia(p:Project,sceneId:string){
 const aliases=new Map<string,string>(),assets=new Map(p.assets.map(a=>[a.id,a]));
 const props=(c:Clip)=>{const {id,assetId,versionId,startFrame,durationFrames,sourceIn,...rest}=c;return JSON.stringify(rest);};
 for(const track of new Set(p.clips.filter(c=>c.sceneId===sceneId).map(c=>c.track))){
  const cs=p.clips.filter(c=>c.sceneId===sceneId&&c.track===track).sort((a,b)=>a.startFrame-b.startFrame);let previous:Clip|undefined;
  for(const c of cs){const a=assets.get(c.assetId!),v=a?.versions.find(v=>v.id===c.versionId),pa=previous?assets.get(previous.assetId!):undefined,pv=pa?.versions.find(v=>v.id===previous!.versionId);
   const transition=p.transitions.some(t=>t.fromClipId===c.id||t.toClipId===c.id||t.fromClipId===previous?.id||t.toClipId===previous?.id);
   if(previous&&a&&pa&&v&&pv&&a.kind===pa.kind&&v.path===pv.path&&props(previous)===props(c)&&!transition&&!c.fadeInFrames&&!c.fadeOutFrames&&previous.startFrame+previous.durationFrames===c.startFrame&&Math.abs(previous.sourceIn+previous.durationFrames*previous.speed-c.sourceIn)<.01){previous.durationFrames+=c.durationFrames;aliases.set(c.id,previous.id);}else previous=c;
  }
 }
 p.clips=p.clips.filter(c=>!aliases.has(c.id));p.annotations.forEach(a=>{if(a.clipId&&aliases.has(a.clipId))a.clipId=aliases.get(a.clipId)!;});
}

/** Split at a scene-local edit frame, preserving every media offset and source interval. */
export function splitSceneAt(p:Project,sceneId:string,frame:number,options:{sourceSeconds?:number}={}){
 const index=p.scenes.findIndex(s=>s.id===sceneId),s=p.scenes[index];if(!s)throw new Error('Scene not found.');
 const length=sceneFrames(p,s);if(!Number.isInteger(frame)||frame<1||frame>=length)throw new Error('Choose a split inside the scene.');
 if(options.sourceSeconds!==undefined){const ps=parts(s),t=options.sourceSeconds;if(!ps.length||t<=ps[0].startSeconds||t>=ps.at(-1)!.endSeconds||!ps.some(x=>t>=x.startSeconds&&t<=x.endSeconds))throw new Error('Verified source split must lie inside retained source coverage.');}
 mutable(p,new Set([sceneId]));const globalSplit=sceneStart(p,sceneId)+frame;detachVoice(p,s);
 const right:Scene={...structuredClone(s),id:id(),number:nextSceneNumber(p),estimatedFrames:length-frame,audioAssetId:null,approved:false};s.estimatedFrames=frame;s.approved=false;
 const versions=new Map<string,{assetId:string;map:Map<string,string>}>(),clipMap=new Map<string,string>();
 const forRight=(c:Clip)=>{if(!c.assetId)return c;let found=versions.get(c.assetId);if(!found){const old=p.assets.find(a=>a.id===c.assetId)!;const a=structuredClone(old);a.id=id();a.sceneId=right.id;const map=new Map<string,string>();for(const v of a.versions){const before=v.id;v.id=id();map.set(before,v.id);v.provenance.sourceVersionIds=[...new Set([...v.provenance.sourceVersionIds,before])];}a.activeVersionId=map.get(old.activeVersionId)!;p.assets.push(a);found={assetId:a.id,map};versions.set(old.id,found);}return {...c,assetId:found.assetId,versionId:c.versionId?found.map.get(c.versionId)!:null};};
 const result:Clip[]=[];
 for(const c of p.clips){if(c.sceneId!==sceneId){result.push(c);continue;}const end=c.startFrame+c.durationFrames;
  if(c.startFrame>=frame){const moved=forRight({...c,sceneId:right.id,startFrame:c.startFrame-frame});result.push(moved);clipMap.set(c.id,moved.id);}
  else if(end<=frame)result.push(c);
  else{const a=p.assets.find(a=>a.id===c.assetId);const leftLength=frame-c.startFrame;result.push({...c,durationFrames:leftLength,fadeOutFrames:Math.min(c.fadeOutFrames,leftLength)});const moved=forRight({...c,id:id(),sceneId:right.id,startFrame:0,durationFrames:end-frame,sourceIn:c.sourceIn+(a&&a.kind!=='image'?Math.round(leftLength*c.speed):0),fadeInFrames:0,fadeOutFrames:Math.min(c.fadeOutFrames,end-frame)});result.push(moved);clipMap.set(c.id,moved.id);}
 }
 p.clips=result;
 const original=parts(s);if(s.source&&original.length){const total=original.reduce((n,x)=>n+x.endSeconds-x.startSeconds,0);let at=total*frame/length;if(options.sourceSeconds!==undefined){let prior=0;for(const x of original){if(options.sourceSeconds>=x.startSeconds&&options.sourceSeconds<=x.endSeconds){at=prior+options.sourceSeconds-x.startSeconds;break;}prior+=x.endSeconds-x.startSeconds;}}let cursor=0;const left:typeof original=[],after:typeof original=[];
  for(const x of original){const len=x.endSeconds-x.startSeconds,offset=Math.max(0,Math.min(len,at-cursor));if(offset>1e-8)left.push({...x,endSeconds:x.startSeconds+offset});if(offset<len-1e-8)after.push({...x,startSeconds:x.startSeconds+offset});cursor+=len;}
  s.source={...s.source,endSeconds:left.at(-1)!.endSeconds,segments:left,status:'analyzed'};right.source={...right.source!,referenceId:`${s.source.referenceId}-part-${right.number}`,startSeconds:after[0].startSeconds,endSeconds:after.at(-1)!.endSeconds,segments:after,status:'analyzed',originalSceneNumbers:right.source?.originalSceneNumbers??[s.number!]};
 }
 const originalShots=s.shots;s.shots=originalShots.filter(q=>q.startFrame<frame).map(q=>({...q,durationFrames:Math.min(q.durationFrames,frame-q.startFrame)}));right.shots=originalShots.filter(q=>q.startFrame+q.durationFrames>frame).map(q=>({...q,id:id(),startFrame:Math.max(0,q.startFrame-frame),durationFrames:q.startFrame+q.durationFrames-Math.max(frame,q.startFrame)}));
 p.scenes.splice(index+1,0,right);
 for(const a of p.annotations)if(a.sceneId===sceneId&&a.frame>=globalSplit){a.sceneId=right.id;if(a.clipId&&clipMap.has(a.clipId))a.clipId=clipMap.get(a.clipId)!;}
 changed(p);return {leftSceneId:s.id,rightSceneId:right.id,leftNumber:s.number,rightNumber:right.number,frame:globalSplit};
}
