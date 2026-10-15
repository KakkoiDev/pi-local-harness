"""The paperwork, done by the harness (plan 184 part 4). Pi only writes content.

In a project with ROADMAP.md and tasks/, for each request (the extension tells Gate when one starts and ends):
- at the first change to a file that is not a plan file, the request gets its task: the one it names ("do task 2"),
  else a new `tasks/NNN-<words>.md` with the request quoted and a "Progress (kept by the harness)" section, and its line
  in ROADMAP.md;
- test runs Gate saw are written into the progress: "Red: `cmd` failed at 14:02", "Green: `cmd` passed at 14:10";
- at the end, when the change is verified (a failing run first, then a passing run on exactly the final code; a
  Markdown-only change needs none), the task gets "Done", its roadmap line is ticked when no box of the task is left
  open, and the files this request changed are committed locally (never pushed; the person's own edits stay out).
  Otherwise the task stays open with "Not verified at …".
"""
from datetime import datetime
import hashlib
from pathlib import Path
import re
import subprocess
import threading

from .protocol import CheckFailed, changed_paths, is_documentation, project_root

PROGRESS = '## Progress (kept by the harness)'


def plan_path(path):
    return path == 'ROADMAP.md' or (path.startswith('tasks/') and path.endswith('.md'))


def fingerprint(root, path):
    try: return hashlib.sha256((root / path).read_bytes()).hexdigest()
    except OSError: return '<absent>'


def clock():
    return datetime.now().strftime('%H:%M')


