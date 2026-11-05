"""Start only the new private CPU-only API container, using the existing image."""
import datetime
import hashlib
import json
from pathlib import Path
import socket
import subprocess
import time
import urllib.request

ROOT = Path('/opt/minimax-h3')
OUT = ROOT / 'qwen-image-api'
IMAGE = 'sha256:3d56951df679151bfd3a47d094b9ae9c8ace4c82607e2e2bc8d07138c3029edc'
NAME = 'qwen-image-api'


def get(url):
    with urllib.request.urlopen(url, timeout=10) as r:
        return json.load(r)


validation = json.loads((OUT / 'state/native-validation.json').read_text())
assert all(x['valid'] for x in validation['results']), 'Native workflow validation must pass first'
existing = subprocess.run(['docker', 'inspect', NAME], text=True, capture_output=True)
if existing.returncode == 0:
    info = json.loads(existing.stdout)[0]
    if info['Image'] != IMAGE or info['Config'].get('Labels', {}).get('local.qwen.api') != '1':
        raise SystemExit('Container name belongs to a different deployment; preserve and inspect')
    if not info['State']['Running']:
        subprocess.run(['docker', 'start', NAME], check=True)
    container = info['Id']
else:
    with socket.socket() as s:
        if s.connect_ex(('127.0.0.1', 7861)) == 0:
            raise SystemExit('Port7861 already in use; no service changed')
    command = ['docker', 'run', '-d', '--name', NAME, '--pull', 'never', '--runtime', 'runc',
               '--restart', 'unless-stopped', '--init', '--network', 'host', '--user', '1002:1005',
               '--label', 'local.qwen.api=1', '--read-only', '--cap-drop', 'ALL',
               '--security-opt', 'no-new-privileges', '--cpus', '1', '--memory', '512m',
               '--log-opt', 'max-size=10m', '--log-opt', 'max-file=3',
               '--mount', f'type=bind,source={ROOT},target={ROOT},readonly',
               '--mount', f'type=bind,source={OUT}/state,target={OUT}/state',
               '--mount', f'type=bind,source={ROOT}/ComfyUI/input,target={ROOT}/ComfyUI/input',
               '--tmpfs', '/tmp:rw,size=268435456', '--workdir', str(OUT),
               '--env', 'H3_ROOT=/opt/minimax-h3', '--env', 'NVIDIA_VISIBLE_DEVICES=void',
               '--entrypoint', '/opt/minimax-h3/venv/bin/python', IMAGE,
               '-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '7861', '--workers', '1']
    container = subprocess.check_output(command, text=True).strip()
health = None
for _ in range(20):
    try:
        health = get('http://127.0.0.1:7861/v1/health')
        break
    except Exception:
        time.sleep(1)
if not health or not health.get('ready'):
    print(subprocess.run(['docker', 'logs', '--tail', '40', NAME], text=True, capture_output=True).stderr)
    raise SystemExit('New API not healthy; existing video/backend services were not touched')
receipt = {'savedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'container': container,
           'image': IMAGE, 'api': 'http://127.0.0.1:7861', 'cpuOnlyAPI': True,
           'videoContainersRestarted': False, 'gpuInferenceSubmitted': False,
           'nativeValidation': validation,
           'sourceSha256': {n: hashlib.sha256((OUT / n).read_bytes()).hexdigest() for n in ['app.py', 'client.py', 'test_api.py', 'idle_unload.py']},
           'health': health, 'videoHealth': get('http://127.0.0.1:7860/v1/health')}
(OUT / 'state/deployment.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
