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
import json
from pathlib import Path
import re
import subprocess
import threading

from . import rules
from .protocol import CheckFailed, changed_paths, is_documentation, project_root

PROGRESS = '## Progress (kept by the harness)'


def short_title(text):
    """A short first sentence without request filler; the full request stays in the task."""
    title = str(text or '').strip().splitlines()[0] if str(text or '').strip() else ''
    title = re.split(r'(?<=[.!?])\s+|[。！？]', title, maxsplit=1)[0].strip()
    while True:
        shorter = re.sub(r'^(?:I want to|I would like to|Can you|Please|make a|create a)\s+', '', title, count=1, flags=re.I).strip()
        if shorter == title: break
        title = shorter
    title = title.rstrip('.:;!? ') or 'Request'
    title = title[0].upper() + title[1:]
    if len(title) > 48:
        words = title[:48].rsplit(' ', 1)
        title = (words[0] if len(words) > 1 else '') + '…'
    return title


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
                    "ROADMAP.md up to date and commits when the change is verified. Write content only: no task files, boxes or commits. "
                    f"Before you finish, add a `## For the person` section to {item['task']}: two or three short lines for someone who does not "
                    "read code, what changed and then \"Tried it: …\".")

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

    def end(self, request, review=True):
        """The request is over: mark it done and commit, or leave it open and say why. None outside a project."""
        with self.lock:
            item = self.requests.get(request)
            if not item: return None
            if review and not item.get('sample_checked'):
                item['sample_checked'] = True
                instruction = self.sample_cleanup(item)
                if instruction: return {'outcome': 'continue', 'instruction': instruction, 'task': item['task']}
            gaps = rules.plan_gaps(item['root']) if item['task'] and any(not plan_path(path) and not is_documentation(path) for path in self.changes(item)) else []
            if review and gaps and not item.get('plan_checked'):
                item['plan_checked'] = True
                return {'outcome': 'continue', 'kind': 'plan', 'task': item['task'], 'instruction': 'G-014: fill the plan before finishing. '+ '; '.join(gaps)}
            self.requests.pop(request, None)
            if not item['task']: return {'outcome': 'nothing changed'}
            root, task = item['root'], item['task']
            changed = self.changes(item)
            code = [path for path in changed if not plan_path(path) and not is_documentation(path)]
            text = (root / task).read_text(encoding='utf-8')
            if gaps:
                reason = '; '.join(gaps)
                self.write(item,text.rstrip('\n')+f'\n\nPlan incomplete (G-014): {reason} The task stays open.\n')
                saved = self.commit(root,sorted(set(changed)|{task,'ROADMAP.md'}),self.subject(item,', plan incomplete'),f'Plan incomplete (G-014): {reason}')
                return {'outcome':'plan incomplete','task':task,'reason':reason,**saved}
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
                    # Committed too, marked (2026-10-15): every change can be undone the same way; the task stays open.
                    self.write(item, text.rstrip('\n') + f'\n\nNot verified at {clock()}: {reason}. The task stays open.\n')
                    saved = self.commit(root, sorted(set(changed) | {task, 'ROADMAP.md'}), self.subject(item, ', not verified'), f'Not verified: {reason}.')
                    return {'outcome': 'not verified', 'task': task, 'reason': reason, **saved}
            self.progress(item, f'Done at {clock()}: verified and committed')
            text = (root / task).read_text(encoding='utf-8')
            roadmap = (root / 'ROADMAP.md').read_text(encoding='utf-8')
            if not re.search(r'- \[ \]', text):
                roadmap = re.sub(rf'^(\s*)- \[ \](.*\(tasks/{re.escape(Path(task).name)}\))', r'\1- [x]\2', roadmap, count=1, flags=re.MULTILINE)
                (root / 'ROADMAP.md').write_text(roadmap, encoding='utf-8')
            saved = self.commit(root, sorted(set(changed) | {task, 'ROADMAP.md'}), self.subject(item))
            return {'outcome': saved.pop('outcome', 'committed'), 'task': task, **saved}

    def sample_cleanup(self, item):
        """Once, before the first code request is committed: name the sample left from the starter's first commit."""
        root = item['root']
        if not any(not plan_path(path) and not is_documentation(path) for path in self.changes(item)): return None
        def git(*args):
            result = subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, timeout=10)
            return result.stdout if result.returncode == 0 else ''
        history = git('log', '--reverse', '--format=%H%x00%s').splitlines()
        if not history: return None
        baseline, subject = history[0].split('\0', 1)
        if subject != 'Start from the Pi Workbench starter': return None
        for revision in git('log', '--author=^Pi Workbench <', '--format=%H', baseline+'..HEAD').splitlines():
            paths = git('diff-tree', '--no-commit-id', '--name-only', '-r', revision).splitlines()
            if any(not plan_path(path) and not is_documentation(path) for path in paths): return None
        registry = json.loads((Path(__file__).resolve().parent.parent/'kit/starters.json').read_text(encoding='utf-8'))
        original = set(git('ls-tree', '-r', '--name-only', baseline).splitlines())
        spec = next((entry for entry in registry.values() if entry['identify'] in original), None)
        if not spec: return None
        remaining = []
        for name in spec['sample_files']:
            path = root/name
            if path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(root) and path.read_text(encoding='utf-8',errors='replace') == git('show', baseline+':'+name): remaining.append(name+' (unchanged sample)')
        for pattern in spec['rename']:
            for path in sorted(root.glob(pattern)):
                if not path.is_file() or path.is_symlink() or not path.resolve().is_relative_to(root): continue
                text = path.read_text(encoding='utf-8',errors='replace'); name = path.relative_to(root).as_posix()
                if path.suffix == '.json' or path.name.endswith('.webmanifest'):
                    try: values = json.loads(text)
                    except ValueError: continue
                    if not isinstance(values,dict): continue
                    keys = [key for key,value in values.items() if key.startswith('notes.') or key in {'app.name','name','short_name'} and value == 'Notes']
                    if keys: remaining.append(name+' ('+', '.join(keys)+')')
                elif re.search(r'\bnotes?\b', text, re.I): remaining.append(name+' (notes sample text)')
        if not remaining: return None
        return ('This project started from the sample notes app. Replace or remove what the new app does not use: '+
                '; '.join(remaining)+'. Keep the skeleton ('+', '.join(spec['skeleton'])+
                '). Adapt domain-specific parts of storage as needed. Update sw.js’s file list, the manifest’s name and the README to the new app. Run the tests again after cleanup.')

    def subject(self, item, mark=''):
        text = (item['root'] / item['task']).read_text(encoding='utf-8')
        title = re.match(r'# \d+: (.*)', text)
        return f"{title.group(1) if title else Path(item['task']).stem} (task {Path(item['task']).name[:3]}{mark})"

    def commit(self, root, paths, message, body=''):
        """One commit for the request's files, by the harness: {'message', 'commit'} (the handle for Undo This Request),
        or {'outcome': 'commit failed', 'reason'}."""
        name, email = self.identity
        done = subprocess.run(['git', '-C', str(root), '-c', f'user.name={name}', '-c', f'user.email={email}', 'commit', '-q', '-m', message,
                               *(['-m', body] if body else []), '--', *paths], capture_output=True, text=True, timeout=60) if self.add(root, paths) else None
        if not done or done.returncode:
            return {'outcome': 'commit failed', 'reason': (done.stderr if done else 'git add failed').strip()[-500:]}
        head = subprocess.run(['git', '-C', str(root), 'rev-parse', '--short=12', 'HEAD'], capture_output=True, text=True, timeout=30).stdout.strip()
        return {'message': message, 'commit': head}

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
        title = short_title(item['text'])
        words = re.findall(r'[a-z0-9]+', title.lower())[:5] or ['request']
        path = f'tasks/{number:03d}-{"-".join(words)}.md'
        quoted = item['text']
        (root / path).write_text(f'# {number:03d}: {title}\n\nKind: code\n\nRequest {datetime.now():%Y-%m-%d}: “{quoted}”\n\nDone when: {title}.\n\n{PROGRESS}\n', encoding='utf-8')
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
