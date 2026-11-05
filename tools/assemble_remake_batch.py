"""Assemble completed saved takes for an explicitly requested review timeline. No API calls."""
from pathlib import Path
import argparse,json,hashlib,subprocess,copy
ap=argparse.ArgumentParser();ap.add_argument('--plan',required=True);ap.add_argument('--override-plan',action='append',default=[]);ap.add_argument('--out',required=True);args=ap.parse_args()
root=Path(__file__).resolve().parents[1];ff=root/'node_modules/ffmpeg-static/ffmpeg.exe';probe=root/'node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe'
def read(f):
 try:return json.loads(Path(f).read_text(encoding='utf-8-sig'))
 except FileNotFoundError:return {}
plan=read(args.plan)
for f in args.override_plan:
 other=read(f)
 if other['projectId']!=plan['projectId']:raise ValueError('Project mismatch')
 for s in other['scenes']:
  old=next(x for x in plan['scenes'] if x['number']==s['number']);old.update(s)
  previous=[j for j in plan['jobs'] if j['sceneNumber']==s['number']]
  plan.setdefault('extraAttempts',[]).extend(j for j in previous if j['folder'] not in [x['folder'] for x in plan.get('extraAttempts',[])])
  plan['jobs']=[j for j in plan['jobs'] if j['sceneNumber']!=s['number']]+other['jobs']
ready=[];missing=[]
for s in plan['scenes']:
 jobs=[j for j in plan['jobs'] if j['sceneNumber']==s['number']];files=[]
 for j in jobs:
  d=Path(j['folder']);status=read(d/('provider_status.json' if j['provider']=='veo' else 'higgsfield-status.json'))
  videos=status.get('response',{}).get('videos',[])
  file=Path(videos[0]['local_file']) if videos and videos[0].get('local_file') else d/'output_01.mp4'
  terminal=status.get('done') and videos if j['provider']=='veo' else status.get('status')=='completed'
  if not terminal or not file.exists():break
  files.append(file)
 if len(files)!=len(jobs) or not jobs:missing.append(s['number']);continue
 folder=Path(s['folder']);digest=hashlib.sha256()
 for file in files:digest.update(file.read_bytes())
 token=digest.hexdigest()[:12];out=folder/f'assembled-{token}.mp4';meta=[]
 for file in files:
  p=json.loads(subprocess.check_output([str(probe),'-v','error','-show_streams','-show_format','-of','json',str(file)]));v=next(x for x in p['streams'] if x['codec_type']=='video')
  if not any(x['codec_type']=='audio' for x in p['streams']):raise ValueError(f'Native audio missing: {file}')
  num,den=map(float,v['r_frame_rate'].split('/'));duration=int(v['nb_frames'])/(num/den) if v.get('nb_frames','').isdigit() else float(v.get('duration',p['format']['duration']))
  meta.append({'file':str(file),'duration':duration,'width':v['width'],'height':v['height'],'fps':num/den})
 if not out.exists():
  cmd=[str(ff),'-v','error','-y','-filter_complex_threads','1']
  for file in files:cmd+=['-i',str(file)]
  filters=[]
  for i,m in enumerate(meta):
   frames=round(m['duration']*24);duration=frames/24
   filters += [f'[{i}:v]fps=24,scale=1280:720,setsar=1,format=yuv420p,trim=duration={duration},setpts=PTS-STARTPTS[v{i}]',f'[{i}:a]aresample=48000,apad,atrim=duration={duration},asetpts=PTS-STARTPTS[a{i}]']
  filters += [''.join(f'[v{i}][a{i}]' for i in range(len(files)))+f'concat=n={len(files)}:v=1:a=1[v][a]']
  cmd += ['-filter_complex',';'.join(filters),'-map','[v]','-map','[a]','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',str(out)]
  subprocess.run(cmd,check=True)
 # Preview placement is authorized, while quality findings remain unchanged.
 quality=read(folder/'review.json');review=folder/f'timeline-review-{token}.json'
 review.write_text(json.dumps({'decision':'place-for-review','approved':False,'creatorRequestedAllGenerated':True,'summary':quality.get('summary',s.get('contentAdaptation','Completed generated takes placed for creator review; not a quality approval.')),'qualityReview':quality,'nativeFiles':meta,'handling':'24fps frame sampling, H.264720p and aligned native sound. No optical flow, interpolation, hidden pose cuts or added intro/outro.'},indent=2),encoding='utf-8')
 s['finishedFile']=str(out);s['timelineReviewPath']=str(review);s['timelineLabel']=f'Rendered · Scene {s["number"]}'+(' · REVIEW' if quality.get('decision')=='reject' else '')
 s['providerJobIds']=[read(Path(j['folder'])/('submission.json' if j['provider']=='veo' else 'higgsfield-receipt.json')).get('provider',{}).get('name') if j['provider']=='veo' else read(Path(j['folder'])/'higgsfield-receipt.json').get('job_id') for j in jobs]
 ready.append(s['number'])
plan['timelineReadySceneNumbers']=ready;plan['timelineMissingSceneNumbers']=missing;plan['timelinePlacementPolicy']='Creator explicitly requested completed generated scenes on timeline, including imperfect review takes. Latest take per scene plays; older attempts remain history/alternatives, never duplicated as plot events.'
Path(args.out).write_text(json.dumps(plan,indent=2),encoding='utf-8');print(json.dumps({'ready':ready,'missing':missing,'manifest':args.out}))
