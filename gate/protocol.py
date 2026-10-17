"""Request-to-task protocol gate for `git commit` in projects that have ROADMAP.md and tasks/.

Required since the last commit: a failing (red) test run, a code change, a passing (green)
test run on exactly the code being committed, a newly checked box in tasks/, and a newly
checked box in ROADMAP.md. Commits that change only Markdown or tasks/ skip the tests.
Evidence is git state plus test runs Gate observed. This checks the protocol; it is not a sandbox.
"""
import hashlib
import json
from pathlib import Path
import re
import shlex
import subprocess
import threading
import uuid

WRAPPERS = {'sudo', 'command', 'exec', 'nohup', 'time', 'env'}
SHELLS = {'sh', 'bash', 'zsh', 'dash', 'ksh'}
TEST_COMMANDS = [
    ('python', '-m', 'unittest'), ('python3', '-m', 'unittest'), ('python', '-m', 'pytest'), ('python3', '-m', 'pytest'),
    ('pytest',), ('py.test',), ('uv', 'run', 'pytest'), ('node', '--test'), ('npm', 'test'), ('npm', 'run', 'test'),
    ('npm', 't'), ('yarn', 'test'), ('pnpm', 'test'), ('bun', 'test'), ('npx', 'vitest'), ('npx', 'jest'), ('vitest',),
    ('jest',), ('go', 'test'), ('cargo', 'test'), ('make', 'test'), ('python3', 'tests/verify_workflow.py'),
    ('npx', '--no-install', 'vitest'), ('npx', '--no-install', 'jest'), ('npx', '--no-install', 'tsc'), ('uv', 'run', '--offline', 'pytest'),
    ('npx', 'tsc'), ('python3', 'tests/browser/run.py'), ('python', 'tests/browser/run.py'),
]
CHECKED = re.compile(r'- \[[xX]\]')
KIND = re.compile(r'^Kind:\s*(\S+)', re.MULTILINE)
KINDS = ('code', 'chore', 'docs', 'planning')
KIND_FIX = '`Kind: code|chore|docs|planning` line'
LARGE = 1024 * 1024
INTERRUPTED = ('Command aborted', 'Command terminated without an exit code', 'Command timed out after')

class CheckFailed(Exception):
    pass

def tokens(command):
    lexer = shlex.shlex(command, posix=True, punctuation_chars=';&|()<>\n')
    lexer.whitespace = ' \t\r'
    lexer.whitespace_split = True
    return list(lexer)

def segments(command):
    """Simple commands with the operator that follows each; None when quoting is malformed."""
    try:
        values = tokens(command)
    except ValueError:
        return None
    result, current = [], []
    for token in values + [';']:
        if token in {';', '&&', '||', '|', '&', '\n', '(', ')'}:
            while current and (Path(current[0]).name in WRAPPERS or re.match(r'^\w+=', current[0])):
                current.pop(0)
            if current:
                result.append((current, token))
            current = []
        else:
            current.append(token)
    return result

def move(cwd, target):
    return (Path(cwd) / Path(target).expanduser()).resolve()

def commit_folder(command, cwd, depth=0):
    """Folder a `git commit` in the command runs in, following `cd` and `git -C`; None without a commit."""
    cwd = Path(cwd or '.').expanduser()
    for words, _ in segments(command) or []:
        name, args = Path(words[0]).name, words[1:]
        if name == 'cd' and args:
            cwd = move(cwd, args[0])
        if name in SHELLS and depth < 4:
            for index, arg in enumerate(args[:-1]):
                if arg.startswith('-') and not arg.startswith('--') and 'c' in arg:
                    nested = commit_folder(args[index + 1], cwd, depth + 1)
                    if nested:
                        return nested
        if name == 'git':
            index, folder = 0, cwd
            while index < len(args) and args[index].startswith('-'):
                if args[index] == '-C' and index + 1 < len(args):
                    folder = move(folder, args[index + 1])
                index += 2 if args[index] in {'-C', '-c', '--git-dir', '--work-tree'} else 1
            if index < len(args) and args[index] == 'commit':
                return folder
    return None

def test_folder(command, cwd):
    """Folder of a test run when the runner is the last command and nothing pipes or masks its exit code."""
    parts = segments(command)
    if not parts or any(operator in {'|', '||', '&'} for _, operator in parts):
        return None
    cwd = Path(cwd or '.').expanduser()
    for words, _ in parts[:-1]:
        if words[0] == 'cd' and len(words) > 1:
            cwd = move(cwd, words[1])
    words = parts[-1][0]
    return cwd if any(tuple(words[:len(prefix)]) == prefix for prefix in TEST_COMMANDS) else None

# Task 260: a help, version or listing call of a runner runs no test, so it is neither Red nor Green.
NOT_A_RUN = {'--help', '-h', '-help', '--version', '-V', '-version', '--collect-only', '--co', '--list', '-list',
             '--listTests', '--list-tests', '--showOnly'}
