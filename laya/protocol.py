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

def is_commit(command, depth=0):
    for words, _ in segments(command) or []:
        name, args = Path(words[0]).name, words[1:]
        if name in SHELLS and depth < 4:
            for index, arg in enumerate(args[:-1]):
                if arg.startswith('-') and not arg.startswith('--') and 'c' in arg and is_commit(args[index + 1], depth + 1):
                    return True
        if name == 'git':
            index = 0
            while index < len(args) and args[index].startswith('-'):
                index += 2 if args[index] in {'-C', '-c', '--git-dir', '--work-tree'} else 1
            if index < len(args) and args[index] == 'commit':
                return True
    return False

def is_test_run(command):
    """Counts only when the test runner is the last command and nothing pipes or masks its exit code."""
    parts = segments(command)
    if not parts or any(operator in {'|', '||', '&'} for _, operator in parts):
        return False
    words = parts[-1][0]
    return any(tuple(words[:len(prefix)]) == prefix for prefix in TEST_COMMANDS)

def project_root(cwd):
    path = Path(cwd or '.').expanduser().resolve()
    for candidate in [path, *path.parents]:
        if (candidate / 'ROADMAP.md').is_file() and (candidate / 'tasks').is_dir():
            return candidate
    return None

def git(root, *args):
    completed = subprocess.run(['git', '-C', str(root), *args], capture_output=True, timeout=15)
    return completed.stdout if completed.returncode == 0 else None

def is_documentation(path):
    return path.endswith('.md') or path.startswith('tasks/')

def changed_paths(root):
    output = git(root, 'status', '--porcelain=v1', '-z', '--untracked-files=all')
    if output is None:
        return None
    entries, paths, index = output.decode(errors='replace').split('\0'), {}, 0
    while index < len(entries):
        entry = entries[index]
        index += 1
        if len(entry) < 4:
            continue
        paths[entry[3:]] = entry[:2]
        if entry[0] in 'RC':
            paths[entries[index]] = 'D '
            index += 1
    return paths

def code_state(root, paths):
    """Hash of every changed non-documentation file, so any later code edit changes it."""
    digest = hashlib.sha256()
    code = sorted(path for path in paths if not is_documentation(path))
    for path in code:
        file = root / path
        digest.update(path.encode() + b'\0' + (file.read_bytes() if file.is_file() else b'<absent>') + b'\0')
    return digest.hexdigest(), code

def newly_checked(root, paths, selected):
    for path, status in paths.items():
        if not selected(path):
            continue
        if status == '??' or git(root, 'cat-file', '-e', f'HEAD:{path}') is None:
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
        root = project_root(cwd)
        if not root:
            return
        if passed and is_commit(command):
            self.runs.pop(root, None)
        elif is_test_run(command):
            paths = changed_paths(root)
            if paths is not None:
                self.runs.setdefault(root, []).append((code_state(root, paths)[0], passed))

    def commit_reason(self, cwd, command):
        if not is_commit(command):
            return None
        root = project_root(cwd)
        if not root:
            return None
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
