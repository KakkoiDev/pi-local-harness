"""Project Start (plan 253, plan 266 item 9): capabilities (what the app does) and packages (how it runs), chosen
separately; the kit assembles a tested base from them, and Add a Capability… adds one to an existing project.

The catalogue is kit/capabilities.json. Each available capability brings files from the kit (vendored libraries,
fragments) and tests of its own; the base check runs the package's base tests and every capability's tests with Python
or Node alone, offline, before anything is created or kept. Code decides all of it, never the model.

    python3 kit/capabilities.py <folder> <package>[,<package>] [<capability>,…]   # assemble and check, as New Project does
"""
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path

KIT = Path(__file__).resolve().parent
ROOT = KIT.parent
BASES = ('web', 'static', 'tui')
WORKER = {'web': 'static/sw.js', 'static': 'sw.js'}  # where each package's offline shell list lives
IGNORED = shutil.ignore_patterns('.venv', '__pycache__', 'node_modules', '.DS_Store')
IDENTITY = ('-c', 'user.name=Pi Workbench', '-c', 'user.email=pi-workbench@localhost', '-c', 'core.hooksPath=/dev/null')

try:
    from .new_project import new_project, start_history, initial_plan
    from .publish_audit import ensure_task
except ImportError:  # imported as a top-level module (harness/documents.py puts kit/ on the path)
    from new_project import new_project, start_history, initial_plan
    from publish_audit import ensure_task


class BaseFailed(ValueError):
    """The assembled base did not pass its own tests: nothing is created (or kept). `check` says which test failed."""
    def __init__(self, check):
        failing = check.get('failing') or []
        named = f"{failing[0]['capability']}: {failing[0]['test']}" if failing else (check.get('reason') or 'the tests did not pass')
        super().__init__(f'Not created: a test of the base failed ({named}). Nothing was created.')
        self.check = check


# -- the catalogue ----------------------------------------------------------------------------------------------------
def catalogue():
    """kit/capabilities.json, plus PI_KIT_CAPABILITIES_EXTRA (a catalogue file whose paths are relative to it: tests
    use it for a capability whose test fails). Each capability knows the folder its files come from."""
    data = json.loads((KIT / 'capabilities.json').read_text(encoding='utf-8'))
    for item in data['capabilities']: item['_kit'] = str(KIT)
    extra = os.environ.get('PI_KIT_CAPABILITIES_EXTRA')
    if extra:
        more = json.loads(Path(extra).read_text(encoding='utf-8'))
        for item in more.get('capabilities', []): item['_kit'] = str(Path(extra).resolve().parent); data['capabilities'].append(item)
    return data


def _by_id(items, identifier, kind):
    found = next((item for item in items if item['id'] == identifier), None)
    if not found: raise ValueError(f'Unknown {kind}: {identifier}')
    return found


def count_tests(path):
    """Test cases in one test file: unittest methods or node:test calls."""
    text = Path(path).read_text(encoding='utf-8', errors='replace')
    pattern = r'^\s*def test_\w+\(' if str(path).endswith('.py') else r'^\s*(?:test|it)\(\s*[\'"`]'
    return len(re.findall(pattern, text, re.M))


def _fragment_files(capability, base):
    spec = capability.get('install', {}).get(base) or {}
    if not spec.get('files'): return []
    folder = Path(capability['_kit']) / spec['files']
    return sorted(path for path in folder.rglob('*') if path.is_file() and '__pycache__' not in path.parts)


def _is_test(name):
    name = str(name)
    return bool(re.search(r'(^|/)tests/(test_[\w-]+\.py|[\w.-]+\.test\.mjs)$', name))


def tests_added(capability, base):
    folder = Path(capability['_kit']) / ((capability.get('install', {}).get(base) or {}).get('files') or '.')
    return sum(count_tests(path) for path in _fragment_files(capability, base) if _is_test(path.relative_to(folder).as_posix()))


