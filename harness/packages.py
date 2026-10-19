"""Task 331: a project's packages (its environment), installed once with the person's approval.

Live 2026-10-19: the “Habit Tracker” web project had no .venv: the base check used the standard library only and the
Preview never started, so pytest was never installed and Pi's tests could not run. Now:

- Project Start's Summary shows what installing the app's packages means, from the lock file (uv.lock: the packages this
  computer installs and the size of their downloads; package-lock.json for npm). Pressing Create is the approval: Create
  runs `uv sync --frozen` (online, this one time) before the base check, which then also runs the project's own tests
  offline (`uv run --offline pytest -q`).
- An existing project with a lock file and no environment offers Project › Install Packages… (the person's control;
  `/setup packages` in the person's terminal). Nothing else installs: the Preview and Pi's test runs stay offline.

System 1 decides all of it (the lock file, the person's press); the model never installs anything.
"""
import json
import os
from pathlib import Path
import platform
import re
import shutil
import subprocess
import sys
import time

try: import tomllib
except ImportError: tomllib = None  # Python < 3.11: counts unavailable; the line says the size comes later

SOURCES = {'uv': ('PyPI', 'uv'), 'npm': ('the npm registry', 'npm')}


def uv():
    """uv where its installers put it (plh may start at login with a short PATH), looked up at call time."""
    return shutil.which('uv') or next((str(path) for path in (Path.home() / '.local/bin/uv', Path.home() / '.cargo/bin/uv', Path('/opt/homebrew/bin/uv')) if path.is_file()), 'uv')


def _read(path):
    try: return Path(path).read_text(encoding='utf-8')
    except (OSError, UnicodeDecodeError): return ''


# -- markers and wheels -----------------------------------------------------------------------------------------------
def _version(text):
    return tuple(int(part) for part in re.findall(r'\d+', text)[:3])


def _environment(system, machine, python):
    names = {'darwin': 'Darwin', 'linux': 'Linux', 'win32': 'Windows'}
    return {'sys_platform': system, 'platform_system': names.get(system, system), 'os_name': 'nt' if system == 'win32' else 'posix',
            'platform_machine': machine, 'python_version': f'{python[0]}.{python[1]}', 'python_full_version': '.'.join(map(str, python)),
            'implementation_name': 'cpython', 'platform_python_implementation': 'CPython'}


def marker_holds(marker, environment):
    """A PEP 508 marker as uv writes them (`a == 'b' and (c < '3.13' or …)`); a variable it does not know holds."""
    if not marker: return True
    def compare(match):
        name, operator, value = match.group(1), match.group(2), match.group(3)
        if name not in environment: return 'True'
        left = environment[name]
        if name.startswith('python'):
            left, value = _version(left), _version(value); width = len(value); left = left[:width] if operator != '==' else left
        result = {'==': left == value, '!=': left != value, '<': left < value, '<=': left <= value, '>': left > value, '>=': left >= value, '~=': left >= value}.get(operator, True)
        return str(result)
    text = re.sub(r"(\w+)\s*(==|!=|<=|>=|~=|<|>)\s*'([^']*)'", compare, marker)
    text = re.sub(r"'[^']*'\s+(?:not\s+)?in\s+\w+|\w+\s+(?:not\s+)?in\s+'[^']*'", 'True', text)
    if not re.fullmatch(r'[\s()]*(?:(?:True|False|and|or|not)[\s()]*)*', text): return True
    try: return bool(eval(text, {'__builtins__': {}}, {}))  # only True/False/and/or/not/parentheses remain
    except SyntaxError: return True


def _platform_matches(tag, system, machine):
    if tag == 'any': return True
    arch = {'arm64': ('arm64', 'aarch64'), 'aarch64': ('arm64', 'aarch64'), 'x86_64': ('x86_64', 'amd64'), 'amd64': ('x86_64', 'amd64')}.get(machine, (machine,))
    for part in tag.split('.'):
        if system == 'darwin' and part.startswith('macosx') and (part.endswith(arch) or part.endswith('universal2')): return True
        if system == 'linux' and part.startswith(('manylinux', 'musllinux', 'linux')) and part.endswith(arch): return True
        if system == 'win32' and part.startswith('win') and part.endswith(arch): return True
    return False


