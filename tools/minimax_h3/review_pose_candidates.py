"""Compare source snapshot with a whole H3 reference take; never auto-approve."""
from pathlib import Path
import argparse,io,json,subprocess
from PIL import Image,ImageDraw

def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--plan',type=Path,required=True);ap.add_argument('--scene',type=int,required=True);ap.add_argument('--phase',choices=['start','later'],default='start');ap.add_argument('--out',type=Path,required=True);a=ap.parse_args()
 p=json.loads(a.plan.read_text(encoding='utf-8'));s=next(x for x in p['scenes'] if x['number']==a.scene);d=Path(s['folder'])/('pose-'+a.phase);ff=Path(p['repository'])/'node_modules/ffmpeg-static/ffmpeg.exe';probe=Path(p['repository'])/'node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe'
 def frame(file,t):
  data=subprocess.check_output([str(ff),'-v','error','-ss',str(t),'-i',str(file),'-frames:v','1','-vf','scale=320:180','-threads','1','-f','image2pipe','-vcodec','mjpeg','-']);return Image.open(io.BytesIO(data)).convert('RGB')
 source_t=json.loads((d/'layout-selection.json').read_text())['sourceTime'];duration=float(json.loads(subprocess.check_output([str(probe),'-v','error','-show_format','-of','json',str(d/'output.mp4')]))['format']['duration']);times=[.125,1.25,2.5,3.75,min(4.95,duration-1/24)]
 board=Image.new('RGB',(960,408),(18,18,18));draw=ImageDraw.Draw(board)
 for i,(file,t,title) in enumerate([(p['source'],source_t,f'SOURCE {source_t:.3f}s')]+[(d/'output.mp4',t,f'H3 candidate {t:.3f}s') for t in times]):
  x=i%3*320;y=i//3*204;draw.text((x+4,y+4),title,fill='white');board.paste(frame(file,t),(x,y+22))
 a.out.parent.mkdir(parents=True,exist_ok=True);board.save(a.out,quality=91);print(a.out)
if __name__=='__main__':main()
