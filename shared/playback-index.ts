import {activeVersion,makeClip,sceneFrames,type Project,type Clip,type Scene,type Transition} from './project';
export type PlaybackEntry={clip:Clip;start:number;end:number};
export function buildPlaybackIndex(p:Project){
 const assets=new Map(p.assets.map(a=>[a.id,a])),starts=new Map<string,number>(),scenes:{scene:Scene;start:number;end:number}[]=[],incoming=new Map<string,Transition>(),outgoing=new Map<string,Transition>();let total=0;
 for(const t of p.transitions){incoming.set(t.toClipId,t);outgoing.set(t.fromClipId,t);}
 for(const s of p.scenes){starts.set(s.id,total);const a=s.audioAssetId?assets.get(s.audioAssetId):undefined;const length=a?activeVersion(a).durationFrames??s.estimatedFrames:s.estimatedFrames;scenes.push({scene:s,start:total,end:total+length});total+=length;}
 const entries=p.clips.map(clip=>({clip,start:(starts.get(clip.sceneId)||0)+clip.startFrame,end:(starts.get(clip.sceneId)||0)+clip.startFrame+clip.durationFrames+(outgoing.get(clip.id)?.type!=='dip-black'?(outgoing.get(clip.id)?.durationFrames||0):0)}));
 for(const s of scenes){const a=s.scene.audioAssetId?assets.get(s.scene.audioAssetId):undefined;if(a){const clip=makeClip(s.scene.id,a,0,s.end-s.start,'music');clip.id=`voice-${s.scene.id}-${a.activeVersionId}`;entries.push({clip,start:s.start,end:s.end});}}
 entries.sort((a,b)=>a.start-b.start);const prefixEnd:number[]=[];for(const e of entries)prefixEnd.push(Math.max(prefixEnd.at(-1)||0,e.end));
 const media=entries.filter(e=>!!e.clip.assetId),visuals=entries.filter(e=>e.clip.track==='visual').sort((a,b)=>a.end-b.end);
 const byScene=new Map<string,PlaybackEntry[]>();for(const e of entries){const a=byScene.get(e.clip.sceneId)||[];a.push(e);byScene.set(e.clip.sceneId,a);}
 return {assets,starts,scenes,total,incoming,outgoing,entries,prefixEnd,media,visuals,byScene};
}
export type PlaybackIndex=ReturnType<typeof buildPlaybackIndex>;
function upperBound<T>(a:T[],frame:number,key:(x:T)=>number){let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>>1;if(key(a[m])<=frame)lo=m+1;else hi=m;}return lo;}
export function playbackWindow(index:PlaybackIndex,frame:number,fps:number){
 const active:PlaybackEntry[]=[];for(let i=upperBound(index.entries,frame,e=>e.start)-1;i>=0&&index.prefixEnd[i]>frame;i--)if(index.entries[i].end>frame)active.push(index.entries[i]);
 const future:PlaybackEntry[]=[];let videos=0,audio=0;
 for(let i=upperBound(index.media,frame,e=>e.start);i<index.media.length;i++){const e=index.media[i];if(e.start>frame+fps*6)break;const kind=index.assets.get(e.clip.assetId!)?.kind;if(kind==='video'&&videos<2){future.push(e);videos++;}else if(kind==='audio'&&audio<2){future.push(e);audio++;}else if(kind==='image'&&videos<2){future.push(e);videos++;}if(videos>=2&&audio>=2)break;}
 const previous=index.visuals[upperBound(index.visuals,frame,e=>e.end)-1];
 const selected=new Map([...active,...future,...(previous?[previous]:[])].map(e=>[e.clip.id,e]));
 return {active,previous,entries:[...selected.values()].sort((a,b)=>a.start-b.start),scene:index.scenes[Math.min(index.scenes.length-1,Math.max(0,upperBound(index.scenes,frame,s=>s.start)-1))]};
}
