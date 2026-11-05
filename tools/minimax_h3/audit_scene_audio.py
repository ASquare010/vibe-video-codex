"""Local, resumable source/native/timeline speech audit. ASR is evidence, never approval."""
from pathlib import Path
import argparse,datetime,hashlib,json,re,subprocess,time,wave
from difflib import SequenceMatcher

def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def save(p,v):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True);t=p.with_suffix(p.suffix+'.tmp');t.write_text(json.dumps(v,indent=2,ensure_ascii=False),encoding='utf-8');t.replace(p)
def main():
 ap=argparse.ArgumentParser(description=__doc__);ap.add_argument('--plan',type=Path,required=True);ap.add_argument('--out',type=Path,required=True);ap.add_argument('--model',default='small');ap.add_argument('--cache',type=Path,required=True);ap.add_argument('--scenes',type=int,nargs='+');a=ap.parse_args();p=read(a.plan);r=Path(p['repository']);ff=r/'node_modules/ffmpeg-static/ffmpeg.exe';a.out.mkdir(parents=True,exist_ok=True)
 from faster_whisper import WhisperModel
 print(json.dumps(dict(status='loading-local-asr',model=a.model)),flush=True);model=WhisperModel(a.model,device='cpu',compute_type='int8',cpu_threads=8,num_workers=1,download_root=str(a.cache))
 def wav(file,name,start=None,duration=None):
  out=a.out/'audio'/name
  if not out.exists():
   out.parent.mkdir(parents=True,exist_ok=True);cmd=[str(ff),'-v','error','-y']
   if start is not None:cmd+=['-ss',str(start)]
   cmd+=['-i',str(file)]
   if duration is not None:cmd+=['-t',str(duration)]
   cmd+=['-map','0:a:0','-vn','-ar','16000','-ac','1','-c:a','pcm_s16le',str(out)];subprocess.run(cmd,check=True)
  return out
 def transcribe(audio,outfile,task='transcribe',language=None):
  digest=hashlib.sha256(audio.read_bytes()).hexdigest();settings=dict(model=a.model,task=task,language=language,beam_size=5,vad_filter=True,condition_on_previous_text=False,word_timestamps=True)
  if outfile.exists():
   previous=read(outfile)
   if previous.get('sha256')==digest and previous.get('settings')==settings:return previous
  # Our own mono16k PCM avoids version-specific PyAV decoding and resampling.
  import numpy as np
  with wave.open(str(audio),'rb') as sound:
   if (sound.getnchannels(),sound.getsampwidth(),sound.getframerate())!=(1,2,16000):raise RuntimeError('Expected mono16k signed16 PCM')
   samples=np.frombuffer(sound.readframes(sound.getnframes()),dtype='<i2').astype(np.float32)/32768
  started=time.time();segments,info=model.transcribe(samples,**{k:v for k,v in settings.items() if k!='model'});rows=[]
  for s in segments:rows.append(dict(start=s.start,end=s.end,text=s.text.strip(),avgLogprob=s.avg_logprob,noSpeechProbability=s.no_speech_prob,compressionRatio=s.compression_ratio,words=[dict(start=w.start,end=w.end,word=w.word,probability=w.probability) for w in s.words or []]))
  result=dict(file=str(audio),sha256=digest,settings=settings,language=info.language,languageProbability=info.language_probability,duration=info.duration,text=' '.join(x['text'] for x in rows),segments=rows,elapsed=time.time()-started,note='Automatic transcript may hallucinate over music/grunts or unclear speech; verify words and speaker before using in generation. No automatic speech approval.')
  save(outfile,result);print(json.dumps(dict(status='transcribed',file=str(outfile),language=result['language'],probability=result['languageProbability'],text=result['text'][:450]),ensure_ascii=True),flush=True);return result
 end=max(s['end'] for s in p['scenes']);source_audio=wav(p['source'],'source-prologue.wav',0,end);source=transcribe(source_audio,a.out/'source-asr.json')
 expected=source
 if source['language']!='en' and source['languageProbability']>.55:expected=transcribe(source_audio,a.out/'source-english-translation-asr.json',task='translate')
 def expected_for(s):
  words=[w for seg in expected['segments'] for w in seg['words'] if s['start']<=(w['start']+w['end'])/2<s['end']]
  if words:return ''.join(w['word'] for w in words).strip()
  return ' '.join(seg['text'] for seg in expected['segments'] if seg['start']<s['end'] and seg['end']>s['start'])
 source_map=[dict(number=s['number'],start=s['start'],end=s['end'],automaticEnglishText=expected_for(s),verified=False,sourceLanguage=source['language'],sourceLanguageProbability=source['languageProbability']) for s in p['scenes']];save(a.out/'source-dialogue-candidates.json',source_map)
 preferred=[1,2,3,4,6,8,10,22,26,28];scenes=[s for s in p['scenes'] if a.scenes is None or s['number'] in a.scenes];scenes.sort(key=lambda s:(0,preferred.index(s['number'])) if s['number'] in preferred else (1,p['scenes'].index(s)));report=[]
 for s in scenes:
  receipt=Path(s['folder'])/'completed-take.json'
  if not receipt.exists():continue
  take=read(receipt);native=Path(take['metadata']).parent/'output.mp4';job=read(take['metadata']);expected_text=expected_for(s);results={}
  for kind,file in [('native',native),('timeline',Path(take['file']))]:
   if not file.exists():continue
   audio=wav(file,f"{s['number']:03}-{take['jobId']}-{kind}.wav");results[kind]=transcribe(audio,a.out/'transcripts'/f"{s['number']:03}-{take['jobId']}-{kind}.json")
  normalize=lambda x:re.sub(r'[^a-z0-9 ]','',x.lower()).split()
  flags=[]
  for kind,result in results.items():
   if result['text'] and result['language']!='en' and result['languageProbability']>.55:flags.append(kind+': ASR detected possible non-English speech')
   if not expected_text.strip() and len(normalize(result['text']))>=3:flags.append(kind+': possible invented speech in source no-dialogue interval')
   if expected_text.strip() and not result['text'].strip():flags.append(kind+': no intelligible speech recognized where source has words')
   if expected_text.strip() and SequenceMatcher(None,normalize(expected_text),normalize(result['text'])).ratio()<.5:flags.append(kind+': recognized words differ substantially from source candidate')
  request=job.get('request',{});row=dict(number=s['number'],source=[s['start'],s['end']],jobId=take['jobId'],expectedEnglishCandidate=expected_text,sourceLanguage=source['language'],nativeText=results.get('native',{}).get('text'),nativeLanguage=results.get('native',{}).get('language'),nativeLanguageProbability=results.get('native',{}).get('languageProbability'),timelineText=results.get('timeline',{}).get('text'),timelineLanguage=results.get('timeline',{}).get('language'),timelineLanguageProbability=results.get('timeline',{}).get('languageProbability'),retimeSpeed=take.get('retimeSpeed'),rawVideoInputs=len(request.get('videos',[])),imageInputs=len(request.get('images',[])),audioInputs=len(request.get('audios',[])),prompt=take['prompt'],flags=flags,status='requires-human-review',audioApproved=False)
  report.append(row);save(a.out/'scene-audio-audit.json',dict(createdAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),plan=str(a.plan.resolve()),sourceLanguage=source['language'],sourceLanguageProbability=source['languageProbability'],sourceText=source['text'],rows=report,complete=False,note='ASR suggestions only; do not automatically approve intelligibility, exact words, voice identity, speaker ownership or lip sync.'))
  print(json.dumps(dict(status='scene-audited',number=s['number'],flags=flags)),flush=True)
 result=read(a.out/'scene-audio-audit.json');result['complete']=True;save(a.out/'scene-audio-audit.json',result);print(json.dumps(dict(status='audit-complete',scenes=len(report),file=str(a.out/'scene-audio-audit.json'))),flush=True)
if __name__=='__main__':main()
