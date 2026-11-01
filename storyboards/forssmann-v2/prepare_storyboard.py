"""Prepare the creator-requested image/audio board; never submit video or change speech."""
from pathlib import Path
import hashlib
import json

REPO = Path(__file__).resolve().parents[2]
ROOT = REPO / 'data/projects/761bb19c-3366-42b3-bb34-274cc9f0f625'
OUT = ROOT / 'storyboard-v2'
OUT.mkdir(exist_ok=True)
PROJECT = json.loads((ROOT / 'project.json').read_text(encoding='utf-8'))

# Ends are scene-local seconds mapped to the saved ready-audio word/phrase evidence.
# A still shows the decisive pose; action describes the planned movement, not observed motion.
# End, title, exact script anchor, decisive still, planned action, reference role, optional keeper.
SCENES = [
 [
  (2.70,'Inside the route',"The tube in this doctor's arm",'A clean dimensional cutaway inside the upper vena cava just above the right atrium. A single slender amber rubber catheter follows the blue vessel lumen downward toward the open heart chamber. Extreme macro, curving vessel walls form a clear route and the heart chamber is visible ahead; no blood or wound.','The tip progresses down the existing vessel toward the atrium; explanatory opening hook, not the doctor seeing inside himself.','anatomy'),
  (4.46,'The living destination','heading toward his heart','The same single amber catheter tip just inside the upper right atrial chamber through the superior vena cava. A translucent ivory heart wall reveals the chamber and enclosing blue vessel above; oblique dimensional view, navy background. Tip stays in the lumen, never punctures a wall.','Reveal the continuous vessel-to-chamber relationship, with restrained heartbeat implied by the pose.','anatomy'),
  (5.25,'The hand supplies the movement','the doctor pushing it forward','His own right fingertips hold the amber tube beside the dressing on his supported left inner elbow. Tight tactile detail makes fingers, tube and entry connection legible.','Carry the internal movement into the external guiding hand; one small controlled advance.','young','S01-B'),
  (8.54,'Doctor and patient','also the patient','Reveal the single young doctor seated at the table, right hand guiding the catheter into his own supported left arm. His connected arm and concentrated face share the frame.','Expose that both hands and the access arm belong to the same man.','young','S01-A'),
  (11.08,'A hospital before the gamble','In nineteen twenty-nine','1929 German hospital exterior viewed through an open iron gate: modest pale masonry building, tall windows, a bicycle and bare orderly entrance. Warm daylight, no readable signs or invented institution name.','Use the pause as an establishing transition from the hook into the historical setting.','environment'),
  (13.00,'The young physician','Werner Forssmann was a young physician','The same young doctor in a white coat inside the established cream-tile, dark-green-door hospital corridor, alert posture beside the tall window.','Locate the person within the hospital, leading toward the operating room.','young','S01-C'),
  (15.68,'A question takes shape','in Eberswalde, Germany','Young doctor at an oak desk in the same hospital, leaning over an open period anatomy book showing a simple heart and vessels; his index finger follows the illustrated arm-to-heart route. No readable lettering. Low three-quarter view connects his face, hand and diagram.','Turn orientation into his inquiry; attention travels from the page to the route he wants to reach.','young'),
  (18.00,'An existing passage','reach the heart from inside a blood vessel','Explanatory upper-body cutaway from front: anatomical left arm on viewer right, blue vein enclosed in the arm, crossing beneath clavicle into the superior vena cava on viewer left and descending into right atrium. One amber catheter follows that continuous lumen. Translucent ivory torso, subdued other anatomy, navy field.','Make the alternative route understandable during the exact mechanism explanation.','anatomy'),
  (20.42,'The chest stays closed','without opening the chest','Three-quarter cutaway of an intact translucent ivory sternum and ribs around the heart. The single amber catheter approaches through the superior vena cava from above, entirely inside the blue vein; a clearly unbroken chest wall in foreground.','Contrast the internal passage with an intact exterior, without showing a chest incision.','anatomy'),
  (21.16,'A flexible tool','A flexible tube','Close supported right hand lifting one thin amber rubber catheter from a steel tray; its flexible arc hangs naturally above white linen. Same white coat, period room, no needle or loose duplicate tubes.','A brief pickup carries the idea into a tangible tool.','young'),
  (23.96,'The tube follows a curve','could offer a way in','Macro still of the same thin amber rubber catheter bending smoothly between two fingers above white linen, clearly flexible rather than a rigid stick. His supported left elbow rests behind it out of focus.','Demonstrate flexibility while the narration explains why it could follow a vessel.','young'),
  (25.42,'Permission refused','his hospital director refused','Older hospital director seated behind oak desk raises an open refusing palm toward the standing young doctor, their eyelines connected.','Show the refusal at the spoken refusal, not a vague worried reaction.','director','S01-D'),
  (27.14,'The patient will be himself','Forssmann decided to use himself','Young doctor alone seated at the enamel table, left sleeve held above elbow, supported left forearm on white linen, sterile amber catheter on tray at his right.','Re-establish the same man as operator and subject after the refusal.','young','S01-E'),
  (28.04,'Sleeve secured','decided to use himself','Tight detail of the young doctor\'s right hand fastening the rolled left cuff above the elbow; supported bare left forearm stays relaxed on linen. No tube is inserted yet.','A quick practical preparation leads directly to the exposed access arm.','young'),
  (31.10,'His own arm on the table','If the experiment went wrong','Wider side view of the young doctor alone at the established table, left forearm palm-up and supported, right hand poised with the single flexible catheter above the tray. Empty opposite chair makes the solitary responsibility readable.','Hold the decision and bodily stakes without inventing a crisis or another assistant.','young'),
  (36.50,'The decision holds','the one paying for it','Close three-quarter view of the young doctor\'s determined face and steady right hand; the supported left elbow is a readable foreground anchor. His gaze goes to his own arm, not toward the audience, in the same quiet operating room.','Carry the consequence into the next scene\'s actual procedure; end with steady focus, not a generic shock.','young'),
 ],
 [
  (1.70,'Connection established','introduced a thin rubber catheter','The same doctor seated with right fingertips at the amber tube connected to the small gauze dressing on the left inner elbow. Arm supported on table.','Establish operator, supported arm and one continuous tube before the detail.','young','S02-A'),
  (2.50,'Grip near the access','into a vein','Macro of right thumb and forefinger gripping one thin amber tube immediately outside the gauze dressing on the left inner elbow. Tube actually enters the dressing, fingers do not grip the fixed cloth, forearm rests on linen.','Secure the moving component in a brief readable grip.','young'),
  (4.52,'Controlled forward advance','advanced it through his body','Low close side view along supported left forearm: right fingers have moved the same amber tube a small distance toward the gauze-covered entry. A single natural external curve returns to the tray, no duplicate tube.','Continue the same grip into one controlled advance instead of replaying a new approach.','young'),
  (6.98,'Enclosed by the vein','The important part is the route','Clean close cutaway of an ivory upper arm and shoulder, single amber catheter enclosed inside a clearly continuous blue vein. Soft dimensional medical illustration, no labels or detached tubing.','Show enclosure and route rather than an unexplained glowing line.','anatomy','S02-B'),
  (8.74,'Blood returns toward the heart','veins carry blood back toward the heart','Dimensional medical close view of the blue upper-arm vein joining the larger shoulder vessel, a few subtle pale-blue flow streaks moving toward the chest and one amber catheter inside the lumen. The heart is a distant contextual form, not a competing focal point.','Explain direction of normal return, providing the reason this route reaches the heart.','anatomy'),
  (10.50,'Across the shoulder','follow an existing passage','Oblique close anatomical cutaway under left clavicle: blue brachiocephalic vein crosses into superior vena cava, amber catheter continuously follows the interior bend. An ivory clavicle above gives a fixed spatial landmark.','Continue the same tube past the shoulder landmark toward the central vessel.','anatomy'),
  (12.16,'No tissue shortcut','instead of piercing the chest','Side cutaway showing unbroken translucent chest wall in foreground and the amber catheter entirely enclosed by a blue vein behind it. Clear separation between intact outer surface and internal passage.','Confirm that the route stays inside the vessel rather than piercing the chest.','anatomy'),
  (15.20,'The whole connected route','follow an existing passage','A clean full upper-torso explanatory cutaway, anatomical left arm on viewer right. One amber catheter follows a continuous blue arm vein beneath clavicle into superior vena cava and toward right atrium on viewer left. Intact ivory ribs, no arrows or labels.','Use the existing spoken pause for a readable synthesis of the arm-to-heart route; explanatory knowledge, not a new diagnosis.','anatomy'),
  (18.26,'Outside he cannot see the tip','But being inside a vein','Over the doctor\'s shoulder at table, his visible left arm remains opaque and supported, right hand holds the single external catheter near dressing. Only the outside connection is visible; no transparent body or magical glow.','Return from audience explanation to the doctor\'s limited view before the uncertainty is spoken.','young'),
  (19.20,'Search for evidence','wasn\'t enough','His concentrated eyes above the connected supported arm, gaze toward the elbow. No smile or triumph.','A brief eye movement registers that external access alone cannot confirm position.','young','S02-D'),
  (21.20,'The next destination','where the tip had gone','Young doctor at table turns his head toward the established green doorway; left elbow dressing and amber tube stay supported in foreground, right hand holds the external curve close to the body.','Carry uncertainty into the decision to seek X-ray evidence.','young'),
  (23.14,'Keep the experiment supported','With the catheter still in place','Close waist-level view: his left forearm is held gently across the abdomen, a small dressing at the elbow, right hand securing the single short external loop of amber catheter. White coat, no dangling loose lines.','Show what remains connected while preparing to move.','young'),
  (23.92,'Door contact','With the catheter still in place','His right hand briefly presses the broad green hospital door lever while his dressed left arm remains supported against his body and the small external catheter loop is secured by his left fingers. No tube attached to the door.','A brief contact begins the exit; preserve support and ownership.','young'),
  (27.24,'The experiment walks','walked to the X-ray department','Full figure of the same young doctor walking down the cream-and-green corridor with his left forearm supported across abdomen and right hand securing the catheter.','Continue the exit as ordinary purposeful steps, not a long atmospheric stroll.','young','S02-E'),
  (31.24,'A visible destination','down the hospital corridor','Rear three-quarter view of the young doctor reaching the end of the corridor where an open dark X-ray room reveals an upright period apparatus and control pedestal. Left forearm remains supported; no image or result on the unlit screen yet.','Connect the corridor to a concrete destination instead of walking without arrival.','young'),
  (826/24,'Evidence in another room','evidence was waiting in another room','Period X-ray room from inside the doorway: young doctor steps beside the upright apparatus, radiographer at the control pedestal; unlit rectangular screen and a clear supported standing position. No glowing chest image yet.','Complete the arrival and establish the apparatus before its result is revealed.','young'),
 ],
 [
  (1.56,'The apparatus supplies evidence','The X-ray supplied the answer','1929 X-ray room, radiographer\'s hand poised at a large mechanical control, Forssmann standing beside the upright apparatus beyond. Rectangular screen is dim, no modern display.','Preparation links the arrival to the coming image.','young'),
  (2.40,'The control engages','The X-ray supplied the answer','Tight detail of a white-sleeved radiographer\'s hand completing a quarter turn of a large black Bakelite control on a period metal pedestal, with a dim warm indicator bulb. No modern buttons.','A brief control contact motivates the next image becoming visible.','equipment'),
  (4.74,'Position confirmed','his right atrium','Clean grayscale radiographic reconstruction fills the portrait frame. Ribs and heart silhouette understated, one pale catheter crosses from viewer-right shoulder into the central descending superior vena cava and ends inside right atrium at viewer-left upper heart. Its terminal tip clearly sits within the chamber, not through the wall. No text.','Show the position that the narration confirms; do not rely on the word atrium alone.','xray'),
  (7.20,'One of the upper chambers','one of the heart\'s upper chambers','A small dimensional explanatory cutaway of the heart alone, ivory translucent surface, right atrium on viewer left subtly blue and isolated by clarity rather than labels; one amber catheter enters from superior vena cava above and its tip stays in atrial lumen.','Make the upper chamber relation legible during its spoken explanation.','anatomy'),
  (10.50,'Arm and heart connected','sixty-five centimeters of tubing','Clean frontal upper-body explanatory cutaway: whole anatomical left arm on viewer right through shoulder to superior vena cava and right atrium on viewer left. One continuous amber catheter, no ruler or invented numeric label, clear beginning and destination.','Show the extent and connected path while the narration supplies the measured length.','anatomy'),
  (12.80,'He survived','He had survived','The doctor holds his developed X-ray at the lightbox, supported dressed arm visible, relieved but contained expression.','Return from explanation to the living person and tangible proof.','young','S03-C'),
  (16.26,'A picture to prove it','a picture to prove where the tube was','Over-shoulder close view of his right index fingertip stopping just beside the catheter endpoint on the developed chest radiograph at the lightbox; finger does not obscure tip. Same single continuous pale catheter path.','Connect his gaze and finger to the specific evidence, not merely an attractive X-ray.','young'),
  (17.10,'The report leaves his hands','published the experiment','Tight period desk detail: his hand sets a typed medical report and developed chest radiograph together into a large paper publication envelope; no readable recipient or invented headline.','Brief editorial representation of submitting evidence, without inventing private dialogue.','paper'),
  (20.50,'Evidence enters the journal','published the experiment that November','Open 1929 medical journal on a reader\'s desk, a printed reproduction of the chest radiograph embedded beside dense unremarkable German type. A white-sleeved hand turns the facing page. No readable invented headline, no modern printing equipment.','Show circulation of the published evidence before its lack of acceptance.','paper'),
  (23.40,'Attention withheld','His work attracted little interest','Young Forssmann with radiograph in front of the older mustached surgeon\'s desk; surgeon returns to papers.','Establish an observer actively withholding interest from the offered evidence.','surgeon','S03-E'),
  (27.10,'Dismissal rather than debate','Sauerbruch dismissed such experiments','Reverse view from beside the young doctor: older imposing mustached surgeon turns back to a stack of papers, leaving the offered radiograph at the edge of his attention. Foreground young doctor\'s sleeve and plate establish who is being dismissed.','Continue the same refusal of attention at the actual dismissal passage.','surgeon'),
  (29.40,'Proof lowered','as circus work','Close on young doctor\'s hands lowering the same developed radiograph from chest height toward his waist beside the desk; supported glass plate stays intact. Older surgeon\'s papers in background.','Expose the consequence of dismissal without inventing anger or a broken plate.','young'),
  (31.40,'What the picture established','The picture showed what was possible','Developed chest radiograph still lit on the hospital lightbox, single catheter route and terminal position visible, room around it dark and quiet. No triumphant glow or extra diagram.','Return attention to the actual evidence despite the human rejection.','xray'),
  (849/24,'What it did not establish','It did not persuade everyone to follow','Young doctor at the office doorway leaving with the radiograph tucked securely beneath his right arm; older surgeon remains absorbed in papers behind the desk. Medium-wide depth preserves their physical separation.','End on lack of adoption, leading naturally into the later researchers rather than repeating a generic sad face.','surgeon'),
 ],
 [
  (2.62,'A shared method','more than one man\'s gamble','Two distinct middle-aged researchers in the established 1940s laboratory coordinate around analog pressure apparatus.','Replace the solitary gamble with collaborative work.','lab','S04-A'),
  (5.00,'Cournand follows the record','André Cournand','Close three-quarter view of the slender dark-haired researcher with round glasses writing notes beside a paper pressure trace. His colleague\'s hand and connected apparatus remain in the background, no invented readable name tag.','Identify one participant through a task within the same shared work.','lab'),
  (8.40,'Richards checks the method','Dickinson Richards developed','His taller colleague with receding hair carefully checks the stopcock below an upright glass manometer while the glasses-wearing researcher watches the trace beside him. Connected rubber lines stay on the bench.','Show a complementary task and stable shared apparatus.','lab'),
  (9.92,'A sample is taken for analysis','Doctors could sample blood','Close gloved hands hold a small glass tube containing a dark ruby sample above a metal rack, laboratory glasswork behind.','Prepare the sample placement just before the spoken sampling phrase.','lab','S04-B'),
  (10.66,'The sample is seated','sample blood','Macro still of the small glass sample tube fully seated in a rigid metal rack, one gloved fingertip just releasing its rim. Dark ruby sample, stable bench, no needle or insertion.','Brief contact/result closes the sample movement instead of hovering indefinitely.','equipment'),
  (11.48,'Pressure becomes readable','measure pressures','Macro view of fluid levels in the two limbs of an upright glass manometer, rigid backing and connected fine rubber tubing at its base visible. A real difference between the fluid columns is legible, no invented scale values or text.','A brief diagnostic detail shows what measuring pressure means.','equipment'),
  (13.08,'A trace records change','inside the circulation','Period connected manometer and mechanical paper recorder with a pen at a visible pressure trace, researchers behind.','Connect the fluid measurement to its record.','lab','S04-C'),
  (17.76,'Heart and lungs as one circulation','heart and lungs worked together','Restrained dimensional explanatory diagram: ivory heart between two translucent lungs, continuous blue route from right heart to lungs and warm red route returning to left heart. Clearly connected system, no arrows, no extraneous branches or numerical claim. Navy background and the same medical illustration medium.','Give the relationship its own explanatory view as the narration moves beyond apparatus.','anatomy'),
  (20.25,'Twenty-seven years later','In nineteen fifty-six','Older Forssmann, 52, solid oval face and receding gray hair, in white-tie evening dress entering a golden Stockholm ceremonial hall through tall doors. A small presentation case in his hand, no crowd of extra laureates.','Make the passage of time visible with changed age and location at the spoken date.','nobel'),
  (23.18,'Three men share recognition','all three men shared','Three laureates in black white-tie tails stand together in the established golden hall, older Forssmann in center and his two older colleagues beside him, all equally framed.','Prepare shared recognition without a lone hero victory.','nobel','S04-E'),
  (24.00,'The medal revealed','the Nobel Prize in medicine','Tight view of a gold Nobel-style medal already revealed in an open blue-velvet presentation case, a white-tie cuff and supporting hands at the edge; no invented readable inscriptions.','A subsecond reveal identifies the recognition clearly.','nobel'),
  (29.04,'Daring and careful work together','the careful work that made it useful','Three older laureates\' supported hands holding their separate open presentation cases at waist height, sleeves belong to the three men standing shoulder to shoulder. Equal emphasis on all three cases, warm ceremonial light.','Hold the shared nature of the achievement while the narration distinguishes the first step from later systematic work.','nobel'),
  (32.60,'Return to the route','The tube that had once led through one doctor\'s arm','Elegant clean explanatory upper torso: single amber catheter from anatomical left arm through continuous blue vein into right atrium, translucent ivory heart and intact chest. The route is the focal feature, readable against navy.','Recall the opening internal path as the closing words return to the original tube.','anatomy'),
  (894/24,'A living heart opened to understanding','opened a route into the living heart','The same three older laureates together in the ceremonial hall, composed and dignified, cases supported.','End on shared recognition through the final accepted audio tail; no new spoken conclusion.','nobel','S04-E'),
 ],
]

