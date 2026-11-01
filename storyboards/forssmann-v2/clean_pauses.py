"""Version the authorized pause-only edit and retime the existing 60 image cuts."""
from pathlib import Path
import hashlib,json,math,wave,uuid
import numpy as np

repo=Path(__file__).resolve().parents[2]
root=repo/'data/projects/761bb19c-3366-42b3-bb34-274cc9f0f625'
audio_dir=root/'audio-pause-cleanup';out=root/'storyboard-v3'
out.mkdir(exist_ok=True)
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
write=lambda p,o:p.write_text(json.dumps(o,indent=2),encoding='utf-8')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
p=read(root/'project.json');oldplan=read(root/'storyboard-v2/plan.json');oldlock=read(root/'storyboard-v2/preservation-lock.json')
assert p['revision']==54, 'Prepare against the inspected image board only'
snapshot=out/'project-before-pause-edit.json'
assert not snapshot.exists(), 'Already prepared; inspect existing edit instead of overwriting'
write(snapshot,p)
plan=json.loads(json.dumps(oldplan));plan['version']='pause-cleaned-storyboard-v3';plan['scope']='Existing 60 stills over authorized pause-only Holden derivatives. No speech speed change or video generation.'
reports=[];locks=[];offset=0

def retime_boundaries(cuts,mapper,total):
    # Weighted isotonic projection preserves all cuts when several boundaries land in removed silence.
    # Brief inserts retain their old frame duration; ordinary images get at least one second.
    minimum=[c['durationFrames'] if c['durationFrames']<24 else 24 for c in cuts]
    prefix=[0]
    for n in minimum:prefix.append(prefix[-1]+n)
    slack=total-prefix[-1];assert slack>=0
    desired=[round(mapper(c['startFrame']/24)*24) for c in cuts]+[total]
    blocks=[]
    for i in range(1,len(cuts)):
        # Preserve mapped cut positions as far as readable coverage permits.
        value=max(0,min(slack,desired[i]-prefix[i]))
        blocks.append([i,i,float(value),1])
        while len(blocks)>1 and blocks[-2][2]/blocks[-2][3]>blocks[-1][2]/blocks[-1][3]:
            b=blocks.pop();a=blocks.pop();blocks.append([a[0],b[1],a[2]+b[2],a[3]+b[3]])
    residual=[0]*len(prefix);residual[-1]=slack
    for a,b,value,weight in blocks:
        for i in range(a,b+1):residual[i]=round(value/weight)
    actual=[prefix[i]+residual[i] for i in range(len(prefix))]
    assert all(actual[i+1]-actual[i]>=minimum[i] for i in range(len(cuts)))
    return actual,desired

