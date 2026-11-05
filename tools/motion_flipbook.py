"""Native-frame flipbook and onion-skin viewer for one verified source camera take.

Example: python motion_flipbook.py --video source.mp4 --out review --fps 25
No smoothing, optical-flow frames or new camera boundaries are introduced.
"""
import argparse,base64,json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageEnhance

from media_runtime import ffmpeg_path
FF=ffmpeg_path()
HTML='''<!doctype html><html><head><meta charset="utf-8"><title>Motion flipbook</title><style>
*{box-sizing:border-box}body{margin:0;background:#14171c;color:#e4e9f0;font:16px system-ui}main{max-width:1250px;margin:auto;padding:24px}h1{font-size:25px;margin:0 0 6px}p{color:#adb7c6;margin:8px 0 18px}.view{background:#090b0e;border:1px solid #374151;border-radius:12px;padding:10px}canvas{display:block;width:100%;height:auto}button,select,input{accent-color:#6da9ff}button,select{color:#e4e9f0;background:#26303e;border:1px solid #465568;border-radius:7px;padding:9px 14px;font:inherit;cursor:pointer}button:hover{background:#354357}.row{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin:15px 0}label{display:flex;align-items:center;gap:8px}.panel{padding:14px;background:#1c222c;border-radius:10px}.timeline{width:100%}output{font-variant-numeric:tabular-nums;color:#8dbbff}.note{font-size:14px}.mark{border-left:3px solid #709fe6;padding:8px 12px;background:#202936}#markerList button{font-size:14px;padding:6px 10px}.swatch{display:inline-block;width:12px;height:12px;border-radius:50%}.red{background:#f36f6f}.blue{background:#67a9ff}
</style></head><body><main><h1>Motion flipbook</h1><p>__TITLE__ · __KIND__ · __FPS__ fps · __COUNT__ native frames</p><div class="view"><canvas id="screen" width="__WIDTH__" height="__HEIGHT__"></canvas></div>
<div class="row"><button id="prev">← One frame</button><button id="play">Play</button><button id="next">One frame →</button><label>Review speed <select id="speed"><option value="1">Normal</option><option value="0.5">Half speed</option><option value="0.25">Quarter speed</option></select></label><output id="time"></output></div><input class="timeline" id="seek" type="range" min="0" max="__MAX__" value="0" step="1">
<div class="panel"><div class="row"><label><input id="trails" type="checkbox" checked> Overlay neighboring frames</label><label>Past frames <input id="past" type="range" min="0" max="5" value="2"></label><label>Future frames <input id="future" type="range" min="0" max="5" value="2"></label></div><div class="row"><label>Frame spacing <input id="spacing" type="range" min="1" max="8" value="2"><output id="spacingLabel"></output></label><label>Overlay strength <input id="opacity" type="range" min="5" max="70" value="22"></label><label><input id="tint" type="checkbox" checked> Color trails</label></div><p class="note"><span class="swatch red"></span> Earlier positions &nbsp; <span class="swatch blue"></span> Later positions. Whole-image drift includes camera movement. Disable overlays for an ordinary flipbook. Review speed changes this viewer only; it does not change any source or generated video. Keyboard: ←/→ one frame, Space play/pause.</p></div>
<div class="row" id="markerList"></div><div class="mark" id="annotation">Scrub to inspect approach, contact and recoil.</div><p class="note">Frame positions are source evidence, not new shot boundaries. Only an actual camera cut should start another generation. These overlays are for human analysis; only the selected first frame is sent to the comparison models.</p>
</main><script>
const data=__DATA__,meta=__META__;const canvas=document.getElementById('screen'),ctx=canvas.getContext('2d');const els=Object.fromEntries(['seek','time','play','speed','trails','past','future','spacing','opacity','tint','spacingLabel','annotation'].map(x=>[x,document.getElementById(x)]));const imgs=data.map(s=>{const im=new Image;im.src=s;return im});let playing=false,frame=0,last=0;
const scratch=document.createElement('canvas');scratch.width=canvas.width;scratch.height=canvas.height;const sc=scratch.getContext('2d');function layer(i,color,alpha){if(i<0||i>=imgs.length||!imgs[i].complete)return;sc.clearRect(0,0,scratch.width,scratch.height);sc.globalCompositeOperation='source-over';sc.globalAlpha=1;sc.drawImage(imgs[i],0,0,scratch.width,scratch.height);if(els.tint.checked){sc.globalCompositeOperation='source-atop';sc.fillStyle=color;sc.globalAlpha=.45;sc.fillRect(0,0,scratch.width,scratch.height)}ctx.globalAlpha=alpha;ctx.drawImage(scratch,0,0)}
function draw(){frame=Number(els.seek.value);ctx.globalAlpha=1;ctx.clearRect(0,0,canvas.width,canvas.height);if(imgs[frame].complete)ctx.drawImage(imgs[frame],0,0,canvas.width,canvas.height);if(els.trails.checked){const step=Number(els.spacing.value),alpha=Number(els.opacity.value)/100;for(let i=Number(els.past.value);i>0;i--)layer(frame-i*step,'#ff4141',alpha);for(let i=Number(els.future.value);i>0;i--)layer(frame+i*step,'#328bff',alpha)}ctx.globalAlpha=1;els.time.textContent=`Frame ${frame+1}/${imgs.length} · ${(frame/meta.fps).toFixed(3)}s · source ${(meta.sourceStart+frame/meta.fps).toFixed(3)}s`;els.spacingLabel.textContent=els.spacing.value;const m=meta.markers.filter(x=>x.time<=frame/meta.fps).at(-1);els.annotation.textContent=m?m.text:'Scrub to inspect approach, contact and recoil.'}
function move(d){els.seek.value=Math.min(imgs.length-1,Math.max(0,frame+d));draw()}function toggle(){playing=!playing;els.play.textContent=playing?'Pause':'Play';last=0}els.play.onclick=toggle;document.getElementById('prev').onclick=()=>move(-1);document.getElementById('next').onclick=()=>move(1);for(const el of Object.values(els))el.addEventListener('input',draw);window.onkeydown=e=>{if(e.key==='ArrowRight'){e.preventDefault();move(1)}if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.code==='Space'){e.preventDefault();toggle()}};
for(const m of meta.markers){const b=document.createElement('button');b.textContent=m.label;b.onclick=()=>{els.seek.value=Math.round(m.time*meta.fps);draw()};document.getElementById('markerList').appendChild(b)}
function tick(t){if(playing){const interval=1000/(meta.fps*Number(els.speed.value));if(!last)last=t;if(t-last>=interval){move(1);last=t;if(frame===imgs.length-1){playing=false;els.play.textContent='Play'}}}requestAnimationFrame(tick)}Promise.all(imgs.map(i=>i.decode().catch(()=>{}))).then(draw);requestAnimationFrame(tick);
</script></body></html>'''

