"""Private durable Qwen image-job API; ComfyUI owns all GPU execution."""
from __future__ import annotations
from contextlib import asynccontextmanager
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import threading
import time
from typing import Literal
import uuid

import httpx
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, ConfigDict, Field, model_validator
from idle_unload import IdleUnloader

ROOT = Path(os.environ.get('H3_ROOT', '/opt/minimax-h3')).resolve()
STATE = Path(os.environ.get('QWEN_STATE', ROOT / 'qwen-image-api/state')).resolve()
COMFY = ROOT / 'ComfyUI'
BACKEND = os.environ.get('COMFY_URL', 'http://127.0.0.1:8188')
VIDEO_API = os.environ.get('H3_URL', 'http://127.0.0.1:7860')
LOCK = threading.RLock()
STOP = threading.Event()
MEMORY_POLICY = None
TERMINAL = {'completed', 'failed', 'cancelled', 'submission_unknown', 'needs_attention'}
MAX_UPLOAD = 128 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 40_000_000


def atomic(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    with tmp.open('w', encoding='utf-8') as f:
        json.dump(value, f, ensure_ascii=False, indent=2)
        f.flush()
        os.fsync(f.fileno())
    tmp.replace(path)


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def safe_id(value):
    try:
        return str(uuid.UUID(value))
    except (ValueError, TypeError, AttributeError):
        raise HTTPException(404, 'Unknown ID')


def load(path):
    if not path.is_file():
        raise HTTPException(404, 'Not found')
    return json.loads(path.read_text(encoding='utf-8'))


def job_get(job_id):
    with LOCK:
        return load(STATE / 'jobs' / (safe_id(job_id) + '.json'))


def update(job_id, **changes):
    with LOCK:
        j = job_get(job_id)
        j.update(changes, updated_at=time.time())
        atomic(STATE / 'jobs' / (j['id'] + '.json'), j)
        return j


def jobs():
    with LOCK:
        return [load(p) for p in sorted((STATE / 'jobs').glob('*.json'))
                if p.stem.count('.') == 0]


def uploaded(file_id):
    r = load(STATE / 'uploads' / (safe_id(file_id) + '.json'))
    p = STATE / 'uploads' / r['stored_name']
    if p.parent != STATE / 'uploads' or not p.is_file():
        raise HTTPException(404, 'Uploaded image is missing')
    return r, p


class Generation(BaseModel):
    model_config = ConfigDict(extra='forbid')
    prompt: str = Field(min_length=1, max_length=50000)
    images: list[str] = Field(min_length=1, max_length=10)
    precision: Literal['int8', 'bf16'] = 'int8'
    resolution: int = Field(0, ge=0, le=2048, multiple_of=32)
    width: int | None = Field(None, ge=256, le=2048, multiple_of=32)
    height: int | None = Field(None, ge=256, le=2048, multiple_of=32)
    steps: int = Field(25, ge=1, le=100)
    cfg: float = Field(1, ge=1, le=10)
    negative_prompt: str = Field('', max_length=50000)
    sampler: Literal['euler', 'heun', 'dpmpp_2m', 'res_multistep'] = 'euler'
    scheduler: Literal['simple', 'normal', 'beta', 'karras'] = 'simple'
    seed: int = Field(-1, ge=-1, le=2**63 - 1)
    refine_prompt: bool = False
    thinking: bool = True
    max_length: int = Field(4096, ge=128, le=24000)
    unload_after: bool = Field(True, description='Compatibility field; shared automatic unloading is always enabled after all jobs finish')

    @model_validator(mode='after')
    def dimensions(self):
        if (self.width is None) != (self.height is None):
            raise ValueError('Supply width and height together, or omit both to follow image1')
        if self.refine_prompt and not self.thinking:
            raise ValueError('Enable thinking when enabling the official prompt enhancer')
        return self


def graph_for(r: Generation, job_id: str, names: list[str], system_prompt=''):
    g = {}
    def node(key, kind, **inputs):
        g[key] = {'class_type': kind, 'inputs': inputs}
        return [key, 0]
    suffix = 'int8_convrot' if r.precision == 'int8' else 'bf16'
    model = node('model', 'UNETLoader', unet_name=f'qwen_image_2.1_{suffix}.safetensors', weight_dtype='default')
    model = node('cache', 'QwenImage21Cache', model=model, device='auto', dtype='default')
    clip = node('clip', 'CLIPLoader', clip_name=f'qwen3vl_8b_{suffix}.safetensors', type='qwen_image', device='default')
    vae = node('vae', 'VAELoader', vae_name='qwen_image_2.1_vae_bf16.safetensors')
    refs = [node(f'image_{i+1}', 'LoadImage', image=name) for i, name in enumerate(names)]
    prompt = r.prompt
    if r.refine_prompt:
        pe = node('enhancer_model', 'CLIPLoader', clip_name='qwen3.5_9b_qwen_image_2.1_pe_i2i.int8_convrot.safetensors', type='qwen_image', device='default')
        batch = node('enhancer_images', 'BatchImagesNode', **{f'images.image{i}': x for i, x in enumerate(refs)})
        prompt = node('enhanced_prompt', 'TextGenerate', clip=pe, image=batch, prompt=r.prompt,
                      system_prompt=system_prompt, max_length=r.max_length, thinking=True,
                      use_default_template=True, mtp='auto', sampling_mode={
                          'sampling_mode': 'on', 'temperature': 1.0, 'top_k': 20, 'top_p': 0.95,
                          'min_p': 0.0, 'repetition_penalty': 1.0, 'presence_penalty': 0.0, 'seed': r.seed})
    node('encode', 'TextEncodeQwenImage21', clip=clip, vae=vae, prompt=prompt,
         negative_prompt=r.negative_prompt, resolution=r.resolution,
         **{f'images.image_{i+1}': x for i, x in enumerate(refs)})
    latent = ['encode', 2]
    if r.width is not None:
        latent = node('canvas', 'EmptyLatentImage', width=r.width, height=r.height, batch_size=1)
    samples = node('sample', 'KSampler', model=model, positive=['encode', 0], negative=['encode', 1],
                   latent_image=latent, seed=r.seed, steps=r.steps, cfg=r.cfg,
                   sampler_name=r.sampler, scheduler=r.scheduler, denoise=1.0)
    pixels = node('decode', 'VAEDecode', samples=samples, vae=vae)
    node('save', 'SaveImage', images=pixels, filename_prefix=f'qwen_api/{job_id}')
    return g


def enhancer_system():
    w = load(ROOT / 'qwen-image-2.1-install/official-image-edit.json')
    for group in w['definitions']['subgraphs']:
        for n in group['nodes']:
            if n['type'] == 'PrimitiveStringMultiline':
                return n['widgets_values'][0]
    raise HTTPException(503, 'Official prompt-enhancer system prompt is missing')


def validate_request(r):
    refs = [uploaded(i)[0] for i in r.images]
    try:
        with httpx.Client(timeout=15) as c:
            info = c.get(BACKEND + '/object_info').raise_for_status().json()
    except httpx.HTTPError as e:
        raise HTTPException(503, 'ComfyUI unavailable') from e
    graph = graph_for(r.model_copy(update={'seed': max(0, r.seed)}), str(uuid.uuid4()),
                      ['qwen_api_validation.png'] * len(refs), enhancer_system() if r.refine_prompt else '')
    for n in graph.values():
        schema = info.get(n['class_type'])
        if not schema:
            raise HTTPException(503, 'Required node missing: ' + n['class_type'])
        for key, v in n['inputs'].items():
            definition = schema.get('input', {}).get('required', {}).get(key)
            if definition and isinstance(definition[0], list) and isinstance(v, str) and v not in definition[0] and key != 'image':
                raise HTTPException(422, f'Unavailable {key}: {v}')
    return refs


def prepare(j):
    r = Generation.model_validate(j['request'])
    names = []
    for i, fid in enumerate(r.images):
        meta, source = uploaded(fid)
        if digest(source) != meta['sha256']:
            raise RuntimeError('Uploaded reference changed: ' + fid)
        name = f'qwen_api/{j["id"]}/ref_{i+1}{source.suffix}'
        dest = COMFY / 'input' / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists() and digest(dest) != meta['sha256']:
            raise RuntimeError('Prepared reference differs; preserved')
        if not dest.exists():
            shutil.copyfile(source, dest)
        names.append(name)
    g = graph_for(r, j['id'], names, enhancer_system() if r.refine_prompt else '')
    atomic(STATE / 'jobs' / (j['id'] + '.workflow.json'), g)
    return g


def backend_snapshot(c, prompt_id):
    history = c.get('/history/' + prompt_id).raise_for_status().json().get(prompt_id)
    queue = c.get('/queue').raise_for_status().json()
    present = any(x[1] == prompt_id for key in ('queue_running', 'queue_pending') for x in queue.get(key, []))
    return history, present


def collect(j, entry):
    if entry.get('status', {}).get('status_str') == 'error':
        raise RuntimeError('ComfyUI execution failed: ' + json.dumps(entry.get('status', {}).get('messages', []))[-6000:])
    images = entry.get('outputs', {}).get('save', {}).get('images', [])
    if not images:
        raise RuntimeError('Completed workflow has no saved image')
    image = images[0]
    if image.get('type') != 'output':
        raise RuntimeError('Unexpected output location')
    output_root = (COMFY / 'output').resolve()
    source = (output_root / image.get('subfolder', '') / image['filename']).resolve()
    if not source.is_relative_to(output_root) or not source.is_file():
        raise RuntimeError('Output missing or outside ComfyUI output directory')
    dest = STATE / 'outputs' / (j['id'] + '.png')
    dest.parent.mkdir(exist_ok=True)
    temp = dest.with_suffix('.png.part')
    shutil.copyfile(source, temp)
    with Image.open(temp) as im:
        width, height = im.size
        if im.format != 'PNG':
            raise RuntimeError('Unexpected image format')
        im.verify()
    temp.replace(dest)
    atomic(STATE / 'jobs' / (j['id'] + '.history.json'), entry)
    return update(j['id'], status='completed', output=str(dest), source_output=str(source),
                  width=width, height=height, output_sha256=digest(dest), finished_at=time.time(),
                  download_url=f'/v1/jobs/{j["id"]}/output', error=None)


def video_idle():
    with httpx.Client(timeout=10) as c:
        h = c.get(VIDEO_API + '/v1/health').raise_for_status().json()
    return h.get('active_job') is None and h.get('queue_length') == 0


def run_job(j):
    job_id = j['id']
    with httpx.Client(base_url=BACKEND, timeout=60) as c:
        with LOCK:
            j = job_get(job_id)
            if j['status'] in TERMINAL:
                return
        if not j.get('prompt_id'):
            with LOCK:
                if job_get(job_id)['status'] in TERMINAL:
                    return
                update(job_id, status='preparing')
            graph = prepare(j)
            while not STOP.is_set():
                if job_get(job_id).get('cancel_requested'):
                    update(job_id, status='cancelled', finished_at=time.time())
                    return
                try:
                    q = c.get('/queue').raise_for_status().json()
                    if not q.get('queue_running') and not q.get('queue_pending') and video_idle():
                        break
                except httpx.HTTPError:
                    pass
                STOP.wait(3)
            if STOP.is_set():
                return
            # Persist a chosen backend UUID BEFORE the one and only POST.
            pid = str(uuid.uuid4())
            with LOCK:
                if job_get(job_id).get('cancel_requested'):
                    update(job_id, status='cancelled', finished_at=time.time())
                    return
                j = update(job_id, status='submitting', prompt_id=pid, submission_started_at=time.time())
            try:
                response = c.post('/prompt', json={'prompt': graph, 'prompt_id': pid, 'client_id': 'qwen-api-' + job_id})
                if response.status_code != 200:
                    raise RuntimeError('ComfyUI rejected the workflow: ' + response.text[:6000])
                if response.json()['prompt_id'] != pid:
                    raise RuntimeError('Unexpected backend prompt ID; inspect before retry')
                j = update(job_id, status='running', started_at=time.time())
            except httpx.HTTPError as e:
                update(job_id, status='submission_unknown', error=f'Submission response uncertain; preserve prompt ID and inspect, never automatically resubmit: {e}')
                return
        missing = 0
        while not STOP.is_set():
            try:
                j = job_get(job_id)
                entry, present = backend_snapshot(c, j['prompt_id'])
                if entry:
                    if j.get('cancel_requested'):
                        update(job_id, status='cancelled', finished_at=time.time())
                    else:
                        collect(j, entry)
                    return
                if j.get('cancel_requested'):
                    c.post('/queue', json={'delete': [j['prompt_id']]}).raise_for_status()
                    c.post('/interrupt', json={'prompt_id': j['prompt_id']}).raise_for_status()
                    update(job_id, status='cancelled', finished_at=time.time())
                    return
                missing = 0 if present else missing + 1
                if missing >= 3:
                    update(job_id, status='needs_attention', error='Saved backend prompt ID is absent from queue/history. No resubmission performed.')
                    return
                if j['status'] != 'running':
                    update(job_id, status='running')
            except httpx.HTTPError as e:
                update(job_id, last_poll_error=str(e))
            STOP.wait(3)


def worker():
    while not STOP.is_set():
        pending = sorted((j for j in jobs() if j.get('status') not in TERMINAL), key=lambda j: j['created_at'])
        if not pending:
            STOP.wait(1)
            continue
        j = pending[0]
        try:
            run_job(j)
        except Exception as e:
            update(j['id'], status='failed', error=str(e), finished_at=time.time())


@asynccontextmanager
async def lifespan(app):
    global MEMORY_POLICY
    import fcntl
    for name in ('jobs', 'uploads', 'outputs', 'keys'):
        (STATE / name).mkdir(parents=True, exist_ok=True)
    lock = (STATE / 'worker.lock').open('a+')
    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    for index in (STATE / 'keys').glob('*.json'):
        saved = load(index)
        dest = STATE / 'jobs' / (saved['job_id'] + '.json')
        if not dest.exists():
            atomic(dest, saved['job'])
    STOP.clear()
    threads = []
    MEMORY_POLICY = IdleUnloader(BACKEND, VIDEO_API,
        lambda: any(j['status'] not in TERMINAL for j in jobs()), STATE / 'auto-unload.json')
    if os.environ.get('QWEN_DISABLE_WORKER') != '1':
        for target in (worker, lambda: MEMORY_POLICY.run(STOP)):
            thread = threading.Thread(target=target, daemon=True)
            thread.start()
            threads.append(thread)
    yield
    STOP.set()
    for thread in threads:
        thread.join(timeout=65)
    lock.close()


app = FastAPI(title='Qwen Image 2.1 private job API', version='1.0.0', lifespan=lifespan)


@app.get('/v1/health')
def health():
    try:
        with httpx.Client(timeout=10) as c:
            stats = c.get(BACKEND + '/system_stats').raise_for_status().json()
        ready = True
    except httpx.HTTPError:
        stats, ready = None, False
    pending = [j for j in jobs() if j['status'] not in TERMINAL]
    return {'ready': ready, 'model': 'Qwen Image 2.1', 'backend': ready, 'active_jobs': [j['id'] for j in pending],
            'queue_length': len(pending), 'system': stats, 'inference_on_health_check': False,
            'auto_unload': MEMORY_POLICY.status() if MEMORY_POLICY else {'enabled': True, 'phase': 'starting'}}


@app.get('/v1/memory')
def memory_status():
    return MEMORY_POLICY.status() if MEMORY_POLICY else {'enabled': True, 'phase': 'starting'}


@app.get('/v1/config')
def config():
    return {'model': 'Qwen Image 2.1', 'request_schema': Generation.model_json_schema(),
            'reference_tags': '<image1> through <image10>; first image is the edit target',
            'idempotency': 'Idempotency-Key header is required; replaying the same key/body returns the same job',
            'states': sorted(TERMINAL | {'queued', 'preparing', 'submitting', 'running'}),
            'auto_unload': {'enabled': True, 'after_all_image_video_and_comfy_jobs': True, 'idle_seconds': 5, 'keep_loaded_override': False},
            'shared_gpu': 'Uses the existing ComfyUI queue; waits for MiniMax and ComfyUI to be idle before submission'}


@app.post('/v1/files', status_code=201)
async def upload(file: UploadFile = File(...)):
    tmp = STATE / 'uploads' / (str(uuid.uuid4()) + '.part')
    size = 0
    try:
        with tmp.open('wb') as f:
            while data := await file.read(1024 * 1024):
                size += len(data)
                if size > MAX_UPLOAD:
                    raise HTTPException(413, 'Image upload exceeds 128 MiB')
                f.write(data)
        try:
            with Image.open(tmp) as im:
                width, height, fmt = *im.size, im.format
                if width * height > Image.MAX_IMAGE_PIXELS or fmt not in {'PNG', 'JPEG', 'WEBP', 'BMP'}:
                    raise HTTPException(400, 'Unsupported image format or image exceeds 40 million pixels')
                im.verify()
        except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as e:
            raise HTTPException(400, 'Invalid image') from e
        sha = digest(tmp)
        fid = str(uuid.uuid5(uuid.NAMESPACE_URL, 'qwen-image21:' + sha))
        ext = {'PNG': '.png', 'JPEG': '.jpg', 'WEBP': '.webp', 'BMP': '.bmp'}[fmt]
        meta = {'id': fid, 'kind': 'image', 'name': Path(file.filename or 'image').name,
                'stored_name': fid + ext, 'bytes': size, 'sha256': sha, 'width': width, 'height': height}
        with LOCK:
            path = STATE / 'uploads' / (fid + '.json')
            if path.exists():
                return load(path)
            tmp.replace(STATE / 'uploads' / meta['stored_name'])
            atomic(path, meta)
        return meta
    finally:
        tmp.unlink(missing_ok=True)
        await file.close()


@app.post('/v1/validate')
def validate(r: Generation):
    refs = validate_request(r)
    return {'valid': True, 'validation': 'reference, model and node availability; no inference',
            'reference_labels': [f'<image{i+1}>: {x["id"]}' for i, x in enumerate(refs)]}


@app.post('/v1/jobs', status_code=201)
def submit(r: Generation, idempotency_key: str = Header(min_length=8, max_length=128)):
    fingerprint = hashlib.sha256(json.dumps(r.model_dump(), sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    key = hashlib.sha256(idempotency_key.encode()).hexdigest()
    with LOCK:
        index = STATE / 'keys' / (key + '.json')
        if index.exists():
            old = load(index)
            if old['fingerprint'] != fingerprint:
                raise HTTPException(409, 'Idempotency key already belongs to a different request')
            dest = STATE / 'jobs' / (old['job_id'] + '.json')
            if not dest.exists():
                atomic(dest, old['job'])
            return job_get(old['job_id'])
        refs = validate_request(r)
        if r.seed == -1:
            r.seed = secrets.randbelow(2**63)
        job_id = str(uuid.uuid4())
        j = {'id': job_id, 'status': 'queued', 'created_at': time.time(), 'updated_at': time.time(),
             'request': r.model_dump(), 'fingerprint': fingerprint, 'prompt_id': None, 'error': None,
             'reference_labels': [f'<image{i+1}>: {x["id"]}' for i, x in enumerate(refs)],
             'input_sha256': [x['sha256'] for x in refs], 'output': None,
             'cost': {'generation_api_fee': 0, 'infrastructure_usd': None, 'infrastructure_status': 'unpriced'}}
        # The index embeds the job so an interrupted two-file commit can be reconciled safely.
        atomic(index, {'fingerprint': fingerprint, 'job_id': job_id, 'job': j})
        atomic(STATE / 'jobs' / (job_id + '.json'), j)
        return j


@app.get('/v1/jobs')
def list_jobs():
    return sorted(jobs(), key=lambda j: j['created_at'], reverse=True)


@app.get('/v1/jobs/{job_id}')
def status(job_id: str):
    return job_get(job_id)


@app.get('/v1/jobs/{job_id}/output')
def output(job_id: str):
    j = job_get(job_id)
    if j['status'] != 'completed':
        raise HTTPException(409, 'Job is not completed')
    path = STATE / 'outputs' / (j['id'] + '.png')
    if not path.is_file():
        raise HTTPException(404, 'Saved output is missing; original backend output and history are retained')
    return FileResponse(path, media_type='image/png', filename=j['id'] + '.png')


@app.post('/v1/jobs/{job_id}/cancel')
def cancel(job_id: str):
    with LOCK:
        j = job_get(job_id)
        if j['status'] in TERMINAL:
            return j
        if j['status'] == 'queued':
            return update(j['id'], status='cancelled', finished_at=time.time())
        return update(j['id'], cancel_requested=True)
