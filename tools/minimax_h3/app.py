"""Private MiniMax H3 job API and Gradio UI backed by native ComfyUI nodes."""
from __future__ import annotations

from contextlib import asynccontextmanager
import json
import os
from pathlib import Path
import queue
import secrets
import shutil
import subprocess
import threading
import time
from typing import Literal
import uuid

import gradio as gr
import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, ConfigDict, Field, model_validator

ROOT = Path(os.environ.get('H3_ROOT', '/opt/minimax-h3')).resolve()
COMFY = ROOT / 'ComfyUI'
STATE = ROOT / 'state'
UPLOADS = STATE / 'uploads'
JOBS = STATE / 'jobs'
COMFY_URL = os.environ.get('COMFY_URL', 'http://127.0.0.1:8188')
for directory in (UPLOADS, JOBS):
    directory.mkdir(parents=True, exist_ok=True)
PENDING: queue.Queue[str] = queue.Queue()
LOCK = threading.RLock()
ACTIVE: str | None = None
TERMINAL = {'completed', 'failed', 'cancelled'}
IMAGE_EXT = {'.png', '.jpg', '.jpeg', '.webp', '.bmp'}
VIDEO_EXT = {'.mp4', '.mov', '.mkv', '.webm', '.avi'}
AUDIO_EXT = {'.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac', '.opus'}


class VideoRef(BaseModel):
    model_config = ConfigDict(extra='forbid')
    file_id: str
    use_audio: bool = True
    audio_file_id: str | None = None
    start: float = Field(0, ge=0)
    duration: float = Field(15, ge=0.21, le=15)


class Generation(BaseModel):
    model_config = ConfigDict(extra='forbid')
    prompt: str = Field(min_length=1, max_length=50000)
    images: list[str] = Field(default_factory=list, max_length=9)
    videos: list[VideoRef] = Field(default_factory=list, max_length=3)
    audios: list[str] = Field(default_factory=list, max_length=3)
    width: int = Field(864, ge=32, le=16384, multiple_of=32)
    height: int = Field(480, ge=32, le=16384, multiple_of=32)
    duration: float = Field(5, ge=0.21, le=149.6)
    length: int | None = Field(None, ge=5, le=3592)
    ref_image_size: Literal['match', 'max'] = 'match'
    seed: int = Field(-1, ge=-1, le=2**63 - 1)
    steps: int = Field(4, ge=1, le=100)
    turbo: bool = True
    lora_strength: float = Field(1, ge=0, le=2)
    sampler: Literal['res_multistep', 'euler', 'heun', 'dpmpp_2m'] = 'res_multistep'
    scheduler: Literal['beta', 'normal', 'simple'] = 'beta'
    shift_video: float = Field(12, ge=0.01, le=100)
    shift_audio: float = Field(3, ge=0.01, le=100)
    embeddings: list[str] = Field(default_factory=list, max_length=10)

    @model_validator(mode='after')
    def check_files(self):
        for file_id in self.images:
            uploaded(file_id, 'image')
        for video in self.videos:
            uploaded(video.file_id, 'video')
            if video.audio_file_id:
                uploaded(video.audio_file_id, 'audio')
        for file_id in self.audios:
            uploaded(file_id, 'audio')
        for embedding in self.embeddings:
            if embedding not in embedding_names():
                raise ValueError(f'Unknown embedding: {embedding}')
        return self

    def frames(self):
        requested = self.length if self.length is not None else max(5, round(self.duration * 24))
        return requested + (5 - requested % 17) % 17


def embedding_names():
    return sorted(p.stem for p in (COMFY / 'models/embeddings').glob('minimaxh3_*.safetensors'))


def safe_id(value):
    try:
        return str(uuid.UUID(value))
    except (ValueError, TypeError):
        raise HTTPException(404, 'Unknown ID')


def uploaded(file_id, kind=None):
    file_id = safe_id(file_id)
    meta = UPLOADS / f'{file_id}.json'
    if not meta.exists():
        raise ValueError(f'Upload not found: {file_id}')
    record = json.loads(meta.read_text())
    if kind and record['kind'] != kind:
        raise ValueError(f'Expected {kind}: {file_id}')
    return UPLOADS / record['stored_name']