class Paperwork:
    def __init__(self, protocol, data=None, identity=('Pi Workbench', 'pi-workbench@localhost')):
        self.protocol, self.data, self.identity = protocol, data, identity
        self.requests = {}
        self.lock = threading.RLock()

    # -- a request's life -------------------------------------------------------------------------------------------
    def start(self, request, cwd, text):
        """Remember what was already changed, so only this request's changes are its own."""
        root = project_root(cwd) if cwd else None
        if not root: return None
        try: before = {path: fingerprint(root, path) for path in (changed_paths(root) or {})}
        except CheckFailed: before = {}
        with self.lock: self.requests[request] = {'root': root, 'text': str(text or '').strip(), 'before': before, 'task': None}
        return str(root)

    def changes(self, item):
        """Paths this request changed (relative to the project), plan files included."""
        root, before = item['root'], item['before']
        try: now = changed_paths(root) or {}
        except CheckFailed: return []
        return sorted(path for path in now if path not in before or fingerprint(root, path) != before[path])

    def observe(self, request):
        """After a tool ran: the note for Pi the first time the request gets its task, else None."""
        with self.lock:
            item = self.requests.get(request)
            if not item or item['task']: return None
            content = [path for path in self.changes(item) if not plan_path(path)]
            if not content: return None
            item['task'], made = self.task_for(item)
            self.progress(item, f'Started at {clock()}: {", ".join(content[:6])}{" …" if len(content) > 6 else ""}')
            return (f"This request's task is {item['task']} ({'made' if made else 'named in the request'}); the harness keeps it and "
                    "ROADMAP.md up to date and commits when the change is verified. Write content only: no task files, boxes or commits.")

    def ran(self, request, command, passed):
        """A test run Gate saw: written into the task's progress."""
        with self.lock:
            item = self.requests.get(request)
            if not item or not item['task']: return
            text = (item['root'] / item['task']).read_text(encoding='utf-8')
            if not passed and '- [x] Red:' not in text:
                self.progress(item, f'Red: `{command}` failed at {clock()}')
            if passed:
                item['test_command'] = command  # the harness proves Red with it at the end, if Pi did not show it
                answer = self.protocol.verification(item['root'])
                if answer and answer[2]:
                    line = f'- [x] Green: `{command}` passed at {clock()}'
                    if '- [x] Green:' in text: self.write(item, re.sub(r'- \[x\] Green: .*', line.replace('\\', r'\\'), text, count=1))
                    else: self.progress(item, line[6:])

    def end(self, request):
        """The request is over: mark it done and commit, or leave it open and say why. None outside a project."""
        with self.lock:
            item = self.requests.pop(request, None)
            if not item: return None
            if not item['task']: return {'outcome': 'nothing changed'}
            root, task = item['root'], item['task']
            changed = self.changes(item)
            code = [path for path in changed if not plan_path(path) and not is_documentation(path)]
            text = (root / task).read_text(encoding='utf-8')
            if not code:
                text = re.sub(r'^Kind:\s*\S+', 'Kind: docs', text, count=1, flags=re.MULTILINE); self.write(item, text)
            else:
                answer = self.protocol.verification(root)
                reason = None
                if not (answer and answer[2]): reason = 'no test passed on the final code (Green)'
                elif not self.protocol.failed_run(root):
                    # Strategy 1 (bench, 2026-10-15): Pi need not work test-first; the harness proves Red itself.
                    proof = self.prove_red(item, code)
                    if proof is True: self.progress(item, f"Red (proved by the harness): without the change, `{item['test_command']}` fails")
                    else: reason = proof
                if reason:
                    self.write(item, text.rstrip('\n') + f'\n\nNot verified at {clock()}: {reason}. The task stays open.\n')
                    return {'outcome': 'not verified', 'task': task, 'reason': reason}
            self.progress(item, f'Done at {clock()}: verified and committed')
            text = (root / task).read_text(encoding='utf-8')
            roadmap = (root / 'ROADMAP.md').read_text(encoding='utf-8')
            if not re.search(r'- \[ \]', text):
                roadmap = re.sub(rf'^(\s*)- \[ \](.*\(tasks/{re.escape(Path(task).name)}\))', r'\1- [x]\2', roadmap, count=1, flags=re.MULTILINE)
                (root / 'ROADMAP.md').write_text(roadmap, encoding='utf-8')
            paths = sorted(set(changed) | {task, 'ROADMAP.md'})
            title = re.match(r'# \d+: (.*)', text)
            message = f"{title.group(1) if title else Path(task).stem} (task {Path(task).name[:3]})"
            name, email = self.identity
            done = subprocess.run(['git', '-C', str(root), '-c', f'user.name={name}', '-c', f'user.email={email}', 'commit', '-q', '-m', message, '--', *paths],
                                  capture_output=True, text=True, timeout=60) if self.add(root, paths) else None
            if not done or done.returncode:
                return {'outcome': 'commit failed', 'task': task, 'reason': (done.stderr if done else 'git add failed').strip()[-500:]}
            head = subprocess.run(['git', '-C', str(root), 'rev-parse', '--short=12', 'HEAD'], capture_output=True, text=True, timeout=30).stdout.strip()
            return {'outcome': 'committed', 'task': task, 'message': message, 'commit': head}  # the handle for Undo This Request

    def prove_red(self, item, code):
        """Set the request's code changes aside (tests stay), run its last passing test command: it must fail; put the
        changes back: it must pass. True, or the reason it is not proved."""
        root, command = item['root'], item.get('test_command')
        if not command: return 'no test passed on the final code (Green)'
        changes = [path for path in code if not re.search(r'(^|/)tests?/|(^|/)test_[^/]*$|_test\.py$|\.test\.[mc]?js$', path)]
        if not changes: return 'only tests changed: nothing to prove'
        if any(path in item['before'] for path in changes): return 'a changed file had other edits before the request, so Red cannot be proved'
        saved = {path: (root / path).read_bytes() if (root / path).exists() else None for path in changes}
        run = lambda: subprocess.run(command, shell=True, cwd=root, capture_output=True, timeout=600).returncode == 0
        try:
            for path in changes:
                original = subprocess.run(['git', '-C', str(root), 'show', f'HEAD:{path}'], capture_output=True)
                if original.returncode == 0: (root / path).write_bytes(original.stdout)
                elif (root / path).exists(): (root / path).unlink()
            without = run()
        finally:
            for path, content in saved.items():
                if content is None: (root / path).unlink(missing_ok=True)
                else: (root / path).parent.mkdir(parents=True, exist_ok=True); (root / path).write_bytes(content)
        if without: return f'the tests pass without the change too (`{command}`): they do not test it'
        if not run(): return f'the tests fail with the change (`{command}`)'
        return True

    # -- the files ------------------------------------------------------------------------------------------------
    def task_for(self, item):
        """(task path, made) for the request: a task it names that exists, else a new one with its roadmap line."""
        from harness.context import mentioned  # the same reading of "task 2" as the context Pi gets
        root = item['root']
        names = sorted(path.relative_to(root).as_posix() for path in (root / 'tasks').glob('*.md'))
        named = [name for name in mentioned(item['text'], names) if name.startswith('tasks/')]
        if named:
            text = (root / named[0]).read_text(encoding='utf-8')
            if PROGRESS not in text: (root / named[0]).write_text(text.rstrip('\n') + f'\n\n{PROGRESS}\n', encoding='utf-8')
            return named[0], False
        number = max([int(match.group(1)) for name in names if (match := re.match(r'tasks/(\d+)-', name))] or [0]) + 1
        first = item['text'].splitlines()[0].strip() if item['text'] else 'Request'
        title = re.sub(r'[.:;!?\s]+$', '', first)[:70] or 'Request'
        words = re.findall(r'[a-z0-9]+', title.lower())[:5] or ['request']
        path = f'tasks/{number:03d}-{"-".join(words)}.md'
        quoted = item['text'][:600] + ('…' if len(item['text']) > 600 else '')
        (root / path).write_text(f'# {number:03d}: {title}\n\nKind: code\n\nRequest {datetime.now():%Y-%m-%d}: “{quoted}”\n\n{PROGRESS}\n', encoding='utf-8')
        roadmap = root / 'ROADMAP.md'
        roadmap.write_text(roadmap.read_text(encoding='utf-8').rstrip('\n') + f'\n- [ ] [{number:03d}-{title}]({path})\n', encoding='utf-8')
        return path, True

    def progress(self, item, line):
        path = item['root'] / item['task']
        text = path.read_text(encoding='utf-8')
        if PROGRESS not in text: text = text.rstrip('\n') + f'\n\n{PROGRESS}\n'
        path.write_text(text.rstrip('\n') + f'\n- [x] {line}\n', encoding='utf-8')

    def write(self, item, text):
        (item['root'] / item['task']).write_text(text, encoding='utf-8')

    @staticmethod
    def add(root, paths):
        return subprocess.run(['git', '-C', str(root), 'add', '-A', '--', *paths], capture_output=True, timeout=60).returncode == 0