STYLE = ('One edge-to-edge 9:16 portrait film still, cinematic stylized 3D historical drama. '
         'Sculpted expressive adults with believable proportions, tactile cloth and porcelain enamel, '
         'dimensional depth, teal shadows and warm amber motivated light. Restrained gravity, not comedy, '
         'not low-poly or miniature. One instant, no panels, no captions or watermark. ')
REFS = {'young':'S01-A', 'director':'S01-D', 'surgeon':'S03-E', 'lab':'S04-A',
        'nobel':'S04-E', 'equipment':'S04-C', 'paper':'S03-D'}

audio_locks=[]
for scene in PROJECT['scenes']:
    a=next(a for a in PROJECT['assets'] if a['id']==scene['audioAssetId'])
    v=next(v for v in a['versions'] if v['id']==a['activeVersionId'])
    audio_locks.append(dict(sceneId=scene['id'],assetId=a['id'],versionId=v['id'],path=v['path'],
        frames=v['durationFrames'],sha256=hashlib.sha256((ROOT/v['path']).read_bytes()).hexdigest()))

lock=dict(projectId=PROJECT['id'],originalRevision=PROJECT['revision'],plan=PROJECT['plan'],
          sceneWords=[dict(id=s['id'],title=s['title'],narration=s['narration'],spokenStyle=s['spokenStyle'],audioPrompt=s['audioPrompt']) for s in PROJECT['scenes']],
          audio=audio_locks,scope='Images over unchanged accepted audio. No video generation. Default built-in image tool for new stills.')