def upload_record(file_id, name, size):
    ext = Path(name).suffix.lower()
    kind = 'image' if ext in IMAGE_EXT else 'video' if ext in VIDEO_EXT else 'audio' if ext in AUDIO_EXT else None
    if kind is None:
        raise HTTPException(400, 'Unsupported media extension')
    return {'id': file_id, 'name': Path(name).name, 'stored_name': file_id + ext, 'kind': kind, 'bytes': size}


def save_json(path, value):
    with LOCK:
        temporary = path.with_suffix('.tmp')
        temporary.write_text(json.dumps(value, indent=2), encoding='utf-8')
        temporary.replace(path)


def job_get(job_id):
    path = JOBS / f'{safe_id(job_id)}.json'
    if not path.exists():
        raise HTTPException(404, 'Job not found')
    with LOCK:
        return json.loads(path.read_text())


def job_update(job_id, **changes):
    with LOCK:
        job = job_get(job_id)
        job.update(changes, updated_at=time.time())
        save_json(JOBS / f'{job_id}.json', job)
        return job


def submit(request: Generation):
    manifest = ROOT / 'models-manifest.json'
    if not manifest.exists():
        raise HTTPException(503, 'Model downloads are not complete')
    try:
        with httpx.Client(timeout=5) as client:
            client.get(COMFY_URL + '/system_stats').raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(503, 'The GPU backend is starting or unavailable; check /v1/health')
    job_id = str(uuid.uuid4())
    if request.seed == -1:
        request.seed = secrets.randbelow(2**63)
    job = {'id': job_id, 'status': 'queued', 'created_at': time.time(), 'updated_at': time.time(),
           'request': request.model_dump(), 'frames': request.frames(), 'fps': 24, 'actual_duration': request.frames() / 24,
           'prompt_id': None, 'error': None, 'output': None}
    save_json(JOBS / f'{job_id}.json', job)
    PENDING.put(job_id)
    return job


def ffmpeg(args):
    result = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', *args], capture_output=True, text=True, timeout=300)
    if result.returncode:
        raise RuntimeError('Reference media could not be decoded: ' + result.stderr[-2000:])


