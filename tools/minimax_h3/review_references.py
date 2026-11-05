"""Read-only source/photographic-reference pages. No generation, approval or timeline writes."""
from pathlib import Path
import argparse,concurrent.futures,io,json,math,subprocess
from PIL import Image,ImageDraw,ImageOps

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--plan',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--width',type=int,default=240);a=ap.parse_args()
 if not 160<=a.width<=640:ap.error('Use width160..640')
 p=json.loads(a.plan.read_text(encoding='utf-8'));R=Path(p['repository']);ff=R/'node_modules/ffmpeg-static/ffmpeg.exe';a.out.mkdir(parents=True,exist_ok=True);rows=[]
 for s in p['scenes']:
  folder=Path(s['folder']);f=folder/'prepared-references.json'
  if not f.exists():continue
  prepared=json.loads(f.read_text(encoding='utf-8'))
  for i,pose in enumerate(prepared['poses']):
   phase='start' if i==0 else 'later';selection=folder/('pose-'+phase)/'layout-selection.json';t=json.loads(selection.read_text())['sourceTime'] if selection.exists() else s['start']+.04 if i==0 else s.get('laterSourceTime',s['start']+(s['end']-s['start'])*.78)
   rows.append(dict(scene=s['number'],phase=phase,sourceTime=t,reference=pose['file'],jobId=pose.get('jobId'),decision='unreviewed',questions=['Photographed real actors/materials rather than drawings?','Same camera, framing and head/body sizes?','Same people, clothes, props, creature anatomy/scale and action phase?','Required visible effects and correct incoming/outgoing state?']))
 def images(row):
  data=subprocess.check_output([str(ff),'-v','error','-threads','1','-ss',str(row['sourceTime']),'-i',p['source'],'-frames:v','1','-vf',f'scale={a.width}:-2','-threads','1','-f','image2pipe','-vcodec','mjpeg','-']);source=Image.open(io.BytesIO(data)).convert('RGB');ref=Image.open(row['reference']).convert('RGB');return source,ImageOps.contain(ref,(a.width,source.height))
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:views=list(pool.map(images,rows))
 height=round(a.width*9/16);perpage=6
 for page in range(math.ceil(len(rows)/perpage)):
  part=rows[page*perpage:(page+1)*perpage];board=Image.new('RGB',(a.width*2,(height+29)*len(part)),(18,18,18));draw=ImageDraw.Draw(board)
  for k,row in enumerate(part):
   y=k*(height+29);source,ref=views[page*perpage+k];draw.text((3,y+3),f"Scene{row['scene']} {row['phase']} | source {row['sourceTime']:.3f}s / PHOTO TO REVIEW",fill='white');board.paste(source,(0,y+24));board.paste(ref,(a.width+(a.width-ref.width)//2,y+24))
  board.save(a.out/f'references-{page+1:02d}.jpg',quality=90)
 report=dict(plan=str(a.plan.resolve()),revision=p.get('revision'),rows=rows,note='Read-only comparison. No row is automatically approved; inspect real-time motion after generation too.')
 (a.out/'reference-review.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(dict(preparedViews=len(rows),pages=math.ceil(len(rows)/perpage),folder=str(a.out))))
if __name__=='__main__':main()