def public():
    """What the dialog shows: groups, packages and capabilities, with the tests each one adds per package."""
    data = catalogue()
    capabilities = []
    for item in data['capabilities']:
        row = {key: value for key, value in item.items() if not key.startswith('_') and key not in ('install', 'keywords', 'readme')}
        row['tests'] = {base: tests_added(item, base) for base in item.get('install', {})}
        capabilities.append(row)
    return {'groups': data['groups'], 'packages': data['packages'], 'capabilities': capabilities}


def suggest(text):
    """Capabilities the person's sentence names (code, from each capability's words). Marked in the dialog, never chosen."""
    text = ' ' + str(text or '').lower() + ' '
    found = []
    for item in catalogue()['capabilities']:
        for word in item.get('keywords', []):
            word = word.lower()
            hit = re.search(r'(?<![a-z0-9])' + re.escape(word) + r'(?![a-z0-9])', text) if word.isascii() else word in text
            if hit: found.append(item['id']); break
    return found


# -- choosing ---------------------------------------------------------------------------------------------------------
def resolve(packages, capabilities):
    """Check a choice and say what the base will be: {'base', 'packages', 'capabilities', 'included', 'problems',
    'warnings'}. A problem stops Create (each says what to change); a warning is shown and does not."""
    data = catalogue(); packages = list(dict.fromkeys(packages or [])); chosen = list(dict.fromkeys(capabilities or []))
    names = {item['id']: item['name'] for item in data['packages']}
    for identifier in packages: _by_id(data['packages'], identifier, 'package')
    problems, warnings, included = [], [], {}
    bases = [identifier for identifier in packages if identifier in BASES]
    if not packages: problems.append('Choose at least one package.')
    if len(bases) > 1:
        problems.append(f"{' and '.join(names[item] for item in bases)} together are not available yet: one source for several packages needs the browser adapter (plan 253, task 277).")
    base = bases[0] if bases else 'static'
    for identifier in packages:
        package = _by_id(data['packages'], identifier, 'package')
        if package.get('on') and base not in package['on']:
            problems.append(f"{package['name']} needs {' or '.join(names[item] for item in package['on'])}: it installs a page.")
        for extra in package.get('includes', []):
            if extra not in chosen: chosen.append(extra); included[extra] = identifier
    for identifier in chosen:
        item = _by_id(data['capabilities'], identifier, 'capability')
        if not item.get('available'): problems.append(f"{item['name']}: {item.get('reason') or 'Not available yet.'}"); continue
        if base not in item.get('supports', []): problems.append(f"{item['name']}: the {names[base]} can't carry it.")
        for need in item.get('needs', []):
            if need not in chosen: problems.append(f"{item['name']} needs {_by_id(data['capabilities'], need, 'capability')['name']}.")
        for other, text in (item.get('warn_with') or {}).items():
            if other in chosen: warnings.append(text.replace('With ', f"{item['name']} and ", 1) if text.startswith('With ') else text)
    return {'base': base, 'packages': packages, 'capabilities': chosen, 'included': included, 'problems': problems, 'warnings': warnings}


# -- assembling -------------------------------------------------------------------------------------------------------
def _worker_entries(text, entries):
    """sw.js with `entries` added to its literal SHELL list, in the list's own quote style."""
    found = re.search(r'(\bSHELL\s*=\s*\[)([\s\S]*?)(\])', text)
    if not found: raise ValueError('sw.js has no literal SHELL list to add the files to.')
    present = re.findall(r'[\'"]([^\'"]+)[\'"]', found.group(2))
    quote = '"' if '"' in found.group(2) else "'"
    new = [entry for entry in entries if entry not in present]
    if not new: return text
    inside = found.group(2).rstrip()
    inside += (', ' if inside else '') + ', '.join(quote + entry + quote for entry in new)
    return text[:found.start(2)] + inside + text[found.end(2):]


