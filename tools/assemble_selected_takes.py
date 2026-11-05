"""Select source-grounded phases of saved native takes; no inference or hidden scene merging."""
from pathlib import Path
import argparse,json,hashlib,subprocess
ap=argparse.ArgumentParser();ap.add_argument('--plan',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
R=Path(__file__).resolve().parents[1];ff=R/'node_modules/ffmpeg-static/ffmpeg.exe';probe=R/'node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe'
def read(p):
 try:return json.loads(Path(p).read_text(encoding='utf-8-sig'))
 except FileNotFoundError:return {}
p=read(a.plan);ready=[];missing=[]
for s in p['scenes']:
 selections=s.get('takeSelections',[]);sources=[];ids=[]
 for cut in selections:
  if cut.get('file'):
   f=Path(cut['file']);done=f.exists();ids.append(cut.get('sourceJobId','existing native performance'))
  else:
   j=next(j for j in p['jobs'] if j['key']==cut['jobKey']);d=Path(j['folder']);st=read(d/('provider_status.json' if j['provider']=='veo' else 'higgsfield-status.json'));vs=st.get('response',{}).get('videos',[]);f=Path(vs[0]['local_file']) if vs and vs[0].get('local_file') else d/'output_01.mp4'
   done=bool(st.get('done') and vs) if j['provider']=='veo' else st.get('status')=='completed'
   sub=read(d/('submission.json' if j['provider']=='veo' else 'higgsfield-receipt.json'));ids.append(sub.get('provider',{}).get('name') if j['provider']=='veo' else sub.get('job_id'))
  if not done or not f.exists():break
  streams=json.loads(subprocess.check_output([str(probe),'-v','error','-show_streams','-of','json',str(f)]))['streams'];v=next(x for x in streams if x['codec_type']=='video')
  if not any(x['codec_type']=='audio' for x in streams):raise ValueError(f'Missing native sound: {f}')
  num,den=map(float,v['r_frame_rate'].split('/'));duration=int(v['nb_frames'])/(num/den) if v.get('nb_frames','').isdigit() else float(v['duration'])
  if cut['inSeconds']+cut['durationSeconds']>duration+.05:raise ValueError(f'Selection exceeds native take for {s["number"]}')
  sources.append((f,cut))
 if len(sources)!=len(selections) or not selections:missing.append(s['number']);continue
 spec=dict(selections=selections,overlay=s.get('audioOverlay'),flash=s.get('flash'))
 h=hashlib.sha256(json.dumps(spec,sort_keys=True).encode())
 for f,_ in sources:h.update(f.read_bytes())
 if s.get('audioOverlay'):h.update(Path(s['audioOverlay']['file']).read_bytes())
 token=h.hexdigest()[:12];out=Path(s['folder'])/f'assembled-{token}.mp4';review=out.with_suffix('.review.json');frames=0
 for _,c in sources:frames+=round(c['durationSeconds']/c.get('speed',1)*24)
 if not out.exists():
  cmd=[str(ff),'-v','error','-y','-filter_complex_threads','1'];filters=[]
  for f,c in sources:cmd+=['-i',str(f)]
  for i,(_,c) in enumerate(sources):
   speed=c.get('speed',1);nf=round(c['durationSeconds']/speed*24);dur=nf/24;start=c['inSeconds'];end=start+c['durationSeconds']
   crop=c.get('crop');cropfilter=f"crop=iw*{crop['w']}:ih*{crop['h']}:iw*{crop['x']}:ih*{crop['y']}," if crop else ''
   filters += [f'[{i}:v]{cropfilter}trim=start={start}:end={end},setpts=(PTS-STARTPTS)/{speed},fps=24,scale=1280:720,setsar=1,format=yuv420p,trim=end_frame={nf}[v{i}]',f'[{i}:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,atempo={speed},aresample=48000,apad,atrim=duration={dur}[a{i}]']
  filters+=[''.join(f'[v{i}][a{i}]' for i in range(len(sources)))+f'concat=n={len(sources)}:v=1:a=1[vbase][abase]'];vout='vbase';aout='abase'
  if s.get('audioOverlay'):
   o=s['audioOverlay'];i=len(sources);cmd+=['-i',o['file']];dur=frames/24
   filters += [f'[{i}:a]atrim=start={o["inSeconds"]}:duration={o["durationSeconds"]},asetpts=PTS-STARTPTS,aresample=48000,apad,atrim=duration={dur}[voice]',f'[abase]volume={s.get("nativeAudioGain",.28)}[sfx]',f'[sfx][voice]amix=inputs=2:duration=first:normalize=0[aout]'];aout='aout'
  # Optional brief practical flash; never retime a whole action to conceal a long beam.
  if s.get('flash'):
   x=s['flash'];start=x['startFrame'];end=start+min(4,x.get('frames',2))-1
   filters += [f'[vbase]eq=brightness=0.20:saturation=0.70:enable=\'between(n,{start},{end})\'[vout]'];vout='vout'
  cmd+=['-filter_complex',';'.join(filters),'-map',f'[{vout}]','-map',f'[{aout}]','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)];subprocess.run(cmd,check=True)
 review.write_text(json.dumps(dict(decision='place-for-review',approved=False,summary=read(Path(s['folder'])/'review.json').get('summary','Restored source camera cut, using a selected phase of a new photographic native take; creator review pending.'),qualityReview=read(Path(s['folder'])/'review.json'),selections=selections,audioOverlay=s.get('audioOverlay'),handling='720p24 H264; native effects and English voice, mild action speed only, no interpolation or added story cuts.'),indent=2),encoding='utf-8')
 s.update(finishedFile=str(out),timelineReviewPath=str(review),timelineLabel=f'Rendered · Scene {s["number"]} · review',providerJobIds=ids);ready.append(s['number'])
p.update(timelineReadySceneNumbers=ready,timelineMissingSceneNumbers=missing)
Path(a.out).write_text(json.dumps(p,indent=2),encoding='utf-8');print(json.dumps(dict(ready=ready,missing=missing)))
