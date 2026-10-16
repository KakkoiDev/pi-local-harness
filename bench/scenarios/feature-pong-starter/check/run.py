"""Hidden Pong checks. No source names or implementation details for game behavior."""
import functools
import http.server
import json
from pathlib import Path
import subprocess
import sys
import threading

project, repo = map(Path, sys.argv[1:])
sys.path.insert(0, str(repo))
from gate.rules import plan_gaps

failures = []
def check(name, action):
    try:
        action()
        print('PASS: ' + name)
    except Exception as error:
        failures.append(name)
        print('FAIL: ' + name + ': ' + str(error))

def sample():
    assert not (project / 'js/logic/notes.mjs').exists(), 'sample logic remains'
    assert 'notes' not in (project / 'manifest.webmanifest').read_text().lower(), 'sample app name'
    assert 'notes' not in (project / 'README.md').read_text().lower(), 'sample README'
    for path in (project / 'messages').glob('*.json'):
        assert not any(key.startswith('notes.') for key in json.loads(path.read_text())), str(path)

def plan():
    gaps = plan_gaps(project)
    assert not gaps, '; '.join(gaps)
    roadmap = (project / 'ROADMAP.md').read_text()
    assert 'Plan this app' not in roadmap or '[x] [001-Plan this app]' in roadmap, 'planning task remains open'

def command(args, source=None):
    run = subprocess.run(args, input=source, cwd=project, capture_output=True, text=True, timeout=60)
    assert run.returncode == 0, (run.stdout + run.stderr)[-1800:]

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(project)))
thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
try:
    check('game pixels and controls', lambda: command(['node', str(Path(__file__).with_name('game.mjs')), str(repo), 'http://127.0.0.1:' + str(server.server_port)]))
finally:
    server.shutdown(); server.server_close(); thread.join()
check('sample removed', sample)
def references():
    command(['node', '--test', 'tests/files.test.mjs'])
    # The hidden copy prevents an accidentally weakened project test from passing broken references.
    source = (repo / 'kit/starter-static/tests/files.test.mjs').read_text()
    source = source.replace("const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');", 'const root=' + json.dumps(str(project)) + ';')
    command(['node', '--input-type=module'], source)
check('referenced files', references)
check('complete plan', plan)
check('own project tests', lambda: command(['node', '--test']))
# Verified request commits are graded by runner.run_one, against its baseline HEAD.
print('Request verification and commits: runner result (separate from app correctness)')
sys.exit(bool(failures))
