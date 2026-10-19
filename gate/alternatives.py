"""Task 323: a refused command comes with a checked alternative, so Pi goes on with allowed tools.

System 1 keeps the refusal; the person is never asked to classify the command or to choose a policy. The alternative is
the project's own test command (Implementation) or the read-only form of what Pi tried. Every test command offered here
passes gate.phase_shell.test_run.
"""
import json
import re
import shlex
from pathlib import Path

CONTINUE = 'Continue with allowed tools.'
READS = ('ls', 'cat', 'head', 'tail', 'wc', 'grep', 'rg', 'find', 'diff', 'sed', 'tree', 'less', 'more', 'awk', 'xargs', 'file', 'stat', 'cd', 'pwd', 'git')
RUNNERS = ('pytest', 'py.test', 'unittest', 'jest', 'vitest', '--test')
INTERPRETERS = ('python', 'python3', 'node', 'uv', 'uvx', 'npm', 'npx', 'yarn', 'pnpm', 'bun', 'deno', 'make')


def _text(path):
    try: return path.read_text(encoding='utf-8', errors='replace')[:200_000] if path.is_file() else ''
    except OSError: return ''


UNITTEST = 'python3 -m unittest discover -s tests'


def pytest_missing(root):
    """Live 2026-10-19 (Habit Tracker, web starter): the project names pytest but has no .venv (its packages were never
    installed: `uv sync` is a download the person approves), so pytest cannot run offline; only the stdlib runner can."""
    import importlib.util
    root = Path(root)
    if (root / 'uv.lock').is_file(): return not (root / '.venv').is_dir()
    return importlib.util.find_spec('pytest') is None


def project_test_command(root):
    """The project's own checked test command, from its files (the starters: npm/node --test, uv/pytest, unittest), one
    that runs in this project now (no .venv: the stdlib runner)."""
    from .phase_shell import test_run
    root = Path(root)
    found = None
    try: scripts = json.loads(_text(root / 'package.json') or '{}').get('scripts') or {}
    except (ValueError, AttributeError): scripts = {}
    tests = root / 'tests'
    def has(pattern):
        try: return tests.is_dir() and any(True for _ in tests.rglob(pattern))
        except OSError: return False
    if isinstance(scripts, dict) and scripts.get('test'): found = 'npm test'
    elif has('*.test.mjs') or has('*.test.js'): found = 'node --test'
    else:
        python = _text(root / 'pyproject.toml') + _text(root / 'requirements.txt') + _text(root / 'requirements-dev.txt')
        pytest = 'pytest' in python or (root / 'pytest.ini').is_file() or (root / 'conftest.py').is_file()
        if pytest and pytest_missing(root): found = UNITTEST
        elif pytest and (root / 'uv.lock').is_file(): found = 'uv run --offline pytest -q'
        elif pytest: found = 'python3 -m pytest -q'
        elif has('test*.py'): found = UNITTEST
    return found if found and test_run(found) else None


# The fixed alternatives (messages/ja.json translates each; "Instead: {alternative} Continue with allowed tools." joins them).
TESTS_ANY = 'run the project\u2019s tests with a checked runner (pytest, unittest, node --test, npm test).'
TESTS_LATER = 'read with the read tool, `ls`, `cat` or `rg`; tests run in Implementation.'
FIND = '`rg --files` or `find . -name <pattern>` (no -exec), then the read tool or `rg <pattern>`.'
READ_FORM = 'the read tool, or `ls`, `cat <file>` or `rg <pattern>` alone (no cd, globs, $, ; or redirection).'
READ = 'read with the read tool, `ls`, `cat` or `rg`.'
NO_PYTEST = '`python3 -m unittest discover -s tests` with unittest.TestCase tests: pytest isn\u2019t installed here (no .venv; creating it is a download the person approves).'


def instead(command, root, phase):
    """One short sentence for the refusal: what Pi can use instead, and that it goes on."""
    try: words = shlex.split(command or '')
    except ValueError: words = (command or '').split()
    head = Path(words[0]).name if words else ''
    testing = any(word in RUNNERS or word in ('test', 't') and head in ('npm', 'yarn', 'pnpm', 'bun', 'make') for word in words)
    if phase == 'implementation' and (testing or head in INTERPRETERS or re.match(r'python\d', head)):
        found = project_test_command(root) if root else None
        python = _text(Path(root) / 'pyproject.toml') if root else ''
        if found == UNITTEST and 'pytest' in python and pytest_missing(root): alternative = NO_PYTEST
        else: alternative = f'`{found}` (no cd, pipes or redirection), or a test of the behaviour.' if found else TESTS_ANY
    elif testing: alternative = TESTS_LATER
    elif head == 'find' and any(word in ('-exec', '-execdir', '-delete', '-ok', '-fprint') for word in words): alternative = FIND
    elif head in READS: alternative = READ_FORM
    else: alternative = READ
    return f'Instead: {alternative} {CONTINUE}'
