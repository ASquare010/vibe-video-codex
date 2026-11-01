"""Assemble real stills and unchanged narration for creator review; no video renderer."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps
import hashlib
import html
import json
import math

REPO=Path(__file__).resolve().parents[2]
ROOT=REPO/'data/projects/761bb19c-3366-42b3-bb34-274cc9f0f625'
OUT=ROOT/'storyboard-v2'
plan=json.loads((OUT/'plan.json').read_text(encoding='utf-8'))
lock=json.loads((OUT/'preservation-lock.json').read_text(encoding='utf-8'))
receipts=json.loads((OUT/'image-receipts.json').read_text(encoding='utf-8'))
review_file=OUT/'review-notes.json'
reviews=json.loads(review_file.read_text(encoding='utf-8'))['cuts'] if review_file.exists() else []
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for a in lock['audio']:
    assert sha(ROOT/a['path'])==a['sha256'], 'Accepted audio changed'

font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',13)
selections=[]
for c in plan['cuts']:
    rel=c['reuse']['path'] if c['reuse'] else 'storyboard-v2/images/'+c['id']+'.png'
    p=ROOT/rel
    assert p.is_file(), 'Missing real image '+c['id']
    with Image.open(p) as im:
        im.verify()
    with Image.open(p) as im:
        width,height=im.size
    receipt=next((r for r in reversed(receipts) if r['cutId']==c['id'] and r['sha256']==sha(p)),None)
    assert c['reuse'] or receipt, 'Missing generation receipt '+c['id']
    review=next((r for r in reviews if r['cutId']==c['id']),{})
    selections.append(dict(cutId=c['id'],path=rel,sha256=sha(p),width=width,height=height,
        reuse=c['reuse'],receipt=receipt,reviewStatus=review.get('status','pending final selected-sheet inspection'),observed=review.get('observed',''),motion='not generated'))

for s in plan['scenes']:
    cuts=[c for c in plan['cuts'] if c['sceneId']==s['id']]
    cursor=0
    for c in cuts:
        assert c['startFrame']==cursor
        cursor+=c['durationFrames']
    assert cursor==s['frames']
    assert sum(12<=c['durationFrames']<24 for c in cuts)>=2
    board=Image.new('RGB',(1024,72+math.ceil(len(cuts)/4)*510),'#101921')
    d=ImageDraw.Draw(board)
    d.text((16,12),s['id']+' | '+s['title']+' | '+str(len(cuts))+' cuts',font=font,fill='white')
    d.text((16,40),'Selected image/audio storyboard | original narration | motion not generated',font=small,fill='#a5bac5')
    for i,c in enumerate(cuts):
        selected=next(x for x in selections if x['cutId']==c['id'])
        x=(i%4)*256+8;y=72+(i//4)*510
        with Image.open(ROOT/selected['path']) as im:
            thumb=ImageOps.contain(im.convert('RGB'),(240,426))
            board.paste(thumb,(x+(240-thumb.width)//2,y))
        d.text((x,y+432),c['id']+' | '+f"{c['seconds']:.2f}s",font=font,fill='white')
        d.text((x,y+456),c['title'][:34],font=small,fill='#e4c98f')
        d.text((x,y+478),f"{c['globalStartFrame']/24:.2f}s"+(' | reuse' if c['reuse'] else ' | new'),font=small,fill='#a5bac5')
    board.save(OUT/(s['id']+'-selected.jpg'),quality=94)

data=dict(scenes=[dict(**s,audio='../'+a['path'],narration=w['narration']) for s,a,w in zip(plan['scenes'],lock['audio'],lock['sceneWords'])],
    cuts=[dict(**c,image='../'+selections[i]['path']) for i,c in enumerate(plan['cuts'])],frames=plan['frames'],fps=24)
template=(Path(__file__).parent/'review.html').read_text(encoding='utf-8')
(OUT/'review.html').write_text(template.replace('/*BOARD_DATA*/{}',json.dumps(data).replace('</','<\\/')),encoding='utf-8')
(OUT/'selections.json').write_text(json.dumps(selections,indent=2),encoding='utf-8')
print(json.dumps(dict(cuts=len(selections),newImages=sum(not c['reuse'] for c in plan['cuts']),reusePlacements=sum(bool(c['reuse']) for c in plan['cuts']),frames=plan['frames'],audioHashes='all four unchanged',preview=str(OUT/'review.html'))))
