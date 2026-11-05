"""Durable single-worker H3 production. Existing job IDs always resume; never creative-retry automatically."""
from pathlib import Path
import argparse,datetime,json,math,msvcrt,os,shutil,subprocess,sys,time,traceback
from client import Client
from shot_contract import validate_scene_inputs,audio_prompt

def save(path,value):
 temp=path.with_suffix(path.suffix+'.tmp');temp.write_text(json.dumps(value,indent=2),encoding='utf-8');temp.replace(path)
def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def call(args,**kw):return subprocess.run([str(x) for x in args],check=True,creationflags=subprocess.CREATE_NO_WINDOW,**kw)

class Run:
 def __init__(self,plan,prepare_only=False):
  self.prepare_only=prepare_only;self.planfile=plan;self.plan=json.loads(plan.read_text(encoding='utf-8'));self.base=plan.parent;self.R=Path(self.plan['repository']);self.P=Path(self.plan['projectFolder']);self.ff=self.R/'node_modules/ffmpeg-static/ffmpeg.exe';self.probe=self.R/'node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe';self.client=Client();self.statusfile=self.base/'overnight-state.json';self.state=json.loads(self.statusfile.read_text()) if self.statusfile.exists() else dict(createdAt=now(),scenes={});self.tunnel=None;self.failures=0
 def status(self,**values):
  self.state.update(values,pid=os.getpid(),updatedAt=now());save(self.statusfile,self.state);print(json.dumps(values),flush=True)
 def ready(self):
  try:
   if self.client.request('/v1/health').get('ready'):return True
  except Exception:pass
  return False
 def recover(self):
  # Reuse the endpoint first. Never touch drivers, models, services or unrelated jobs.
  for attempt in range(12):
   if self.ready():return
   self.status(status='waiting-for-server',recoveryAttempt=attempt+1)
   cloud=shutil.which('gcloud')
   if not cloud:raise RuntimeError('gcloud executable unavailable')
   r=call([cloud,'compute','instances','describe','evrn-rnd-server','--project=evrn-dev','--zone=us-central1-c','--format=value(status)'],capture_output=True,text=True)
   if r.stdout.strip()=='TERMINATED':
    start=subprocess.run([cloud,'compute','instances','start','evrn-rnd-server','--project=evrn-dev','--zone=us-central1-c','--quiet'],capture_output=True,text=True,creationflags=subprocess.CREATE_NO_WINDOW)
    if start.returncode:self.status(recoveryError=(start.stderr or start.stdout)[-1800:])
   if not self.tunnel or self.tunnel.poll() is not None:
    log=(self.base/'tunnel.log').open('a',encoding='utf-8');self.tunnel=subprocess.Popen(['powershell.exe','-NoProfile','-ExecutionPolicy','Bypass','-File',str(self.R/'tools/minimax_h3/tunnel.ps1')],stdout=log,stderr=subprocess.STDOUT,creationflags=subprocess.CREATE_NO_WINDOW)
   for _ in range(20):
    time.sleep(3)
    if self.ready():return
   time.sleep(60 if attempt<2 else 300)
  raise RuntimeError('Existing H3 VM/tunnel did not recover. Saved IDs are safe; needs access/capacity review.')
 def media(self,args):return call([self.ff,'-v','error','-y','-threads','1',*args],capture_output=True)
 def spec(self,folder,prompt,images,video=None,duration=5,steps=4,audios=None,reference=False):
  folder.mkdir(parents=True,exist_ok=True);f=folder/'spec.json'
  dimensions=self.plan.get('referenceSettings' if reference else 'nativeSettings',{})
  value=dict(promptFile=str(folder/'prompt.txt'),images=[str(x) for x in images],videos=([dict(path=str(video),use_audio=True,start=0,duration=duration)] if video else []),audios=[str(x) for x in audios or []],settings=dict(width=dimensions.get('width',864),height=dimensions.get('height',480),duration=duration,steps=steps,turbo=steps==4,seed=int.from_bytes(folder.name.encode()[:4],'little')%2147483646,ref_image_size='match',sampler='res_multistep',scheduler='beta',shift_video=12,shift_audio=3),output=str(folder/'output.mp4'))
  if not f.exists():(folder/'prompt.txt').write_text(prompt,encoding='utf-8');save(f,value)
  elif json.loads(f.read_text())!=value or (folder/'prompt.txt').read_text(encoding='utf-8')!=prompt:raise RuntimeError('Request changed for existing take '+str(folder))
  return f
 def render(self,spec):
  folder=spec.parent;output=Path(json.loads(spec.read_text())['output'])
  if output.exists() and output.with_suffix('.job.json').exists():return json.loads(output.with_suffix('.job.json').read_text())
  for interruption in range(4):
   self.recover()
   try:
    call([sys.executable,self.R/'tools/minimax_h3/render_plan.py','--spec',spec],cwd=self.R)
    return json.loads(output.with_suffix('.job.json').read_text())
   except subprocess.CalledProcessError:
    state=folder/'job-state.json'
    if state.exists():
     jobid=json.loads(state.read_text()).get('jobId')
     if jobid:
      try:
       j=self.client.request('/v1/jobs/'+jobid)
       if j['status'] in ['failed','cancelled']:raise RuntimeError('Recorded H3 job '+jobid+' is '+j['status']+': '+str(j.get('error'))+'. No duplicate or new take submitted.')
      except (OSError,TimeoutError):pass
    if interruption==3:raise
    time.sleep(15)
 def pose(self,s,folder,label,t,appearance):
  d=folder/('pose-'+label);d.mkdir(parents=True,exist_ok=True);layout=d/'source-layout.jpg'
  view=s.get('poseViews',{}).get(label,{})
  if not layout.exists():
   from PIL import Image,ImageStat
   import io
   # A fade/flash is not a usable appearance or geometry reference. Select the earliest legible phase.
   candidates=[t]+[min(s['end']-.08,t+v) for v in [.12,.24,.4,.64,1.0,1.4]]
   for candidate in candidates:
    data=self.media(['-ss',candidate,'-i',self.plan['source'],'-frames:v','1','-vf','scale=224:126,pad=224:128:0:1,hue=s=0,gblur=sigma=0.6','-threads','1','-f','image2pipe','-vcodec','mjpeg','-']).stdout
    stats=ImageStat.Stat(Image.open(io.BytesIO(data)).convert('L'))
    if view.get('allowOccluded') or (stats.stddev[0]>8 and 5<stats.mean[0]<245):break
   layout.write_bytes(data);save(d/'layout-selection.json',dict(sourceTime=candidate,requestedTime=t,reason='Earliest legible source phase; fades/flashes rejected.'))
  pose_action=view.get('target',s.get('poseActions',{}).get(label,s['action']));appearance_role=view.get('appearanceRole',s.get('laterAppearanceRole',s['appearanceRole']) if label=='later' else s['appearanceRole']);appearance=view.get('appearance',appearance)
  extra=view.get('appearanceRefs',[]) if view else s.get('appearanceRefs',[]);images=[appearance]+[x['path'] for x in extra]+[layout];layout_tag='<Picture '+str(len(images))+'>'
  roles=' '.join('<Picture '+str(i+2)+'> supplies '+x['role'] for i,x in enumerate(extra))
  prompt='Create a photographed live-action movie frame. <Picture 1> supplies '+appearance_role+' '+roles+' '+layout_tag+' is only a tiny grey position map for the TARGET camera, head sizes, actor placement and depth, never drawing style. Use the real people and physical materials from the photographs. '+pose_action+' Move the camera and body from the identity photograph into this target composition, reaching the specified view by the END and settling there briefly. The identity photo must not lock the old camera or old pose. Real skin, anatomical joints, worn cloth and physical chitin, motivated lighting and restrained colour. No illustration, anime faces, game rendering, lettering, camera cut or music.'
  if view.get('mode')=='text-only':
   images=[];prompt='Photographed live-action cinema, practical physical people and creatures, real lenses and motivated light. '+pose_action+' Begin directly in this specified composition and maintain its camera and visible subjects. Restrained colour, real skin, worn cloth, physically lit chitin and effects. No illustration, anime, game rendering, lettering, extra subjects, camera cut or music.'
  spec=self.spec(d,prompt,images,steps=20,reference=True);job=self.render(spec);photo=d/'photographic-reference.jpg'
  selection=d/'reference-selection.json';selected_time=.125 if not view or view.get('mode')=='text-only' else 4.75
  if not photo.exists():
   self.media(['-ss',selected_time,'-i',d/'output.mp4','-frames:v','1','-q:v','2','-threads','1',photo]);save(selection,dict(selectedTime=selected_time,status='unreviewed',reason='Candidate selection only; compare camera, visible subjects, scale and action phase against the source before final generation.'))
  return dict(label=label,file=str(photo),jobId=job['id'],metadata=str(d/'output.job.json'),prompt=prompt,selection=str(selection))
 def scene(self,s):
  folder=Path(s['folder']);folder.mkdir(parents=True,exist_ok=True);ss=self.state['scenes'].setdefault(str(s['number']),{});receipt=folder/'completed-take.json'
  self.status(status='running',currentScene=s['number'],currentTitle=s['title'])
  if not receipt.exists():
   if self.plan.get('qualityPolicy',{}).get('requireReferencePlan') and s.get('referencePlanStatus')!='reviewed-source':raise RuntimeError('Source camera/action reference plan is not reviewed; no request submitted.')
   if s.get('readyReferences'):
    poses=[dict(x) for x in s['readyReferences']]
    for x in poses:
     if not Path(x['file']).is_file():raise RuntimeError('Missing converted photographic reference: '+x['file'])
    pose=poses[0]
   elif s.get('reuseReferenceFrom'):
    link=s['reuseReferenceFrom'];prior=next(x for x in self.plan['scenes'] if x['number']==link['number']);prepared=json.loads((Path(prior['folder'])/'prepared-references.json').read_text());original=next(x for x in prepared['poses'] if x['label']==link.get('phase','later'));ref=folder/'photographic-reference.jpg'
    if not ref.exists():shutil.copyfile(original['file'],ref)
    pose=dict(original,label='start',file=str(ref),reusedFromScene=link['number'])
   elif s.get('readyPose'):
    ref=folder/'photographic-reference.jpg'
    if not ref.exists():shutil.copyfile(s['readyPose'],ref)
    pose=dict(label='source-matched photographic reference',file=str(ref),existing=not bool(s.get('readyPoseJobId')),jobId=s.get('readyPoseJobId'),metadata=s.get('readyPoseMetadata',str(self.planfile)),prompt=s.get('readyPosePrompt',s.get('readyPoseNote','Existing photographic source-matched reference; no new image generation.')))
   else:pose=self.pose(s,folder,'start',s['start']+.04,s['appearance'])
   if not s.get('readyReferences'):
    poses=[pose]
    if s.get('extraPose'):poses.append(self.pose(s,folder,'later',s.get('laterSourceTime',s['start']+(s['end']-s['start'])*.78),s.get('laterAppearance',pose['file'])))
   save(folder/'prepared-references.json',dict(sceneId=s['sceneId'],number=s['number'],source=[s['start'],s['end']],poses=poses,preparedAt=now()))
   if self.prepare_only:
    ss.update(status='references-prepared',referenceFile=str(folder/'prepared-references.json'));self.failures=0;self.status(status='preparing-references',preparedScene=s['number']);return
   if s.get('poseViews') and not s.get('readyReferences'):
    for candidate in poses:
     selection=Path(candidate.get('selection',''))
     if not selection.is_file() or json.loads(selection.read_text()).get('status')!='reviewed-accepted':raise RuntimeError('Photographic reference still needs visual source-camera review; no final job submitted: '+candidate['file'])
   continuation=s.get('continueFromScene')
   if continuation:
    prior=next(x for x in self.plan['scenes'] if x['number']==continuation);previous=json.loads((Path(prior['folder'])/'completed-take.json').read_text());frame=folder/'previous-end-reference.jpg'
    if not frame.exists():self.media(['-i',previous['file'],'-vf',f"select=eq(n\\,{previous['targetFrames']-1})",'-frames:v','1','-q:v','2','-threads','1',frame])
    poses.insert(0,dict(label='previous shot actual end',file=str(frame),jobId=previous['jobId'],metadata=previous['metadata'],prompt='Actual final frame of preceding scene; preserve people, positions and momentum.',continuedFromScene=continuation))
   video=folder/'motion-guide-224x128.mp4';duration=s['end']-s['start']
   motion_width=s.get('motionWidth',224);motion_content=round(motion_width*9/16/2)*2;motion_height=math.ceil(motion_content/32)*32
   neutral=',hue=s=0,gblur=sigma=0.6' if s.get('neutralMotion') else ''
   if not video.exists():self.media(['-ss',s['start'],'-i',self.plan['source'],'-t',duration,'-vf',f'scale={motion_width}:{motion_content},pad={motion_width}:{motion_height}:0:{(motion_height-motion_content)//2},fps=24{neutral}','-c:v','libx264','-preset','veryfast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-ar','32000','-ac','2',video])
   images=[x['file'] for x in poses]
   tags='<Picture 1> fixes the opening photographic cast, materials, camera and poses. '+('<Picture 2> fixes the later view and resulting positions. ' if len(poses)>1 else '')
   if continuation:tags='<Picture 1> is the actual final frame of the preceding connected shot: continue these people, positions and momentum without reset. '+''.join(f'<Picture {i+2}> supplies the planned '+x['label']+' view. ' for i,x in enumerate(poses[1:]))
   if s.get('materialImage'):
    images.append(s['materialImage']);tags+=f'<Picture {len(images)}> supplies photographed physical surfaces and lighting only; it does not add a new view or new people. '
   policy=self.plan.get('qualityPolicy',{})
   if len(images)<policy.get('minimumImages',1):raise RuntimeError('Prepare multiple relevant photographic image references before this request.')
   contract=validate_scene_inputs(s,images,policy) if policy else None
   image_only=s.get('guidance')=='image-only';audiofile=folder/'source-dialogue-effects.wav'
   if image_only and not audiofile.exists():self.media(['-i',video,'-vn','-ar','32000','-ac','2','-c:a','pcm_s16le',audiofile])
   motion_description='The reviewed source action and camera sequence is: ' if image_only else '<Video 1> is ONLY the small storyboard for precise motion, camera travel, view changes and timing, never its drawn style. '
   if contract:
    tags=' '.join(f"<Picture {i+1}> {x.get('roleDescription',x['label'])}." for i,x in enumerate(poses))
    if s.get('providerPrompt'):
     # Sequence analysis can describe the NEXT camera/actor; keep that evidence
     # outside a request for the CURRENT shot. Audio remains contract-driven.
     prompt=audio_prompt(contract)+' '+s['providerPrompt']
    else:prompt=audio_prompt(contract)+' Visual instructions (never spoken): '+tags+' '+s['action']+' '+s.get('cameraPolicy','Preserve the source camera and people placement.')+' Photographed live-action people and physical creatures,24fps; sharp acceleration, visible contact/recoil and natural fast-motion blur. No drawn style, invented people or slow motion.'
   else:prompt=tags+motion_description+s['action']+' Complete that action in '+str(round(duration,3))+' seconds at source pace. Keep the established frame composition and all human/creature identities, size, spatial positions and movement across every view. Real adult anatomy, planted weight and sharp acceleration, decisive contact and recoil, natural fast-motion blur, photographed skin and worn materials,24fps. <Audio 1> guides the source English speech and event timing; regenerate matching English voices and heavy native effects. No music, extra dialogue, extra cuts, slow motion or idle warm-up.'
   final=folder/'final';spec=self.spec(final,prompt,images,None if image_only else video,s.get('nativeDuration',duration),s.get('finalSteps',20),[audiofile] if image_only else []);job=self.render(spec)
   # Adapters may scope the submitted prompt. Receipts must retain exactly what
   # was actually sent, including when resuming an immutable older request.
   actual_spec=json.loads(Path(spec).read_text(encoding='utf-8'));prompt=Path(actual_spec['promptFile']).read_text(encoding='utf-8') if actual_spec.get('promptFile') else actual_spec['prompt']
   # Retain the complete generated motion/audio, adjusting native grid padding to the exact edit duration.
   native=final/'output.mp4';meta=json.loads((final/'output.job.json').read_text());probe=json.loads(call([self.probe,'-v','error','-show_streams','-show_format','-of','json',native],capture_output=True,text=True).stdout);v=next(x for x in probe['streams'] if x['codec_type']=='video');audio=next((x for x in probe['streams'] if x['codec_type']=='audio'),None)
   dims=self.plan.get('nativeSettings',{})
   if (v['width'],v['height'])!=(dims.get('width',864),dims.get('height',480)) or v['r_frame_rate']!='24/1' or not audio:raise RuntimeError('Output media verification failed: '+str(native))
   frames=int(v.get('nb_frames') or round(float(probe['format']['duration'])*24));speed=frames/s['targetFrames'];out=folder/('timeline-'+self.plan.get('outputLabel','480p24')+'.mp4');factors=[];remaining=speed
   while remaining>2:factors.append('atempo=2');remaining/=2
   while remaining<.5:factors.append('atempo=0.5');remaining/=.5
   factors.append('atempo='+str(remaining));target=s['targetFrames']/24
   crop=self.plan.get('outputCrop');crop_filter=f"crop={crop['width']}:{crop['height']}:{crop.get('x',0)}:{crop.get('y',0)}," if crop else ''
   speech=bool(contract and contract['mode']=='dialogue')
   if not out.exists():self.media(['-i',native,'-vf',crop_filter+('fps=24' if speech else f'setpts=(PTS-STARTPTS)/{speed},fps=24'),'-af',('' if speech else ','.join(factors)+',')+f'apad,atrim=duration={target}','-frames:v',s['targetFrames'],'-t',target,'-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-ac','2','-movflags','+faststart',out])
   review='Unapproved photographic motion draft. Inspect identity, camera, contacts, English speech and neighboring joins before acceptance.'+(' Short source shot uses H3 below its trained5â€“15s range; inspect particularly closely.' if duration<5 else '')
   save(receipt,dict(projectId=self.plan['projectId'],sceneId=s['sceneId'],number=s['number'],start=s['start'],end=s['end'],targetFrames=s['targetFrames'],jobId=job['id'],file=str(out),metadata=str(final/'output.job.json'),name='H3 draft · Scene '+str(s['number']),prompt=prompt,poses=poses,reviewNote=review,place=True,nativeFrames=frames,retimeSpeed=1 if speech else speed,audioEdit='No speech speedup; padding trimmed, full line still requires review.' if speech else 'Picture and effects retimed together; action phase requires review.',audioContract=contract,createdAt=now()))
   # Small source/result contact board, explicitly not a substitute for temporal QA.
   try:
    from PIL import Image,ImageDraw
    import io
    board=Image.new('RGB',(960,400),(15,15,15));draw=ImageDraw.Draw(board)
    for row,file in enumerate([video,out]):
     for col,fraction in enumerate([.02,.5,.94]):
      buf=self.media(['-ss',str(max(.0,(duration if row==0 else target)*fraction)),'-i',file,'-frames:v','1','-vf','scale=320:180','-threads','1','-f','image2pipe','-vcodec','mjpeg','-']).stdout;board.paste(Image.open(io.BytesIO(buf)),(col*320,row*200+20))
     draw.text((4,row*200+3),'Source' if row==0 else 'H3 DRAFT â€” visual review required',fill='white')
    board.save(folder/'source-vs-draft.jpg',quality=88)
   except Exception as e:print('Contact board: '+str(e),flush=True)
  if self.plan.get('reviewBeforePlacement'):
   reviewfile=folder/'take-review.json';reviewed=json.loads(reviewfile.read_text(encoding='utf-8')) if reviewfile.exists() else {}
   take=json.loads(receipt.read_text(encoding='utf-8'))
   if reviewed.get('status')!='approved-for-draft' or reviewed.get('jobId')!=take['jobId']:
    ss.update(status='rendered-awaiting-picture-and-English-review',receipt=str(receipt));self.failures=0;self.status(status='awaiting-take-review',renderedScene=s['number']);return
  call([self.R/'node_modules/.bin/tsx.cmd',self.R/'tools/minimax_h3/apply_render.ts','--receipt',receipt],cwd=self.R)
  ss.update(status='placed-for-review',receipt=str(receipt),completedAt=now());self.failures=0;self.status(completedScenes=sum(x.get('status')=='placed-for-review' for x in self.state['scenes'].values()))
 def execute(self,limit=None,numbers=None,priority=None):
  lock=(self.base/'worker.lock').open('a+b');lock.seek(0);lock.write(b'1');lock.flush();lock.seek(0)
  try:msvcrt.locking(lock.fileno(),msvcrt.LK_NBLCK,1)
  except OSError:raise SystemExit('An existing production worker owns the lock; no second worker launched.')
  try:
   # Prevent unattended local sleep only while this worker owns the run.
   import ctypes
   ctypes.windll.kernel32.SetThreadExecutionState(0x80000001)
   self.status(status='running',totalScenes=len(self.plan['scenes']),plan=str(self.planfile))
   selected=[s for s in self.plan['scenes'] if numbers is None or s['number'] in numbers]
   if priority:selected.sort(key=lambda s:(s['number']!=priority,self.plan['scenes'].index(s)))
   for original in selected[:limit]:
    if (self.base/'STOP').exists():self.status(status='stopped-after-current-scene');return
    # Read future reference refinements without interrupting the current take or reusing a changed request.
    latest=json.loads(self.planfile.read_text(encoding='utf-8'));s=next((s for s in latest['scenes'] if s['sceneId']==original['sceneId']),None)
    if s is None or (s['start'],s['end'])!=(original['start'],original['end']):raise RuntimeError('Scene source bounds changed during production; review the scene map before resuming.')
    if self.state['scenes'].get(str(s['number']),{}).get('status')=='placed-for-review':continue
    try:self.scene(s)
    except Exception as e:
     self.state['scenes'].setdefault(str(s['number']),{}).update(status='needs-attention',error=str(e));self.status(status='scene-error',error=str(e));traceback.print_exc();self.failures+=1
     if self.failures>=2:raise RuntimeError('Two consecutive scene failures; preserving all IDs and pausing for recovery.') from e
   completed=sum(x.get('status')=='placed-for-review' for x in self.state['scenes'].values())
   if self.prepare_only:
    self.status(status='references-prepared-awaiting-inspection',completedScenes=completed,preparedScenes=sum(x.get('status')=='references-prepared' for x in self.state['scenes'].values()));return
   if completed==len(self.plan['scenes']) and self.plan.get('autoFinish',True):
    self.status(status='exporting-draft');call([self.R/'node_modules/.bin/tsx.cmd',self.R/'tools/render_timeline.ts','--project',self.plan['projectId']],cwd=self.R);call([self.R/'node_modules/.bin/tsx.cmd',self.R/'tools/minimax_h3/finish_production.ts',self.plan['projectId']],cwd=self.R)
    queue=self.base/'reviewed-repairs.json';pending=[]
    if queue.exists():pending=[x.get('number') for x in json.loads(queue.read_text(encoding='utf-8')).get('repairs',[]) if x.get('status') not in ['completed-reviewed','reviewed-accepted','resolved']]
    self.status(status='first-pass-draft-awaiting-reviewed-repairs' if pending else 'completed-draft-needs-review',completedScenes=completed,pendingReviewedRepairs=pending)
   else:self.status(status='bounded-check-complete' if limit or numbers else 'partial-needs-attention',completedScenes=completed)
  except Exception as e:self.status(status='needs-attention',error=str(e));raise
  finally:
   ctypes.windll.kernel32.SetThreadExecutionState(0x80000000)
   lock.seek(0);msvcrt.locking(lock.fileno(),msvcrt.LK_UNLCK,1);lock.close()

if __name__=='__main__':
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--plan',type=Path,required=True);ap.add_argument('--limit',type=int);ap.add_argument('--scenes',type=int,nargs='+');ap.add_argument('--priority',type=int);ap.add_argument('--prepare-only',action='store_true');args=ap.parse_args();Run(args.plan.resolve(),prepare_only=args.prepare_only).execute(args.limit,args.scenes,args.priority)
