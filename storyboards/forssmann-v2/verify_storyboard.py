"""Check the applied artifact and frozen creative/media inputs, without playing media."""
from pathlib import Path
import hashlib
import json

repo=Path(__file__).resolve().parents[2]
root=repo/'data/projects/761bb19c-3366-42b3-bb34-274cc9f0f625'
out=root/'storyboard-v2'
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
p=read(root/'project.json');before=read(out/'project-before-v2.json');lock=read(out/'preservation-lock.json')
plan=read(out/'plan.json');selections=read(out/'selections.json');receipt=read(out/'applied.json')
assert len(p['scenes'])==4 and [len(s['shots']) for s in p['scenes']]==[16,16,14,14]
assert len(p['clips'])==60 and all(c['track']=='visual' for c in p['clips'])
assert {k:v for k,v in p['plan'].items() if k not in ('approved','directorBasis')}=={k:v for k,v in lock['plan'].items() if k not in ('approved','directorBasis')}
assert p['skill']==before['skill'], 'Frozen project skill unexpectedly replaced'
assert p['settings']==before['settings']
assert all(a in p['assets'] for a in before['assets']), 'Historical asset/version changed'
assert all(j in p['jobs'] for j in before['jobs']), 'Historical jobs changed'
assert sum(a['kind']=='video' for a in p['assets'])==sum(a['kind']=='video' for a in before['assets'])
assert all(c['reviewStatus']=='selected-still-reviewed' for c in selections)
checks=[]
for s,old,a in zip(p['scenes'],before['scenes'],lock['audio']):
    for key in ['id','title','narration','spokenStyle','audioPrompt','audioAssetId']:
        assert s[key]==old[key],key
    audio=next(x for x in p['assets'] if x['id']==a['assetId'])
    assert audio['activeVersionId']==a['versionId'] and sha(root/a['path'])==a['sha256']
    assert not s['approved']
    clips=sorted([c for c in p['clips'] if c['sceneId']==s['id']],key=lambda c:c['startFrame'])
    cursor=0
    for c in clips:
        assert c['startFrame']==cursor and c['sourceIn']==0 and c['speed']==1 and c['motion']=='none'
        cursor+=c['durationFrames']
        asset=next(x for x in p['assets'] if x['id']==c['assetId']);assert asset['kind']=='image'
        v=next(v for v in asset['versions'] if v['id']==c['versionId'])
        selected=next(x for x in selections if x['path']==v['path'])
        assert sha(root/v['path'])==selected['sha256']
    assert cursor==a['frames']
    assert sum(12<=c['durationFrames']<24 for c in clips)>=2
    checks.append(dict(sceneId=s['id'],cuts=len(clips),frames=cursor,subsecondInserts=sum(c['durationFrames']<24 for c in clips),audioSha256=a['sha256']))
assert sum(c['durationFrames'] for c in p['clips'])==3445
assert p['production']==dict(status='awaiting-review',stage='images')
assert p['review']['approvals']['storyboard'] is None
assert read(root/'latest-storyboard.json')==receipt
oldfilm=root/'exports/7458e92f-01a2-4f73-ab61-9de01b64db1b/film.mp4'
assert sha(oldfilm)=='b0867b1bedf56ccf876e150bd5d8f45635e699dac4ff074a70402720f88b8be0'
preview=(out/'review.html').read_text(encoding='utf-8')
assert '/*BOARD_DATA*/{}' not in preview and '<video' not in preview and 'autoplay' not in preview
for s in selections:assert (root/s['path']).is_file()
report=dict(projectId=p['id'],revision=p['revision'],cuts=60,frames=3445,seconds=3445/24,scenes=checks,
    originalStoryAndAudioUnchanged=True,historicalAssetsAndFilmPreserved=True,videoGenerationCalls=0,
    status='awaiting-review',nativePlayback='pending; no playback/listening claim',
    images=dict(new=sum(not c['reuse'] for c in plan['cuts']),reusePlacements=sum(bool(c['reuse']) for c in plan['cuts'])),
    preview=str(out/'review.html'))
(out/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(Path(__file__).parent/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
# Compact committed evidence refers to real local media; media remains in the project.
(Path(__file__).parent/'selected-images.json').write_text(json.dumps([{k:v for k,v in s.items() if k!='receipt'} for s in selections],indent=2),encoding='utf-8')
(Path(__file__).parent/'review-notes.json').write_text((out/'review-notes.json').read_text(encoding='utf-8'),encoding='utf-8')
print(json.dumps(report))
