import {activeVersion,id,makeClip,sceneFrames,type Project,type Scene} from './project';
import {sourceAsset} from './source-timeline';

export type CompactGroup={anchor:number;title:string;segments:{startSeconds:number;endSeconds:number;referenceId:string;originalSceneNumber:number}[];provider:'veo'|'higgsfield';reason:string;reuseJobId?:string;jobDurations:number[];plannedCredits:number};
export type CompactPlan={projectId:string;baseRevision:number;rationale:string;budget:{higgsfieldTotalCap:number;higgsfieldRetryReserve:number;pricingBasis:string};groups:CompactGroup[]};
export function budgetSummary(p:Project){
 const entries=p.costs.filter(c=>c.unit==='Higgsfield credits');
 if(entries.some(c=>c.amount===null))throw new Error('Resolve unknown Higgsfield charges before committing another batch');
 const spent=entries.reduce((n,c)=>n+(c.amount??0),0),planned=p.scenes.reduce((n,s)=>n+(s.generationPlan?.provider==='higgsfield'&&s.generationPlan.state==='planned'?s.generationPlan.estimatedCredits:0),0);
 const cap=p.productionBudget?.higgsfieldCreditCap??0,reserve=p.productionBudget?.higgsfieldRetryReserve??0;
 return {cap,spent,planned,reserve,unallocated:cap-spent-planned-reserve};
}
export function assertBudget(p:Project){const b=budgetSummary(p);if(b.unallocated<0)throw new Error(`Higgsfield plan exceeds the ${b.cap}-credit total cap by ${-b.unallocated} credits`);return b;}

