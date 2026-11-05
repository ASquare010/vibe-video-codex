import {removeAsset,type Project} from '../shared/project.ts';
import {HttpError} from './store.ts';

/** Editable ownership for joins/splits, while all physical media versions remain server-owned. */
export function applyAssetTopology(p:Project,draft:Project){
 const known=new Map(p.assets.map(a=>[a.id,a])),scenes=new Set(draft.scenes.map(s=>s.id));
 for(const proposed of draft.assets){const old=known.get(proposed.id);
  if(old){if(!proposed.archived&&!scenes.has(proposed.sceneId))throw new HttpError(400,'Media owner scene is missing');old.sceneId=proposed.sceneId;old.archived=proposed.archived;continue;}
  const original=p.assets.find(a=>a.kind===proposed.kind&&proposed.versions.every(v=>a.versions.some(k=>k.path===v.path&&k.durationFrames===v.durationFrames&&k.width===v.width&&k.height===v.height)));
  if(!original)throw new HttpError(400,'New media must be imported; scene splits may only clone existing media versions');
  const clone=structuredClone(original);clone.id=proposed.id;clone.sceneId=proposed.sceneId;clone.archived=proposed.archived;
  clone.versions=proposed.versions.map(v=>{const k=original.versions.find(k=>k.path===v.path&&k.durationFrames===v.durationFrames&&k.width===v.width&&k.height===v.height)!;return {...structuredClone(k),id:v.id,provenance:{...structuredClone(k.provenance),sourceVersionIds:[...new Set([...k.provenance.sourceVersionIds,k.id])]}};});
  if(!clone.versions.some(v=>v.id===proposed.activeVersionId))throw new HttpError(400,'Invalid cloned media version');clone.activeVersionId=proposed.activeVersionId;p.assets.push(clone);
 }
 for(const asset of p.assets)if(asset.archived)removeAsset(p,asset.id);
}
