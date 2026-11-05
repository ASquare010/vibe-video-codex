"""Submit local references over the private SSH tunnel and download the MP4.

Only the Python standard library is required on the client.
"""
from __future__ import annotations
import argparse
import http.client
import json
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


class Client:
    def __init__(self, url='http://127.0.0.1:7860'):
        self.url = url.rstrip('/')

    def request(self, path, body=None):
        data = json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(self.url + path, data=data, headers={'Content-Type': 'application/json'})
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            raise RuntimeError(error.read().decode(errors='replace')) from error

    def upload(self, filename):
        source = Path(filename).resolve(strict=True)
        boundary = 'h3-' + uuid.uuid4().hex
        prefix = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="reference{source.suffix.lower()}"\r\nContent-Type: application/octet-stream\r\n\r\n').encode()
        suffix = f'\r\n--{boundary}--\r\n'.encode()
        parsed = urllib.parse.urlsplit(self.url)
        connection_type = http.client.HTTPSConnection if parsed.scheme == 'https' else http.client.HTTPConnection
        connection = connection_type(parsed.hostname, parsed.port, timeout=600)
        try:
            connection.putrequest('POST', parsed.path.rstrip('/') + '/v1/files')
            connection.putheader('Content-Type', f'multipart/form-data; boundary={boundary}')
            connection.putheader('Content-Length', str(len(prefix) + source.stat().st_size + len(suffix)))
            connection.endheaders()
            connection.send(prefix)
            with source.open('rb') as stream:
                while chunk := stream.read(1024 * 1024):
                    connection.send(chunk)
            connection.send(suffix)
            response = connection.getresponse()
            payload = response.read()
            if response.status != 201:
                raise RuntimeError(payload.decode(errors='replace'))
            return json.loads(payload)['id']
        finally:
            connection.close()

    def wait(self, job_id, output, poll=3):
        last = None
        while True:
            job = self.request('/v1/jobs/' + job_id)
            if job['status'] != last:
                print(f"{job_id}: {job['status']}", flush=True)
                last = job['status']
            if job['status'] == 'completed':
                destination = Path(output).resolve()
                destination.parent.mkdir(parents=True, exist_ok=True)
                temporary = destination.with_suffix(destination.suffix + '.part')
                with urllib.request.urlopen(self.url + job['download_url'], timeout=600) as response, temporary.open('wb') as stream:
                    while chunk := response.read(1024 * 1024):
                        stream.write(chunk)
                temporary.replace(destination)
                destination.with_suffix('.job.json').write_text(json.dumps(job, indent=2), encoding='utf-8')
                print(destination)
                return job
            if job['status'] in ('failed', 'cancelled'):
                raise RuntimeError(job.get('error') or job['status'])
            time.sleep(poll)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--url', default='http://127.0.0.1:7860')
    parser.add_argument('--health', action='store_true')
    parser.add_argument('--prompt')
    parser.add_argument('--image', action='append', default=[], help='Repeat in <Picture N> order')
    parser.add_argument('--video', action='append', default=[], help='Repeat in <Video N> order')
    parser.add_argument('--video-audio', action='append', default=[], help='Replace soundtrack for the corresponding video; use - to keep original')
    parser.add_argument('--mute-video-audio', action='store_true')
    parser.add_argument('--audio', action='append', default=[])
    parser.add_argument('--settings', type=Path, help='JSON overrides, e.g. shift_video, sampler, lora_strength, or per-video trim settings')
    parser.add_argument('--width', type=int, default=864)
    parser.add_argument('--height', type=int, default=480)
    parser.add_argument('--duration', type=float, default=5)
    parser.add_argument('--steps', type=int, default=4)
    parser.add_argument('--seed', type=int, default=-1)
    parser.add_argument('--no-turbo', action='store_true')
    parser.add_argument('--ref-image-size', choices=['match', 'max'], default='match')
    parser.add_argument('--embedding', action='append', default=[])
    parser.add_argument('--output', type=Path, default=Path('h3-output.mp4'))
    parser.add_argument('--no-wait', action='store_true')
    parser.add_argument('--resume', help='Wait for an existing job and download its result')
    parser.add_argument('--cancel', help='Cancel an existing job')
    args = parser.parse_args()
    client = Client(args.url)
    if args.health:
        print(json.dumps(client.request('/v1/health'), indent=2))
        return
    if args.cancel:
        print(json.dumps(client.request('/v1/jobs/' + args.cancel + '/cancel', {}), indent=2))
        return
    if args.resume:
        client.wait(args.resume, args.output)
        return
    if not args.prompt:
        parser.error('--prompt is required for a new generation')
    if len(args.image) > 9 or len(args.video) > 3 or len(args.audio) > 3:
        parser.error('Maximum: 9 images, 3 videos, 3 standalone audio clips')
    if len(args.video_audio) > len(args.video):
        parser.error('--video-audio must correspond to a --video')
    payload = {'prompt': args.prompt, 'width': args.width, 'height': args.height, 'duration': args.duration,
               'steps': args.steps, 'seed': args.seed, 'turbo': not args.no_turbo,
               'ref_image_size': args.ref_image_size, 'embeddings': args.embedding}
    if args.settings:
        payload.update(json.loads(args.settings.read_text(encoding='utf-8')))
    payload['images'] = [client.upload(p) for p in args.image]
    video_options = payload.pop('video_options', [])
    payload['videos'] = []
    for i, path in enumerate(args.video):
        video = {'file_id': client.upload(path), 'use_audio': not args.mute_video_audio}
        if i < len(video_options):
            video.update(video_options[i])
        if i < len(args.video_audio) and args.video_audio[i] != '-':
            video['audio_file_id'] = client.upload(args.video_audio[i])
        payload['videos'].append(video)
    payload['audios'] = [client.upload(p) for p in args.audio]
    job = client.request('/v1/jobs', payload)
    print(json.dumps(job, indent=2), flush=True)
    if not args.no_wait:
        client.wait(job['id'], args.output)


if __name__ == '__main__':
    main()