def _blocks():
    """kit/blocks/add.py: App Blocks' own copier, so a capability's libraries land exactly where the blocks expect them."""
    import importlib.util
    spec = importlib.util.spec_from_file_location('kit_blocks_add', KIT / 'blocks' / 'add.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


def _block_files(names, base, folder=None):
    """(files App Blocks' add() would copy, whether it adds texts) for `names` in a `base` project, without writing."""
    blocks = _blocks(); cards = {card['name']: card for card in blocks.index()['cards']}
    chosen = blocks.expand(names, cards)
    needed = {library for name in chosen for library in cards[name]['libraries']}
    prefix = 'static/' if base == 'web' and needed - {'basecoat', 'littlejs'} else ''
    files = []
    for library, pairs in blocks.FILES.items():
        if library not in needed: continue
        for source, relative in pairs:
            target = prefix + relative
            if target in files: continue
            if folder is not None and (Path(folder) / target).is_file() and (Path(folder) / target).read_bytes() == source.read_bytes(): continue
            files.append(target)
    texts = json.loads((KIT / 'blocks' / 'texts.json').read_text(encoding='utf-8'))['cards']
    return files, any(texts.get(name) for name in chosen)


def planned(capability, base, folder=None):
    """(files added, files changed) when `capability` goes into a `base` project, without writing anything. With the
    project's `folder`, a library file already there, byte for byte, is neither added nor changed."""
    spec = capability.get('install', {}).get(base)
    if spec is None: raise ValueError(f"{capability['name']} can't go into this package.")
    added = []
    if spec.get('files'):
        fragments = Path(capability['_kit']) / spec['files']
        added += [path.relative_to(fragments).as_posix() for path in _fragment_files(capability, base)]
    for source, target in spec.get('copy', []):
        source = Path(capability['_kit']) / source
        if source.is_dir(): added += [f'{target}/{path.relative_to(source).as_posix()}' for path in sorted(source.rglob('*')) if path.is_file() and '__pycache__' not in path.parts]
        else: added.append(target)
    texts = False
    if spec.get('blocks'):
        files, texts = _block_files(spec['blocks'], base, folder); added += [name for name in files if name not in added]
    changed = ['README.md', 'packaging.json'] + ([WORKER[base]] if spec.get('shell') else []) + (['messages/en.json', 'messages/ja.json'] if texts else [])
    return added, changed


def install(folder, capability, base):
    """Copy one capability's files into the project and add its files to the offline shell. Returns the files added."""
    folder = Path(folder); spec = capability['install'][base]; added, _ = planned(capability, base, folder)
    taken = [name for name in added if (folder / name).exists()]
    if taken: raise ValueError(f"{capability['name']}: {', '.join(taken[:3])} already exist{'s' if len(taken) == 1 else ''} in the project.")
    if spec.get('files'):
        source = Path(capability['_kit']) / spec['files']
        for path in _fragment_files(capability, base):
            target = folder / path.relative_to(source); target.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(path, target)
    for source, target in spec.get('copy', []):
        source = Path(capability['_kit']) / source; target = folder / target; target.parent.mkdir(parents=True, exist_ok=True)
        if source.is_dir(): shutil.copytree(source, target, ignore=IGNORED, dirs_exist_ok=True)
        else: shutil.copy2(source, target)
    if spec.get('blocks'): _blocks().add(folder, spec['blocks'])  # the libraries, licences and texts, as App Blocks copy them
    if spec.get('shell'):
        worker = folder / WORKER[base]; worker.write_text(_worker_entries(worker.read_text(encoding='utf-8'), spec['shell']), encoding='utf-8')
    return added


def write_record(folder, packages, capabilities):
    """packaging.json (plan 253, task 275): the packages and capabilities the person chose. The harness writes it."""
    (Path(folder) / 'packaging.json').write_text(json.dumps({'packages': list(packages), 'capabilities': list(capabilities)}, indent=1) + '\n', encoding='utf-8')


def write_readme(folder, capabilities):
    """The README's Capabilities section, rewritten from the chosen capabilities: what each brings and how to check it."""
    path = Path(folder) / 'README.md'; text = path.read_text(encoding='utf-8') if path.is_file() else ''
    text = re.sub(r'\n## Capabilities\n[\s\S]*?(?=\n## |\Z)', '\n', text).rstrip() + '\n'
    items = {item['id']: item for item in catalogue()['capabilities']}
    lines = [f"- {items[identifier].get('readme') or items[identifier]['name']}" for identifier in capabilities if identifier in items]
    if lines:
        command = ' '.join(_display(argv) for argv in check_commands(folder))
        text += '\n## Capabilities\n\nChosen in Project Start or added with Project › Add a Capability…; each came with its own tests. ' \
                f'The base check, with nothing installed: `{command}`\n\n' + '\n'.join(lines) + '\n'
    path.write_text(text, encoding='utf-8')


def assemble(folder, plan, files=None):
    """The base in `folder` (which must not exist yet or be empty), not yet committed: the package's starter, every
    capability's files, packaging.json and the README section."""
    folder = Path(folder)
    new_project(folder, static=plan['base'] == 'static', tui=plan['base'] == 'tui', files=files, history=False)
    items = catalogue()['capabilities']
    for identifier in plan['capabilities']: install(folder, _by_id(items, identifier, 'capability'), plan['base'])
    write_record(folder, plan['packages'], plan['capabilities'])
    write_readme(folder, plan['capabilities'])
    return folder


def summary(packages, capabilities, files=None):
    """Step 4's facts: the base's files and tests, assembled in a scratch folder (with the first plan's `files` and the
    publication audit task the first commit adds) and thrown away."""
    plan = resolve(packages, capabilities)
    if plan['problems']: return {**plan, 'files': 0, 'tests': 0}
    with tempfile.TemporaryDirectory(prefix='pi-start-') as scratch:
        folder = assemble(Path(scratch) / 'base', plan, files)
        ensure_task(folder)
        files = sum(1 for path in folder.rglob('*') if path.is_file() and '.git' not in path.relative_to(folder).parts)
        tests = sum(count_tests(folder / name) for name in base_tests(folder))
    return {**plan, 'files': files, 'tests': tests}


# -- the base check ---------------------------------------------------------------------------------------------------
def project_state(folder):
    """(base package, packages, capabilities) of a project: packaging.json, or what its files show for older projects."""
    folder = Path(folder); record = folder / 'packaging.json'
    capabilities = []
    if record.is_file():
        try: data = json.loads(record.read_text(encoding='utf-8'))
        except ValueError: data = {}
        packages = [item for item in data.get('packages', []) if isinstance(item, str)]
        capabilities = [item for item in data.get('capabilities', []) if isinstance(item, str)]
        base = next((item for item in packages if item in BASES), 'static' if packages else None)
        if base: return base, packages, capabilities
    registry = json.loads((KIT / 'starters.json').read_text(encoding='utf-8'))
    base = next((name for name, spec in registry.items() if (folder / spec['identify']).is_file()), None)
    if base is None: return None, [], []
    for item in catalogue()['capabilities']:
        if any((folder / name).is_file() for name in (f"tests/test_cap_{item['id']}.py", f"tests/cap-{item['id']}.test.mjs")): capabilities.append(item['id'])
    return base, [base], capabilities


def base_tests(folder):
    """The base check's test files in a project: the package's base tests and every capability's own tests."""
    folder = Path(folder); base, _, _ = project_state(folder)
    if base is None: return []
    package = _by_id(catalogue()['packages'], base, 'package')
    names = sorted(path.relative_to(folder).as_posix() for path in (folder / 'tests').glob('*') if path.is_file()) if (folder / 'tests').is_dir() else []
    patterns = [pattern for kind in package.get('base_tests', {}).values() for pattern in kind]
    return [name for name in names if any(fnmatch.fnmatch(name, pattern) for pattern in patterns)]


def node():
    """Node for the base check: the one on PATH, else the toolchain's (through uv, offline)."""
    found = shutil.which('node')
    return [found] if found else ['uvx', '--offline', '--from', 'nodejs-wheel-binaries==24.19.0', 'node']


def check_commands(folder):
    names = base_tests(folder); commands = []
    python = [name for name in names if name.endswith('.py')]; scripts = [name for name in names if name.endswith('.mjs')]
    if python: commands.append([sys.executable, '-B', '-m', 'unittest', *(name[:-3].replace('/', '.') for name in python)])
    if scripts: commands.append([*node(), '--test', '--test-reporter=tap', *scripts])
    return commands


def _display(argv):
    shown = ['python3' if part == sys.executable else part for part in argv]
    if shown and shown[0] == shutil.which('node'): shown[0] = 'node'
    return ' '.join(shown)


def _owner(name, folder):
    """The capability (or package base) a test file belongs to, in the person's words."""
    found = re.search(r'(?:test_cap_([\w-]+)\.py|cap-([\w-]+)\.test\.mjs)$', name or '')
    items = {item['id']: item['name'] for item in catalogue()['capabilities']}
    if found: return items.get(found.group(1) or found.group(2), found.group(1) or found.group(2))
    base, _, _ = project_state(folder)
    return f"the {next((item['name'] for item in catalogue()['packages'] if item['id'] == base), 'package')}'s base"


def failing_tests(output, folder):
    """[{'test', 'file', 'capability'}] from unittest's or node's TAP report."""
    found = []
    for kind, test, where in re.findall(r'^(FAIL|ERROR): (\S+) \(([\w.]+)', output, re.M):
        parts = where.split('.')
        name = f'tests/{test}.py' if where.startswith('unittest.') else f'{parts[0]}/{parts[1]}.py' if parts[0] == 'tests' and len(parts) > 1 else where
        found.append({'test': test, 'file': name, 'capability': _owner(name, folder)})
    lines = output.splitlines()
    for index, line in enumerate(lines):
        failed = re.match(r'^\s*not ok \d+ - (.+?)\s*$', line)
        if not failed: continue
        location = next((re.search(r"location: '(.+?):\d+:\d+'", item) for item in lines[index + 1:index + 30] if 'location:' in item), None)
        path = location.group(1) if location else ''
        try: name = Path(path).resolve().relative_to(Path(folder).resolve()).as_posix() if path else ''
        except ValueError: name = path
        if name and not name.startswith('tests/'): continue  # a file-level row repeats the failing test
        found.append({'test': failed.group(1), 'file': name, 'capability': _owner(name, folder)})
    unique = []
    for item in found:
        if item not in unique: unique.append(item)
    return unique


def run_check(folder, data=None, request=None, project=None):
    """Run the base check offline in `folder`: {'passed', 'counts', 'tests', 'failing', 'commands', 'output', 'reason'}.
    Each run is recorded as Gate's test evidence when `data` (the workbench's data folder) is given."""
    folder = Path(folder); commands = check_commands(folder)
    result = {'passed': bool(commands), 'counts': {'pass': 0, 'fail': 0, 'skipped': 0}, 'tests': 0, 'failing': [], 'commands': [], 'output': '', 'reason': '' if commands else 'The base has no tests to run.'}
    environment = {**os.environ, 'PYTHONDONTWRITEBYTECODE': '1', 'UV_OFFLINE': '1', 'NODE_NO_WARNINGS': '1'}
    environment.pop('PYTHONPATH', None)  # the project's own app/, never the harness's
    sys.path.insert(0, str(ROOT)) if str(ROOT) not in sys.path else None
    from gate import sandbox  # task 311: the base check runs the project's code: in the test sandbox, like Pi's test runs
    for argv in commands:
        started = time.monotonic()
        try:
            ran = subprocess.run(sandbox.argv(argv, folder, data, sandbox.widened(data, folder)['network']), cwd=folder, env=environment, capture_output=True, text=True, timeout=300)
            code, output = ran.returncode, ran.stdout + ran.stderr
        except (OSError, subprocess.TimeoutExpired) as error:
            code, output = -1, f'Could not run: {error}'
        counts = _counts(output)
        for key in result['counts']: result['counts'][key] += counts.get(key, 0)
        shown = _display(argv); result['commands'].append(shown); result['output'] += f'$ {shown}\n' + output[-6000:] + '\n'
        if code != 0 or not counts.get('pass') or counts.get('fail'):
            result['passed'] = False
            result['failing'] += failing_tests(output, folder)
            if not result['reason']: result['reason'] = 'Could not run offline: ' + (output.strip().splitlines() or ['no output'])[-1][:300] if not counts else ''
        if data is not None:
            try:
                sys.path.insert(0, str(ROOT)) if str(ROOT) not in sys.path else None
                from gate import test_runs
                test_runs.record(data, request=request or 'project-start-' + uuid.uuid4().hex[:12], project=project or folder, cwd=folder, command=shown, exit_code=code, duration=time.monotonic() - started, output=output)
            except (ImportError, OSError):
                pass
    result['tests'] = result['counts']['pass'] + result['counts']['fail']
    return result


def _counts(output):
    try:
        sys.path.insert(0, str(ROOT)) if str(ROOT) not in sys.path else None
        from gate.test_runs import counts
        return counts(output)
    except ImportError:  # the standalone kit: the two summaries the base check prints
        node_counts = dict(re.findall(r'(?m)^\s*#\s+(pass|fail|skipped)\s+(\d+)\s*$', output))
        if node_counts: return {key: int(value) for key, value in node_counts.items()}
        ran = re.findall(r'Ran (\d+) tests?', output); failed = sum(int(n) for n in re.findall(r'(?:failures|errors)=(\d+)', output))
        return {'pass': int(ran[-1]) - failed, 'fail': failed} if ran else {}


# -- New Project and Add a Capability… --------------------------------------------------------------------------------
def build(folder, packages, capabilities, files=None, data=None, request=None):
    """New Project from Project Start: assemble, run the base check, and make the first commit only if every test
    passes. Returns the check; on a failure the caller moves the folder away (nothing is created) and says which test."""
    plan = resolve(packages, capabilities)
    if plan['problems']: raise ValueError(' '.join(plan['problems']))
    assemble(folder, plan, files)
    check = run_check(folder, data, request)
    check['plan'] = plan
    if check['passed']: start_history(Path(folder))
    return check


def preview(folder, identifier):
    """What Add a Capability… would change in a project: files added and changed, tests added, the base's tests now."""
    folder = Path(folder); base, _, present = project_state(folder)
    if base is None: raise ValueError('Not a project from the kit: Add a Capability… needs a Web app, an App with no server or a Terminal app.')
    item = _by_id(catalogue()['capabilities'], identifier, 'capability')
    added, changed = planned(item, base, folder) if base in item.get('install', {}) else ([], [])
    return {'base': base, 'present': present, 'added': added, 'changed': [name for name in changed if name != 'packaging.json' or (folder / name).is_file()],
            'tests_added': tests_added(item, base) if base in item.get('install', {}) else 0, 'tests_now': sum(count_tests(folder / name) for name in base_tests(folder))}


def _git(folder, *args, check=True):
    return subprocess.run(['git', '-C', str(folder), *args], capture_output=True, text=True, timeout=60, check=check)


def add(folder, identifier, data=None, request=None, full_suite=None):
    """Add a Capability…: one capability into an existing project, kept as one commit by the harness (so Undo This
    Request… takes it back) only if the base check passes, and the project's whole suite too when it passed before
    (`full_suite(folder)` -> {'passed', 'command'}). Otherwise every file is as it was. Returns {'added', …}."""
    folder = Path(folder); base, packages, present = project_state(folder)
    if base is None: raise ValueError('Not a project from the kit: Add a Capability… needs a Web app, an App with no server or a Terminal app.')
    item = _by_id(catalogue()['capabilities'], identifier, 'capability')
    if identifier in present: raise ValueError(f"{item['name']} is already in this project.")
    if not item.get('available'): raise ValueError(f"{item['name']}: {item.get('reason') or 'Not available yet.'}")
    names = {package['id']: package['name'] for package in catalogue()['packages']}
    if base not in item.get('supports', []) or base not in item.get('install', {}): raise ValueError(f"{item['name']}: the {names[base]} can't carry it.")
    missing = [need for need in item.get('needs', []) if need not in present]
    if missing: raise ValueError(f"{item['name']} needs {', '.join(_by_id(catalogue()['capabilities'], need, 'capability')['name'] for need in missing)} first.")
    if not (folder / '.git').exists(): raise ValueError('This project has no history, so the change could not be undone. Nothing was changed.')
    added, changed = planned(item, base, folder)
    taken = [name for name in added if (folder / name).exists()]
    if taken: raise ValueError(f"Not added: {', '.join(taken[:3])} already exist{'s' if len(taken) == 1 else ''}. Nothing was changed.")
    edited = [line[3:] for line in _git(folder, 'status', '--porcelain', '--', *changed).stdout.splitlines()]
    if edited: raise ValueError(f"Not added: {', '.join(edited)} {'has' if len(edited) == 1 else 'have'} changes that are not saved in history yet. Nothing was changed.")
    tracked = {name for name in changed if _git(folder, 'ls-files', '--error-unmatch', '--', name, check=False).returncode == 0}
    before = full_suite(folder) if full_suite else None
    capabilities = [*present, identifier]
    try:
        install(folder, item, base)
        write_record(folder, packages or [base], capabilities)
        write_readme(folder, capabilities)
        check = run_check(folder, data, request)
        after = full_suite(folder) if before and before.get('passed') and check['passed'] else None
    except Exception:
        _put_back(folder, added, changed, tracked); raise
    if not check['passed'] or (after is not None and not after.get('passed')):
        _put_back(folder, added, changed, tracked)
        return {'added': False, 'check': check, 'suite': after, 'name': item['name'],
                'message': f"Not added: {_failure(check, after)}. Nothing was changed."}
    paths = [*added, *changed]
    _git(folder, 'add', '--', *paths)
    new = tests_added(item, base)
    body = f"Added with Project › Add a Capability…: {len(added)} file{'s' if len(added) != 1 else ''} added, {', '.join(changed)} changed.\nThe base check passed: {check['tests']} tests."
    _git(folder, *IDENTITY, 'commit', '-q', '-m', f"Capability: {item['name']}", '-m', body, '--', *paths)
    commit = _git(folder, 'rev-parse', '--short=12', 'HEAD').stdout.strip()
    suite = f" The whole suite passes too (`{after['command']}`)." if after else ''
    return {'added': True, 'commit': commit, 'check': check, 'suite': after, 'name': item['name'], 'files': {'added': added, 'changed': changed},
            'message': f"Added {item['name']}: {item['small'][0].lower() + item['small'][1:]} Tried it: all {check['tests']} tests of the base pass, {new} of them new.{suite}"}


def _failure(check, after):
    if not check['passed']:
        failing = check.get('failing') or []
        return f"a test failed ({failing[0]['capability']}: {failing[0]['test']})" if failing else (check.get('reason') or 'the base check did not pass')
    return f"the project's tests passed before and fail with it (`{after.get('command')}`)"


def _put_back(folder, added, changed, tracked):
    """Every file as it was before Add a Capability…: added files removed (and the folders they made), changed ones back."""
    for name in added:
        path = folder / name
        if path.is_file() or path.is_symlink(): path.unlink()
    for name in sorted({str(Path(name).parent) for name in added}, key=lambda value: -value.count('/')):
        directory = folder / name
        while directory != folder and directory.is_dir() and not any(directory.iterdir()):
            directory.rmdir(); directory = directory.parent
    for name in changed:
        if name in tracked: _git(folder, 'checkout', 'HEAD', '--', name, check=False)
        elif (folder / name).is_file(): (folder / name).unlink()


if __name__ == '__main__':
    if len(sys.argv) not in (3, 4): raise SystemExit(__doc__)
    outcome = build(Path(sys.argv[1]).resolve(), sys.argv[2].split(','), sys.argv[3].split(',') if len(sys.argv) == 4 and sys.argv[3] else [])
    print(json.dumps({key: outcome[key] for key in ('passed', 'counts', 'failing', 'commands')}, indent=1))
    sys.exit(0 if outcome['passed'] else 1)
