"""Compare outgoing/incoming source frames across neighboring production scenes. Local analysis only."""
from pathlib import Path
import argparse,json,subprocess,io,math,html
from PIL import Image,ImageDraw

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--project',required=True);ap.add_argument('--scenes',nargs='+',type=int)
    ap.add_argument('--neighbors',type=int,default=1);ap.add_argument('--samples',type=int,default=4)
    ap.add_argument('--out',required=True);ap.add_argument('--width',type=int,default=240)
    ap.add_argument('--internal',action='store_true',help='Also compare retained source parts inside joined scenes')
    ap.add_argument('--media-root',help='Project folder when reviewing an external manifest snapshot')
    ap.add_argument('--survey',action='store_true',help='Page through first/middle/last source views for the selected scene range')
    a=ap.parse_args();r=Path(__file__).resolve().parents[1];file=Path(a.project)
    if not file.is_file():file=r/'data/projects'/a.project/'project.json'
    p=json.loads(file.read_text(encoding='utf-8-sig'));root=Path(a.media_root) if a.media_root else file.parent;out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
    if not 2<=a.samples<=8 or not 128<=a.width<=640 or not 0<=a.neighbors<=3:ap.error('Use samples2..8, width128..640 and neighbors0..3')
    source=root/p['sourceVideo']['proxyPath' if a.survey else 'path'];fps=p['sourceVideo']['fps'];ff=r/'node_modules/ffmpeg-static/ffmpeg.exe';scenes=[];chosen=set()
    for s in p['scenes']:
        parts=s.get('source',{}).get('segments',[])
        if a.internal and len(parts)>1:
            scenes.extend(dict(s,displayNumber=f"{s.get('number')}.{i+1}",source=dict(s['source'],startSeconds=x['startSeconds'],endSeconds=x['endSeconds']),title=f"{s['title']} | original {x.get('referenceId','source part')}") for i,x in enumerate(parts))
        else:scenes.append(dict(s,displayNumber=str(s.get('number'))))
    for i,s in enumerate(scenes):
        if a.scenes is None or s.get('number') in a.scenes or any(n in s.get('source',{}).get('originalSceneNumbers',[]) for n in a.scenes):
            chosen.update(range(max(0,i-a.neighbors),min(len(scenes),i+a.neighbors+1)))
    pairs=[i for i in range(len(scenes)-1) if i in chosen or i+1 in chosen];report=[];cards=[]
    def extract(t):
        data=subprocess.check_output([str(ff),'-v','error','-threads','1','-ss',f'{max(0,t):.6f}','-i',str(source),'-frames:v','1','-vf',f'scale={a.width}:-2','-threads','1','-f','image2pipe','-vcodec','mjpeg','-'])
        return Image.open(io.BytesIO(data)).convert('RGB')
    if a.survey:
        from concurrent.futures import ThreadPoolExecutor
        rows=[]
        with ThreadPoolExecutor(max_workers=4) as pool:
            for i in sorted(chosen):
                s=scenes[i]
                if not s.get('source'):continue
                start,end=s['source']['startSeconds'],s['source']['endSeconds'];ts=[start,(start+end)/2,max(start,end-1/fps)]
                rows.append((s,ts,list(pool.map(extract,ts))))
        for page in range(math.ceil(len(rows)/10)):
            chunk=rows[page*10:(page+1)*10];h=max(im.height for _,_,ims in chunk for im in ims);board=Image.new('RGB',(a.width*3,(h+43)*len(chunk)),(18,20,24));draw=ImageDraw.Draw(board)
            for i,(s,ts,ims) in enumerate(chunk):
                y=i*(h+43);draw.text((4,y+3),f"Scene{s['displayNumber']} | {s['source']['startSeconds']:.3f}-{s['source']['endSeconds']:.3f}s | {s['title'][:48]}",fill='white')
                for j,(im,t) in enumerate(zip(ims,ts)):board.paste(im,(j*a.width,y+22));draw.text((j*a.width+3,y+h+24),f'source {t:.3f}s',fill='white')
            board.save(out/f'survey-{page+1:02d}.jpg',quality=88)
        (out/'survey.json').write_text(json.dumps([dict(scene=s['number'],sourceSeconds=ts) for s,ts,_ in rows],indent=2),encoding='utf-8');print(json.dumps(dict(scenes=len(rows),pages=math.ceil(len(rows)/10),folder=str(out))));return
    for i in pairs:
        prev,nxt=scenes[i:i+2]
        if not prev.get('source') or not nxt.get('source'):continue
        end=prev['source']['endSeconds'];start=nxt['source']['startSeconds'];before=[max(prev['source']['startSeconds'],end-(a.samples-j)/fps) for j in range(a.samples)];after=[min(nxt['source']['endSeconds']-1/fps,start+j/fps) for j in range(a.samples)]
        frames=[extract(t) for t in before+after];h=max(im.height for im in frames);board=Image.new('RGB',(a.width*a.samples,2*(h+45)),(18,20,24));draw=ImageDraw.Draw(board)
        for row,(s,times,fs,label) in enumerate([(prev,before,frames[:a.samples],'OUTGOING'),(nxt,after,frames[a.samples:],'INCOMING')]):
            y=row*(h+45);draw.text((4,y+3),f"{label} scene{s['displayNumber']} | {s['title'][:70]}",fill='white')
            for j,(im,t) in enumerate(zip(fs,times)):board.paste(im,(j*a.width,y+23));draw.text((j*a.width+3,y+h+25),f'source {t:.3f}s',fill='white')
        name=f"boundary-{prev['displayNumber']}-{nxt['displayNumber']}.jpg";board.save(out/name,quality=88)
        report.append(dict(before=prev.get('number'),after=nxt.get('number'),sourceBoundary=[end,start],beforeFrames=before,afterFrames=after,image=name,decision='unreviewed',questions=['Same camera/setup or a verified cut?','Continuous action phase, velocity, people/props and geography?','Does part of either scene belong to its neighbor?']))
        cards.append(f'<section><h2>{prev.get("number")} → {nxt.get("number")}</h2><img loading="lazy" src="{html.escape(name)}"><p>Inspect motion with native flipbooks before deciding. Join/split edits preserve source coverage; no generation is performed here.</p></section>')
    (out/'boundary-review.json').write_text(json.dumps(dict(project=str(file.resolve()),revision=p.get('revision'),fps=fps,boundaries=report),indent=2),encoding='utf-8')
    (out/'index.html').write_text('<meta charset="utf-8"><title>Scene boundary review</title><style>body{background:#14171c;color:#eee;font:16px system-ui;margin:24px}section{margin:0 0 30px}img{max-width:100%;height:auto}p{color:#aab}</style>'+''.join(cards),encoding='utf-8')
    print(json.dumps(dict(boundaries=len(report),review=str(out/'index.html'))))
if __name__=='__main__':main()
