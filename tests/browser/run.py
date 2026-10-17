"""Run the browser suites from any shell: `python3 tests/browser/run.py design|chat|stories|all`.

Finds Playwright (NODE_PATH, PI_PLAYWRIGHT, or ~/.cache/plh-browser/node_modules as docs/contributing-for-agents.md sets it
up) and exits with the suite's own code. Without Playwright it runs nothing, says so ("Not run") and exits 2, so a model
cannot mistake a check it could not run for a pass (docs/lessons/L-005). Gate counts this command as a test run.
"""
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
SUITES = {'design': 'tests/browser/design.cjs', 'chat': 'tests/browser/chat.cjs', 'stories': 'tests/browser/stories.cjs'}
SETUP = ('mkdir -p ~/.cache/plh-browser && cd ~/.cache/plh-browser && npm install playwright@1.56.1 '
         '&& npx playwright install chromium && cd -')


def playwright():
    """The node_modules folder that holds Playwright, or None."""
    candidates = [*filter(None, os.environ.get('NODE_PATH', '').split(os.pathsep)), os.environ.get('PI_PLAYWRIGHT', ''),
                  str(Path.home() / '.cache/plh-browser/node_modules')]
    return next((folder for folder in candidates if folder and (Path(folder) / 'playwright' / 'package.json').is_file()), None)


def main(names):
    chosen = list(SUITES) if names in ([], ['all']) else names
    if any(name not in SUITES for name in chosen):
        print(f'Usage: python3 tests/browser/run.py design, chat, stories or all (got {" ".join(names)})'); return 2
    modules = playwright()
    if not modules:
        print('Not run: Playwright is not installed, so the browser suites did not run. Nothing was verified.')
        print(f'Set it up once:\n  {SETUP}\nor point NODE_PATH or PI_PLAYWRIGHT at a node_modules folder that has playwright.')
        return 2
    code = 0
    for name in chosen:
        print(f'── {name}: node {SUITES[name]}', flush=True)
        result = subprocess.run(['node', SUITES[name]], cwd=ROOT, env={**os.environ, 'NODE_PATH': modules})
        print(f'── {name}: {"passed" if result.returncode == 0 else f"FAILED (exit {result.returncode})"}', flush=True)
        code = code or result.returncode
    return code


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