def build_graph(request: Generation, job_id):
    graph = {}

    def node(key, class_type, **inputs):
        graph[key] = {'class_type': class_type, 'inputs': inputs}
        return [key, 0]

    model = node('model', 'UNETLoader', unet_name='minimax_h3_ref2va_pruned_int8_convrot.safetensors', weight_dtype='default')
    clip = node('clip', 'CLIPLoader', clip_name='qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors', type='minimax', device='default')
    vae = node('vae', 'VAELoader', vae_name='minimax_h3_video_vae_int8_convrot.safetensors')
    audio_vae = node('audio_vae', 'VAELoader', vae_name='minimax_h3_audio_vae_fp32.safetensors')
    if request.turbo:
        model = node('turbo', 'LoraLoaderModelOnly', model=model, lora_name='minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors', strength_model=request.lora_strength)
    model = node('shift', 'MiniMaxH3SigmaShift', model=model, shift_video=request.shift_video, shift_audio=request.shift_audio)
    prompt = request.prompt
    if request.embeddings:
        prompt += '\n' + ' '.join('embedding:' + name for name in request.embeddings)
    ref = {'clip': clip, 'vae': vae, 'audio_vae': audio_vae, 'prompt': prompt, 'width': request.width,
           'height': request.height, 'length': request.frames(), 'ref_image_size': request.ref_image_size}
    input_dir = COMFY / 'input'
    input_dir.mkdir(exist_ok=True)
    prepared = []
    for i, file_id in enumerate(request.images):
        source = uploaded(file_id, 'image')
        name = f'h3_{job_id}_image_{i}{source.suffix}'
        shutil.copyfile(source, input_dir / name)
        prepared.append(name)
        ref[f'ref_images.ref_image_{i}'] = node(f'image_{i}', 'LoadImage', image=name)
    audio_index = 1
    labels = [f'<Picture {i+1}>: {file_id}' for i, file_id in enumerate(request.images)]
    for i, video in enumerate(request.videos):
        source = uploaded(video.file_id, 'video')
        name = f'h3_{job_id}_video_{i}.mp4'
        seconds = min(video.duration, request.frames() / 24)
        ffmpeg(['-ss', str(video.start), '-i', str(source), '-t', str(seconds), '-map', '0:v:0', '-an', '-vf', "fps=24,scale=w='if(gte(iw,ih),min(iw,1344),min(iw,768))':h='if(gte(iw,ih),min(ih,768),min(ih,1344))':force_original_aspect_ratio=decrease:force_divisible_by=2", '-c:v', 'libx264', '-preset', 'fast', '-crf', '16', str(input_dir / name)])
        prepared.append(name)
        loaded = node(f'video_{i}', 'LoadVideo', file=name)
        parts = node(f'video_parts_{i}', 'GetVideoComponents', video=loaded)
        ref[f'ref_videos.ref_video_{i}'] = parts
        if video.audio_file_id or video.use_audio:
            audio_source = uploaded(video.audio_file_id, 'audio') if video.audio_file_id else source
            probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=index', '-of', 'csv=p=0', str(audio_source)], capture_output=True, text=True, timeout=30, check=True)
            if probe.stdout.strip():
                audio_name = f'h3_{job_id}_video_audio_{i}.wav'
                ffmpeg(['-ss', str(0 if video.audio_file_id else video.start), '-i', str(audio_source), '-t', str(seconds), '-vn', '-ac', '2', '-ar', '32000', str(input_dir / audio_name)])
                prepared.append(audio_name)
                ref[f'ref_video_audios.ref_video_audio_{i}'] = node(f'video_audio_{i}', 'LoadAudio', audio=audio_name)
                labels.append(f'<Audio {audio_index}>: soundtrack of <Video {i+1}>')
                audio_index += 1
        labels.append(f'<Video {i+1}>: {video.file_id}')
    for i, file_id in enumerate(request.audios):
        name = f'h3_{job_id}_audio_{i}.wav'
        ffmpeg(['-i', str(uploaded(file_id, 'audio')), '-t', '15', '-vn', '-ac', '2', '-ar', '32000', str(input_dir / name)])
        prepared.append(name)
        ref[f'ref_audios.ref_audio_{i}'] = node(f'audio_{i}', 'LoadAudio', audio=name)
        labels.append(f'<Audio {audio_index}>: {file_id}')
        audio_index += 1
    conditioning = node('reference', 'MiniMaxH3ReferenceToVideo', **ref)
    guider = node('guider', 'BasicGuider', model=model, conditioning=conditioning)
    noise = node('noise', 'RandomNoise', noise_seed=request.seed)
    sampler = node('sampler', 'KSamplerSelect', sampler_name=request.sampler)
    sigmas = node('sigmas', 'BasicScheduler', model=model, scheduler=request.scheduler, steps=request.steps, denoise=1)
    latent = node('sample', 'SamplerCustomAdvanced', noise=noise, guider=guider, sampler=sampler, sigmas=sigmas, latent_image=['reference', 1])
    images = node('decode', 'VAEDecode', samples=latent, vae=vae)
    audio = node('decode_audio', 'VAEDecodeAudio', samples=latent, vae=audio_vae)
    video = node('create_video', 'CreateVideo', images=images, audio=audio, fps=24, bit_depth=8)
    node('save', 'SaveVideo', video=video, filename_prefix=f'h3/{job_id}', format='mp4', codec={'codec': 'h264'})
    job_update(job_id, reference_labels=labels, prepared_files=prepared)
    return graph