export function applyCompactPlan(p:Project,plan:CompactPlan){
 if(p.id!==plan.projectId||p.revision!==plan.baseRevision)throw new Error('The project changed after this plan was prepared');
 const previous=structuredClone(p),anchors=new Set<number>();let last=0;
 for(const g of plan.groups){
  if(anchors.has(g.anchor)||!g.segments.length)throw new Error('Duplicate anchor or empty scene');anchors.add(g.anchor);
  for(const r of g.segments){if(r.startSeconds<last-1e-5||r.endSeconds<=r.startSeconds||r.endSeconds>(p.sourceVideo?.durationSeconds??0))throw new Error('Invalid or overlapping retained source ranges');last=r.endSeconds;}
 }
 const scenes:Scene[]=[],assets=p.assets.map(a=>({...a,archived:true}));p.assets=assets;p.clips=[];p.transitions=[];
 for(const g of plan.groups){
  const anchor=previous.scenes.find(s=>s.number===g.anchor);if(!anchor)throw new Error(`Missing original Scene ${g.anchor}`);
  const s:Scene={...structuredClone(anchor),title:g.title,narration:'',audioAssetId:null,shots:[],approved:false};
  const first=g.segments[0],end=g.segments.at(-1)!.endSeconds;
  const originalNumbers=previous.scenes.filter(old=>old.source&&g.segments.some(r=>old.source!.startSeconds<r.endSeconds-1e-5&&old.source!.endSeconds>r.startSeconds+1e-5)).map(old=>old.number!);
  s.source={...anchor.source!,referenceId:`EDIT-${g.anchor}`,startSeconds:first.startSeconds,endSeconds:end,segments:g.segments,originalSceneNumbers:originalNumbers,adaptation:!g.reuseJobId,verified:g.reuseJobId?anchor.source!.verified:false,status:g.reuseJobId?'review':'analyzed',route:g.provider==='higgsfield'?'seedance':'veo',motion:g.provider==='higgsfield'?'high':'low',notes:`${g.reason}\nOriginal cut handles: ${originalNumbers.join(', ')}. ${g.reuseJobId?'Reuse the existing selected render; no new request.':'Approved budget adaptation: one coherent remake setup can replace repeated source coverage. Check exact dialogue and natural clause boundaries before generation.'}`};
  s.direction=g.reason;s.purpose=g.title;
  s.generationPlan={mode:g.reuseJobId?'reuse':'generate',state:g.reuseJobId?'rendered':'planned',provider:g.provider,nativeSeconds:g.jobDurations,estimatedCredits:g.plannedCredits,reason:g.reason,reuseJobId:g.reuseJobId};
  scenes.push(s);
  if(g.reuseJobId){
   // The three selected fight takes retain their exact active versions and timing.
   const exact=['existing:02_grip_impact','existing:03_power_fight','existing:04_recovery_guard'].includes(g.reuseJobId);
   if(exact){
    const clips=previous.clips.filter(c=>c.sceneId===anchor.id&&previous.assets.find(a=>a.id===c.assetId)?.role==='render');
    if(!clips.some(c=>c.track==='visual'))throw new Error('Selected fight render is missing');
    for(const c of clips){const a=assets.find(a=>a.id===c.assetId)!;a.archived=false;a.sceneId=s.id;p.clips.push({...c,sceneId:s.id});}
    s.estimatedFrames=sceneFrames(previous,anchor);
   }else{
    const visual=previous.assets.find(a=>a.kind==='video'&&a.role==='render'&&activeVersion(a).provenance.jobId===g.reuseJobId),sound=previous.assets.find(a=>a.kind==='audio'&&a.role==='render'&&activeVersion(a).provenance.jobId===g.reuseJobId);
    if(!visual||!sound)throw new Error('Selected dialogue render or its native sound is missing');
    const frames=Math.min(activeVersion(visual).durationFrames!,activeVersion(sound).durationFrames!);s.estimatedFrames=frames;
    for(const old of [visual,sound]){const a=assets.find(a=>a.id===old.id)!;a.archived=false;a.sceneId=s.id;p.clips.push(makeClip(s.id,a,0,frames,a.kind==='video'?'visual':'music'));}
   }
  }else{
   s.estimatedFrames=0;
   const video=sourceAsset(p,s,'video'),audio=p.sourceVideo!.hasAudio?sourceAsset(p,s,'audio'):undefined;
   for(const r of g.segments){const sourceIn=Math.round(r.startSeconds*p.settings.fps),duration=Math.min(Math.round(r.endSeconds*p.settings.fps)-sourceIn,activeVersion(video).durationFrames!-sourceIn);if(duration<1)continue;
    const c=makeClip(s.id,video,s.estimatedFrames,duration);c.sourceIn=sourceIn;p.clips.push(c);
    if(audio){const c=makeClip(s.id,audio,s.estimatedFrames,duration,'music');c.sourceIn=sourceIn;p.clips.push(c);}s.estimatedFrames+=duration;
   }
   // Consecutive reference pieces in the same source file become a continuous placement.
   for(const track of ['visual','music'] as const){let prev:typeof p.clips[number]|undefined;const remove=new Set<string>();for(const c of p.clips.filter(c=>c.sceneId===s.id&&c.track===track)){if(prev&&prev.assetId===c.assetId&&prev.startFrame+prev.durationFrames===c.startFrame&&Math.abs(prev.sourceIn+prev.durationFrames-c.sourceIn)<=1){prev.durationFrames+=c.durationFrames;remove.add(c.id);}else prev=c;}p.clips=p.clips.filter(c=>!remove.has(c.id));}
  }
 }
 p.scenes=scenes;p.annotations=previous.annotations.filter(a=>scenes.some(s=>s.id===a.sceneId));
 p.productionBudget={higgsfieldCreditCap:plan.budget.higgsfieldTotalCap,higgsfieldRetryReserve:plan.budget.higgsfieldRetryReserve,higgsfieldPlanningRate:2.5,pricingBasis:plan.budget.pricingBasis};
 const b=assertBudget(p);
 p.plan.approved=false;p.review.approvals.storyboard=null;
 p.plan.story='Condensed remake retaining the failed island raid, elite hunters, weak hunter and family motive, injury/healing, double-dungeon vote, temple warning, sealed exit, first death and statue massacre.';
 p.plan.researchNotes=`${plan.rationale}\n${scenes.length} production scenes; ${scenes.reduce((n,s)=>n+(s.generationPlan?.nativeSeconds.length??0),0)} prospective provider requests, not one request per editor row. Higgsfield: ${b.spent} recorded + ${b.planned} planned + ${b.reserve} retry reserve = ${b.spent+b.planned+b.reserve}, under ${b.cap}. Unallocated: ${b.unallocated}. Cost bar remains actual recorded USD spending.\nThe street-chase subplot, repeated eye/hand flashes, excess establishing shots and redundant action coverage are shortened. Exact dialogue at removed-section joins needs review before new generation.`;
 p.plan.targetSeconds=scenes.reduce((n,s)=>n+sceneFrames(p,s),0)/p.settings.fps;p.production={status:'idle',stage:'plan'};
 p.sourceVideo!.analysis=`Budget edit: ${previous.scenes.length} cut candidates consolidated into ${scenes.length} production scenes. Retained source segments and old scene numbers are stored per scene. This is a reviewed adaptation plan, not a claim that merged shots were one original camera take. Seven selected renders are reused. Intros, title-logo card and ending credits are omitted. Dialogue joins require review before generation.`;
 const audit=previous.scenes.map(old=>({oldNumber:old.number,oldId:old.id,startSeconds:old.source?.startSeconds,endSeconds:old.source?.endSeconds,newNumbers:scenes.filter(s=>s.source!.originalSceneNumbers!.includes(old.number!)).map(s=>s.number),disposition:scenes.some(s=>s.source!.originalSceneNumbers!.includes(old.number!))?'retained or consolidated':'removed: redundant insert, repeated coverage, title card, or shortened subplot'}));
 return {budget:b,audit};
}
