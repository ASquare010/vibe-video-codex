"""Make bounded small previews and frames before visual/video-model analysis."""
import argparse,json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
from media_runtime import ffmpeg_path
FF=ffmpeg_path()
def main(a):
 out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
 clip=out/'preview.mp4';frames=out/'frames';frames.mkdir(exist_ok=True)
 if Path(a.source).resolve()==clip:raise ValueError('Choose a preview output folder separate from the source file.')
 if frames.resolve().parent!=out:raise ValueError('Frame cache must stay inside the preview folder.')
 for old in frames.glob('[0-9][0-9][0-9][0-9].jpg'):old.unlink()
 cmd=[a.ffmpeg,'-hide_banner','-loglevel','error','-y','-filter_threads','1','-ss',str(a.start),'-i',str(Path(a.source).resolve()),'-t',str(a.duration),'-vf',f'scale={a.width}:-2,fps={a.fps}','-c:v',a.encoder,'-b:v','1200k']
 cmd+=['-c:a','aac','-b:a','64k','-ar','16000'] if a.audio else ['-an']
 cmd+=[str(clip)]
 subprocess.run(cmd,check=True)
 subprocess.run([a.ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(clip),'-vf',f'fps={a.board_fps}',str(frames/'%04d.jpg')],check=True)
 fs=sorted(frames.glob('*.jpg'));tiles=[]
 for page in range((len(fs)+23)//24):
  board=Image.new('RGB',(1280,200*6),'#17191d');d=ImageDraw.Draw(board)
  for i,f in enumerate(fs[page*24:(page+1)*24]):
   im=Image.open(f);im.thumbnail((320,180));x=i%4*320;y=i//4*200;board.paste(im,(x,y+20));d.text((x+5,y+3),f'{a.start+(page*24+i)/a.board_fps:.3f}s',fill='white')
  name=out/f'overview_{page+1:02d}.jpg';board.save(name,quality=88);tiles.append(str(name))
 meta={'source':str(Path(a.source).resolve()),'start':a.start,'duration':a.duration,'width':a.width,'fps':a.fps,'board_fps':a.board_fps,'preview':str(clip),'boards':tiles,'audio':'low-bandwidth native audio retained' if a.audio else 'omitted from visual inspection proxy only','policy':'Preview/analysis media only. Keep source untouched and generate final deliverables separately.'}
 (out/'preview_metadata.json').write_text(json.dumps(meta,indent=2),encoding='utf-8');print(json.dumps(meta))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--out',required=True);p.add_argument('--start',type=float,default=0);p.add_argument('--duration',type=float,required=True);p.add_argument('--width',type=int,default=640);p.add_argument('--fps',type=float,default=12);p.add_argument('--board-fps',type=float,default=2);p.add_argument('--audio',action='store_true');p.add_argument('--encoder',default='libx264');p.add_argument('--ffmpeg',default=FF);main(p.parse_args())
