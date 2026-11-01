"""Verify the adopted pause-only audio, image placements and original-version preservation."""
from pathlib import Path
import hashlib,json,re,subprocess,wave

repo=Path(__file__).resolve().parents[2];root=repo/'data/projects/761bb19c-3366-42b3-bb34-274cc9f0f625';out=root/'storyboard-v3'
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
p=read(root/'project.json');before=read(out/'project-before-pause-edit.json');lock=read(out/'preservation-lock.json');plan=read(out/'plan.json');report=read(out/'audio-edit-report.json')
assert p['revision']==55 and len(p['scenes'])==4 and len(p['clips'])==60
assert len(p['assets'])==len(before['assets']) and p['costs']==before['costs']
assert p['settings']==before['settings'] and p['theme']==before['theme'] and p['skill']==before['skill']
assert p['plan']['story']==before['plan']['story'] and p['plan']['fullNarration']==before['plan']['fullNarration']
assert p['production']==dict(status='awaiting-review',stage='images') and p['review']['approvals']['storyboard'] is None
checks=[]
for old,s,a,r in zip(before['scenes'],p['scenes'],lock['audio'],report['scenes']):
    for key in ['id','title','narration','spokenStyle','audioPrompt','audioAssetId']:assert old[key]==s[key]
    for shot,oldshot in zip(s['shots'],old['shots']):assert shot['id']==oldshot['id'] and shot['imagePrompt']==oldshot['imagePrompt'] and shot['videoPrompt']==''
    audio=next(x for x in p['assets'] if x['id']==a['assetId']);prior=next(x for x in before['assets'] if x['id']==a['assetId'])
    assert audio['activeVersionId']==a['versionId'] and all(v in audio['versions'] for v in prior['versions'])
    oldv=next(v for v in audio['versions'] if v['id']==a['sourceVersionId'])
    assert sha(root/oldv['path'])==a['sourceSha256'] and sha(root/a['path'])==a['sha256']
    with wave.open(str(root/a['path']),'rb') as w:
        assert w.getframerate()==48000 and w.getnchannels()==2 and w.getnframes()==a['frames']*2000
    clips=sorted([c for c in p['clips'] if c['sceneId']==s['id']],key=lambda c:c['startFrame']);cursor=0
    for c in clips:
        oldc=next(x for x in before['clips'] if x['id']==c['id'])
        assert all(c[k]==oldc[k] for k in c if k not in ['startFrame','durationFrames'])
        assert c['startFrame']==cursor;cursor+=c['durationFrames']
        asset=next(x for x in p['assets'] if x['id']==c['assetId']);assert asset['kind']=='image'
    assert cursor==a['frames'] and len(clips)==len(s['shots'])
    assert sum(c['durationFrames']<24 for c in clips)>=2
    detected=subprocess.run([str(repo/'node_modules/ffmpeg-static/ffmpeg.exe'),'-nostdin','-hide_banner','-i',str(root/a['path']),'-af','silencedetect=noise=-42dB:d=0.1','-f','null','-'],capture_output=True,text=True,check=True)
    lengths=[float(x) for x in re.findall(r'silence_duration: ([0-9.]+)',detected.stderr)]
    assert max(lengths,default=0)<.9, 'An excessive quiet gap remains'
    checks.append(dict(sceneId=s['id'],seconds=cursor/24,cuts=len(clips),longestDetectedQuietGapSeconds=max(lengths,default=0),speechPcmPreserved=r['retainedPcmExact'],originalAudioSha256=a['sourceSha256'],selectedAudioSha256=a['sha256']))
assert sum(c['durationFrames'] for c in p['clips'])==2908
for old in before['assets']:
    now=next(a for a in p['assets'] if a['id']==old['id'])
    if old['kind']!='audio' or old['id'] not in [a['assetId'] for a in lock['audio']]:assert now==old
film=root/'exports/7458e92f-01a2-4f73-ab61-9de01b64db1b/film.mp4'
assert sha(film)=='b0867b1bedf56ccf876e150bd5d8f45635e699dac4ff074a70402720f88b8be0'
full=root/'audio-pause-cleanup/Doctor-Holden-pause-cleaned.wav'
with wave.open(str(full),'rb') as w:
    data=w.readframes(w.getnframes());assert w.getnframes()==2908*2000
chunks=[]
for a in lock['audio']:
    with wave.open(str(root/a['path']),'rb') as w:chunks.append(w.readframes(w.getnframes()))
assert data==b''.join(chunks)
result=dict(projectId=p['id'],revision=p['revision'],frames=2908,seconds=2908/24,removedSeconds=report['removedSeconds'],tempo=1,originalAudioFilesPreserved=True,wordsAndImagesUnchanged=True,noGeneratedMedia=True,scenes=checks,playback='Pending creator audition; measurements and retained-PCM checks only',preview=str(out/'review.html'),fullAudio=str(full),fullAudioSha256=sha(full))
for target in [out/'verification.json',Path(__file__).parent/'pause-verification.json']:target.write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
