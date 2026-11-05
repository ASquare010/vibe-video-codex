"""Save connector statuses and download only matching generated results for local review."""
import json,sys,urllib.request
from pathlib import Path
plan=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'));statuses=json.loads(Path(sys.argv[2]).read_text(encoding='utf-8-sig'))
for j in plan['jobs']+plan.get('extraAttempts',[]):
 d=Path(j['folder']);f=d/'higgsfield-receipt.json'
 if j['provider']!='higgsfield' or not f.exists():continue
 receipt=json.loads(f.read_text());status=next((s for s in statuses if s['job_id']==receipt['job_id']),None)
 if not status:continue
 (d/'higgsfield-status.json').write_text(json.dumps(status,indent=2),encoding='utf-8')
 if status['status']=='completed' and status.get('result_url') and not (d/'output_01.mp4').exists():
  tmp=d/'output_01.mp4.pending';urllib.request.urlretrieve(status['result_url'],tmp);tmp.replace(d/'output_01.mp4')
 print(json.dumps({'key':j['key'],'folder':str(d),'status':status['status'],'downloaded':(d/'output_01.mp4').exists()}))
