import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { mediaUrl } from '../lib/api';
import { sceneNumber, sceneFrames, type Project, type Scene } from '../../shared/project';
import { retimeSourceScene } from '../../shared/rerender';
import { isImagePreview } from '../../shared/source-timeline';

export function SourcePanel({ project: p, scene, choose, edit, upload, busy }: { project: Project; scene: Scene; choose: (id: string) => void; edit: (f: (p: Project) => void) => void; upload: () => void; busy: boolean }) {
  const [filter, setFilter] = useState(''); const video = useRef<HTMLVideoElement>(null);
  const source = p.sourceVideo;
  const mediaStatus = (sceneId:string) => {
    const visuals=p.clips.filter(c=>c.sceneId===sceneId&&c.track==='visual').map(c=>p.assets.find(a=>a.id===c.assetId));
    if(visuals.some(isImagePreview))return 'Image preview';
    return visuals.some(a=>a&&a.role!=='source-reference')?'Render ready':'Reference';
  };
  const jump = () => { if (video.current && scene.source) video.current.currentTime = scene.source.startSeconds; };
  useEffect(jump, [scene.id, scene.source?.startSeconds]);
  const patch = (value: Partial<NonNullable<Scene['source']>>) => edit(p => { const s=p.scenes.find(s => s.id === scene.id)!;Object.assign(s.source!,value);if(value.route&&s.generationPlan&&s.generationPlan.mode!=='reuse'){s.generationPlan.provider=value.route==='seedance'?'higgsfield':value.route==='minimax'?'minimax':'veo';s.generationPlan.estimatedCredits=value.route==='seedance'?s.generationPlan.nativeSeconds.reduce((a,b)=>a+b,0)*(p.productionBudget?.higgsfieldPlanningRate??2.5):0;} });
  return <div className="source-panel">
    <div className="workspace-title"><div><span className="panel-eyebrow">REFERENCE → REALISTIC FILM</span><h2>Source scenes</h2><p>Production scenes can consolidate repeated coverage. Original cut numbers remain searchable.</p></div>{!source && <Button disabled={busy} onClick={upload}>{busy ? 'Analyzing source…' : 'Import source video'}</Button>}</div>
    {source ? <>
      <p>{source.name} · {source.durationSeconds.toFixed(2)}s · source {source.fps} fps → output {p.settings.fps} fps / {p.settings.resolution}p</p><p className="timing-note">{source.analysis}</p>
      <video ref={video} className="source-reference" aria-label="Source reference video" controls preload="metadata" src={mediaUrl(p.id, source.proxyPath)} onLoadedMetadata={jump} onTimeUpdate={() => {const v=video.current;if(!v||!scene.source||v.paused)return;const parts=scene.source.segments??[scene.source],current=v.currentTime;const next=parts.find(r=>r.endSeconds>current+.005);if(!next)v.pause();else if(current<next.startSeconds-.005)v.currentTime=next.startSeconds;}}/>
      {scene.source && <div className="source-selection"><h3>Scene {sceneNumber(p, scene)} · {scene.source.referenceId}</h3><p>Source {scene.source.startSeconds.toFixed(3)}–{scene.source.endSeconds.toFixed(3)}s · edit {(sceneFrames(p, scene) / p.settings.fps).toFixed(2)}s</p><div className="toolbar-group"><Button variant="outline" onClick={jump}>Replay reference</Button><Button variant="outline" disabled={!p.clips.some(c => c.sceneId === scene.id) || !!scene.audioAssetId} onClick={() => edit(p => retimeSourceScene(p, scene.id, 1.15))}>Speed up scene 15%</Button></div>
        <div className="field-pair"><label>Motion<select aria-label="Source motion" value={scene.source.motion} onChange={e => patch({ motion: e.target.value as NonNullable<Scene['source']>['motion'] })}>{['unknown', 'low', 'medium', 'high'].map(v => <option key={v}>{v}</option>)}</select></label><label>Video provider<select aria-label="Video provider" value={scene.source.route} onChange={e => patch({ route: e.target.value as NonNullable<Scene['source']>['route'] })}>{['unassigned', 'veo', 'seedance', 'minimax'].map(v => <option key={v}>{v}</option>)}</select></label></div>
        <div className="field-pair"><label>Status<select aria-label="Source scene status" value={scene.source.status} onChange={e => patch({ status: e.target.value as NonNullable<Scene['source']>['status'] })}>{['candidate','analyzed','ready','generated','review','accepted','excluded'].map(v => <option key={v}>{v}</option>)}</select></label><label><input type="checkbox" checked={scene.source.verified} onChange={e => patch({ verified: e.target.checked })}/> {scene.source.adaptation ? 'Grouping reviewed for generation' : 'Camera cut visually verified'}</label></div>
        <label>Motion & continuity notes<Textarea aria-label="Source scene notes" value={scene.source.notes} onChange={e => patch({ notes: e.target.value })}/></label>
      </div>}
      <Input aria-label="Find source scene" placeholder="Find scene number, title or reference ID…" value={filter} onChange={e => setFilter(e.target.value)}/>
      <table className="source-table"><thead><tr><th>Scene</th><th>Source time</th><th>Motion / provider</th><th>Review</th><th>Render</th></tr></thead><tbody>{p.scenes.filter(s => `${sceneNumber(p,s)} ${s.title} ${s.source?.referenceId} ${s.source?.originalSceneNumbers?.join(' ')??''}`.toLowerCase().includes(filter.toLowerCase())).map(s => <tr key={s.id} className={scene.id === s.id ? 'selected' : ''}><td><button onClick={() => choose(s.id)}>Scene {sceneNumber(p,s)} · {s.title}</button><small>{s.source?.referenceId}</small></td><td>{s.source ? `${s.source.startSeconds.toFixed(2)}–${s.source.endSeconds.toFixed(2)}s` : '—'}</td><td>{s.source?.motion} / {s.source?.route}</td><td>{s.source?.adaptation ? 'Adaptation' : s.source?.verified ? 'Verified' : 'Candidate'} · {s.source?.status}</td><td>{mediaStatus(s.id)}</td></tr>)}</tbody></table>
    </> : <p>Choose a source for local cut detection and a small review proxy. This step uses no generation credits. You can also import an existing reviewed scene manifest with tools/import_source.ts.</p>}
  </div>;
}
