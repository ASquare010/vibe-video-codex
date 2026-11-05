import fs from 'node:fs/promises';import path from 'node:path';
import {ProjectStore} from '../../server/store.ts';import {durableWrite} from '../../server/persistence.ts';
const store=new ProjectStore(path.resolve('data/projects'));
for(const [projectId,relative] of [['819259e6-e020-4813-a1fe-736398ae8bbb','jobs/h3-opening/production'],['0b39a6a2-6e72-44b7-a109-421dde19ce99','jobs/h3-720-opening/production']]){
 const p=await store.read(projectId);await store.mutate(projectId,p=>{p.production={...p.production,status:'paused'};},p.revision);
 const folder=path.join(store.folder(projectId),relative),statefile=path.join(folder,'overnight-state.json');const s=JSON.parse(await fs.readFile(statefile,'utf8'));s.status='paused-by-creator';s.pausedAt=new Date().toISOString();s.pauseReason='Creator requested pause and server VRAM release. No active/queued H3 jobs. minimax-comfy stopped; nvidia-smi reports0MiB used. Do not resume or reload until creator asks.';await durableWrite(statefile,JSON.stringify(s,null,2));await fs.appendFile(path.join(folder,'RUN_STATUS.md'),'\nCREATOR PAUSED: all generation held; heartbeat PAUSED. GPU model service minimax-comfy explicitly stopped after verifying no active/queued requests. Server GPU usage verified0MiB,40442MiB free. Saved requests, outputs, source files and project state retained. Do not restart/reload/resume until creator explicitly asks.\n');
}
console.log(JSON.stringify({status:'paused',projects:2,modelService:'stopped',verifiedGpuUsedMiB:0}));
