import fs from 'node:fs/promises';
import path from 'node:path';
import { activeVersion, sceneFrames, totalFrames, dimensions, type Project } from '../shared/project.ts';
import { isText, trackOrder } from '../shared/composition.ts';
import { ProjectStore, HttpError } from './store.ts';
import { ffmpegPath, runMedia } from './media.ts';

// The renderer is a local tool. It consumes exactly the same canonical placements as the player.
export async function renderProject(store: ProjectStore, p: Project): Promise<string> {
  if (!p.clips.some(c => c.track === 'visual')) throw new HttpError(400, 'Add visual media to the timeline before exporting');
  const exportId = crypto.randomUUID();
  const folder = path.join(store.folder(p.id), 'exports', exportId);
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, 'snapshot.json'), JSON.stringify(p, null, 2));
  const [width, height] = dimensions(p.settings.aspectRatio, p.settings.resolution);
  const parts: string[] = [];
  for (let si = 0; si < p.scenes.length; si++) {
    const scene = p.scenes[si];
    const frames = sceneFrames(p, scene), seconds = frames / 30;
    const args = ['-v', 'error', '-y', '-f', 'lavfi', '-i', `color=c=black:s=${width}x${height}:r=30:d=${seconds}`];
    const filters: string[] = ['[0:v]format=yuv420p[v0]'];
    let input = 1, layer = 0;
    const audioLabels: string[] = [];
    const clips = p.clips.filter(c => c.sceneId === scene.id).sort((a, b) => trackOrder.indexOf(a.track) - trackOrder.indexOf(b.track) || a.startFrame - b.startFrame);
    for (const clip of clips) {
      const begin = clip.startFrame / 30, duration = clip.durationFrames / 30;
      const incoming = p.transitions.find(t => t.toClipId === clip.id), outgoing = p.transitions.find(t => t.fromClipId === clip.id);
      const hold = outgoing && outgoing.type !== 'dip-black' ? outgoing.durationFrames / 30 : 0;
      if (isText(clip)) {
        const textFile = `text-${clip.id}.txt`;
        await fs.writeFile(path.join(folder, textFile), clip.text);
        // Use project-relative filter paths by passing the render directory as cwd below.
        const family = ({ Arial: ['arial', 'arialbd'], Georgia: ['georgia', 'georgiab'], Verdana: ['verdana', 'verdanab'], 'Courier New': ['cour', 'courbd'], 'Trebuchet MS': ['trebuc', 'trebucbd'] })[clip.fontFamily];
        const font = process.platform === 'win32' ? `:fontfile='C\\:/Windows/Fonts/${family[clip.fontWeight === '700' ? 1 : 0]}.ttf'` : `:font='${clip.fontFamily}'`;
        const fade = `${clip.opacity}*${clip.fadeInFrames ? `min(1,max(0,(t-${begin})/${clip.fadeInFrames / 30}))` : '1'}*${clip.fadeOutFrames ? `min(1,max(0,(${begin + duration}-t)/${clip.fadeOutFrames / 30}))` : '1'}`;
        // Text is rendered onto a transparent full-frame layer so rotation and opacity
        // obey the same transform as the browser preview.
        const textInput = input++;
        args.push('-f', 'lavfi', '-i', `color=c=black@0:s=${width}x${height}:r=30:d=${seconds},format=rgba`);
        filters.push(`[${textInput}:v]drawtext=textfile='${textFile}'${font}:expansion=none:fontsize=${clip.fontSize * width / 1280}:fontcolor=${clip.color}:alpha='${fade}':borderw=${clip.outlineWidth * width / 1280}:bordercolor=${clip.outlineColor}:text_align=${clip.textAlign === 'left' ? 'L' : clip.textAlign === 'right' ? 'R' : 'C'}:x=(w-tw)/2:y=(h-th)/2${clip.shadow ? ':shadowcolor=black@0.7:shadowx=1:shadowy=2' : ''}${clip.rotation ? `,rotate=${clip.rotation}*PI/180:c=none` : ''}[text${textInput}]`);
        filters.push(`[v${layer}][text${textInput}]overlay=x=W*${clip.x / 100}:y=H*${clip.y / 100}:enable='between(t,${begin},${begin + duration - 1 / 60})':eof_action=pass[v${layer + 1}]`);
        layer++; continue;
      }
      const asset = p.assets.find(a => a.id === clip.assetId)!;
      const version = asset.versions.find(v => v.id === clip.versionId)!;
      const file = await store.safeFile(p.id, version.path);
      if (asset.kind === 'image') args.push('-loop', '1', '-framerate', '30');
      else args.push('-ss', String(clip.sourceIn / 30));
      args.push('-t', String(duration * clip.speed), '-i', file);
      const stream = input++;
      if (asset.kind === 'audio') {
        filters.push(`[${stream}:a]atrim=duration=${duration * clip.speed},asetpts=PTS-STARTPTS${clip.speed !== 1 ? `,atempo=${clip.speed}` : ''},volume=${clip.volume},adelay=${Math.round(begin * 1000)}:all=1[a${stream}]`); audioLabels.push(`[a${stream}]`); continue;
      }
      const fit = clip.fit === 'cover' ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}` : `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black@0`;
      const progress = `min(1,t/${duration})`;
      const zoom = clip.motion === 'zoom-in' ? `${clip.scale}*(1+${clip.motionAmount}*${progress})` : clip.motion === 'zoom-out' ? `${clip.scale}*(1+${clip.motionAmount}*(1-${progress}))` : clip.motion === 'custom' ? `${clip.scale}+(${clip.endScale}-${clip.scale})*${progress}` : String(clip.scale);
      const effects: string[] = [];
      if (clip.brightness !== 0) effects.push(`lutrgb=r='clip(val*${1 + clip.brightness},0,255)':g='clip(val*${1 + clip.brightness},0,255)':b='clip(val*${1 + clip.brightness},0,255)'`);
      if (clip.contrast !== 1 || clip.saturation !== 1) effects.push(`eq=contrast=${clip.contrast}:saturation=${clip.saturation}`);
      if (clip.temperature) effects.push(`colorchannelmixer=rr=${1 + clip.temperature * 0.12}:bb=${1 - clip.temperature * 0.12}`);
      if (clip.blur) effects.push(`gblur=sigma=${clip.blur * width / 1280}`);
      if (clip.vignette) effects.push(`vignette=angle=${clip.vignette}*PI/4`);
      if (clip.rotation) effects.push(`rotate=${clip.rotation}*PI/180:c=none`);
      effects.push(`colorchannelmixer=aa=${clip.opacity}`);
      if (clip.fadeInFrames) effects.push(`fade=t=in:st=0:d=${clip.fadeInFrames / 30}:alpha=1`);
      if (clip.fadeOutFrames) effects.push(`fade=t=out:st=${Math.max(0, duration - clip.fadeOutFrames / 30)}:d=${clip.fadeOutFrames / 30}:alpha=1`);
      if (incoming && ['crossfade', 'dip-black'].includes(incoming.type)) effects.push(`fade=t=in:st=0:d=${incoming.durationFrames / (incoming.type === 'dip-black' ? 60 : 30)}:alpha=1`);
      if (outgoing?.type === 'dip-black') effects.push(`fade=t=out:st=${Math.max(0, duration - outgoing.durationFrames / 60)}:d=${outgoing.durationFrames / 60}:alpha=1`);
      if (incoming?.type === 'wipe-left') effects.push(`geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte(X,W*min(1,T/${incoming.durationFrames / 30})),alpha(X,Y),0)'`);
      filters.push(`[${stream}:v]setpts=(PTS-STARTPTS)/${clip.speed},fps=30,${fit},trim=duration=${duration},setpts=PTS-STARTPTS${hold ? `,tpad=stop_mode=clone:stop_duration=${hold}` : ''},scale=w='max(2,trunc(${width}*(${zoom})/2)*2)':h='max(2,trunc(${height}*(${zoom})/2)*2)':eval=frame,format=rgba,${effects.join(',')},setpts=PTS+${begin}/TB[c${stream}]`);
      const t = `min(1,max(0,(t-${begin})/${duration}))`;
      let dx = clip.motion === 'pan-left' ? `${clip.x / 100}+${clip.motionAmount}*(0.5-${t})` : clip.motion === 'pan-right' ? `${clip.x / 100}+${clip.motionAmount}*(${t}-0.5)` : clip.motion === 'custom' ? `${clip.x / 100}+(${clip.endX - clip.x})/100*${t}` : `${clip.x / 100}`;
      const dy = clip.motion === 'pan-up' ? `${clip.y / 100}+${clip.motionAmount}*(0.5-${t})` : clip.motion === 'pan-down' ? `${clip.y / 100}+${clip.motionAmount}*(${t}-0.5)` : clip.motion === 'custom' ? `${clip.y / 100}+(${clip.endY - clip.y})/100*${t}` : `${clip.y / 100}`;
      if (incoming?.type === 'slide-left') dx += `+max(0,1-(t-${begin})/${incoming.durationFrames / 30})`;
      filters.push(`[v${layer}][c${stream}]overlay=x='(W-w)/2+W*(${dx})':y='(H-h)/2+H*(${dy})':enable='between(t,${begin},${begin + duration + hold - 1 / 60})':eof_action=pass[v${layer + 1}]`);
      layer++;
    }
    const narration = p.assets.find(a => a.id === scene.audioAssetId);
    if (narration) {
      args.push('-i', await store.safeFile(p.id, activeVersion(narration).path));
      filters.push(`[${input}:a]atrim=duration=${seconds},asetpts=PTS-STARTPTS[voice]`); audioLabels.push('[voice]'); input++;
    }
    if (audioLabels.length) filters.push(`${audioLabels.join('')}amix=inputs=${audioLabels.length}:normalize=0,apad,atrim=duration=${seconds}[audio]`);
    else { args.push('-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'); filters.push(`[${input}:a]atrim=duration=${seconds}[audio]`); }
    const part = path.join(folder, `scene-${si}.mp4`);
    args.push('-filter_complex', filters.join(';'), '-map', `[v${layer}]`, '-map', '[audio]', '-frames:v', String(frames), '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-t', String(seconds), part);
    // drawtext reads text files relative to the process working directory.
    const { spawn } = await import('node:child_process');
    await new Promise<void>((resolve, reject) => {
      const child = spawn(ffmpegPath(), args, { cwd: folder, windowsHide: true });
      let error = ''; child.stdout.resume(); child.stderr.on('data', data => { error = (error + data.toString()).slice(-8000); });
      const timer = setTimeout(() => { child.kill(); reject(new Error('Scene render timed out')); }, 10 * 60 * 1000);
      child.on('error', e => { clearTimeout(timer); reject(e); }); child.on('exit', code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(error || 'Render failed')); });
    });
    parts.push(`file 'scene-${si}.mp4'`);
    store.emit('change', { projectId: p.id, type: 'export', status: 'running', message: `Rendered scene ${si + 1} of ${p.scenes.length}` });
  }
  await fs.writeFile(path.join(folder, 'scenes.txt'), parts.join('\n'));
  const output = path.join(folder, 'film.mp4');
  await runMedia(ffmpegPath(), ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(folder, 'scenes.txt'), '-c', 'copy', '-t', String(totalFrames(p) / 30), '-movflags', '+faststart', output]);
  return `exports/${exportId}/film.mp4`;
}
