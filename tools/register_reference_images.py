"""Preserve accepted GPT image provenance and make 720p video first frames."""
from pathlib import Path
import json,shutil,subprocess,sys,hashlib
plan=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
records=json.loads(Path(sys.argv[2]).read_text(encoding='utf-8-sig'))
ff=Path(__file__).resolve().parents[1]/'node_modules/ffmpeg-static/ffmpeg.exe'
for r in records:
 s=next(s for s in plan['scenes'] if s['number']==r['number']);d=Path(s['folder']);src=Path(r['path']);stem=r.get('stem',s.get('referenceStem','first-frame'));dest=d/(stem+'-original.png')
 if dest.exists() and hashlib.sha256(src.read_bytes()).digest()!=hashlib.sha256(dest.read_bytes()).digest():raise RuntimeError('Refusing to overwrite a different accepted reference')
 if not dest.exists():shutil.copy2(src,dest)
 (d/(stem+'-prompt.txt')).write_text(r['prompt'],encoding='utf-8')
 (d/(stem+'-provenance.json')).write_text(json.dumps({'provider':'OpenAI','tool':'built-in image_gen','sourceOutput':str(src),'prompt':r['prompt'],'usd':None,'costNotes':'No monetary receipt returned by the image tool; excluded from USD estimate.'},indent=2),encoding='utf-8')
 if not (d/(stem+'.jpg')).exists():subprocess.run([str(ff),'-v','error','-y','-i',str(dest),'-vf','scale=1280:720','-frames:v','1',str(d/(stem+'.jpg'))],check=True)
 print('Registered',r['number'])
