import path from 'node:path';
import { id, type Asset, type Project } from '../shared/project.ts';
import { ProjectStore } from './store.ts';
import { measure, runMedia, probePath, ffmpegPath } from './media.ts';

export async function nativeRenderAudio(store:ProjectStore,p:Project,sceneId:string,file:string,sourceVersionId:string):Promise<Asset|undefined>{
  const probe=JSON.parse((await runMedia(probePath(),['-v','error','-show_streams','-of','json',file])).toString());
  if(!probe.streams.some((s:any)=>s.codec_type==='audio'))return;
  const relative=`media/${id()}-native.wav`, destination=path.join(store.folder(p.id),relative);
  await runMedia(ffmpegPath(),['-v','error','-y','-i',file,'-map','0:a:0','-c:a','pcm_s16le',destination]);
  const vid=id();return {id:id(),name:'Rendered dialogue & effects',role:'render',kind:'audio',sceneId,activeVersionId:vid,outdated:false,versions:[{...(await measure(destination,destination,p.settings.fps)),id:vid,path:relative,provenance:{tool:'Extracted native rendered audio',prompt:'',createdAt:new Date().toISOString(),sourceVersionIds:[sourceVersionId]}}]};
}
