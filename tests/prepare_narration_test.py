"""Real PCM/FFmpeg checks for pause-only preparation; no inference or listening claim."""
import hashlib
import json
import math
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import wave

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / 'video-skills/cinematic-3d-storytelling/scripts/prepare_narration.py'
RATE = 24000


def read_pcm(path):
    with wave.open(str(path), 'rb') as stream:
        return stream.getparams(), stream.readframes(stream.getnframes())


class NarrationPreparationTest(unittest.TestCase):
    def setUp(self):
        test_root = ROOT / 'data' / 'narration-tests'
        test_root.mkdir(parents=True, exist_ok=True)
        self.folder = Path(tempfile.mkdtemp(prefix='run-', dir=test_root))
        self.source = self.folder / 'source.wav'
        tone = b''.join(struct.pack('<h', round(9000 * math.sin(2 * math.pi * 440 * n / RATE))) for n in range(round(.4 * RATE)))
        silence = lambda seconds: b'\0\0' * round(seconds * RATE)
        self.pcm = silence(.2) + tone + silence(1) + tone + silence(.2)
        with wave.open(str(self.source), 'wb') as stream:
            stream.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
            stream.writeframes(self.pcm)
        self.hash = hashlib.sha256(self.source.read_bytes()).hexdigest()

    def prepare(self, *flags, folder='prepared', success=True):
        result = subprocess.run([sys.executable, str(HELPER), '--input', str(self.source), '--out-dir', str(self.folder / folder), *flags], capture_output=True, text=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
            return json.loads((self.folder / folder / 'source-edit-report.json').read_text(encoding='utf-8'))
        self.assertNotEqual(result.returncode, 0)
        return result

    def test_default_removes_only_recorded_gap_intervals_without_tempo_processing(self):
        report = self.prepare()
        self.assertEqual(report['tempoFactor'], 1)
        self.assertTrue(report['articulationSpeedPreserved'])
        params, final = read_pcm(report['output'])
        _, intermediate = read_pcm(report['pauseTightened'])
        expected = b''.join(self.pcm[round(a['inputSeconds'][0] * RATE) * 2:round(a['inputSeconds'][1] * RATE) * 2] for a in report['mapping'])
        self.assertEqual(final, intermediate)
        self.assertEqual(final, expected)
        self.assertEqual(params.framerate, RATE)
        self.assertGreater(len(report['removedInputRanges']), 0)
        self.assertLess(report['outputSeconds'], report['sourceSeconds'] - .5)
        self.assertEqual(hashlib.sha256(self.source.read_bytes()).hexdigest(), self.hash)

    def test_protected_internal_hold_survives_cleanup(self):
        report = self.prepare('--protect', '.59:1.61')
        self.assertGreater(report['outputSeconds'], 1.7)
        self.assertFalse(any(a < 1.6 and b > .6 for a, b in report['removedInputRanges']))

    def test_explicit_tempo_remains_separate_bounded_preview(self):
        report = self.prepare('--tempo', '1.1')
        self.assertFalse(report['articulationSpeedPreserved'])
        self.assertLess(report['outputSeconds'], report['tightenedSeconds'])
        rejected = self.prepare('--tempo', '1.2', folder='outside-policy', success=False)
        self.assertIn('saved maximum', rejected.stderr)

    def test_existing_outputs_are_preserved(self):
        report = self.prepare()
        before = Path(report['output']).read_bytes()
        rejected = self.prepare(success=False)
        self.assertIn('Refusing to overwrite', rejected.stderr)
        self.assertEqual(Path(report['output']).read_bytes(), before)


if __name__ == '__main__':
    unittest.main()
