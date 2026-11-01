"""Make a separate pause-tightened, pitch-preserving tempo preview of PCM WAV narration."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import wave


def read_wav(path):
    with wave.open(str(path), 'rb') as stream:
        if stream.getcomptype() != 'NONE' or stream.getsampwidth() != 2:
            raise ValueError('Input must be uncompressed 16-bit PCM WAV.')
        return stream.getparams(), stream.readframes(stream.getnframes())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--input', type=Path, required=True)
    parser.add_argument('--out-dir', type=Path, required=True)
    parser.add_argument('--tempo', type=float, default=1.15)
    parser.add_argument('--noise-db', type=float, default=-45)
    parser.add_argument('--min-gap', type=float, default=.60)
    parser.add_argument('--keep-gap', type=float, default=.24)
    parser.add_argument('--edge-pad', type=float, default=.10)
    parser.add_argument('--protect', action='append', default=[], help='Preserve an original-time range START:END.')
    parser.add_argument('--ffmpeg', type=Path, default=Path(__file__).resolve().parents[3] / 'node_modules/ffmpeg-static/ffmpeg.exe')
    args = parser.parse_args()
    if not .9 <= args.tempo <= 1.3:
        parser.error('Use a conservative preview tempo between 0.9 and 1.3.')
    if not 0 < args.keep_gap < args.min_gap or args.edge_pad <= 0:
        parser.error('Require 0 < keep-gap < min-gap and positive edge-pad.')
    if not -80 <= args.noise_db <= -30:
        parser.error('noise-db must be between -80 and -30.')
    protected = []
    for value in args.protect:
        start, end = map(float, value.split(':'))
        if start < 0 or end <= start:
            parser.error('Protected ranges require 0 <= START < END.')
        protected.append((start, end))
    source = args.input.resolve(strict=True)
    params, pcm = read_wav(source)
    rate, frames = params.framerate, params.nframes
    duration = frames / rate
    args.out_dir.mkdir(parents=True, exist_ok=True)
    tightened = args.out_dir / (source.stem + '-pause-tightened.wav')
    final = args.out_dir / (source.stem + '-faster.wav')
    report = args.out_dir / (source.stem + '-edit-report.json')
    for output in (tightened, final, report):
        if output.resolve() == source or output.exists():
            raise FileExistsError(f'Refusing to overwrite: {output}')
    detect = subprocess.run([
        str(args.ffmpeg), '-nostdin', '-hide_banner', '-i', str(source),
        '-af', f'silencedetect=noise={args.noise_db}dB:d=0.1',
        '-f', 'null', '-'
    ], capture_output=True, text=True, check=True)
    silences, opened = [], None
    for line in detect.stderr.splitlines():
        found = re.search(r'silence_start: ([0-9.]+)', line)
        if found:
            opened = float(found.group(1))
        found = re.search(r'silence_end: ([0-9.]+)', line)
        if found and opened is not None:
            silences.append((opened, min(duration, float(found.group(1)))))
            opened = None
    if opened is not None:
        silences.append((opened, duration))
    removed = []
    for start, end in silences:
        if any(start < b and end > a for a, b in protected):
            continue
        if start <= .05 and end - start > args.edge_pad:
            cut = (0, end - args.edge_pad)
        elif end >= duration - .05 and end - start > args.edge_pad:
            cut = (start + args.edge_pad, duration)
        elif end - start >= args.min_gap:
            cut = (start + args.keep_gap / 2, end - args.keep_gap / 2)
        else:
            continue
        a, b = max(0, round(cut[0] * rate)), min(frames, round(cut[1] * rate))
        if b > a:
            removed.append((a, b))
    retained, cursor = [], 0
    for a, b in removed:
        if a > cursor:
            retained.append((cursor, a))
        cursor = b
    if cursor < frames:
        retained.append((cursor, frames))
    if not retained:
        raise ValueError('No narration retained; inspect input/threshold before editing.')
    frame_bytes = params.sampwidth * params.nchannels
    output_pcm = b''.join(pcm[a * frame_bytes:b * frame_bytes] for a, b in retained)
    with wave.open(str(tightened), 'wb') as stream:
        stream.setparams(params)
        stream.writeframes(output_pcm)
    subprocess.run([
        str(args.ffmpeg), '-nostdin', '-n', '-v', 'error', '-i', str(tightened),
        '-af', f'atempo={args.tempo}', '-c:a', 'pcm_s16le', str(final)
    ], check=True)
    final_params, _ = read_wav(final)
    native_seconds, approximate_mapping = 0, []
    for a, b in retained:
        length = (b - a) / rate
        approximate_mapping.append({
            'inputSeconds': [a / rate, b / rate],
            'approximateFinalSeconds': [native_seconds / args.tempo, (native_seconds + length) / args.tempo]
        })
        native_seconds += length
    result = {
        'source': str(source), 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'pauseTightened': str(tightened.resolve()), 'output': str(final.resolve()),
        'sourceSeconds': duration, 'tightenedSeconds': len(output_pcm) / frame_bytes / rate,
        'outputSeconds': final_params.nframes / final_params.framerate,
        'tempoFactor': args.tempo, 'silenceThresholdDb': args.noise_db,
        'minimumInternalGapSeconds': args.min_gap, 'retainedInternalGapBeforeTempoSeconds': args.keep_gap,
        'protectedInputRanges': protected, 'removedInputRanges': [[a / rate, b / rate] for a, b in removed],
        'mapping': approximate_mapping, 'mappingPrecision': 'Approximate after atempo; re-align final words before shot timing.',
        'sourcePreserved': True, 'listeningStatus': 'pending-user-review',
        'note': 'Silence detection is a candidate edit, not proof of no speech loss. Preserve breaths and intended pauses; verify words and listen. Tempo editing does not create expressive acting.'
    }
    report.write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({key: result[key] for key in ('sourceSeconds', 'tightenedSeconds', 'outputSeconds', 'tempoFactor', 'output')}, indent=2))


if __name__ == '__main__':
    main()
