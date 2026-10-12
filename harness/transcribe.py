# /// script
# requires-python = ">=3.12,<3.13"
# dependencies = ["mlx-whisper==0.4.3", "imageio-ffmpeg==0.6.0"]
# ///
"""Local audio -> text. No audio is sent to a remote API."""
import os
import sys
import tempfile
from pathlib import Path
import imageio_ffmpeg
import mlx_whisper

source = Path(sys.argv[1]).expanduser().resolve(strict=True)
with tempfile.TemporaryDirectory(prefix='pi-audio-') as directory:
    ffmpeg = Path(directory) / 'ffmpeg'
    ffmpeg.symlink_to(imageio_ffmpeg.get_ffmpeg_exe())
    os.environ['PATH'] = directory + os.pathsep + os.environ.get('PATH', '')
    result = mlx_whisper.transcribe(str(source), path_or_hf_repo=os.getenv('PI_WHISPER_MODEL', 'mlx-community/whisper-base-mlx'), verbose=False)
    text = result['text'].strip()
    if not text:
        raise RuntimeError('No speech was recognized in this audio file')
    print(text)
