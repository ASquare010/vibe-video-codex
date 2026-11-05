"""Download the requested H3 files, resume interrupted transfers, verify SHA-256."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request

ROOT = Path(os.environ.get('H3_ROOT', '/opt/minimax-h3'))
REPO = 'Comfy-Org/MiniMax-H3'
FILES = [
    'vae/minimax_h3_video_vae_int8_convrot.safetensors',
    'vae/minimax_h3_audio_vae_fp32.safetensors',
    'diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors',
    'text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors',
    'loras/minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors',
]


def main():
    with urllib.request.urlopen(f'https://huggingface.co/api/models/{REPO}/tree/main?recursive=true', timeout=60) as r:
        tree = json.load(r)
    selected = [x for x in tree if x['path'] in FILES or (x['path'].startswith('embeddings/minimaxh3_') and x['path'].endswith('.safetensors'))]
    assert set(FILES).issubset({x['path'] for x in selected}), 'Requested weights missing from upstream'
    assert len(selected) >= 15, 'Expected ten style embeddings'
    revision = json.load(urllib.request.urlopen(f'https://huggingface.co/api/models/{REPO}', timeout=60))['sha']

    def fetch(item):
        dest = ROOT / 'ComfyUI/models' / item['path']
        dest.parent.mkdir(parents=True, exist_ok=True)
        partial = dest.with_suffix(dest.suffix + '.part')
        expected = item.get('lfs', {}).get('oid')
        if not dest.exists():
            print('Downloading', item['path'], item['size'], flush=True)
            subprocess.run(['curl', '--fail', '--location', '--retry', '10', '--retry-all-errors', '--continue-at', '-', '--output', str(partial), f'https://huggingface.co/{REPO}/resolve/{revision}/{item["path"]}'], check=True)
            assert partial.stat().st_size == item['size'], f'Size mismatch: {dest}'
            partial.rename(dest)
        digest = hashlib.file_digest(dest.open('rb'), 'sha256').hexdigest()
        assert dest.stat().st_size == item['size'], f'Size mismatch: {dest}'
        assert not expected or digest == expected, f'Checksum mismatch: {dest}'
        print('Verified', item['path'], flush=True)
        return {'path': item['path'], 'bytes': dest.stat().st_size, 'sha256': digest}

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        verified = list(pool.map(fetch, selected))
    (ROOT / 'models-manifest.json').write_text(json.dumps({'repo': REPO, 'revision': revision, 'files': verified}, indent=2))
    print('ALL MODELS VERIFIED', flush=True)


if __name__ == '__main__':
    main()
