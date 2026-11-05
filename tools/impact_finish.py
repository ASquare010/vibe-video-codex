"""Selective motion blur and short impact accents; never interpolate or retime.

Pass --events JSON containing [{time,x,y,angle,length,amount,shake,dust}].
Coordinates x/y are normalized. Inspect real contacts before choosing event times.
Use the scene retiming control separately for intentional speedups.
Untouched input remains the authoritative native generation.
"""
import argparse,json,math,subprocess,random,shutil
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from media_runtime import ffmpeg_path
FF=ffmpeg_path()

def directional(im,angle,length):
    # Sample ONLY the current frame along a shutter direction. This never blends
    # distinct body poses from other video frames into phantom limbs or ants.
    angle=math.radians(angle);weights=[.06,.16,.56,.16,.06];out=None;total=0
    for t,w in zip([-.5,-.25,0,.25,.5],weights):
        dx=t*length*math.cos(angle);dy=t*length*math.sin(angle)
        shifted=im.transform(im.size,Image.Transform.AFFINE,(1,0,dx,0,1,dy),resample=Image.Resampling.BILINEAR)
        out=shifted if out is None else Image.blend(out,shifted,w/(total+w));total+=w
    return out

def render(a):
    src=Path(a.video).resolve();out=Path(a.out).resolve();out.parent.mkdir(parents=True,exist_ok=True)
    if src==out: raise ValueError('Keep the native input: choose a different output path.')
    events=json.loads(Path(a.events).read_text(encoding='utf-8-sig'))
    if not events:shutil.copy2(src,out);print('No events: native output copied unchanged.');return
    w,h=a.width,a.height;fps=a.fps
    decode=subprocess.Popen([a.ffmpeg,'-hide_banner','-loglevel','error','-threads','1','-i',str(src),'-map','0:v:0','-vf',f'scale={w}:{h}',
        '-f','rawvideo','-pix_fmt','rgb24','-vsync','0','pipe:1'],stdout=subprocess.PIPE,stderr=subprocess.PIPE)
    encode=subprocess.Popen([a.ffmpeg,'-hide_banner','-loglevel','error','-y','-filter_threads','1','-threads','2',
        '-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','pipe:0','-i',str(src),
        '-map','0:v:0','-map','1:a:0?','-af','bass=g=4:f=95:w=0.7,alimiter=limit=0.94:level=0',
        '-c:v',a.encoder,'-b:v','7M','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',str(out)],stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    previous=None;index=0;blurred=0;accented=0;size=w*h*3
    particles={}
    for j,e in enumerate(events):
        rng=random.Random(413+j)
        particles[j]=[(rng.uniform(80,420)*math.cos(t:=rng.uniform(0,2*math.pi)),rng.uniform(80,420)*math.sin(t)-70,rng.uniform(1,3.5)) for _ in range(42)]
    try:
        while True:
            raw=decode.stdout.read(size)
            if not raw:break
            if len(raw)!=size:raise RuntimeError('Incomplete decoded video frame.')
            frame=Image.frombytes('RGB',(w,h),raw);gray=np.asarray(frame.resize((320,180)).convert('L'),dtype=np.int16)
            t=index/fps
            active=[(j,e,t-e['time']) for j,e in enumerate(events) if -.15<=t-e['time']<=.24]
            for j,e,age in active:
                if previous is not None and (-.15<=age<-.02 or .045<=age<=.115):
                    mask=np.clip((np.abs(gray-previous)-12)*7,0,255).astype(np.uint8)
                    mask=Image.fromarray(mask).filter(ImageFilter.GaussianBlur(1.1)).resize((w,h))
                    mask=mask.point(lambda x:round(x*e.get('amount',.35)))
                    # Keep shifted-sample borders from adding dark frame edges.
                    draw=ImageDraw.Draw(mask);draw.rectangle((0,0,w,12),fill=0);draw.rectangle((0,h-12,w,h),fill=0);draw.rectangle((0,0,12,h),fill=0);draw.rectangle((w-12,0,w,h),fill=0)
                    frame=Image.composite(directional(frame,e.get('angle',0),e.get('length',10)),frame,mask);blurred+=1
                if 0<=age<=.24 and e.get('dust',True):
                    layer=Image.new('RGBA',(w,h));draw=ImageDraw.Draw(layer);x0=e['x']*w;y0=e['y']*h
                    alpha=round(100*(1-age/.24))
                    for vx,vy,radius in particles[j]:
                        x=x0+vx*age;y=y0+vy*age+400*age*age
                        draw.ellipse((x-radius,y-radius,x+radius,y+radius),fill=(146,135,111,alpha))
                    frame=Image.alpha_composite(frame.convert('RGBA'),layer.filter(ImageFilter.GaussianBlur(.45))).convert('RGB')
                if 0<=age<3/fps:
                    k=round(age*fps);pattern=[(1,-.65),(-.5,.3),(.18,0)][min(k,2)];amp=e.get('shake',2)
                    dx=round(pattern[0]*amp);dy=round(pattern[1]*amp)
                    arr=np.asarray(frame);pad=np.pad(arr,((4,4),(4,4),(0,0)),mode='reflect');frame=Image.fromarray(pad[4+dy:4+dy+h,4+dx:4+dx+w])
                    if k==0:frame=Image.blend(frame,Image.new('RGB',(w,h),'#d8d2c5'),.035)
                    accented+=1
            encode.stdin.write(frame.tobytes());previous=gray;index+=1
    finally:
        decode.stdout.close();encode.stdin.close()
    de=decode.stderr.read().decode(errors='replace');ee=encode.stderr.read().decode(errors='replace')
    dr=decode.wait();er=encode.wait()
    if dr or er:raise RuntimeError(de+'\n'+ee)
    report={'input':str(src),'output':str(out),'fps':fps,'frames':index,'blurred_frame_operations':blurred,'impact_frame_operations':accented,'events':events,
            'retiming':False,'interpolation':False,'new_audio_generation':False,'audio':'Existing native sound: +4dB low bass and limiter; no new speech, music or generated sound asset.',
            'blur_method':'Selective current-frame directional shutter sampling, masked by small-proxy frame differences. No temporal pose blending or optical-flow synthesis.',
            'limitations':'A finishing experiment. It cannot repair misses, anatomy, target scale or the generated force trajectory. Extra dust is stylized post-production, not source evidence.'}
    out.with_suffix('.effects.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps({'output':str(out),'frames':index,'fps':fps,'blurred_frames':blurred}))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--video',required=True);p.add_argument('--out',required=True);p.add_argument('--events',required=True);p.add_argument('--fps',type=float,default=24);p.add_argument('--width',type=int,default=1280);p.add_argument('--height',type=int,default=720);p.add_argument('--encoder',default='libx264');p.add_argument('--ffmpeg',default=FF);render(p.parse_args())
