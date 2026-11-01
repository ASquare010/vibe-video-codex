"""Read-only review evidence sampled from the delivered export, not unused tails."""
import hashlib
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parents[2]
ROOT = REPO / 'data/projects/34dd7600-10be-483d-8b19-4bc92f818408'
OUT = Path(__file__).resolve().parent
FFMPEG = REPO / 'node_modules/ffmpeg-static/ffmpeg.exe'


def main():
    export = json.loads((ROOT / 'latest-export.json').read_text(encoding='utf-8'))
    lineage = json.loads((ROOT / 'review/benchmark-v1/asset-lineage-and-timing.json').read_text(encoding='utf-8'))
    project = json.loads((ROOT / 'project.json').read_text(encoding='utf-8'))
    film = Path(export['film'])
    frames = OUT / 'frames'
    frames.mkdir(parents=True, exist_ok=True)
    samples = []
    for cut in lineage:
        start, end = cut['globalFrames']
        for phase, frame in zip(('in', 'middle', 'out'), (start, (start + end - 1) // 2, end - 1)):
            samples.append({'cut': cut['cutId'], 'phase': phase, 'frame': frame})
    # More closely spaced samples through the critical operation, all retained frames.
    critical = next(cut for cut in lineage if cut['cutId'] == 'S04-D')
    start, end = critical['globalFrames']
    detail_frames = list(range(start, end, 4)) + [end - 1]
    indices = sorted(set([s['frame'] for s in samples] + detail_frames))
    select = '+'.join(f'eq(n\\,{n})' for n in indices)
    subprocess.run([str(FFMPEG), '-hide_banner', '-loglevel', 'error', '-y', '-i', str(film),
                    '-vf', f'select={select},scale=640:-1', '-vsync', '0',
                    str(frames / '%04d.png')], check=True)
    by_frame = {n: frames / f'{i:04d}.png' for i, n in enumerate(indices, 1)}
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 19)
    small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 15)
    for scene in project['scenes']:
        rows = [cut for cut in lineage if cut['cutId'].startswith(scene['id'] + '-')]
        width, tile_h = 480, 302
        board = Image.new('RGB', (width * 3, len(rows) * tile_h), '#15191e')
        draw = ImageDraw.Draw(board)
        for row, cut in enumerate(rows):
            chosen = [s for s in samples if s['cut'] == cut['cutId']]
            for col, s in enumerate(chosen):
                im = Image.open(by_frame[s['frame']]).convert('RGB').resize((width, 270))
                x, y = col * width, row * tile_h
                draw.text((x + 5, y + 5), f"{cut['cutId']} {s['phase']}  {s['frame']/24:.3f}s", font=font, fill='white')
                board.paste(im, (x, y + 30))
        board.save(OUT / f"{scene['id']}-selected-export.jpg", quality=94)
    detail = Image.new('RGB', (480 * 3, 300 * ((len(detail_frames) + 2) // 3)), '#15191e')
    draw = ImageDraw.Draw(detail)
    for i, n in enumerate(detail_frames):
        x, y = (i % 3) * 480, (i // 3) * 300
        detail.paste(Image.open(by_frame[n]).convert('RGB').resize((480, 270)), (x, y + 30))
        draw.text((x + 5, y + 5), f'S04-D frame {n}  {n/24:.3f}s', font=small, fill='white')
    detail.save(OUT / 'S04-D-dense-selected-export.jpg', quality=94)
    record = {'film': str(film), 'sha256': hashlib.sha256(film.read_bytes()).hexdigest(),
              'projectRevision': project['revision'], 'fps': 24,
              'method': 'selected-export in/middle/out plus critical operation every four frames; frame evidence only',
              'samples': samples, 'criticalDetailFrames': detail_frames,
              'nativePlayback': 'not performed', 'listening': 'not performed'}
    (OUT / 'evidence.json').write_text(json.dumps(record, indent=2), encoding='utf-8')
    print(json.dumps({'filmHashMatches': record['sha256'] == export['sha256'], 'cuts': len(lineage),
                      'uniqueExportFrames': len(indices), 'boards': 7, 'revision': project['revision']}))


if __name__ == '__main__':
    main()
