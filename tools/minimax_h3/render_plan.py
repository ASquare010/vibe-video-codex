"""Resumable H3 requests using the installed client. One explicit local request specification per take."""
import argparse, hashlib, json, sys, time
from pathlib import Path
from client import Client

def save(path,value):
    temporary=path.with_suffix(path.suffix+'.tmp')
    temporary.write_text(json.dumps(value,indent=2),encoding='utf-8')
    temporary.replace(path)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--spec',required=True,type=Path)
    ap.add_argument('--url',default='http://127.0.0.1:7860')
    ap.add_argument('--submit-only',action='store_true')
    ap.add_argument('--collect-only',action='store_true')
    ap.add_argument('--status',action='store_true')
    args=ap.parse_args();spec=json.loads(args.spec.read_text(encoding='utf-8-sig'))
    folder=args.spec.resolve().parent;statefile=folder/'job-state.json'
    state=json.loads(statefile.read_text(encoding='utf-8')) if statefile.exists() else {}
    client=Client(args.url)
    if state.get('jobId'):
        if args.submit_only and (folder/'request-intent.json').exists():
            original=json.loads((folder/'request-intent.json').read_text(encoding='utf-8'))
            current_prompt=Path(spec['promptFile']).read_text(encoding='utf-8') if spec.get('promptFile') else spec['prompt']
            if original['prompt']!=current_prompt or original['settings']!=spec['settings'] or original['inputs']!={'images':spec.get('images',[]),'videos':spec.get('videos',[]),'audios':spec.get('audios',[])}:
                raise SystemExit('Request changed for a saved job. Resume with collect-only, or create an explicit new take folder.')
        job=client.request('/v1/jobs/'+state['jobId'])
        if args.status or args.submit_only:
            print(json.dumps({k:job.get(k) for k in ['id','status','error','actual_duration','reference_labels','started_at','finished_at']}));return
        if job['status']=='completed' and Path(spec['output']).is_file() and Path(spec['output']).with_suffix('.job.json').is_file():
            print(json.dumps(dict(id=job['id'],status='downloaded',file=spec['output'])));return
        client.wait(job['id'],spec['output']);return
    if args.status or args.collect_only:
        raise SystemExit('No recorded job ID; this operation will not submit a new job.')
    health=client.request('/v1/health')
    if not health.get('ready'):raise SystemExit('H3 backend is not ready; no submission made.')
    prompt=Path(spec['promptFile']).read_text(encoding='utf-8') if spec.get('promptFile') else spec['prompt']
    inputs={'images':spec.get('images',[]),'videos':spec.get('videos',[]),'audios':spec.get('audios',[])}
    identities={}
    for group,items in inputs.items():
        for item in items:
            f=Path(item['path'] if isinstance(item,dict) else item).resolve(strict=True)
            identities[str(f)]=hashlib.sha256(f.read_bytes()).hexdigest()
            if isinstance(item,dict) and item.get('audio_path'):
                replacement=Path(item['audio_path']).resolve(strict=True)
                identities[str(replacement)]=hashlib.sha256(replacement.read_bytes()).hexdigest()
    intent=dict(prompt=prompt,inputs=inputs,settings=spec['settings'],fileHashes=identities)
    digest=hashlib.sha256(json.dumps(intent,sort_keys=True).encode()).hexdigest()
    if state.get('intentHash') and state['intentHash']!=digest:
        raise SystemExit('Request inputs changed in an existing take folder. Create a new explicitly reviewed take specification.')
    state.update(intentHash=digest,createdAt=state.get('createdAt',time.time()),uploads=state.get('uploads',{}))
    save(folder/'request-intent.json',intent);save(statefile,state)
    def upload(file):
        key=str(Path(file).resolve());checksum=identities[key]
        cached=state['uploads'].get(key)
        if cached and cached['sha256']==checksum:return cached['id']
        result=client.upload(key);state['uploads'][key]=dict(id=result,sha256=checksum);save(statefile,state);return result
    payload=dict(spec['settings'],prompt=prompt,images=[upload(f) for f in inputs['images']],videos=[],audios=[upload(f) for f in inputs['audios']])
    for video in inputs['videos']:
        v={k:video[k] for k in ['use_audio','start','duration'] if k in video};v['file_id']=upload(video['path'])
        if video.get('audio_path'):v['audio_file_id']=upload(video['audio_path'])
        payload['videos'].append(v)
    save(folder/'request.json',payload)
    # Recover a response lost between queueing and saving its ID.
    matches=[j for j in client.request('/v1/jobs') if all(j['request'].get(k)==v for k,v in payload.items())]
    if matches:
        job=sorted(matches,key=lambda j:j['created_at'])[0]
    elif state.get('submissionUncertain'):
        raise SystemExit('Previous submission outcome is uncertain and no matching job is listed. Investigate before allowing a duplicate.')
    else:
        state['submissionUncertain']=True;save(statefile,state)
        job=client.request('/v1/jobs',payload)
    state.update(jobId=job['id'],submissionUncertain=False);save(statefile,state);save(folder/'submission.json',job)
    print(json.dumps(dict(id=job['id'],status=job['status'],reference_labels=job.get('reference_labels'),output=spec['output'])),flush=True)
    if not args.submit_only:client.wait(job['id'],spec['output'])

if __name__=='__main__':main()