lock_file=OUT/'preservation-lock.json'
if lock_file.exists():
    old=json.loads(lock_file.read_text(encoding='utf-8'))
    assert old['sceneWords']==lock['sceneWords'] and old['audio']==audio_locks, 'Locked input changed'
else:
    lock_file.write_text(json.dumps(lock,indent=2),encoding='utf-8')
    (OUT/'project-before-v2.json').write_text(json.dumps(PROJECT,indent=2),encoding='utf-8')

cuts=[];offset=0
for scene,items,audio in zip(PROJECT['scenes'],SCENES,audio_locks):
    sid=scene['id'];cursor=0
    asr=json.loads((REPO/f'drafts/forssmann-1929/{sid}-ready-asr.json').read_text(encoding='utf-8'))
    for i,row in enumerate(items):
        end,title,anchor,visual,action,role,*keeper=row
        assert anchor in scene['narration'], (sid,anchor)
        last=round(end*24);frames=last-cursor;assert frames>0
        selected_segments=[s for s in asr['segments'] if s['start']<last/24 and s['end']>cursor/24]
        spoken=' '.join(s['text'].strip() for s in selected_segments)
        shotid=f'{sid}-V2-{i+1:02}'
        ref=None
        if role in REFS:
            asset=next(a for a in PROJECT['assets'] if a['kind']=='image' and a.get('shotId')==REFS[role])
            version=next(v for v in asset['versions'] if v['id']==asset['activeVersionId'])
            ref=str(ROOT/version['path'])
        identity=''
        if role in ['young','director','surgeon']:
            identity='Young Forssmann is the same slim young adult man as the reference, long oval face, high forehead, side-parted dark brown hair, clean shaven, white coat. '
        elif role=='lab':
            identity='Preserve the two reference researchers: slender dark hair and round glasses; taller receding hair. Same period lab and owned apparatus. '
        elif role=='nobel':
            identity='Preserve the three older reference laureates, faces, white-tie costumes and golden hall. '
        prompt=STYLE+'Current event and decisive pose: '+visual+' '+identity
        if ref:
            prompt+='The attached image is an appearance/medium reference only; create the requested new view and action phase, do not copy an irrelevant pose. '
        if role in ['anatomy','xray']:
            prompt+='Scientific explanatory reconstruction, clean non-graphic museum visualization. Anatomy must stay connected. Do not introduce a doctor, captions, blood, detached organs or any tube through the chest wall. '
        prompt+='Keep the important connection and action cue readable within the portrait crop. No extra people or duplicate limbs/props.'
        reuse=None
        if keeper:
            asset=next(a for a in PROJECT['assets'] if a['kind']=='image' and a.get('shotId')==keeper[0])
            version=next(v for v in asset['versions'] if v['id']==asset['activeVersionId'])
            reuse=dict(assetId=asset['id'],versionId=version['id'],path=version['path'])
        cuts.append(dict(id=shotid,sceneId=sid,index=len(cuts),title=title,startFrame=cursor,durationFrames=frames,
            globalStartFrame=offset+cursor,seconds=frames/24,narrationAnchor=anchor,
            speechWindow=dict(start=cursor/24,end=last/24,recognizedContext=spoken,status='Saved ASR phrase/word evidence; editorial cut positions selected by director'),
            imagePrompt=prompt,referencePaths=[ref] if ref else [],referenceRole=role,
            decisiveStill=visual,plannedAction=action,reuse=reuse,
            join='Continuation of the narrated development; explanatory views are audience context, not private vision.',
            reviewStatus='not-reviewed',motionStatus='Not generated: image/audio storyboard only'))
        cursor=last
    assert cursor==audio['frames'],(sid,cursor,audio['frames'])
    assert sum(12<=c['durationFrames']<24 for c in cuts if c['sceneId']==sid)>=2
    offset+=audio['frames']