NO_TESTS = re.compile(r'\bno tests ran\b|\bNO TESTS RAN\b|^Ran 0 tests\b|\bNo tests? files? found\b|\bno test files\b', re.I | re.M)


def test_invocation(command, output=None):
    """Task 260: True when the command really ran tests. False for `--help`/`--version`-style calls, and, when its output
    is known, for runs whose summary shows that no test ran."""
    parts = segments(command) or []
    words = parts[-1][0] if parts else []
    if any(word.split('=', 1)[0] in NOT_A_RUN for word in words[1:]):
        return False
    if output is None:
        return True
    if isinstance(output, list):
        output = '\n'.join(block.get('text', '') for block in output if isinstance(block, dict))
    from .test_runs import counts
    text = str(output)
    found = counts(text)
    if found and not found.get('pass') and not found.get('fail'):
        return False
    return not NO_TESTS.search(text)

def project_root(cwd):
    path = Path(cwd or '.').expanduser().resolve()
    for candidate in [path, *path.parents]:
        if (candidate / 'ROADMAP.md').is_file() and (candidate / 'tasks').is_dir():
            return candidate
    return None

def git(root, *args):
    try:
        completed = subprocess.run(['git', '-C', str(root), *args], capture_output=True, timeout=15)
    except (OSError, subprocess.SubprocessError) as error:
        raise CheckFailed(f'git {args[0]} failed: {error}') from error
    return completed.stdout if completed.returncode == 0 else None

def is_documentation(path):
    return path.endswith('.md') or path.startswith('tasks/')

def changed_paths(root):
    """Changes inside the project folder, keyed by path relative to that folder."""
    top = git(root, 'rev-parse', '--show-toplevel')
    output = git(root, 'status', '--porcelain=v1', '-z', '--untracked-files=all', '--', '.')
    if top is None or output is None:
        return None
    top = Path(top.decode().strip()).resolve()
    entries, paths, index = output.decode(errors='replace').split('\0'), {}, 0
    def add(path, status):
        relative = (top / path).relative_to(root) if (top / path).is_relative_to(root) else None
        if relative is not None:
            paths[relative.as_posix()] = status
    while index < len(entries):
        entry = entries[index]
        index += 1
        if len(entry) < 4:
            continue
        add(entry[3:], entry[:2])
        if entry[0] in 'RC':
            add(entries[index], 'D ')
            index += 1
    return paths

def code_state(root, paths):
    """Hash of every changed non-documentation file, so any later code edit changes it."""
    digest = hashlib.sha256()
    code = sorted(path for path in paths if not is_documentation(path))
    for path in code:
        file = root / path
        try:
            if not file.is_file():
                content = b'<absent>'
            elif file.stat().st_size > LARGE:
                status = file.stat()
                content = f'<large {status.st_size} {status.st_mtime_ns}>'.encode()
            else:
                content = file.read_bytes()
        except OSError as error:
            raise CheckFailed(f'cannot read {path}: {error}') from error
        digest.update(path.encode() + b'\0' + content + b'\0')
    return digest.hexdigest(), code

def newly_checked(root, paths, selected):
    """Selected paths whose changes add a checked box."""
    found = []
    for path, status in paths.items():
        if not selected(path):
            continue
        if status == '??' or git(root, 'cat-file', '-e', f'HEAD:./{path}') is None:
            file = root / path
            if file.is_file() and CHECKED.search(file.read_text(errors='replace')):
                found.append(path)
            continue
        diff = (git(root, 'diff', 'HEAD', '--unified=0', '--', path) or b'').decode(errors='replace')
        if any(line.startswith('+') and not line.startswith('+++') and CHECKED.search(line) for line in diff.splitlines()):
            found.append(path)
    return found

def is_task(path):
    return path.startswith('tasks/') and path.endswith('.md')

def task_kind(root, path):
    """Value of the task file's `Kind:` line, or None when missing or unknown."""
    try:
        match = KIND.search((root / path).read_text(errors='replace'))
    except OSError:
        return None
    return match.group(1).lower() if match and match.group(1).lower() in KINDS else None

def interrupted(output):
    """True when Pi's bash tool reports a stopped, killed, or timed-out command instead of an exit code."""
    if isinstance(output, list):
        output = '\n'.join(block.get('text', '') for block in output if isinstance(block, dict))
    lines = str(output or '').rstrip().splitlines()
    return bool(lines) and lines[-1].startswith(INTERRUPTED)

