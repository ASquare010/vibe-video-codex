"""Structural first pass: retain uncertain cuts; keep flash events without inventing extra scenes."""
import argparse,json,subprocess,math
from pathlib import Path

def correlation(a,b):
    ma=sum(a)/len(a);mb=sum(b)/len(b);va=sum((x-ma)**2 for x in a);vb=sum((x-mb)**2 for x in b)
    return sum((x-ma)*(y-mb) for x,y in zip(a,b))/math.sqrt(va*vb) if va*vb>1e-8 else 0.0

def judge(before,center,after,neighbors=()):
    mean=sum(center)/len(center);std=math.sqrt(sum((x-mean)**2 for x in center)/len(center));same=correlation(before,after)
    # Lighting events remain in the footage and receive explicit event records.
    def light(frame):
        avg=sum(frame)/len(frame);deviation=math.sqrt(sum((x-avg)**2 for x in frame)/len(frame))
        return (avg>225 or avg<8) and deviation<18
    transient=same>.965 and any(light(f) for f in [center,*neighbors])
    return dict(classification='transient_light_event' if transient else 'camera_boundary_candidate',keepBoundary=not transient,
                surroundingCorrelation=round(same,5),centerMean=round(mean,3),centerStd=round(std,3),
                requiresSequenceReview=not transient,note='Retain the effect and its causal timing inside the shot.' if transient else 'A score is not proof of a new production scene; review neighboring motion/camera coverage.')

def main():
    ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--source',required=True);ap.add_argument('--candidates',required=True);ap.add_argument('--fps',required=True,type=float);ap.add_argument('--out',required=True);ap.add_argument('--ffmpeg',required=True);a=ap.parse_args()
    bounds=json.loads(Path(a.candidates).read_text(encoding='utf-8-sig'));out=Path(a.out);out.parent.mkdir(parents=True,exist_ok=True)
    cuts=bounds[1:-1];indices=sorted(set(max(0,round(t*a.fps)+d) for t in cuts for d in [-2,-1,0,1,2]));expr='+'.join(f'eq(n,{i})' for i in indices) or '0'
    script=out.with_suffix('.filter.txt');script.write_text("scale=64:36,select='"+expr+"',format=gray",encoding='ascii')
    raw=subprocess.check_output([a.ffmpeg,'-v','error','-i',a.source,'-t',str(bounds[-1]+.1),'-filter_script:v',str(script),'-an','-vsync','0','-pix_fmt','gray','-f','rawvideo','-'])
    size=64*36;count=len(raw)//size
    if count!=len(indices):raise ValueError('Native frame indexing unavailable; keep raw candidates for manual review.')
    frames={n:raw[i*size:(i+1)*size] for i,n in enumerate(indices)};decisions=[];kept=[bounds[0]]
    for t in cuts:
        n=round(t*a.fps);decision=judge(frames[max(0,n-2)],frames[n],frames[n+2],[frames[max(0,n-1)],frames[n+1]]);decision.update(timeSeconds=t,nativeFrame=n);decisions.append(decision)
        if decision['keepBoundary']:kept.append(t)
    kept.append(bounds[-1]);report=dict(boundaries=kept,rawBoundaries=bounds,events=[x for x in decisions if not x['keepBoundary']],decisions=decisions,mandatorySecondPass=True,method='64px native-frame persistence/lighting check; no semantic action or camera approval claimed.')
    out.write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(dict(boundaries=kept,transientEvents=len(report['events']),report=str(out))))
if __name__=='__main__':main()
