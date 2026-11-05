"""Read-only source/current-selection boards. No APIs, inference or manifest writes."""
import argparse
import io
import json
import math
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def version(asset, version_id=None):
    return next(v for v in asset['versions'] if v['id'] == (version_id or asset['activeVersionId']))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--project', required=True, help='Path to project.json, or project UUID under repo data/projects')
    ap.add_argument('--scenes', required=True, nargs='+', type=int, help='Persistent scene numbers, in desired review order')
    ap.add_argument('--out', required=True, help='Review output folder; project/media remain unchanged')
    ap.add_argument('--width', type=int, default=320, help='Each sampled frame width, 160 to 640')
    ap.add_argument('--samples', type=int, default=4, help='Samples per source/render, 3 to 12; not a motion-quality test')
    ap.add_argument('--ffmpeg', help='Optional local FFmpeg executable')
    ap.add_argument('--ffprobe', help='Optional local FFprobe executable')
    args = ap.parse_args()
    if not 160 <= args.width <= 640 or not 3 <= args.samples <= 12:
        ap.error('Use width 160..640 and samples 3..12')
    repo = Path(__file__).resolve().parents[1]
    project_file = Path(args.project)
    if not project_file.is_file():
        project_file = repo/'data/projects'/args.project/'project.json'
    if not project_file.is_file():
        ap.error('Project manifest not found')
    project_file = project_file.resolve()
    root = project_file.parent
    out = Path(args.out).resolve()
    # Fail before extraction if the output would overwrite actual input files.
    if out == root or out in (root/'media', root/'jobs'):
        ap.error('Choose a dedicated review subfolder')
    ff = Path(args.ffmpeg) if args.ffmpeg else repo/'node_modules/ffmpeg-static/ffmpeg.exe'
    if not ff.is_file():
        ap.error('FFmpeg not found; supply --ffmpeg')
    probe = Path(args.ffprobe) if args.ffprobe else repo/'node_modules/ffprobe-static/bin/win32/x64/ffprobe.exe'
    if not probe.is_file():
        ap.error('FFprobe not found; supply --ffprobe')
    p = read(project_file)
    fps = p['settings']['fps']
    assets = {a['id']: a for a in p['assets']}
    starts, cursor = {}, 0
    for s in p['scenes']:
        starts[s['id']] = cursor
        a = assets.get(s.get('audioAssetId'))
        cursor += (version(a).get('durationFrames') if a else None) or s['estimatedFrames']
    by_number = {s.get('number'): s for s in p['scenes']}
    missing = [n for n in args.scenes if n not in by_number]
    if missing:
        ap.error(f'Scene numbers not found: {missing}')
    source = p.get('sourceVideo')
    if not source:
        ap.error('No source video recorded')
    source_path = root/source.get('proxyPath', source['path'])
    if not source_path.is_file():
        source_path = root/source['path']
    if not source_path.is_file():
        ap.error('Source file not found')
    out.mkdir(parents=True, exist_ok=True)
    records, failures = [], []

    def frame(file, time):
        cmd = [str(ff), '-v', 'error', '-ss', f'{max(0,time):.6f}', '-i', str(file), '-frames:v', '1',
               '-vf', f'scale={args.width}:-2', '-f', 'image2pipe', '-vcodec', 'mjpeg', '-']
        result = subprocess.run(cmd, check=True, capture_output=True, timeout=30)
        return Image.open(io.BytesIO(result.stdout)).convert('RGB')

    for n in args.scenes:
        s = by_number[n]
        try:
            src = s.get('source')
            if not src:
                raise ValueError('No source interval')
            segments = src.get('segments', [])
            if any(abs(a['endSeconds']-b['startSeconds']) > 1e-4 for a,b in zip(segments,segments[1:])):
                raise ValueError('Disjoint source segments need a segment-aware review/export')
            clips = [c for c in p['clips'] if c['sceneId']==s['id'] and c['track']=='visual']
            if len(clips) != 1:
                raise ValueError('Multiple/no visual placements: review a scoped timeline export instead')
            c = clips[0]
            a = assets.get(c.get('assetId'))
            if not a or a['kind'] != 'video':
                raise ValueError('Selected visual is not a saved video')
            v = version(a,c.get('versionId'))
            file = root/v['path']
            if not file.is_file():
                raise ValueError('Selected video file not found')
            ss, se = src['startSeconds'], src['endSeconds']
            duration, speed = c['durationFrames']/fps, c.get('speed',1)
            global_start = (starts[s['id']]+c['startFrame'])/fps
            sample_times = [i/(args.samples-1) for i in range(args.samples)]
            st = [ss+f*max(0,se-ss-1/source['fps']) for f in sample_times]
            nt = [c.get('sourceIn',0)/fps+f*max(0,duration-1/fps)*speed for f in sample_times]
            info = json.loads(subprocess.check_output([str(probe),'-v','error','-select_streams','v:0',
                '-show_entries','stream=duration,nb_frames,r_frame_rate','-of','json',str(file)],timeout=30))['streams'][0]
            numerator,denominator = map(float,info['r_frame_rate'].split('/'))
            media_fps = numerator/denominator
            media_duration = float(info['duration'])
            last_frame = (int(info['nb_frames'])-1)/media_fps if str(info.get('nb_frames','')).isdigit() else media_duration-1/media_fps
            requested_nt = nt[:]
            warnings = []
            if max(nt)>last_frame+1e-5:
                warnings.append('Placement samples exceed the physical last video frame; endpoint samples clamped for analysis, not repaired in the edit.')
                nt = [min(t,last_frame) for t in nt]
            source_frames = [frame(source_path,t) for t in st]
            selected_frames = [frame(file,t) for t in nt]
            height = max(im.height for im in source_frames+selected_frames)
            columns = min(4,args.samples)
            rows = math.ceil(args.samples/columns)
            row_height = height+24
            group_height = rows*row_height+30
            board = Image.new('RGB',(args.width*columns,2*group_height),(20,20,20))
            draw = ImageDraw.Draw(board)
            for group,(frames,times,label) in enumerate([(source_frames,st,f'Scene {n} SOURCE {ss:.3f}-{se:.3f}s'),
                                                        (selected_frames,nt,f'SELECTED MEDIA | edit {global_start:.3f}-{global_start+duration:.3f}s')]):
                base = group*group_height
                draw.text((4,base+5),label,fill='white')
                for i,(im,t) in enumerate(zip(frames,times)):
                    x,y = (i%columns)*args.width,base+30+(i//columns)*row_height
                    board.paste(im,(x,y))
                    draw.text((x+4,y+height+4),f'file time {t:.3f}s',fill='white')
            destination = out/f'scene-{n:03d}-comparison.jpg'
            board.save(destination,quality=88)
            record = dict(scene=n,sceneId=s['id'],sourceSeconds=[ss,se],editSeconds=[global_start,global_start+duration],
                          sourceDuration=se-ss,editDuration=duration,editToSourceDurationRatio=duration/(se-ss),
                          selectedFile=str(file.resolve()),sourceInFrames=c.get('sourceIn',0),clipSpeed=speed,
                          sourceSampleSeconds=st,selectedFileSampleSeconds=nt,provenance=v.get('provenance'),
                          requestedSelectedSampleSeconds=requested_nt,mediaVideoSeconds=media_duration,warnings=warnings,
                          board=str(destination),sourceRole=a.get('role'),
                          caveat='Selected media before editor overlays/grade/transforms; sparse frames do not establish motion quality.')
            records.append(record)
            print(json.dumps(dict(scene=n,board=str(destination),sourceSeconds=round(se-ss,4),editSeconds=round(duration,4))),flush=True)
        except (ValueError, KeyError, StopIteration, subprocess.SubprocessError, OSError) as exc:
            failures.append(dict(scene=n,error=str(exc)))
    (out/'sequence-review.json').write_text(json.dumps(dict(project=str(project_file),revision=p.get('revision'),
        fps=fps,readOnly=True,records=records,failures=failures),indent=2),encoding='utf-8')
    print(json.dumps(dict(reviewed=len(records),failures=failures,report=str(out/'sequence-review.json'))))
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