def main(a):
 out=Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True);frames=out/'native_frames';frames.mkdir(exist_ok=True)
 # Only scratch frames produced by this tool are removed, avoiding stale tails
 # when a shorter camera take is reviewed in the same output folder.
 if frames.resolve().parent!=out:raise ValueError('Frame cache must stay inside the review output folder.')
 for old in frames.glob('[0-9][0-9][0-9][0-9][0-9].jpg'):old.unlink()
 command=[a.ffmpeg,'-hide_banner','-loglevel','error','-y']
 if a.start:command+=['-ss',str(a.start)]
 command+=['-i',str(Path(a.video).resolve())]
 if a.duration:command+=['-t',str(a.duration)]
 command+=['-vf',f'scale={a.width}:-2','-vsync','0','-q:v','3',str(frames/'%05d.jpg')]
 subprocess.run(command,check=True)
 files=sorted(frames.glob('*.jpg'));w,h=Image.open(files[0]).size
 markers=json.loads(Path(a.markers).read_text(encoding='utf-8')) if a.markers else []
 meta={'fps':a.fps,'sourceStart':a.source_start,'markers':markers,'source':str(Path(a.video).resolve()),'frames':len(files),'smoothing':False,'generated_input_policy':'Only first frame; overlays are for analysis.'}
 data=['data:image/jpeg;base64,'+base64.b64encode(f.read_bytes()).decode() for f in files]
 kind='one source camera take' if a.kind=='source' else 'generated trial; markers refer to source cues'
 html=HTML.replace('__TITLE__',a.title).replace('__KIND__',kind).replace('__FPS__',str(a.fps)).replace('__COUNT__',str(len(files))).replace('__MAX__',str(len(files)-1)).replace('__WIDTH__',str(w)).replace('__HEIGHT__',str(h)).replace('__DATA__',json.dumps(data)).replace('__META__',json.dumps(meta))
 (out/'motion_flipbook.html').write_text(html,encoding='utf-8');(out/'motion_metadata.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
 # Static onion skins for agent inspection, using the same source frames.
 previews=[]
 for n,m in enumerate(markers):
  center=max(0,min(len(files)-1,round(m['time']*a.fps)));base=Image.open(files[center]).convert('RGB')
  for delta,color in [(-4,(255,70,70)),(-2,(255,70,70)),(2,(70,140,255)),(4,(70,140,255))]:
   i=center+delta
   if 0<=i<len(files):
    layer=Image.open(files[i]).convert('RGB');tint=Image.new('RGB',layer.size,color);layer=Image.blend(layer,tint,.25);base=Image.blend(base,layer,.20)
  label=Image.new('RGB',(w,h+35),'#15171b');label.paste(base,(0,35));ImageDraw.Draw(label).text((10,9),f"{m['time']:.3f}s | {m['label']}",fill='white');dest=out/f'onion_{n+1:02d}.jpg';label.save(dest,quality=90);previews.append(label)
 if previews:
  board=Image.new('RGB',(w*2,(h+35)*((len(previews)+1)//2)),'#15171b')
  for i,im in enumerate(previews):board.paste(im,((i%2)*w,(i//2)*(h+35)))
  board.save(out/'onion_review.jpg',quality=90)
 print(json.dumps({'viewer':str(out/'motion_flipbook.html'),'native_frames':len(files),'fps':a.fps,'width':w,'height':h}))

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--video',required=True);p.add_argument('--out',required=True);p.add_argument('--fps',type=float,required=True);p.add_argument('--source-start',type=float,default=0);p.add_argument('--start',type=float,default=0);p.add_argument('--duration',type=float);p.add_argument('--width',type=int,default=640);p.add_argument('--markers');p.add_argument('--title',default='Source motion');p.add_argument('--kind',choices=['source','generated'],default='source');p.add_argument('--encoder',default='libx264');p.add_argument('--ffmpeg',default=FF);main(p.parse_args())
