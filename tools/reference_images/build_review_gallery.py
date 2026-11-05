"""Build a source/GPT reference review pack; never generates media or starts a GPU server."""
import argparse,datetime,hashlib,html,json,math,shutil
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('folder',type=Path);ap.add_argument('--scenes',type=int,default=30);ap.add_argument('--first-scene',type=int,default=1);ap.add_argument('--minimum-views',type=int,default=2);a=ap.parse_args();F=a.folder.resolve();scene_numbers=range(a.first_scene,a.first_scene+a.scenes)
 f=F/'manifest.json';m=json.loads(f.read_text(encoding='utf-8'));omitted=json.loads((F/'omitted-candidates.json').read_text(encoding='utf-8')) if (F/'omitted-candidates.json').exists() else {}
 extras={r['id']:r for r in json.loads((F/'input-metadata.json').read_text(encoding='utf-8'))} if (F/'input-metadata.json').exists() else {}
 m.setdefault('preferredPrimaryByScene',{})
 for r in m['images']:
  for k,v in extras.get(r['id'],{}).items():
   if k!='id':r.setdefault(k,v)
  if r['id'] in omitted:r.update(status='omitted-candidate',selected=False,omissionReason=omitted[r['id']])
  else:r.setdefault('selected',True)
 rows=[r for r in m['images'] if r['selected']]
 if any(r['scene'] not in scene_numbers for r in rows):raise RuntimeError('Selected scenes fall outside requested gallery range')
 for n in scene_numbers:
  sr=[r for r in rows if r['scene']==n and r['status']=='generated']
  if len(sr)<a.minimum_views:raise RuntimeError(f'Scene{n} has fewer than {a.minimum_views} generated references')
 if any(r['status']!='generated' for r in rows):raise RuntimeError('A selected reference remains pending')
 for name in ['images-720p','thumbnails','comparisons','reviews']:(F/name).mkdir(exist_ok=True)
 for r in rows:
  im=Image.open(r['output']).convert('RGB');ratio=im.width/im.height
  if abs(ratio/(16/9)-1)>.005:raise RuntimeError('Review aspect ratio before normalization: '+r['id'])
  dest=F/'images-720p'/('scene-'+r['id']+'.png');im.resize((1280,720),Image.Resampling.LANCZOS).save(dest)
  thumb=im.copy();thumb.thumbnail((640,360));thumb.save(F/'thumbnails'/('scene-'+r['id']+'.jpg'),quality=91)
  r.update(reference720=str(dest),referenceWidth=1280,referenceHeight=720,reference720Sha256=hashlib.sha256(dest.read_bytes()).hexdigest())
  (F/'reviews'/('scene-'+r['id']+'.json')).write_text(json.dumps(r,indent=2),encoding='utf-8')
 m.update(targetCount=len(rows),selectedCount=len(rows),candidateCount=len(m['images']),sceneCount=a.scenes,firstScene=a.first_scene,lastScene=a.first_scene+a.scenes-1,status='images-complete-awaiting-creator-review',videoGeneration='paused; no server/GPU work authorized by this image-only batch',updatedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
 m.setdefault('appImport','not yet registered');m.setdefault('usd',None);m.setdefault('costNote','No dollar receipt supplied; unpriced.')
 m.setdefault('qualityLimits',['Still-reference drafts are not a motion, audio or final-video approval.','See per-image notes for adaptations, approximations and remaining defects.'])
 f.write_text(json.dumps(m,indent=2),encoding='utf-8')
 # One selected primary per logical scene for quick scanning.
 board=Image.new('RGB',(1600,math.ceil(a.scenes/5)*208),(18,21,26));draw=ImageDraw.Draw(board)
 for n in scene_numbers:
  sr=[r for r in rows if r['scene']==n];key=m['preferredPrimaryByScene'].get(str(n));r=next((r for r in sr if r['id']==key),sr[0]);x=((n-a.first_scene)%5)*320;y=((n-a.first_scene)//5)*208
  draw.text((x+8,y+6),f'Scene {n} | {len(sr)} views',fill='white');thumb=Image.open(r['reference720']).resize((320,180),Image.Resampling.LANCZOS);board.paste(thumb,(x,y+28))
 board.save(F/'overview.jpg',quality=94)
 # Paired exact source/selected photo pages, preserving complete frame geometry.
 for page in range(math.ceil(len(rows)/10)):
  part=rows[page*10:(page+1)*10];b=Image.new('RGB',(960,len(part)*300),(18,21,26));d=ImageDraw.Draw(b)
  for i,r in enumerate(part):
   y=i*300;d.text((8,y+5),f"Scene {r['scene']} {r['phase']} | source {r['sourceTime']:.2f}s | SOURCE / GPT",fill='white')
   for x,p in [(0,r['source']),(480,r['reference720'])]:
    im=Image.open(p).convert('RGB');im=ImageOps.contain(im,(480,270),Image.Resampling.LANCZOS);b.paste(im,(x+(480-im.width)//2,y+28))
  b.save(F/'comparisons'/f'page-{page+1:02d}.jpg',quality=92)
 sections=[]
 for n in scene_numbers:
  sr=[r for r in rows if r['scene']==n];cards=[]
  for r in sr:
   key=r['id'];note=html.escape(r['reviewNotes']);primary=m['preferredPrimaryByScene'].get(str(n),sr[0]['id'])==key
   cards.append(f'<article><h3>{html.escape(key)} · {r["sourceTime"]:.2f}s {"· Main action guide" if primary else ""}</h3><div class="pair"><figure><figcaption>Source</figcaption><img loading="lazy" src="source/scene-{key}.jpg"></figure><figure><figcaption>GPT · 720p</figcaption><a href="images-720p/scene-{key}.png"><img loading="lazy" src="thumbnails/scene-{key}.jpg"></a></figure></div><p>{note}</p><a href="prompts/scene-{key}.txt">Prompt</a> · <a href="reviews/scene-{key}.json">Source and input record</a></article>')
  sections.append(f'<section id="scene-{n}" data-scene="{n}"><h2>Scene {n}</h2>'+''.join(cards)+'</section>')
 options=''.join(f'<option value="{n}">Scene {n}</option>' for n in scene_numbers)
 doc='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>30-scene GPT references</title><style>body{font:16px system-ui;margin:0;background:#11151b;color:#edf1f7}header,main{max-width:1300px;margin:auto;padding:22px}header{position:sticky;top:0;background:#11151bef;backdrop-filter:blur(8px);z-index:2;border-bottom:1px solid #354052}h1{font-size:25px;margin:0 0 8px}h2{padding-top:12px}h3{font-size:16px}p{color:#b9c4d3;line-height:1.5}a{color:#8ec8ff}select{padding:8px;background:#252f3d;color:white;border:1px solid #52617a;border-radius:7px}article{padding:16px;margin:12px 0 24px;border:1px solid #354052;border-radius:12px;background:#19212c}.pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}figcaption{color:#b9c4d3;margin-bottom:6px}img{display:block;width:100%;height:auto;border-radius:7px}section{scroll-margin-top:160px}.notice{border-left:3px solid #e4b16a;padding-left:12px}@media(max-width:700px){.pair{grid-template-columns:1fr}header{position:static}}</style><header><h1>30 scenes · 63 GPT reference images</h1><p>Two or three source-matched photographic views per scene. Images only; video rendering remains paused.</p><label>Show <select id="choose"><option value="all">All scenes</option>'''+options+'''</select></label> · <a href="overview.jpg">Overview</a> · <a href="manifest.json">Reference records</a></header><main><p class="notice">Reference drafts for review. Scenes21 and27 have non-graphic adaptations. Small background details and expressions remain approximate; stills do not establish correct video motion.</p>'''+''.join(sections)+'''</main><script>document.querySelector('#choose').onchange=e=>{document.querySelectorAll('section').forEach(s=>s.hidden=e.target.value!=='all'&&s.dataset.scene!==e.target.value);window.scrollTo(0,0)}</script></html>'''
 doc=doc.replace('30-scene GPT references',f'{a.scenes}-scene reference review').replace('30 scenes · 63 GPT reference images',f'{a.scenes} scenes · {len(rows)} reference images').replace('Two or three source-matched photographic views per scene.','Source-matched photographic views per scene.').replace('Scenes21 and27 have non-graphic adaptations.','See individual review notes for adaptations and source differences.')
 (F/'index.html').write_text(doc,encoding='utf-8')
 prior=F/'remaining-prompts.json'
 if prior.exists():prior.replace(F/'reviews/planned-prompts-before-generation.json')
 report=dict(selectedImages=len(rows),scenes=a.scenes,firstScene=a.first_scene,lastScene=a.first_scene+a.scenes-1,minimumViews=min(sum(r['scene']==n for r in rows) for n in scene_numbers),resolution='1280x720',gallery=str(F/'index.html'),overview=str(F/'overview.jpg'),status=m['status'],appImport=m['appImport'])
 (F/'completion-report.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
if __name__=='__main__':main()