class Protocol:
    def __init__(self, path=None):
        self.path = Path(path) if path else None
        self.runs = {}
        # Gate serves /gatekeep and /audit on parallel threads: every read and write of the runs goes through this lock.
        self.lock = threading.RLock()
        if self.path and self.path.is_file():
            try:
                stored = json.loads(self.path.read_text())
                self.runs = {Path(root): [(state, passed) for state, passed, *_ in runs] for root, runs in stored.items()}
            except (OSError, ValueError, TypeError):
                self.runs = {}

    def save(self):
        if not self.path:
            return
        with self.lock:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            temporary = self.path.with_name(f'.{self.path.name}.{uuid.uuid4().hex}.tmp')
            temporary.write_text(json.dumps({str(root): [list(run) for run in runs] for root, runs in self.runs.items()}))
            temporary.replace(self.path)

    def record(self, cwd, command, passed, output=None):
        """Unreadable git state or an interrupted run leaves the run unrecorded; the commit gate then names it as missing."""
        committed = commit_folder(command, cwd)
        if committed:
            root = project_root(committed)
            with self.lock:
                if root and passed and self.runs.pop(root, None) is not None:
                    self.save()
            return
        if interrupted(output):
            return
        folder = test_folder(command, cwd)
        root = project_root(folder) if folder else None
        if not root or not test_invocation(command, output):
            return
        try:
            paths = changed_paths(root)
            if paths is not None:
                state = code_state(root, paths)[0]
                with self.lock:
                    self.runs.setdefault(root, []).append((state, passed))
                    self.save()
        except CheckFailed:
            return

    def move(self, old, new):
        """Task 262: a project's folder was renamed or moved; its runs (keyed by folder) follow it, and so do those of
        projects nested inside it."""
        old, new = Path(old).resolve(), Path(new).resolve()
        with self.lock:
            moved = {root: new / root.relative_to(old) for root in self.runs if root == old or root.is_relative_to(old)}
            for root, target in moved.items(): self.runs.setdefault(target, []).extend(self.runs.pop(root))
            if moved: self.save()

    def verification(self, root):
        """G-012: (code state, changed code paths, whether a passing run was seen on exactly this code), or None."""
        try:
            paths = changed_paths(root)
            if paths is None: return None
            state, code = code_state(root, paths)
        except CheckFailed:
            return None
        with self.lock: return state, code, (state, True) in self.runs.get(Path(root), [])

    def clear(self, root):
        """Task 260: after a harness commit, earlier runs describe code that is gone; they never count as Red or Green."""
        with self.lock:
            if self.runs.pop(Path(root), None) is not None:
                self.save()

    def failed_run(self, root):
        """G-010: Gate saw a test run fail in this project since its last commit."""
        with self.lock: return any(not passed for _, passed in self.runs.get(Path(root), []))

    def passing_now(self, root):
        """G-010: the last test run Gate saw in this project passed."""
        with self.lock:
            runs = self.runs.get(Path(root), [])
            return bool(runs) and runs[-1][1]

    def commit_reason(self, cwd, command):
        folder = commit_folder(command, cwd)
        root = project_root(folder) if folder else None
        if not root:
            return None
        try:
            return self.missing(root)
        except CheckFailed as error:
            return f'Protocol (AGENT.md): commit in {root} could not be checked ({error}). Retry; the commit was not run.'

    def missing(self, root):
        paths = changed_paths(root)
        if paths is None:
            return None
        state, code = code_state(root, paths)
        tasks = newly_checked(root, paths, is_task)
        roadmap = newly_checked(root, paths, lambda path: path == 'ROADMAP.md')
        planning_only = all(path == 'ROADMAP.md' or path.startswith('tasks/') for path in paths)
        missing = []
        if planning_only and not tasks and not roadmap:
            unkinded = [path for path in paths if is_task(path) and (root / path).is_file() and not task_kind(root, path)]
            if unkinded:
                missing.append(f'a {KIND_FIX} in ' + ', '.join(unkinded))
            return self.reason(root, missing, code)
        kinds = {path: task_kind(root, path) for path in tasks}
        missing += [f'a {KIND_FIX} in {path}' for path, kind in kinds.items() if not kind]
        known = set(kinds.values()) - {None}
        if code and known and known <= {'docs', 'planning'}:
            missing.append(f'code changes in a Kind: {"/".join(sorted(known))} task; set Kind: code or Kind: chore, or revert the code')
        elif code:
            with self.lock:
                runs = list(self.runs.get(root, []))
            green = next((index for index in range(len(runs) - 1, -1, -1) if runs[index] == (state, True)), None)
            if (not known or 'code' in known) and (green is None or not any(not passed and before != state for before, passed in runs[:green])):
                missing.append('a failing (red) test run before the implementation, made by running the tests without pipes or `|| true`')
            if green is None:
                missing.append('a passing (green) test run after the last code change')
        if not tasks:
            missing.append('a newly checked box (- [x]) in the task file under tasks/')
        if not roadmap:
            missing.append('the task marked done (- [x]) in ROADMAP.md')
        return self.reason(root, missing, code)

    def reason(self, root, missing, code):
        if not missing:
            return None
        changed = ', '.join(code[:8]) + (' ...' if len(code) > 8 else '') if code else 'documentation only'
        return (f'Protocol (AGENT.md): commit in {root} needs test red -> implementation -> test green -> check task -> '
                f'check roadmap. Missing: ' + '; '.join(missing) + f'. Changed code: {changed}.')
