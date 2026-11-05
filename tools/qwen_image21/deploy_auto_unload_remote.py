"""Enable the shared idle policy after checking all existing queues are empty."""
import datetime
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import time
import urllib.request

ROOT = Path('/opt/minimax-h3/qwen-image-api')
STAGE = ROOT / 'releases/auto-unload-v1'


def get(url):
    with urllib.request.urlopen(url, timeout=15) as r:
        return json.load(r)


video = get('http://127.0.0.1:7860/v1/health')
image = get('http://127.0.0.1:7861/v1/health')
queue = get('http://127.0.0.1:8188/queue')
if video.get('active_job') is not None or video.get('queue_length') != 0 or image.get('active_jobs') or queue.get('queue_running') or queue.get('queue_pending'):
    raise SystemExit('Jobs are active; preserve them and wait before updating the coordinator')
old = json.loads((ROOT / 'state/deployment.json').read_text())
for name, expected in old['sourceSha256'].items():
    if hashlib.sha256((ROOT / name).read_bytes()).hexdigest() != expected:
        raise SystemExit('Deployment source changed; preserve and inspect: ' + name)
before = {n: json.loads(subprocess.check_output(['docker', 'inspect', n], text=True))[0] for n in ['minimax-app', 'minimax-comfy']}
backup = STAGE / 'previous'
backup.mkdir(exist_ok=True)
for name in ['idle_unload.py', 'test_idle_unload.py', 'test_api.py', 'client.py', 'app.py']:
    dest = ROOT / name
    if dest.exists():
        shutil.copy2(dest, backup / name)
    tmp = dest.with_suffix('.next')
    tmp.write_bytes((STAGE / name).read_bytes())
    tmp.chmod(0o644)
    tmp.replace(dest)
shutil.copy2(ROOT / 'state/deployment.json', backup / 'deployment.json')
subprocess.run(['docker', 'restart', '--time', '75', 'qwen-image-api'], check=True, capture_output=True, text=True)
policy = None
for _ in range(30):
    try:
        policy = get('http://127.0.0.1:7861/v1/memory')
        if policy.get('phase') == 'unloaded' and policy.get('last_unload', {}).get('weights_in_vram_released'):
            break
    except Exception:
        pass
    time.sleep(1)
if not policy or policy.get('phase') != 'unloaded':
    raise SystemExit('Shared memory policy not yet verified; inspect state/auto-unload.json')
unchanged = {}
for n, original in before.items():
    current = json.loads(subprocess.check_output(['docker', 'inspect', n], text=True))[0]
    unchanged[n] = original['Id'] == current['Id'] and original['State']['StartedAt'] == current['State']['StartedAt']
assert all(unchanged.values()), 'An existing video/backend runtime changed unexpectedly'
files = ['app.py', 'client.py', 'test_api.py', 'idle_unload.py', 'test_idle_unload.py']
hashes = {n: hashlib.sha256((ROOT / n).read_bytes()).hexdigest() for n in files}
receipt = {'savedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'automaticUnloadEnabled': True,
           'models': ['MiniMax H3', 'Qwen Image 2.1'], 'idleSeconds': 5, 'onlyQwenAPIContainerRestarted': True,
           'videoAndComfyContainersUnchanged': unchanged, 'testsPassed': 18, 'testsUseSimulatedJobs': True,
           'inferenceSubmitted': False, 'policy': policy, 'sourceSha256': hashes,
           'gpu': subprocess.check_output(['nvidia-smi', '--query-gpu=name,memory.used,memory.free,utilization.gpu', '--format=csv,noheader,nounits'], text=True).strip(),
           'videoHealth': get('http://127.0.0.1:7860/v1/health'),
           'imageHealth': get('http://127.0.0.1:7861/v1/health')}
(ROOT / 'state/auto-unload-deployment.json').write_text(json.dumps(receipt, indent=2) + '\n')
old.update(sourceSha256=hashes, autoUnload=policy, autoUnloadDeployment='state/auto-unload-deployment.json')
(ROOT / 'state/deployment.json').write_text(json.dumps(old, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
