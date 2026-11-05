"""One-command Qwen upload/submit/resume/download helper (Python standard library)."""
from __future__ import annotations
import argparse
import hashlib
import http.client
import json
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    tmp.replace(path)


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for data in iter(lambda: f.read(1024 * 1024), b''):
            h.update(data)
    return h.hexdigest()


class Client:
    def __init__(self, url='http://127.0.0.1:7861'):
        self.url = url.rstrip('/')

    def request(self, path, body=None, key=None):
        headers = {'Content-Type': 'application/json'}
        if key:
            headers['Idempotency-Key'] = key
        req = urllib.request.Request(self.url + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            raise RuntimeError(e.read().decode(errors='replace')) from e

    def upload(self, filename):
        source = Path(filename).resolve(strict=True)
        boundary = 'qwen-' + uuid.uuid4().hex
        prefix = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="reference{source.suffix.lower()}"\r\nContent-Type: application/octet-stream\r\n\r\n').encode()
        suffix = f'\r\n--{boundary}--\r\n'.encode()
        parsed = urllib.parse.urlsplit(self.url)
        conn = (http.client.HTTPSConnection if parsed.scheme == 'https' else http.client.HTTPConnection)(parsed.hostname, parsed.port, timeout=600)
        try:
            conn.putrequest('POST', parsed.path.rstrip('/') + '/v1/files')
            conn.putheader('Content-Type', 'multipart/form-data; boundary=' + boundary)
            conn.putheader('Content-Length', str(len(prefix) + source.stat().st_size + len(suffix)))
            conn.endheaders()
            conn.send(prefix)
            with source.open('rb') as f:
                for data in iter(lambda: f.read(1024 * 1024), b''):
                    conn.send(data)
            conn.send(suffix)
            r = conn.getresponse()
            payload = r.read()
            if r.status != 201:
                raise RuntimeError(payload.decode(errors='replace'))
            return json.loads(payload)
        finally:
            conn.close()

    def wait(self, job_id, output, poll=3):
        output = Path(output).resolve()
        meta = output.with_suffix(output.suffix + '.job.json')
        if output.exists() and (not meta.exists() or json.loads(meta.read_text(encoding='utf-8'))['id'] != job_id):
            raise RuntimeError('Output already exists without matching job metadata; choose a new filename')
        last = None
        while True:
            j = self.request('/v1/jobs/' + job_id)
            save(meta, j)
            if j['status'] != last:
                print(f"{job_id}: {j['status']}", flush=True)
                last = j['status']
            if j['status'] == 'completed':
                if output.exists() and sha(output) == j['output_sha256']:
                    return j
                tmp = output.with_suffix(output.suffix + '.part')
                with urllib.request.urlopen(self.url + '/v1/jobs/' + job_id + '/output', timeout=600) as r, tmp.open('wb') as f:
                    for data in iter(lambda: r.read(1024 * 1024), b''):
                        f.write(data)
                if sha(tmp) != j['output_sha256']:
                    raise RuntimeError('Downloaded image checksum differs; original job preserved')
                tmp.replace(output)
                print(output, flush=True)
                return j
            if j['status'] in {'failed', 'cancelled', 'submission_unknown', 'needs_attention'}:
                raise RuntimeError(j.get('error') or j['status'])
            time.sleep(poll)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--url', default='http://127.0.0.1:7861')
    p.add_argument('--health', action='store_true')
    p.add_argument('--config', action='store_true')
    p.add_argument('--status')
    p.add_argument('--cancel')
    p.add_argument('--resume')
    p.add_argument('--prompt')
    p.add_argument('--image', action='append', default=[])
    p.add_argument('--output', type=Path)
    p.add_argument('--precision', choices=['int8', 'bf16'], default='int8')
    p.add_argument('--resolution', type=int, default=0)
    p.add_argument('--width', type=int)
    p.add_argument('--height', type=int)
    p.add_argument('--steps', type=int, default=25)
    p.add_argument('--cfg', type=float, default=1)
    p.add_argument('--negative-prompt', default='')
    p.add_argument('--sampler', default='euler')
    p.add_argument('--scheduler', default='simple')
    p.add_argument('--seed', type=int, default=-1)
    p.add_argument('--refine-prompt', action='store_true')
    p.add_argument('--max-length', type=int, default=4096)
    p.add_argument('--validate-only', action='store_true')
    p.add_argument('--no-wait', action='store_true')
    a = p.parse_args()
    c = Client(a.url)
    if a.health or a.config or a.status or a.cancel:
        route = '/v1/health' if a.health else '/v1/config' if a.config else '/v1/jobs/' + (a.status or a.cancel) + ('/cancel' if a.cancel else '')
        print(json.dumps(c.request(route, {} if a.cancel else None), indent=2))
        return
    if not a.output:
        p.error('--output is required to preserve a durable request and job ID')
    if a.resume:
        c.wait(a.resume, a.output)
        return
    if not a.prompt or not a.image:
        p.error('Supply --prompt and at least one --image, or use --resume JOB_ID')
    body = {k: getattr(a, k) for k in ['prompt', 'precision', 'resolution', 'width', 'height', 'steps', 'cfg', 'negative_prompt', 'sampler', 'scheduler', 'seed', 'refine_prompt', 'max_length']}
    body.update(thinking=True, unload_after=True)
    paths = [str(Path(x).resolve(strict=True)) for x in a.image]
    hashes = [sha(x) for x in paths]
    receipt = a.output.resolve().with_suffix(a.output.suffix + '.request.json')
    if receipt.exists():
        s = json.loads(receipt.read_text(encoding='utf-8'))
        if s['url'] != c.url or s['options'] != body or s['input_sha256'] != hashes:
            raise RuntimeError('Saved request differs; choose a new output filename. No new request submitted.')
    else:
        if a.output.exists():
            raise RuntimeError('Output exists; choose a new filename')
        s = {'url': c.url, 'idempotency_key': str(uuid.uuid4()), 'options': body, 'input_paths': paths, 'input_sha256': hashes, 'uploads': [], 'job_id': None}
        save(receipt, s)
    for path in paths[len(s['uploads']):]:
        s['uploads'].append(c.upload(path))
        save(receipt, s)
    request = {**body, 'images': [x['id'] for x in s['uploads']]}
    if a.validate_only:
        print(json.dumps(c.request('/v1/validate', request), indent=2))
        return
    if not s['job_id']:
        j = c.request('/v1/jobs', request, key=s['idempotency_key'])
        s['job_id'] = j['id']
        save(receipt, s)
    print(json.dumps({'id': s['job_id'], 'request_receipt': str(receipt)}), flush=True)
    if not a.no_wait:
        c.wait(s['job_id'], a.output)


if __name__ == '__main__':
    main()
