import {activeVersion,cleanTransitions,id,sceneFrames,totalFrames,type Project,type Clip} from './project';
type Range={start:number;end:number};
const visible=new Set(['visual','overlay','text','caption']);
export function unionRanges(ranges:Range[]):Range[]{const result:Range[]=[];for(const r of ranges.sort((a,b)=>a.start-b.start)){const last=result.at(-1);if(last&&r.start<=last.end)last.end=Math.max(last.end,r.end);else if(r.end>r.start)result.push({...r});}return result;}
export function remapAfterRemoval(frame:number,ranges:Range[]){return frame-ranges.reduce((n,r)=>n+Math.max(0,Math.min(frame,r.end)-r.start),0);}
/** Ripple unused picture time across every track; preserve native offsets and stable scene IDs. */
export function closeTimelineGaps(p:Project,playhead=0){
 const originalStarts=new Map<string,number>();let originalCursor=0;for(const s of p.scenes){originalStarts.set(s.id,originalCursor);originalCursor+=sceneFrames(p,s);}
 const before=totalFrames(p),removedScenes:string[]=[],removed:Range[]=[],pieces=new Map<string,{start:number;end:number;id:string}[]>();let global=0;
 const assets=new Map(p.assets.map(a=>[a.id,a])),byScene=new Map<string,Clip[]>();for(const c of p.clips){const list=byScene.get(c.sceneId)||[];list.push(c);byScene.set(c.sceneId,list);}
 const retained:typeof p.scenes=[];const clips:Clip[]=[];
 for(const s of p.scenes){const duration=sceneFrames(p,s),all=byScene.get(s.id)||[],voice=s.audioAssetId?assets.get(s.audioAssetId):undefined,anchored=!!voice&&!!activeVersion(voice).durationFrames,pending=p.jobs.some(j=>j.sceneId===s.id&&['queued','running','awaiting-approval'].includes(j.status));
  if(!all.length&&!anchored&&!pending){removedScenes.push(s.id);removed.push({start:global,end:global+duration});global+=duration;continue;}
  retained.push(s);
  // A measured narration or an in-flight job owns its timing. Do not cut spoken words or pending work.
  let coverage=anchored||pending?[{start:0,end:duration}]:unionRanges((all.some(c=>visible.has(c.track))?all.filter(c=>visible.has(c.track)):all).map(c=>({start:c.startFrame,end:Math.min(duration,c.startFrame+c.durationFrames)})));
  let cursor=0;const gaps:Range[]=[];for(const r of coverage){if(r.start>cursor)gaps.push({start:cursor,end:r.start});cursor=r.end;}if(cursor<duration)gaps.push({start:cursor,end:duration});
  removed.push(...gaps.map(g=>({start:global+g.start,end:global+g.end})));
  for(const c of all){const segments=coverage.map(r=>({start:Math.max(c.startFrame,r.start),end:Math.min(c.startFrame+c.durationFrames,r.end)})).filter(r=>r.end>r.start);const mapped:{start:number;end:number;id:string}[]=[];
   for(const [i,r] of segments.entries()){const part={...c,id:i===0?c.id:id(),startFrame:remapAfterRemoval(r.start,gaps),durationFrames:r.end-r.start};const asset=c.assetId?assets.get(c.assetId):undefined;if(asset&&asset.kind!=='image')part.sourceIn=c.sourceIn+Math.round((r.start-c.startFrame)*c.speed);clips.push(part);mapped.push({...r,id:part.id});}pieces.set(c.id,mapped);
  }
  if(!anchored)s.estimatedFrames=duration-gaps.reduce((n,g)=>n+g.end-g.start,0);global+=duration;
 }
 if(!retained.length){const s=p.scenes[0];s.audioAssetId=null;s.estimatedFrames=1;retained.push(s);removedScenes.splice(removedScenes.indexOf(s.id),1);}
 const deleted=new Set(removedScenes);p.scenes=retained;p.clips=clips;p.assets.forEach(a=>{if(deleted.has(a.sceneId))a.archived=true;});
 p.annotations=p.annotations.filter(a=>!deleted.has(a.sceneId)).map(a=>{const old=a.clipId?pieces.get(a.clipId):undefined,local=a.frame-(originalStarts.get(a.sceneId)||0);return {...a,frame:Math.max(0,remapAfterRemoval(a.frame,removed)),clipId:old?old.find(r=>local>=r.start&&local<r.end)?.id??null:a.clipId};});
 p.review.comments=p.review.comments.filter(c=>!c.anchor.sceneId||!deleted.has(c.anchor.sceneId));cleanTransitions(p);
 const after=totalFrames(p);if(after!==before){p.plan.approved=false;p.review.approvals.storyboard=null;}
 return {removedScenes:removedScenes.length,removedFrames:before-after,frame:Math.max(0,Math.min(after-1,remapAfterRemoval(playhead,removed))),remainingScenes:retained.length};
}
