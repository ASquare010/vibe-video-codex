"""Exercise real image/video/audio uploads, inference, status, and MP4 download."""
import argparse
import json
from pathlib import Path
import subprocess
from client import Client


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--url', default='http://127.0.0.1:7860')
    parser.add_argument('--directory', type=Path, default=Path('/opt/minimax-h3/smoke-test'))
    parser.add_argument('--duration', type=float, default=2)
    parser.add_argument('--width', type=int, default=384)
    parser.add_argument('--height', type=int, default=224)
    args = parser.parse_args()
    args.directory.mkdir(parents=True, exist_ok=True)
    image, video, audio = [args.directory / name for name in ('test-image.png', 'test-video.mp4', 'test-audio.wav')]
    from PIL import Image, ImageDraw
    canvas = Image.new('RGB', (384, 224), '#102c45')
    drawing = ImageDraw.Draw(canvas)
    drawing.ellipse((135, 55, 245, 165), fill='#f3bf38')
    canvas.save(image)
    subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=size=384x224:rate=24', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=32000', '-t', '2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', str(video)], check=True)
    subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=660:sample_rate=32000', '-t', '2', '-ac', '2', str(audio)], check=True)
    client = Client(args.url)
    health = client.request('/v1/health')
    assert health['ready'], health
    image_id, video_id, audio_id = [client.upload(p) for p in (image, video, audio)]
    request = {'prompt': 'A golden sphere like <Picture 1> floats gently over a deep blue background. Use the slow motion of <Video 1>. A quiet musical tone follows <Audio 1> and <Audio 2>. Static camera, simple scene.',
               'images': [image_id], 'videos': [{'file_id': video_id, 'use_audio': True, 'duration': 2}], 'audios': [audio_id],
               'width': args.width, 'height': args.height, 'duration': args.duration, 'steps': 4, 'seed': 12345, 'turbo': True}
    job = client.request('/v1/jobs', request)
    (args.directory / 'submission.json').write_text(json.dumps(job, indent=2))
    job = client.wait(job['id'], args.directory / 'generated.mp4')
    assert len(job['reference_labels']) == 4, job['reference_labels']
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(args.directory / 'generated.mp4')], check=True, capture_output=True, text=True)
    media = json.loads(probe.stdout)
    visual = next(s for s in media['streams'] if s['codec_type'] == 'video')
    sound = next(s for s in media['streams'] if s['codec_type'] == 'audio')
    assert (visual['width'], visual['height']) == (args.width, args.height)
    assert abs(float(media['format']['duration']) - job['actual_duration']) < 0.2
    assert sound['channels'] == 2
    assert visual['avg_frame_rate'] == '24/1'
    (args.directory / 'verified.json').write_text(json.dumps({'job_id': job['id'], 'probe': media, 'reference_labels': job['reference_labels']}, indent=2))
    print('PASS: real multimodal inference; H.264 video + stereo audio, 24 fps, expected dimensions and duration.')


if __name__ == '__main__':
    main()
