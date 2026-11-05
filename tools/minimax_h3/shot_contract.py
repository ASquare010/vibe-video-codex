"""Validate reviewed source guidance and keep spoken dialogue separate from visual instructions."""
from pathlib import Path
import hashlib,json

def validate_scene_inputs(scene,images,policy):
 if policy.get('imageOnly') and scene.get('guidance')!='image-only':raise ValueError('This project requires images and audio only; source video cannot be a generation input.')
 if not images:raise ValueError('A relevant photographic reference is required before video generation.')
 if policy.get('requireImageReview'):
  review=scene.get('imageReferenceReview',{})
  if review.get('status')!='reviewed-source-matched' or not review.get('reviewedAt'):raise ValueError('Scene-specific camera/cast/action reference review is missing.')
  records={str(Path(x['path']).resolve()):x for x in review.get('items',[])}
  for file in images:
   path=Path(file).resolve(strict=True);item=records.get(str(path))
   if not item or hashlib.sha256(path.read_bytes()).hexdigest()!=item.get('sha256'):raise ValueError('Image reference is missing its exact reviewed-file receipt: '+str(path))
   if item.get('role') in ['start','later','previous-end']:
    for key in ['camera','visibleSubjects','actionState','propOwnership']:
     if not item.get(key):raise ValueError('Image reference review lacks '+key)
   if item.get('style')!='photographic':raise ValueError('Drawn/unchecked references cannot guide a live-action remake.')
 contract=scene.get('audioContract')
 if policy.get('requireSpokenScript'):
  if not contract or contract.get('reviewStatus')!='reviewed-source':raise ValueError('Verify the actual source speech/no-speech decision before a new request.')
  if contract.get('language')!=policy.get('spokenLanguage','en'):raise ValueError('Spoken language does not match the project requirement.')
  if contract.get('mode') not in ['dialogue','no-speech','vocalizations']:raise ValueError('Audio mode must be explicit.')
  utterances=contract.get('utterances',[])
  if contract['mode']=='dialogue' and not utterances:raise ValueError('A dialogue shot needs the exact English words and speakers.')
  if contract['mode']!='dialogue' and utterances:raise ValueError('No-speech/vocalization shots cannot contain spoken lines.')
  for line in utterances:
   if not line.get('text','').strip() or not line.get('speaker'):raise ValueError('Each English line needs actual words and its speaker.')
   if line.get('visibility') not in ['visible','off-screen','thought']:raise ValueError('Specify speaker visibility; audio must not add unpictured people.')
 return contract

def audio_prompt(contract):
 mode=contract['mode'];sound=contract.get('effects','Source-matched physical ambience and impacts.')
 if mode=='dialogue':
  lines=[]
  for line in contract['utterances']:
   role={'off-screen':'speaks off-screen','thought':'is heard as an internal thought','visible':'speaks'}[line['visibility']]
   timing=f" from {line['startSeconds']:.2f} to {line['endSeconds']:.2f} seconds" if 'startSeconds' in line and 'endSeconds' in line else ''
   lines.append(line['speaker']+' '+role+timing+' in natural ENGLISH: '+json.dumps(line['text'],ensure_ascii=False)+'.')
  return ' '.join(lines)+' <Audio 1> guides those exact words, voice, emotion and timing; ignore its background score. Only the quoted words are spoken; do not narrate visual instructions. Sound: '+sound+' No other speech or music.'
 voice='Nonverbal breathing, exertion or pain sounds only, with no words.' if mode=='vocalizations' else 'No speech, narration, singing or vocal words.'
 return voice+' <Audio 1> guides event timing and effects only, not dialogue or music. Sound: '+sound+' No music.'
