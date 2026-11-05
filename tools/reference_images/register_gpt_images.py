"""Save completed GPT image outputs and caller-supplied reviews into a reference pack."""
import datetime,hashlib,json,shutil,sys
from pathlib import Path
from PIL import Image

if len(sys.argv)!=3:raise SystemExit('Usage: register_gpt_images.py RECORDS_JSON REFERENCE_PACK_FOLDER')
F=Path(sys.argv[2]).resolve();f=F/'manifest.json';m=json.loads(f.read_text(encoding='utf-8'))
for name in ['images','prompts','reviews']:(F/name).mkdir(exist_ok=True)
for rec in json.loads(Path(sys.argv[1]).read_text(encoding='utf-8')):
 row=next(r for r in m['images'] if r['id']==rec['id']);src=Path(rec['providerFile']);dest=Path(row['output'])
 if rec.get('revision',1)>1:
  dest=F/'images'/('scene-'+row['id']+'-v'+str(rec['revision'])+'.png')
  if row['output']!=str(dest):
   oldprompt=Path(row['promptFile']).read_text(encoding='utf-8') if row.get('promptFile') else None
   row.setdefault('previousVersions',[]).append(dict(file=row['output'],sha256=row.get('sha256'),prompt=oldprompt,reviewNotes=row.get('reviewNotes')));row['output']=str(dest)
 if dest.exists() and hashlib.sha256(dest.read_bytes()).hexdigest()!=hashlib.sha256(src.read_bytes()).hexdigest():raise RuntimeError('Different existing output; supply a new revision: '+row['id'])
 dest.parent.mkdir(parents=True,exist_ok=True)
 if src.resolve()!=dest.resolve():shutil.copy2(src,dest)
 promptfile=F/'prompts'/('scene-'+row['id']+'.txt');promptfile.write_text(rec['prompt'],encoding='utf-8')
 with Image.open(dest) as im:width,height=im.size
 row.update(status='generated',providerFile=str(src),width=width,height=height,sha256=hashlib.sha256(dest.read_bytes()).hexdigest(),promptFile=str(promptfile),anchorIds=rec.get('anchorIds',[]),reviewStatus=rec.get('reviewStatus','unreviewed'),reviewNotes=rec.get('reviewNotes',''),createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 for field in ['inputOrder','inputFiles','safeAdaptation','revision']:
  if field in rec:row[field]=rec[field]
 if rec.get('rejectedAttempt'):
  old=rec['rejectedAttempt'];rejected=F/'reviews'/('scene-'+row['id']+'-rejected-original.png');shutil.copy2(old['providerFile'],rejected)
  (F/'reviews'/('scene-'+row['id']+'-rejected-original.json')).write_text(json.dumps(old,indent=2),encoding='utf-8');row['rejectedAttempt']=dict(file=str(rejected),reason=rec.get('rejectedReason','Previous candidate failed review; see selected review notes.'))
 (F/'reviews'/('scene-'+row['id']+'.json')).write_text(json.dumps(row,indent=2),encoding='utf-8')
m['updatedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();temp=f.with_suffix('.json.tmp');temp.write_text(json.dumps(m,indent=2),encoding='utf-8');temp.replace(f)
print(json.dumps(dict(generated=sum(r['status']=='generated' for r in m['images']),candidates=len(m['images']),reviewed=sum(r.get('reviewStatus','').startswith('reviewed') for r in m['images']))))