def _wheel_score(filename, system, machine, python):
    """How well a wheel fits this computer (higher is better), or None when it cannot be installed here."""
    parts = filename[:-4].split('-')
    if len(parts) < 5: return None
    python_tags, abi, plat = parts[-3].split('.'), parts[-2], parts[-1]
    if not _platform_matches(plat, system, machine): return None
    here = f'cp{python[0]}{python[1]}'
    if here in python_tags and abi == here: return 4
    if abi == 'abi3' and any(tag.startswith('cp3') and _version(tag[2:3] + '.' + tag[3:]) <= python[:2] for tag in python_tags): return 3
    if abi == 'none' and any(tag in ('py3', f'py{python[0]}{python[1]}', here) or tag.startswith('py3') for tag in python_tags): return 2 if plat != 'any' else 1
    return None


def _download_size(package, system, machine, python):
    best = None
    for wheel in package.get('wheels') or []:
        name = str(wheel.get('url') or wheel.get('filename') or '').rsplit('/', 1)[-1]
        score = _wheel_score(name, system, machine, python)
        if score is not None and isinstance(wheel.get('size'), int) and (best is None or score > best[0]): best = (score, wheel['size'])
    if best: return best[1]
    size = (package.get('sdist') or {}).get('size')
    return size if isinstance(size, int) else None


def uv_lock(text, system=None, machine=None, python=None):
    """{'names', 'bytes'}: the packages `uv sync` installs here (from the project through its dependencies, its dependency
    groups and the extras they ask for, following markers) and the size of their downloads (the wheel for this platform,
    else the source archive; None when the lock has no sizes)."""
    system = system or sys.platform; machine = machine or platform.machine(); python = python or tuple(sys.version_info[:3])
    data = tomllib.loads(text) if tomllib else {}
    found = {item.get('name'): item for item in data.get('package', []) if isinstance(item, dict)}
    environment = _environment(system, machine, python)
    roots = [item for item in found.values() if isinstance(item.get('source'), dict) and ('virtual' in item['source'] or 'editable' in item['source'])]
    seen, queue = set(), []
    for root in roots:
        queue += list(root.get('dependencies') or [])
        for group in (root.get('dev-dependencies') or {}).values(): queue += list(group)
    local = {item.get('name') for item in roots}
    while queue:
        edge = queue.pop()
        if not isinstance(edge, dict) or not marker_holds(edge.get('marker'), environment): continue
        name = edge.get('name'); package = found.get(name)
        extras = edge.get('extra') or edge.get('extras') or []
        if package is None or name in local: continue
        key_extras = [(name, extra) for extra in extras]
        if name in seen and all(item in seen for item in key_extras): continue
        if name not in seen: seen.add(name); queue += list(package.get('dependencies') or [])
        for item in key_extras:
            if item not in seen: seen.add(item); queue += list((package.get('optional-dependencies') or {}).get(item[1]) or [])
    names = sorted(item for item in seen if isinstance(item, str))
    sizes = [_download_size(found[name], system, machine, python) for name in names]
    known = [size for size in sizes if size is not None]
    return {'names': names, 'bytes': sum(known) if known else None}


# -- the facts the person sees ----------------------------------------------------------------------------------------
def size(count):
    if count < 1_000_000: return f'{max(1, round(count / 1000))} KB'
    if count < 10_000_000: return f'{count / 1_000_000:.1f} MB'
    return f'{round(count / 1_000_000)} MB'


def line(manager, count, total):
    where, cache = SOURCES[manager]
    amount = f'about {size(total)}' if total else 'size shown after the first install'
    return f"Install the app's packages: {count} package{'s' if count != 1 else ''}, {amount} (download from {where}, once; later projects reuse the shared {cache} cache)"


def _npm(folder):
    try: manifest = json.loads(_read(folder / 'package.json') or '{}')
    except ValueError: return None
    if not isinstance(manifest, dict) or not (manifest.get('dependencies') or manifest.get('devDependencies')): return None
    if not (folder / 'package-lock.json').is_file(): return None
    try: lock = json.loads(_read(folder / 'package-lock.json') or '{}')
    except ValueError: lock = {}
    entries = [key for key in (lock.get('packages') or {}) if key] if isinstance(lock, dict) else []
    return len(entries) or len({**(manifest.get('dependencies') or {}), **(manifest.get('devDependencies') or {})})