for scene,oldaudio in zip(p['scenes'],oldlock['audio']):
    sid=scene['id'];source=root/oldaudio['path'];report=read(audio_dir/(source.stem+'-edit-report.json'))
    assert sha(source)==oldaudio['sha256']==report['sourceSha256']
    assert report['tempoFactor']==1 and report['articulationSpeedPreserved']
    with wave.open(str(source),'rb') as w:params=w.getparams();raw=w.readframes(w.getnframes())
    with wave.open(report['output'],'rb') as w:prepared=w.readframes(w.getnframes())
    align=params.sampwidth*params.nchannels;rate=params.framerate
    spans=[(round(m['inputSeconds'][0]*rate),round(m['inputSeconds'][1]*rate)) for m in report['mapping']]
    expected=b''.join(raw[a*align:b*align] for a,b in spans)
    assert prepared==expected, 'Retained speech PCM changed'
    samples=np.frombuffer(raw,dtype='<i2').reshape(-1,params.nchannels)
    peaks=[]
    for a,b in report['removedInputRanges']:
        chunk=samples[round(a*rate):round(b*rate)].astype(np.int32)
        peak=int(np.max(np.abs(chunk))) if len(chunk) else 0
        db=20*math.log10(max(peak,1)/32768)
        assert db<=-47.8, 'Removed material exceeds the conservative quiet threshold'
        peaks.append(dict(inputSeconds=[a,b],peakDbFS=round(db,2)))
    frame_count=round(len(prepared)/align/rate*24);sample_count=frame_count*(rate//24)
    if sample_count<len(prepared)//align:
        trimmed=np.frombuffer(prepared[sample_count*align:],dtype='<i2').astype(np.int32)
        assert np.max(np.abs(trimmed))<=4, 'Frame rounding must not trim speech'
    framed=prepared[:sample_count*align]+bytes(max(0,sample_count*align-len(prepared)))
    target=audio_dir/(sid+'-Holden-clean.wav');assert not target.exists()
    with wave.open(str(target),'wb') as w:w.setparams(params);w.writeframes(framed)
    def mapper(t):
        sample=t*rate
        return sum(max(0,min(sample,b)-a) for a,b in spans if sample>a)/rate
    cuts=[c for c in plan['cuts'] if c['sceneId']==sid]
    boundaries,desired=retime_boundaries(cuts,mapper,frame_count)
    asr=read(repo/f'drafts/forssmann-1929/{sid}-ready-asr.json')
    segments=[dict(start=mapper(s['start']),end=mapper(s['end']),text=s['text'],words=[dict(start=mapper(w['start']),end=mapper(w['end']),word=w['word']) for w in s['words']]) for s in asr['segments']]
    adjustments=[]
    for i,c in enumerate(cuts):
        c['previousTiming']=dict(startFrame=c['startFrame'],durationFrames=c['durationFrames'])
        c['startFrame']=boundaries[i];c['durationFrames']=boundaries[i+1]-boundaries[i]
        c['globalStartFrame']=offset+boundaries[i];c['seconds']=c['durationFrames']/24
        asset=next(a for a in p['assets'] if a.get('shotId')==c['id'] and a['kind']=='image')
        version=next(v for v in asset['versions'] if v['id']==asset['activeVersionId'])
        c['reuse']=dict(assetId=asset['id'],versionId=version['id'],path=version['path'])
        start,end=boundaries[i]/24,boundaries[i+1]/24
        c['speechWindow']=dict(start=start,end=end,recognizedContext=' '.join(s['text'].strip() for s in segments if s['start']<end and s['end']>start),status='Original ASR evidence transformed by exact retained-PCM map; not a fresh transcript')
        c['reviewStatus']='existing selected still retained; audio timing revised'
        adjustments.append(dict(cutId=c['id'],mappedStartFrame=desired[i],selectedStartFrame=boundaries[i],readabilityAdjustmentFrames=boundaries[i]-desired[i],frames=c['durationFrames']))
    # The explanation now runs with speech instead of relying on the old six-second empty hold.
    if sid=='S02':
        cuts[7]['plannedAction']='Synthesize the connected route while the mechanism explanation completes; the former long pause has been removed.'
        cuts[8]['plannedAction']='Return to his opaque exterior arm as uncertainty about the internal tip begins.'
    sceneplan=next(s for s in plan['scenes'] if s['id']==sid);sceneplan['frames']=frame_count
    vid=str(uuid.uuid4())
    locks.append(dict(sceneId=sid,assetId=oldaudio['assetId'],versionId=vid,path=target.relative_to(root).as_posix(),frames=frame_count,sha256=sha(target),sourceVersionId=oldaudio['versionId'],sourceSha256=oldaudio['sha256']))
    reports.append(dict(sceneId=sid,source=oldaudio,selected=locks[-1],sourceSeconds=report['sourceSeconds'],outputSeconds=frame_count/24,removedSeconds=report['sourceSeconds']-frame_count/24,retainedPcmExact=True,tempoFactor=1,quietRemovalPeakChecks=peaks,cutBoundaryReview=adjustments,mappedSpeechEvidence=segments))
    offset+=frame_count
plan['frames']=offset;plan['seconds']=offset/24
for i,c in enumerate(plan['cuts']):
    c['previousState']=plan['cuts'][i-1]['decisiveStill'] if i else oldplan['cuts'][0]['previousState']
    c['nextRequiredState']=plan['cuts'][i+1]['decisiveStill'] if i+1<len(plan['cuts']) else oldplan['cuts'][-1]['nextRequiredState']
lock=dict(projectId=p['id'],originalRevision=p['revision'],plan=p['plan'],sceneWords=oldlock['sceneWords'],audio=locks,scope=plan['scope'],originalPreservationLock='../storyboard-v2/preservation-lock.json')
write(out/'preservation-lock.json',lock);write(out/'plan.json',plan);write(out/'image-receipts.json',[])
review=read(root/'storyboard-v2/review-notes.json');review['scope']='Same inspected stills; timings updated against pause-only PCM edit. Native playback/listening remains pending.'
write(out/'review-notes.json',review)
report=dict(projectId=p['id'],sourceRevision=p['revision'],reason='Prior assembly added 10 seconds of generic edge padding. Native files also contained multi-second internal gaps. The ready files had not passed the existing pause-preparation helper.',policy=dict(tempo=1,noiseDb=-48,minimumGapSeconds=.65,retainedGapSeconds=.30,edgeSeconds=.12),frames=offset,seconds=offset/24,removedSeconds=sum(r['removedSeconds'] for r in reports),scenes=reports,review='Retained PCM and quiet-only deletions verified. No fresh ASR or listening claim. Same words/voice and 60 images; no generated media.')
write(out/'audio-edit-report.json',report);write(Path(__file__).parent/'pause-edit-report.json',report)
print(json.dumps(dict(frames=offset,seconds=offset/24,removedSeconds=report['removedSeconds'],scenes=[dict(id=r['sceneId'],seconds=r['outputSeconds'],removed=r['removedSeconds'],largestBoundaryAdjustment=max(abs(x['readabilityAdjustmentFrames']) for x in r['cutBoundaryReview'])/24) for r in reports])))
