import { FileAudio, Image as ImageIcon, Mic, Plus, Trash2, Upload, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { activeVersion, type Project } from '../../shared/project';
import { mediaUrl } from '../lib/api';
import { cn } from '../lib/utils';

export function MediaLibrary({ project, selected, filter, setFilter, busy, onImport, onInspect, onAdd, onDelete }: {
  project: Project; selected: string | null; filter: string; setFilter: (filter: string) => void; busy: boolean;
  onImport: () => void; onInspect: (assetId: string, sceneId: string) => void; onAdd: (assetId: string) => void; onDelete: (assetId: string) => void;
}) {
  const assets = project.assets.filter(a => !a.archived), visible = assets.filter(a => filter === 'all' || a.kind === filter);
  return <section className="project-media" aria-label="Project media">
    <div className="library-media-heading"><h3>Media <Badge variant="outline">{assets.length}</Badge><small>All scenes</small></h3><Button size="icon-xs" variant="ghost" aria-label="Import media" disabled={busy} onClick={onImport}><Upload/></Button></div>
    <ToggleGroup type="single" value={filter} onValueChange={value => { if (value) setFilter(value); }} size="sm" className="library-filter"><ToggleGroupItem value="all">All</ToggleGroupItem><ToggleGroupItem value="image" aria-label="Images"><ImageIcon/></ToggleGroupItem><ToggleGroupItem value="video" aria-label="Videos"><Video/></ToggleGroupItem><ToggleGroupItem value="audio" aria-label="Audio"><Mic/></ToggleGroupItem></ToggleGroup>
    <div className="asset-library">
      {!visible.length && <div className="library-empty"><p>{filter === 'all' ? 'No media in this project.' : `No ${filter === 'image' ? 'images' : filter === 'video' ? 'videos' : 'audio'} in this project.`}</p></div>}
      {visible.map(asset => {
        const sceneIndex = project.scenes.findIndex(s => s.id === asset.sceneId), scene = project.scenes[sceneIndex], version = activeVersion(asset);
        const sceneLabel = `Scene ${String(sceneIndex + 1).padStart(2, '0')}`;
        return <div className={cn('asset-item', selected === asset.id && 'selected')} key={asset.id} data-testid="asset-item" data-asset-id={asset.id} role="group" aria-label={`${asset.name}, ${sceneLabel}`} draggable onDragStart={e => e.dataTransfer.setData('vibecut/asset', asset.id)}>
          <button className="asset-select" aria-label={`Inspect ${asset.name}`} title={`${asset.name}\n${sceneLabel} · ${scene?.title ?? ''}`} onClick={() => onInspect(asset.id, asset.sceneId)}><span className={cn('asset-thumb', asset.kind)}>{asset.kind === 'image' ? <img src={mediaUrl(project.id, version.path)} alt=""/> : asset.kind === 'audio' ? <FileAudio/> : <Video/>}</span><span className="asset-item-name">{asset.name}<small>{sceneLabel} · {asset.kind}{version.durationFrames ? ` · ${(version.durationFrames / 30).toFixed(1)}s` : ''}{asset.outdated ? ' · Outdated' : ''}</small></span></button>
          <div className="asset-actions"><Button variant="ghost" size="icon-xs" aria-label={`Add ${asset.name} to timeline`} title="Add to timeline" onClick={() => onAdd(asset.id)}><Plus/></Button><Button variant="ghost" size="icon-xs" aria-label={`Delete ${asset.name}`} title="Delete from project · Undo available" onClick={() => onDelete(asset.id)}><Trash2/></Button></div>
        </div>;
      })}
    </div>
  </section>;
}
