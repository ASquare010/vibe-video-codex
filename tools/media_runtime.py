"""Locate the same FFmpeg used by the editor, with no machine-specific paths."""
import os, shutil
from pathlib import Path
def ffmpeg_path():
    explicit=os.environ.get('FFMPEG_PATH')
    if explicit:return explicit
    bundled=Path(__file__).resolve().parents[1]/'node_modules/ffmpeg-static'/('ffmpeg.exe' if os.name=='nt' else 'ffmpeg')
    if bundled.is_file():return str(bundled)
    return shutil.which('ffmpeg') or 'ffmpeg'
