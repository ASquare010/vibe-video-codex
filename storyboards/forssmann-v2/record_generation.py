"""Collect one real built-in image result and its exact request without changing the film."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import shutil
import sys
import argparse

args=argparse.ArgumentParser()
args.add_argument('cut_id');args.add_argument('source')
args.add_argument('--correction',action='store_true')
args.add_argument('--request-file',type=Path)
options=args.parse_args()

repo=Path(__file__).resolve().parents[2]
root=repo/'data/projects/761bb19c-3366-42b3-bb34-274cc9f0f625/storyboard-v2'
plan=json.loads((root/'plan.json').read_text(encoding='utf-8'))
cut=next(c for c in plan['cuts'] if c['id']==options.cut_id)
source=Path(options.source);assert source.is_file()
request=json.loads(options.request_file.read_text(encoding='utf-8')) if options.request_file else dict(prompt=cut['imagePrompt'],referenced_image_paths=cut['referencePaths'],transparent_background=False)
folder=root/'images';folder.mkdir(exist_ok=True)
target=folder/(cut['id']+'.png')
if target.exists():
    if hashlib.sha256(target.read_bytes()).digest()!=hashlib.sha256(source.read_bytes()).digest():
        assert options.correction, 'Version a correction explicitly'
        rejected=root/'rejected';rejected.mkdir(exist_ok=True)
        prior=hashlib.sha256(target.read_bytes()).hexdigest()[:12]
        shutil.copy2(target,rejected/(cut['id']+'-'+prior+'.png'))
        shutil.copy2(source,target)
else:
    shutil.copy2(source,target)
file=root/'image-receipts.json';rows=json.loads(file.read_text(encoding='utf-8')) if file.exists() else []
row=dict(cutId=cut['id'],tool='image_gen.imagegen',modelAlias='Not exposed by built-in tool',
         **request,
         originalResult=str(source),selectedFile=str(target),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),
         collectedAt=datetime.now(timezone.utc).isoformat(),generationCost='Not returned; unknown, not zero',status='generated; visual review pending')
existing=[r for r in rows if r['cutId']==cut['id']]
if not existing:rows.append(row)
elif existing[-1]['sha256']!=row['sha256']:
    existing[-1]['status']='Rejected previous image; preserved in rejected/';rows.append(row)
file.write_text(json.dumps(rows,indent=2),encoding='utf-8')
print(json.dumps(dict(cutId=cut['id'],file=str(target),sha256=row['sha256'],collected=len(rows))))