def worker():
    global ACTIVE
    while True:
        job_id = PENDING.get()
        try:
            if job_get(job_id)['status'] == 'cancelled':
                continue
            with LOCK:
                ACTIVE = job_id
                job_update(job_id, status='preparing')
            request = Generation.model_validate(job_get(job_id)['request'])
            graph = build_graph(request, job_id)
            save_json(JOBS / f'{job_id}.workflow.json', graph)
            with httpx.Client(base_url=COMFY_URL, timeout=60) as client:
                with LOCK:
                    if job_get(job_id)['status'] == 'cancelled':
                        continue
                    response = client.post('/prompt', json={'prompt': graph, 'client_id': 'h3-' + job_id})
                    if response.status_code != 200:
                        raise RuntimeError('ComfyUI rejected the workflow: ' + response.text[:8000])
                    prompt_id = response.json()['prompt_id']
                    job_update(job_id, status='running', prompt_id=prompt_id, started_at=time.time())
                while True:
                    if job_get(job_id)['status'] == 'cancelled':
                        # Remove only this job; interrupt only if it is the running prompt.
                        client.post('/queue', json={'delete': [prompt_id]}).raise_for_status()
                        running = client.get('/queue').json().get('queue_running', [])
                        if any(item[1] == prompt_id for item in running):
                            client.post('/interrupt', json={}).raise_for_status()
                        break
                    history = client.get('/history/' + prompt_id)
                    history.raise_for_status()
                    entry = history.json().get(prompt_id)
                    if entry:
                        status = entry.get('status', {})
                        if status.get('status_str') == 'error':
                            raise RuntimeError(json.dumps(status.get('messages', []))[-10000:])
                        outputs = entry.get('outputs', {}).get('save', {})
                        results = [v for group in outputs.values() if isinstance(group, list) for v in group if isinstance(v, dict) and 'filename' in v]
                        if not results:
                            raise RuntimeError('ComfyUI finished without a saved video: ' + json.dumps(entry)[-3000:])
                        result = results[0]
                        output_root = (COMFY / 'output').resolve()
                        output = (output_root / result.get('subfolder', '') / result['filename']).resolve()
                        if not output.is_relative_to(output_root) or not output.is_file():
                            raise RuntimeError('Invalid output path returned by ComfyUI')
                        job_update(job_id, status='completed', finished_at=time.time(), output=str(output), download_url=f'/v1/jobs/{job_id}/output')
                        break
                    time.sleep(2)
        except Exception as error:
            if job_get(job_id)['status'] != 'cancelled':
                job_update(job_id, status='failed', error=str(error), finished_at=time.time())
        finally:
            ACTIVE = None
            PENDING.task_done()


@asynccontextmanager
async def lifespan(app):
    # A restart never silently replays a costly inference.
    for path in JOBS.glob('*.json'):
        if path.name.endswith('.workflow.json'):
            continue
        record = json.loads(path.read_text())
        if record['status'] not in TERMINAL:
            job_update(record['id'], status='failed', error='Service restarted; submit again to retry')
    threading.Thread(target=worker, daemon=True).start()
    yield


app = FastAPI(title='MiniMax H3 private inference', version='1.0.0', lifespan=lifespan)


@app.get('/')
def index():
    return RedirectResponse('/ui/')


@app.get('/v1/health')
def health():
    try:
        with httpx.Client(timeout=5) as client:
            response = client.get(COMFY_URL + '/system_stats')
            response.raise_for_status()
            stats = response.json()
        backend = True
    except Exception:
        backend, stats = False, None
    return {'ready': backend and (ROOT / 'models-manifest.json').exists(), 'backend': backend,
            'models_verified': (ROOT / 'models-manifest.json').exists(), 'active_job': ACTIVE,
            'queue_length': PENDING.qsize(), 'system': stats}


@app.get('/v1/config')
def config():
    return {'schema': Generation.model_json_schema(), 'embeddings': embedding_names(), 'fps': 24,
            'reference_tag_order': 'Images first; each video soundtrack gets the next Audio tag; standalone audios follow all video soundtracks.'}


