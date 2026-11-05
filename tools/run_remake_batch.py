"""Submit/poll only explicitly selected saved Veo requests; never retry uncertain submissions."""
import argparse,json,subprocess,sys,concurrent.futures
from pathlib import Path
P=argparse.ArgumentParser();P.add_argument('--plan',required=True);P.add_argument('action',choices=['submit','poll']);P.add_argument('--keys',nargs='*');a=P.parse_args()
plan=json.loads(Path(a.plan).read_text(encoding='utf-8-sig'));jobs=plan['jobs'];root=Path(__file__).resolve().parents[1]
if a.action=='submit' and plan.get('stopRequested'):raise SystemExit('Creator requested a stop. Poll existing jobs only; do not submit new work.')
def read(f):
 try:return json.loads(Path(f).read_text(encoding='utf-8-sig'))
 except FileNotFoundError:return {}
def work(j):
 d=Path(j['folder']);receipt=d/'submission.json'
 if j['provider']!='veo':return None
 if a.keys and j['key'] not in a.keys:return None
 if a.action=='poll' and not receipt.exists():return None
 if a.action=='submit':
  if receipt.exists():return {'key':j['key'],'state':'existing; not resubmitted'}
  image=Path(j['image'])
  if j.get('dependsOn'):
   prior=next(x for x in jobs if x['key']==j['dependsOn']);status=read(Path(prior['folder'])/'provider_status.json');v=status.get('response',{}).get('videos',[])
   if not status.get('done') or not v:return {'key':j['key'],'state':'waiting for preceding take'}
   src=v[0]['local_file']
   subprocess.run([str(root/'node_modules/ffmpeg-static/ffmpeg.exe'),'-v','error','-y','-sseof','-0.08','-i',src,'-frames:v','1','-vf','scale=1280:720',str(image)],check=True)
  if not image.exists():return {'key':j['key'],'state':'waiting for accepted first frame'}
 args=[sys.executable,str(root/'tools/cloud_media.py'),'--project','evrn-dev','veo',a.action,'--model',j['model'],'--duration',str(j['nativeSeconds']),'--out',str(d)]
 if a.action=='submit':args+=['--image',j['image'],'--prompt',j['prompt']]
 cp=subprocess.run(args,capture_output=True,text=True)
 (d/(a.action+'.stdout.log')).write_text(cp.stdout,encoding='utf-8');(d/(a.action+'.stderr.log')).write_text(cp.stderr,encoding='utf-8')
 status=read(d/'provider_status.json') if a.action=='poll' else read(receipt)
 return {'key':j['key'],'exit':cp.returncode,'state':status.get('state'),'done':status.get('done'),'error':status.get('error') or status.get('http_error'),'videos':len(status.get('response',{}).get('videos',[]))}
selected=[j for j in jobs if j['provider']=='veo' and (not a.keys or j['key'] in a.keys)]
if a.action=='submit':
 active=[j for j in jobs if j['provider']=='veo' and read(Path(j['folder'])/'submission.json').get('state')=='submitted' and not read(Path(j['folder'])/'provider_status.json').get('done')]
 fresh=[j for j in selected if not (Path(j['folder'])/'submission.json').exists()]
 if len(fresh)+len(active)>3:raise SystemExit(f'At most 3 active Veo requests; {len(active)} already active, {len(fresh)} requested')
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 for result in pool.map(work,selected):
  if result:print(json.dumps(result),flush=True)
