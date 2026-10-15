"""The README's phone screenshot without Playwright: a scratch workbench (never your own projects or data) with the
sample "Class Notes" app and the same two-message chat as make.cjs, captured at 390 x 844 by the headless shell
(`plh setup browser`). Writes docs/screenshots/workbench-phone.png.

    python3 docs/screenshots/make_phone.py [--chrome PATH]
"""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
QUESTIONS = ['What is the plan for this app?', 'Add a search box that filters the notes as I type.']


def chrome(asked):
    data = Path(os.environ.get('PI_AGENT_DATA', Path.home() / 'pi-local-harness-data'))
    for path in [asked, os.environ.get('PI_TEST_CHROME'), data / 'toolchain/chrome-headless-shell/chrome-headless-shell']:
        if path and Path(path).is_file(): return str(path)
    sys.exit('No headless shell: run `plh setup browser`, or pass --chrome.')


def call(base, path, body=None):
    request = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None,
                                     headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=30) as response: return json.load(response)


def main():
    parser = argparse.ArgumentParser(); parser.add_argument('--chrome'); args = parser.parse_args()
    browser = chrome(args.chrome)
    folder = Path(tempfile.mkdtemp(prefix='pi-phone-shot-')).resolve()
    (folder / 'pi').write_text(f'#!{sys.executable}\n' + (HERE / 'pi.py').read_text()); (folder / 'pi').chmod(0o755)
    env = {key: value for key, value in os.environ.items() if not key.startswith(('PI_HARNESS_', 'PI_WEB_REMOTE_'))}
    env.update(PATH=f'{folder}:{os.environ["PATH"]}', PI_TAILSCALE='false', PI_OLLAMA_URL='http://127.0.0.1:9',
               PI_WEB_PORT='0', PI_GATE_PORT='0', PI_TRASH_DIR=str(folder / 'Trash'), PI_AGENT_DATA=str(folder / 'workspace'),
               PI_WEB_DATA=str(folder / 'data'), PI_HARNESS_LOG_FILE=str(folder / 'audit.log'))
    server = subprocess.Popen([sys.executable, str(ROOT / 'harness/services.py')], cwd=ROOT, env=env,
                              stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    try:
        base = f'http://127.0.0.1:{json.loads(server.stdout.readline())["web"]}'
        project = call(base, '/api/projects/create', {'name': 'Class Notes', 'parent': str(folder), 'kind': 'static'})['project']
        for question in QUESTIONS:
            call(base, '/api/jobs/create', {'project': project, 'message': question})
            for _ in range(120):  # the stand-in Pi answers at once; wait for the request to finish
                if all(job['status'] not in ('queued', 'running') for job in call(base, '/api/workspace')['jobs']): break
                time.sleep(0.25)
        out = HERE / 'workbench-phone.png'
        subprocess.run([browser, '--headless', '--hide-scrollbars', '--window-size=390,844', '--force-device-scale-factor=2',
                        '--virtual-time-budget=8000', f'--user-data-dir={folder / "profile"}', f'--screenshot={out}',
                        f'{base}/p/{project}/chat'], check=True, capture_output=True, timeout=120)
        print(out)
    finally:
        server.terminate(); server.wait(timeout=10)  # the services this script started, by its own handle
        shutil.rmtree(folder, ignore_errors=True)


if __name__ == '__main__':
    main()