def facts(folder):
    """{'manager': 'uv'|'npm'|None, 'count', 'bytes', 'line', 'installed', 'command'} for a project folder."""
    folder = Path(folder)
    if (folder / 'uv.lock').is_file():
        try: counted = uv_lock(_read(folder / 'uv.lock'))
        except (ValueError, TypeError, AttributeError): counted = {'names': [], 'bytes': None}
        count = len(counted['names'])
        return {'manager': 'uv', 'count': count, 'bytes': counted['bytes'], 'line': line('uv', count, counted['bytes']), 'installed': (folder / '.venv').is_dir(), 'command': 'uv sync --frozen'}
    count = _npm(folder)
    if count:
        return {'manager': 'npm', 'count': count, 'bytes': None, 'line': line('npm', count, None), 'installed': (folder / 'node_modules').is_dir(), 'command': 'npm ci'}
    return {'manager': None, 'count': 0, 'bytes': None, 'line': '', 'installed': True, 'command': ''}


def missing(folder):
    """The facts when the project has a lock file but no environment, else None."""
    found = facts(folder) if folder else None
    return found if found and found['manager'] and not found['installed'] else None


def needs_install(folder):
    """missing(), cheaply (two file checks; package.json read only without node_modules): the workspace asks for every
    project on each poll, to enable Project › Install Packages…."""
    folder = Path(folder)
    try:
        if (folder / 'uv.lock').is_file(): return not (folder / '.venv').is_dir()
        if (folder / 'node_modules').is_dir() or not (folder / 'package-lock.json').is_file(): return False
        manifest = json.loads(_read(folder / 'package.json') or '{}')
        return isinstance(manifest, dict) and bool(manifest.get('dependencies') or manifest.get('devDependencies'))
    except (OSError, ValueError): return False


def disk(folder):
    """The installed environment's size on disk, in the person's words ('' when there is none)."""
    root = Path(folder) / ('.venv' if (Path(folder) / '.venv').is_dir() else 'node_modules')
    if not root.is_dir(): return ''
    total = 0
    for path in root.rglob('*'):
        try: total += path.lstat().st_size if path.is_file() and not path.is_symlink() else 0
        except OSError: pass
    return size(total) if total else ''


# -- installing -------------------------------------------------------------------------------------------------------
def install(folder, progress=None, timeout=1800):
    """Install the project's packages from its lock file (`uv sync --frozen` or `npm ci`), online this one time.
    {'installed', 'reason', 'command', 'output', 'seconds', 'count'}. progress(line) gets each line as it comes.
    PI_NO_DOWNLOADS=1 (the tests) never runs the installer."""
    folder = Path(folder); found = facts(folder)
    result = {'installed': False, 'reason': '', 'command': found['command'], 'output': '', 'seconds': 0, 'count': found['count'], 'manager': found['manager']}
    if not found['manager']: return {**result, 'reason': 'This project has no lock file with packages to install.'}
    if found['installed']: return {**result, 'installed': True, 'reason': 'Already installed.'}
    if os.environ.get('PI_NO_DOWNLOADS'): return {**result, 'reason': 'Downloads are off here (PI_NO_DOWNLOADS), so nothing was downloaded.'}
    argv = [uv(), 'sync', '--frozen'] if found['manager'] == 'uv' else [shutil.which('npm') or 'npm', 'ci']
    environment = {key: value for key, value in os.environ.items() if key not in ('UV_OFFLINE', 'VIRTUAL_ENV', 'npm_config_offline') and not key.startswith(('PI_HARNESS_', 'PI_WEB_REMOTE_'))}
    environment.update(PYTHONDONTWRITEBYTECODE='1', NO_COLOR='1')
    started = time.monotonic(); lines = []
    try:
        with subprocess.Popen(argv, cwd=folder, env=environment, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, errors='replace') as process:
            for raw in process.stdout:
                text = raw.rstrip()
                if not text: continue
                lines.append(text); del lines[:-200]
                if progress:
                    try: progress(text)
                    except Exception: pass  # a progress reader never stops the install
                if time.monotonic() - started > timeout: process.kill(); lines.append(f'Stopped after {timeout} seconds.'); break
            code = process.wait()
    except OSError as error:
        code = -1; lines.append(f'Could not run {Path(argv[0]).name}: {error}')
    result.update(output='\n'.join(lines), seconds=round(time.monotonic() - started, 1))
    installed = code == 0 and (folder / ('.venv' if found['manager'] == 'uv' else 'node_modules')).is_dir()
    if installed: return {**result, 'installed': True}
    last = next((text for text in reversed(lines) if text.strip()), f'{Path(argv[0]).name} ended with exit code {code}.')
    offline = re.search(r'fetch|dns|network|offline|connect|resolve|ENOTFOUND|EAI_AGAIN', result['output'], re.I)
    return {**result, 'reason': ('No connection to download the packages: ' if offline else 'The install did not finish: ') + last[:300]}