@app.post('/v1/files', status_code=201)
async def upload(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    record = upload_record(file_id, file.filename or '', 0)
    path = UPLOADS / record['stored_name']
    try:
        with path.open('wb') as stream:
            while chunk := await file.read(1024 * 1024):
                record['bytes'] += len(chunk)
                if record['bytes'] > 2 * 1024**3:
                    raise HTTPException(413, 'Upload exceeds 2 GiB')
                stream.write(chunk)
        save_json(UPLOADS / f'{file_id}.json', record)
    except BaseException:
        path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()
    return record


@app.post('/v1/jobs', status_code=202)
def create_job(request: Generation):
    return submit(request)


@app.get('/v1/jobs')
def list_jobs():
    paths = sorted((p for p in JOBS.glob('*.json') if not p.name.endswith('.workflow.json')), key=lambda p: p.stat().st_mtime, reverse=True)
    return [job_get(p.stem) for p in paths[:100]]


@app.get('/v1/jobs/{job_id}')
def get_job(job_id: str):
    return job_get(job_id)


@app.post('/v1/jobs/{job_id}/cancel')
def cancel(job_id: str):
    with LOCK:
        record = job_get(job_id)
        if record['status'] not in TERMINAL:
            return job_update(job_id, status='cancelled', finished_at=time.time())
        return record


@app.get('/v1/jobs/{job_id}/output')
def output(job_id: str):
    record = job_get(job_id)
    if record['status'] != 'completed':
        raise HTTPException(409, 'Output is not ready')
    path = Path(record['output']).resolve()
    if not path.is_relative_to((COMFY / 'output').resolve()) or not path.is_file():
        raise HTTPException(404, 'Output missing')
    return FileResponse(path, media_type='video/mp4', filename=job_id + '.mp4')


def ui_upload(path):
    if not path:
        return None
    file_id = str(uuid.uuid4())
    source = Path(path)
    record = upload_record(file_id, source.name, source.stat().st_size)
    if record['bytes'] > 2 * 1024**3:
        raise gr.Error('Upload exceeds 2 GiB')
    shutil.copyfile(source, UPLOADS / record['stored_name'])
    save_json(UPLOADS / f'{file_id}.json', record)
    return file_id


def describe_references(images, *values):
    labels = [f'`<Picture {i+1}>` — {Path(path).name}' for i, path in enumerate(images or [])]
    audio_index, video_index = 1, 1
    for i in range(3):
        path, use_audio, audio = values[i*3:i*3+3]
        if not path:
            continue
        has_audio = bool(audio)
        if use_audio and not audio:
            probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=index', '-of', 'csv=p=0', str(path)], capture_output=True, text=True, timeout=30)
            has_audio = bool(probe.stdout.strip())
        if has_audio:
            labels.append(f'`<Audio {audio_index}>` — soundtrack for `<Video {video_index}>`')
            audio_index += 1
        labels.append(f'`<Video {video_index}>` — {Path(path).name}')
        video_index += 1
    for path in values[9] or []:
        labels.append(f'`<Audio {audio_index}>` — {Path(path).name}')
        audio_index += 1
    return '\n\n'.join(labels) or 'Upload references to see the exact prompt tags here.'


def generate_ui(prompt, images, *values, progress=gr.Progress()):
    # Five fields per reference video, then standalone audio and sampling controls.
    video_values, settings = values[:15], values[15:]
    videos = []
    for i in range(3):
        path, use_audio, audio, start, seconds = video_values[i*5:i*5+5]
        if path:
            videos.append(VideoRef(file_id=ui_upload(path), use_audio=use_audio, audio_file_id=ui_upload(audio), start=start, duration=seconds))
    (audios, width, height, duration, length, ref_size, seed, steps, turbo, lora, sampler, scheduler, shift_video, shift_audio, embeddings) = settings
    request = Generation(prompt=prompt, images=[ui_upload(p) for p in (images or [])], videos=videos,
                         audios=[ui_upload(p) for p in (audios or [])], width=width, height=height,
                         duration=duration, length=length or None, ref_image_size=ref_size, seed=int(seed), steps=steps,
                         turbo=turbo, lora_strength=lora, sampler=sampler, scheduler=scheduler,
                         shift_video=shift_video, shift_audio=shift_audio, embeddings=embeddings or [])
    record = submit(request)
    job_id = record['id']
    while record['status'] not in TERMINAL:
        yield None, json.dumps({k: v for k, v in record.items() if k != 'output'}, indent=2), job_id
        time.sleep(2)
        record = job_get(job_id)
    yield record['output'] if record['status'] == 'completed' else None, json.dumps(record, indent=2), job_id


with gr.Blocks(title='MiniMax H3 Studio') as ui:
    gr.Markdown('# MiniMax H3 Studio\nReference images, motion, voices, and native stereo sound. Outputs stay on your VM. Powered by MiniMax H3.')
    gr.Markdown('Use `<Picture 1>`, `<Video 1>`, and `<Audio 1>` in your prompt. Images and videos are numbered in upload order. Enabled video soundtracks take Audio numbers first; standalone audio follows. Start at **864 × 480 / 5 seconds** on this A100 40 GB. Native quality: **1344 × 768**. Large reference sets need more memory and time.')
    with gr.Row():
        with gr.Column():
            prompt = gr.Textbox(label='Scene, motion, camera, dialogue, and sound', lines=6, placeholder='Use <Picture 1> for the character, <Video 1> for motion, and <Audio 1> for the voice...')
            images = gr.File(label='Reference images — up to 9, in tag order', file_count='multiple', file_types=sorted(IMAGE_EXT), type='filepath')
            video_fields = []
            for i in range(3):
                with gr.Accordion(f'Reference video {i+1}', open=i == 0):
                    video = gr.File(label=f'Video slot {i+1} (tags shown below)', file_types=sorted(VIDEO_EXT), type='filepath')
                    use_audio = gr.Checkbox(label='Use the video soundtrack as an audio reference', value=True)
                    audio_override = gr.File(label='Replace soundtrack (optional)', file_types=sorted(AUDIO_EXT), type='filepath')
                    with gr.Row():
                        start = gr.Number(label='Start at (seconds)', value=0, minimum=0)
                        seconds = gr.Number(label='Reference clip duration (seconds)', value=15, minimum=0.21, maximum=15)
                    video_fields += [video, use_audio, audio_override, start, seconds]
            audios = gr.File(label='Standalone reference audio — up to 3, first 15 seconds', file_count='multiple', file_types=sorted(AUDIO_EXT), type='filepath')
            reference_labels = gr.Markdown('Upload references to see the exact prompt tags here.')
        with gr.Column():
            with gr.Row():
                width = gr.Number(label='Width (multiple of 32)', value=864, precision=0, minimum=32, maximum=16384, step=32)
                height = gr.Number(label='Height (multiple of 32)', value=480, precision=0, minimum=32, maximum=16384, step=32)
                duration = gr.Number(label='Duration (seconds)', value=5, minimum=0.21, maximum=149.6)
            gr.Markdown('H3 rounds up to a valid frame count at 24 fps; 5 seconds becomes 124 frames (5.17 s). Trained for about 5–15 seconds. Higher resolution and longer clips can exceed GPU memory.')
            with gr.Row():
                turbo = gr.Checkbox(label='Turbo LoRA', value=True)
                steps = gr.Slider(label='Sampling steps', minimum=1, maximum=100, step=1, value=4)
            gr.Markdown('Turbo: 4 steps for drafts. For stronger reference matching and speech: turn turbo off and use 20–25 steps.')
            with gr.Accordion('Advanced controls', open=False):
                length = gr.Number(label='Override frame count (0 = use duration)', value=0, minimum=0, maximum=3592, precision=0)
                ref_size = gr.Radio(['match', 'max'], label='Reference image sizing', value='match')
                seed = gr.Number(label='Seed (-1 = random)', value=-1, precision=0)
                lora = gr.Slider(label='Turbo LoRA strength', minimum=0, maximum=2, step=0.05, value=1)
                sampler = gr.Dropdown(['res_multistep', 'euler', 'heun', 'dpmpp_2m'], label='Sampler', value='res_multistep')
                scheduler = gr.Dropdown(['beta', 'normal', 'simple'], label='Scheduler', value='beta')
                shift_video = gr.Number(label='Video sigma shift', value=12, minimum=0.01, maximum=100)
                shift_audio = gr.Number(label='Audio sigma shift', value=3, minimum=0.01, maximum=100)
                embeddings = gr.Dropdown(embedding_names(), multiselect=True, label='Style embeddings (optional)')
            run = gr.Button('Generate video', variant='primary')
            stop = gr.Button('Cancel this job')
            result = gr.Video(label='Generated video with stereo audio')
            job_id = gr.Textbox(label='Job ID', interactive=False)
            status = gr.Code(label='Status and reproducible settings', language='json')
    inputs = [prompt, images, *video_fields, audios, width, height, duration, length, ref_size, seed, steps, turbo, lora, sampler, scheduler, shift_video, shift_audio, embeddings]
    tag_inputs = [images, *[field for i, field in enumerate(video_fields) if i % 5 < 3], audios]
    for field in tag_inputs:
        field.change(describe_references, tag_inputs, reference_labels, queue=False)
    run.click(generate_ui, inputs, [result, status, job_id], concurrency_limit=8)
    stop.click(lambda value: json.dumps(cancel(value), indent=2) if value else 'No job selected', job_id, status, queue=False)

ui.queue(max_size=32)
app = gr.mount_gradio_app(app, ui, path='/ui', allowed_paths=[str(COMFY / 'output')], max_file_size='2gb')
