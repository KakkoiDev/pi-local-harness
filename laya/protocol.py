"""Request-to-task protocol gate for `git commit` in projects that have ROADMAP.md and tasks/.

Required since the last commit: a failing (red) test run, a code change, a passing (green)
test run on exactly the code being committed, a newly checked box in tasks/, and a newly
checked box in ROADMAP.md. Commits that change only Markdown or tasks/ skip the tests.
Evidence is git state plus test runs Laya observed. This checks the protocol; it is not a sandbox.
"""
import hashlib
from pathlib import Path
import re
import shlex
import subprocess

WRAPPERS = {'sudo', 'command', 'exec', 'nohup', 'time', 'env'}
SHELLS = {'sh', 'bash', 'zsh', 'dash', 'ksh'}
TEST_COMMANDS = [
    ('python', '-m', 'unittest'), ('python3', '-m', 'unittest'), ('python', '-m', 'pytest'), ('python3', '-m', 'pytest'),
    ('pytest',), ('py.test',), ('uv', 'run', 'pytest'), ('node', '--test'), ('npm', 'test'), ('npm', 'run', 'test'),
    ('npm', 't'), ('yarn', 'test'), ('pnpm', 'test'), ('bun', 'test'), ('npx', 'vitest'), ('npx', 'jest'), ('vitest',),
    ('jest',), ('go', 'test'), ('cargo', 'test'), ('make', 'test'), ('python3', 'tests/verify_workflow.py'),
]
CHECKED = re.compile(r'- \[[xX]\]')
LARGE = 1024 * 1024

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
    for path, status in paths.items():
        if not selected(path):
            continue
        if status == '??' or git(root, 'cat-file', '-e', f'HEAD:./{path}') is None:
            file = root / path
            if file.is_file() and CHECKED.search(file.read_text(errors='replace')):
                return True
            continue
        diff = (git(root, 'diff', 'HEAD', '--unified=0', '--', path) or b'').decode(errors='replace')
        if any(line.startswith('+') and not line.startswith('+++') and CHECKED.search(line) for line in diff.splitlines()):
            return True
    return False

class Protocol:
    def __init__(self):
        self.runs = {}

    def record(self, cwd, command, passed):
        """Unreadable git state leaves the run unrecorded; the commit gate then names it as missing."""
        committed = commit_folder(command, cwd)
        if committed:
            root = project_root(committed)
            if root and passed:
                self.runs.pop(root, None)
            return
        folder = test_folder(command, cwd)
        root = project_root(folder) if folder else None
        if not root:
            return
        try:
            paths = changed_paths(root)
            if paths is not None:
                self.runs.setdefault(root, []).append((code_state(root, paths)[0], passed))
        except CheckFailed:
            return

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
        missing = []
        if code:
            runs = self.runs.get(root, [])
            green = next((index for index in range(len(runs) - 1, -1, -1) if runs[index] == (state, True)), None)
            if green is None or not any(not passed and before != state for before, passed in runs[:green]):
                missing.append('a failing (red) test run before the implementation, made by running the tests without pipes or `|| true`')
            if green is None:
                missing.append('a passing (green) test run after the last code change')
        if not newly_checked(root, paths, lambda path: path.startswith('tasks/') and path.endswith('.md')):
            missing.append('a newly checked box (- [x]) in the task file under tasks/')
        if not newly_checked(root, paths, lambda path: path == 'ROADMAP.md'):
            missing.append('the task marked done (- [x]) in ROADMAP.md')
        if not missing:
            return None
        changed = ', '.join(code[:8]) + (' ...' if len(code) > 8 else '') if code else 'documentation only'
        return (f'Protocol (AGENT.md): commit in {root} needs test red -> implementation -> test green -> check task -> '
                f'check roadmap. Missing: ' + '; '.join(missing) + f'. Changed code: {changed}.')
