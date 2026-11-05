"""Small source-vs-native contact sheets; analysis only, no provider calls."""
from pathlib import Path
import argparse,json,subprocess,io
from PIL import Image,ImageDraw
ap=argparse.ArgumentParser();ap.add_argument('--plan',required=True);ap.add_argument('--keys',nargs='+',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
R=Path(__file__).resolve().parents[1];ff=R/'node_modules/ffmpeg-static/ffmpeg.exe';p=json.loads(Path(a.plan).read_text(encoding='utf-8-sig'));sheet=Image.new('RGB',(960,len(a.keys)*300),(20,20,20));draw=ImageDraw.Draw(sheet)
for row,key in enumerate(a.keys):
 j=next(j for j in p['jobs'] if j['key']==key);d=Path(j['folder']);native=d/'output_01.mp4';y=row*300
 for col,t in enumerate([0,.25,.5,.75,1,1.5,2,3]):
  data=subprocess.check_output([str(ff),'-v','error','-ss',str(t),'-i',str(native),'-frames:v','1','-vf','scale=240:-2','-f','image2pipe','-vcodec','mjpeg','-']);im=Image.open(io.BytesIO(data));x=col%4*240;yy=y+col//4*150;sheet.paste(im,(x,yy));draw.text((x+3,yy+135),f'{key} {t}s',fill='white')
sheet.save(a.out);print(a.out)