for i,c in enumerate(cuts):
    c['previousState']=cuts[i-1]['decisiveStill'] if i else 'Explanatory hook starts within the catheter route; no prior shot.'
    c['nextRequiredState']=cuts[i+1]['decisiveStill'] if i+1<len(cuts) else 'End of unchanged story and accepted audio.'

assert len(cuts)==60 and len(PROJECT['scenes'])==4 and offset==3445
plan=dict(projectId=PROJECT['id'],version='director-storyboard-v2',fps=24,width=720,height=1280,
          frames=offset,seconds=offset/24,scenes=[dict(id=s['id'],title=s['title'],cutCount=len(rows),frames=a['frames']) for s,rows,a in zip(PROJECT['scenes'],SCENES,audio_locks)],
          scope=lock['scope'],sourceAudioEvidence='drafts/forssmann-1929/S0N-ready-asr.json',
          openingNote='Audience explanatory view of vessel/heart then external hand and self-patient reveal; no claim Forssmann saw inside his body.',
          cuts=cuts)
(Path(__file__).parent/'plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8')
(OUT/'plan.json').write_text(json.dumps(plan,indent=2),encoding='utf-8')
print(json.dumps(dict(cuts=len(cuts),newImages=sum(c['reuse'] is None for c in cuts),keepers=sum(c['reuse'] is not None for c in cuts),
    scenes=plan['scenes'],frames=offset,seconds=offset/24,output=str(OUT))))
