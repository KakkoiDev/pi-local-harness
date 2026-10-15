"""plh setup: the toolchain the harness fetches once into <data>/toolchain (plan 198, kit/toolchain.json).

    plh setup            everything below
    plh setup browser    Chromium's headless shell, the browser Pi drives (task 215)

The browser: Chrome for Testing's headless shell, pinned, checked against the MD5 Google's storage publishes for the
file. Measured 2026-10-15 on this Mac with Pi's browser tool: 525 ms and about 420 MB per look, against 837 ms and
922 MB for the full Chromium. Lightpanda was considered: no layout engine, so not usable for layout facts.
"""
import base64
import hashlib
import io
import os
from pathlib import Path
import platform as host
import shutil
import sys
import tempfile
import urllib.request
import zipfile

HEADLESS_SHELL = '155.0.8059.79'  # Chrome for Testing, Stable on 2026-10-15
STORE = 'https://storage.googleapis.com/chrome-for-testing-public'


def platform(system=None, machine=None):
    system, machine = system or host.system(), machine or host.machine()
    if system == 'Darwin': return 'mac-arm64' if machine == 'arm64' else 'mac-x64'
    if system == 'Linux' and machine in ('x86_64', 'AMD64'): return 'linux64'
    raise ValueError(f'No headless shell is published for {system} {machine}; set PI_BROWSER to a Chromium.')


def shell_url(machine, base=STORE):
    return f'{base}/{HEADLESS_SHELL}/{machine}/chrome-headless-shell-{machine}.zip'


def browser(data, base=STORE, machine=None):
    """Fetch, check and unpack the headless shell into <data>/toolchain/chrome-headless-shell; a sentence for the person."""
    machine = machine or platform()
    target = Path(data) / 'toolchain' / 'chrome-headless-shell'
    stamp = target / 'VERSION'
    if stamp.is_file() and stamp.read_text().strip() == HEADLESS_SHELL and (target / 'chrome-headless-shell').is_file():
        return f'The browser for Pi is already installed (headless shell {HEADLESS_SHELL}).'
    with urllib.request.urlopen(shell_url(machine, base), timeout=120) as response:
        body = response.read()
        published = [value.split('=', 1)[1] for value in response.headers.get_all('x-goog-hash') or [] if value.startswith('md5=')]
    if not published: raise ValueError('The download came without its MD5, so it cannot be checked. Nothing was installed.')
    if base64.b64encode(hashlib.md5(body).digest()).decode() != published[0]:
        raise ValueError('The download does not match the MD5 Google publishes for it. Nothing was installed.')
    with tempfile.TemporaryDirectory(dir=Path(data)) as folder:
        with zipfile.ZipFile(io.BytesIO(body)) as zipped:
            for item in zipped.infolist():
                if item.filename.startswith('/') or '..' in Path(item.filename).parts: raise ValueError('The archive has a path outside its folder. Nothing was installed.')
                zipped.extract(item, folder)
                mode = item.external_attr >> 16
                if mode: os.chmod(Path(folder) / item.filename, mode & 0o777)
        unpacked = Path(folder) / f'chrome-headless-shell-{machine}'
        (unpacked / 'VERSION').write_text(HEADLESS_SHELL + '\n')
        if target.exists(): shutil.rmtree(target)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(unpacked), str(target))
    return f'Installed the browser for Pi: headless shell {HEADLESS_SHELL} in {target} ({len(body) // 1_000_000} MB downloaded, checked).'


def main(argv, data):
    steps = argv or ['browser']
    for step in steps:
        if step != 'browser': print(f'Unknown setup step “{step}”. Steps: browser.'); return 2
        try: print(browser(data))
        except (OSError, ValueError) as error: print(f'Not installed: {error}'); return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:], Path(os.getenv('PI_AGENT_DATA', str(Path.home() / 'pi-local-harness-data')))))