def prepare(folder, progress=None):
    """Create's step between assembling the base and its check (kit/capabilities.py build): install the app's packages
    (pressing Create approved it), then name the project's own tests. progress(stage, line): 'install' lines while it
    downloads, then 'check'. None when the package has nothing to install (an app with no server)."""
    found = facts(folder)
    if not found['manager']: return None
    tell = (lambda stage, text: progress(stage, text)) if progress else (lambda stage, text: None)
    tell('install', found['line'])
    done = install(folder, progress=lambda text: tell('install', text))
    tell('check', '')
    return {**{key: done[key] for key in ('installed', 'reason', 'command', 'count', 'seconds', 'manager')}, 'line': found['line'], 'disk': disk(folder) if done['installed'] else '', 'tests': own_tests(folder)}


def own_tests(folder):
    """The project's own tests, offline, once its environment exists: `uv run --offline pytest -q` (argv), or None."""
    folder = Path(folder)
    if not ((folder / 'uv.lock').is_file() and (folder / '.venv').is_dir()): return None
    if 'pytest' not in _read(folder / 'pyproject.toml'): return None
    return [uv(), 'run', '--offline', 'pytest', '-q']


# -- the workbench's routes (harness/web_chat.py) ---------------------------------------------------------------------
PROGRESS = {}  # what an install is doing now, by the page's progress id (Create and Install Packages…)


def teller(key):
    """progress(stage, line) that keeps the latest line under the page's progress id (nothing without one)."""
    def told(stage, line):
        if not key: return
        PROGRESS[key] = {'stage': stage, 'line': (line or '')[-300:]}
        while len(PROGRESS) > 50: PROGRESS.pop(next(iter(PROGRESS)))
    return told


def progress(query):
    """GET /api/packages/progress?id=…: the stage ('install', 'check') and the installer's last line."""
    return PROGRESS.get(query.get('id', [''])[0]) or {'stage': '', 'line': ''}


def status(chat, project):
    """GET /api/project-packages?project=…: what Install Packages… would do, and whether it is needed."""
    found = facts(chat.documents.project_path(project))
    return {**found, 'missing': bool(found['manager'] and not found['installed'])}


def run(chat, data):
    """POST /api/projects/packages (PERSON_ROUTES): Project › Install Packages…, after the person confirmed the size line.
    Refused while Pi works in the project; the decision log keeps the person's decision."""
    from harness.web_chat import ProjectBusy
    from harness.decision_log import record
    project = data['project']; root = chat.documents.project_path(project)
    busy = [job for job in chat.queue.list() if job['status'] in ('running', 'queued') and job.get('project') == project]
    if busy: raise ProjectBusy(busy[0]['id'])
    if not missing(root): return {'installed': True, 'reason': 'Already installed: nothing to download.', 'count': facts(root)['count'], 'disk': disk(root)}
    key = str(data.get('progress') or '')[:64]
    try: done = install(root, progress=lambda text: teller(key)('install', text))
    finally: PROGRESS.pop(key, None)
    record(chat.documents.root, None, 'packages_install', 'person', 'installed' if done['installed'] else 'not installed', rule='packages.install')
    return {**{name: done[name] for name in ('installed', 'reason', 'command', 'count', 'seconds')}, 'disk': disk(root) if done['installed'] else '', 'output': done['output'][-4000:]}
