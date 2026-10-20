"""The harness console's backend (plan 158, task 159): the harness's state as plain data.

One function per question, used by three doors: slash commands in terminal Pi (harness/extension.mjs runs
`python3 -m harness.admin <command> --json`), tools the model can call, and scripts. Reads come from the running
services when their port is known (live queue) and from the data folder otherwise. Nothing here changes anything yet:
changes come in a later phase, each with a confirmation by the person, a backup and a log line (plan 158 § 5).

    python3 -m harness.admin help
    python3 -m harness.admin gate 20 blocked --json
"""
from harness import autonomy
import json
import os
import re
import sqlite3
import subprocess
import sys
import urllib.request
import uuid
from datetime import datetime
from pathlib import Path

from harness import capability, model as models, terminal
from harness.documents import DocumentStore
from harness.markdown_records import read_record

ROOT = Path(__file__).resolve().parents[1]
from harness import settings as registry
DEFAULTS = registry.DEFAULTS  # every setting, its variable and what it does: harness/settings.py (task 166)
EXPLAIN = {**registry.EXPLAIN, 'model': 'Pinned in harness/model.json; must not be set here.'}
OLLAMA_SETTINGS = Path.home() / 'Library/Application Support/Ollama/db.sqlite'


# Ollama's environment and the app (task 162). Tests replace these functions; nothing else calls launchctl or the app.
def launchctl_get(key):
    if sys.platform != 'darwin': return os.environ.get(key)
    try: return subprocess.run(['launchctl', 'getenv', key], capture_output=True, text=True, timeout=5).stdout.strip() or None
    except (OSError, subprocess.SubprocessError): return None


def launchctl_set(key, value):
    subprocess.run(['launchctl', 'setenv', key, str(value)], check=True, capture_output=True, timeout=5)


def launchctl_unset(key):
    subprocess.run(['launchctl', 'unsetenv', key], check=True, capture_output=True, timeout=5)


def restart_ollama_app(between=None):
    """Quit the Ollama app, run `between` (a settings change it must not overwrite), open it, wait until it answers."""
    import time
    subprocess.run(['osascript', '-e', 'quit app "Ollama"'], capture_output=True, timeout=20)
    for _ in range(30):
        try: models.ollama('/api/version', timeout=1); time.sleep(0.5)
        except (OSError, ValueError): break
    if between: between()
    subprocess.run(['open', '-a', 'Ollama'], check=True, capture_output=True, timeout=20)
    for _ in range(120):
        try: models.ollama('/api/version', timeout=1); return
        except (OSError, ValueError): time.sleep(0.5)
    raise ValueError('Ollama did not answer within a minute after the restart. Open the Ollama app and check /doctor.')


def env_number(low, high):
    def check(raw):
        if not str(raw).isdigit() or not low <= int(raw) <= high: raise ValueError(f'Give a number from {low} to {high}.')
        return str(int(raw))
    return check


def keep_alive(raw):
    if not re.fullmatch(r'-1|0|\d+(s|m|h)', str(raw)): raise ValueError('keep_alive is a duration such as 5m, 1h, 0 (unload at once) or -1 (keep loaded).')
    return str(raw)


def context_length(raw):
    if not str(raw).isdigit() or not (int(raw) == 0 or 2048 <= int(raw) <= 262144): raise ValueError('context_length is 0 (Ollama decides) or a number of tokens from 2048 to 262144.')
    return int(raw)


def models_folder(raw):
    path = Path(str(raw)).expanduser()
    if not path.is_absolute() or not path.is_dir(): raise ValueError('models_folder must be an existing folder, as an absolute path.')
    return str(path.resolve())


# key: (where, name, check, what it does). env: launchctl variables the app reads at start; db: the app's settings.
OLLAMA_KEYS = {
    'num_parallel': ('env', 'OLLAMA_NUM_PARALLEL', env_number(1, 8), 'How many requests one loaded model answers at once (each reserves its own context memory).'),
    'keep_alive': ('env', 'OLLAMA_KEEP_ALIVE', keep_alive, 'How long a model stays in memory after its last request.'),
    'context_length': ('db', 'context_length', context_length, 'Default context length for models (0: Ollama decides).'),
    'models_folder': ('db', 'models', models_folder, 'Where Ollama keeps and downloads models. Models already in the old folder are not moved.'),
}

class Console:
    def __init__(self, data, web_port=None):
        self.data = Path(data).expanduser().resolve()
        self.web_port = web_port

    # -- sources -------------------------------------------------------------------------------------------------
    def web(self, path):
        """GET a JSON route of the running web server, or None when it is not running."""
        if not self.web_port: return None
        try:
            with urllib.request.urlopen(f'http://127.0.0.1:{self.web_port}{path}', timeout=3) as response: return json.loads(response.read())
        except (OSError, ValueError): return None

    def ollama(self, path, body=None, timeout=3):
        try: return models.ollama(path, body, timeout=timeout)
        except (OSError, ValueError): return None

    # -- reads ---------------------------------------------------------------------------------------------------
    def paths(self):
        return {'data': str(self.data), 'config': str(self.data / 'config.json'), 'model': str(self.data / 'model.json'),
                'projects': str(self.data / '.projects.json'), 'activity': str(self.data / 'activity'),
                'gate_events': str(self.data / 'gate-events.jsonl'), 'comments': str(self.data / '.comments'),
                'trash': str(self.data / '.trash'), 'chats': str(self.data / 'chats'), 'memory': str(self.data / 'AGENTS.md'),
                'repository': str(ROOT), 'ollama_settings': str(OLLAMA_SETTINGS)}

    def config(self):
        """config.json with defaults, each key's variable and meaning, which variables the shell overrides, and the
        variables the harness sets itself."""
        try: saved = json.loads((self.data / 'config.json').read_text())
        except (OSError, ValueError): saved = {}
        values = {**DEFAULTS, **saved}
        variables = {key: registry.SETTINGS[key][0] for key in values if key in registry.SETTINGS}
        overrides = {key: os.environ[name] for key, name in variables.items() if name and name in os.environ and name not in ('PI_WEB_EFFORT',)}
        internal = {name: {'about': about, 'value': os.environ.get(name)} for name, about in registry.INTERNAL.items()}
        return {'path': str(self.data / 'config.json'), 'values': values, 'explain': {key: EXPLAIN.get(key, 'Not a harness setting.') for key in values},
                'variables': variables, 'environment': overrides, 'internal': internal, 'ollama': registry.OLLAMA}

    def gate(self, n=20, blocked=False, project=None):
        """Gate's history, newest first. blocked: checks before a command that did not allow it."""
        events = []
        try: lines = (self.data / 'gate-events.jsonl').read_text(encoding='utf-8').splitlines()
        except OSError: lines = []
        root = None
        if project:
            try: root = str(DocumentStore(self.data).project_path(project))
            except ValueError: return []
        for line in reversed(lines):
            try: event = json.loads(line)
            except ValueError: continue
            if blocked and (event.get('phase') != 'gate' or event.get('outcome') == 'ALLOW'): continue
            if root and not str(event.get('cwd') or '').startswith(root): continue
            events.append(event)
            if len(events) >= n: break
        return events

    def gate_event(self, identifier):
        found = next((event for event in self.gate(10 ** 6) if event.get('id') == int(identifier)), None)
        if not found: raise ValueError(f'No Gate event {identifier} in the history')
        return found

    def queue(self, state=None):
        """Every request in Activity, oldest first: from the running server, else from the records."""
        live = self.web('/api/workspace')
        if live is not None: jobs = live.get('jobs', [])
        else:
            jobs = []
            for path in sorted((self.data / 'activity').glob('*.md')):
                try: jobs.append(read_record(path))
                except (OSError, ValueError, KeyError): continue
            jobs.sort(key=lambda job: (job.get('created', ''), job.get('order', 0)))
        rows = [{'id': job.get('id'), 'status': job.get('status'), 'project': job.get('project'),
                 'message': job.get('message', (job.get('data') or {}).get('message', '')), 'created': job.get('created'),
                 'progress': job.get('progress', '')} for job in jobs]
        return [row for row in rows if state in (None, 'all') or row['status'] in ({'queued', 'waiting'} if state == 'waiting' else {state})]

    def job(self, identifier):
        identifier = str(identifier).lower()
        if not re.fullmatch(r'[0-9a-f]{4,32}', identifier): raise ValueError('A request id is hexadecimal: its first 8 characters from /queue are enough')
        found = sorted((self.data / 'activity').glob(f'{identifier}*.md'))  # /queue shows the first 8 characters (round 6)
        if len(found) > 1: raise ValueError(f'{identifier} starts more than one request: type more of its id')
        if not found: raise ValueError(f'No request {identifier} in Activity')
        path = found[0]; identifier = path.stem
        return {'id': identifier, 'path': str(path), 'markdown': path.read_text(encoding='utf-8')}

    def projects(self):
        return DocumentStore(self.data).list_projects()

    def models(self):
        effort = self.config()['values']['effort']
        choice = models.current(self.data, effort)
        try: installed = models.local_models()
        except (OSError, ValueError): return {'ollama': False, 'choice': choice, 'default': models.MODEL, 'models': []}
        current = capability.keys()
        for item in installed: item['chosen'] = item['id'] == choice['model']; item['at_once'] = capability.known(self.data, item['id'], current)
        return {'ollama': True, 'choice': choice, 'default': models.MODEL, 'models': installed}

    def ollama_info(self):
        """Ollama's version, address, models folder, parallel slots and loaded models."""
        version = self.ollama('/api/version')
        loaded = self.ollama('/api/ps') or {}
        folder = None
        if OLLAMA_SETTINGS.exists():
            try:
                with sqlite3.connect(f'file:{OLLAMA_SETTINGS}?mode=ro', uri=True, timeout=2) as connection:
                    row = connection.execute('select models from settings limit 1').fetchone()
                    folder = row[0] if row else None
            except sqlite3.Error: folder = None
        parallel = os.getenv('OLLAMA_NUM_PARALLEL')
        if parallel is None and sys.platform == 'darwin':
            try: parallel = subprocess.run(['launchctl', 'getenv', 'OLLAMA_NUM_PARALLEL'], capture_output=True, text=True, timeout=3).stdout.strip() or None
            except (OSError, subprocess.SubprocessError): parallel = None
        return {'url': models.ollama_url(), 'running': version is not None, 'version': (version or {}).get('version'),
                'models_folder': folder or os.getenv('OLLAMA_MODELS') or str(Path.home() / '.ollama/models'),
                'num_parallel': parallel or 'default', 'loaded': [item.get('name') for item in loaded.get('models', [])]}

    def status(self):
        jobs = self.queue(); counts = {}
        for job in jobs: counts[job['status']] = counts.get(job['status'], 0) + 1
        today = datetime.now().astimezone().date().isoformat()
        checks = [event for event in self.gate(10 ** 6) if event.get('phase') == 'gate' and str(event.get('timestamp', '')).startswith(today)]
        try: build = json.loads((ROOT / 'install.json').read_text()).get('commit', '')[:7] or 'checkout'
        except (OSError, ValueError): build = 'checkout'
        choice = models.current(self.data, self.config()['values']['effort'])
        return {'services': {'web': self.web('/api/config') is not None, 'web_port': self.web_port},
                'model': choice, 'ollama': self.ollama('/api/version') is not None,
                'queue': {key: counts.get(key, 0) for key in ('running', 'queued', 'failed', 'stopped', 'interrupted', 'completed')},
                'gate_today': {'checks': len(checks), 'blocked': sum(event.get('outcome') != 'ALLOW' for event in checks)},
                'projects': len(self.projects()), 'data': str(self.data), 'build': build}

    def doctor(self):
        """Checks, each with what is wrong and what to do."""
        checks = []
        # Round 7 (task 177): a fix is an existing command that asks first, or plain words when no command does it; a
        # note is something that needs nothing from the person.
        def check(name, ok, detail, fix='', note=False):
            checks.append({'check': name, 'ok': bool(ok), 'detail': detail, 'fix': '' if ok or note else fix, 'note': bool(note) and not ok})
        check('Data folder', self.data.is_dir() and os.access(self.data, os.W_OK), str(self.data), f'Create {self.data} or set PI_AGENT_DATA.')
        try:
            values = self.config()['values']; problem = None
            path = self.data / 'config.json'
            if path.exists() and 'model' in json.loads(path.read_text() or '{}'): problem = "remove 'model': the model is pinned in harness/model.json"
            elif values['effort'] not in models.EFFORTS: problem = f"effort must be one of {', '.join(models.EFFORTS)}"
        except (OSError, ValueError) as error: problem = f'cannot read it: {error}'
        fix = '/config set effort high' if problem and problem.startswith('effort') else f'Fix config.json: {problem}.'
        check('Settings', not problem, problem or ('config.json is valid' if (self.data / 'config.json').exists() else 'defaults (plh writes config.json at its next start)'), fix)
        version = self.ollama('/api/version')
        check('Ollama', version is not None, f"{models.ollama_url()} {'answers, version ' + version.get('version', '?') if version else 'does not answer'}", '/ollama restart (or start the Ollama app; check PI_OLLAMA_URL)')
        if version is not None:
            info = self.models(); chosen = info['choice']['model']
            check('Chosen model', any(item['id'] == chosen for item in info['models']), f'{chosen}', f'/models pull {chosen} (or /models use <another>)')
        lock = self.data / '.agent-lock'
        if lock.exists():
            try: pid = json.loads(lock.read_text()).get('pid'); os.kill(int(pid), 0); alive = True
            except ProcessLookupError: alive = False
            except (OSError, ValueError, TypeError): alive = True
            check('Agent lock', alive, f'held by process {pid}' if alive else f'left by process {pid}, which is gone; it clears itself when the next agent starts', note=True)
        else: check('Agent lock', True, 'free')
        if self.web_port: check('Web workbench', self.web('/api/config') is not None, f'127.0.0.1:{self.web_port}', 'Quit plh and start it again.')
        return checks


    # -- changes (task 160) ----------------------------------------------------------------------------------------
    # Each change is asked for first (a preview with confirm: True), then run with yes: the file is backed up to
    # <data>/backups/, the change is a line in <data>/admin-log.jsonl, and /undo restores the backup.
    def backup(self, path):
        path = Path(path)
        if not path.exists(): return ''  # it did not exist: /undo moves the new file into backups/
        folder = self.data / 'backups'; folder.mkdir(exist_ok=True)
        target = folder / f"{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}-{path.name}"
        target.write_bytes(path.read_bytes()); return str(target)

    def log(self, **entry):
        line = {'id': uuid.uuid4().hex[:12], 'time': datetime.now().astimezone().isoformat(timespec='seconds'), 'by': 'person', **entry}
        with (self.data / 'admin-log.jsonl').open('a', encoding='utf-8') as handle: handle.write(json.dumps(line, ensure_ascii=False) + '\n')
        return line

    def history(self):
        try: return [json.loads(line) for line in (self.data / 'admin-log.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()]
        except OSError: return []

    @staticmethod
    def setting(key, raw):
        """A config.json value from what was typed (JSON where it parses, else text), or a ValueError saying what is allowed."""
        if key == 'model': raise ValueError('The model is pinned in harness/model.json; choose another one with /models use <name>.')
        if key not in registry.SETTINGS: raise ValueError(f"Unknown setting {key}. Settings: {', '.join(registry.SETTINGS)}.")
        try: value = json.loads(raw)
        except ValueError: value = raw
        try: return registry.SETTINGS[key][2](value)
        except ValueError as error: raise ValueError(f'{key} must be {error}.') from None

    def set_config(self, key, raw, yes=False):
        if key=='auto':key='auto_accept'
        value = self.setting(key, raw)
        if key=='auto_accept':
            from harness.autonomy import set_enabled
            return set_enabled(self.data,value,confirmed=yes)
        path = self.data / 'config.json'
        try: saved = json.loads(path.read_text())
        except (OSError, ValueError): saved = {}
        before = {**DEFAULTS, **saved}.get(key)
        detail = f'{key}: {json.dumps(before)} → {json.dumps(value)} in {path}'.replace('"', '') if isinstance(value, str) else f'{key}: {json.dumps(before)} → {json.dumps(value)} in {path}'
        variable = registry.SETTINGS[key][0]
        note = f'\nIt reaches the harness as {variable}; applies the next time plh starts.' if variable else '\nApplies the next time plh starts.'
        if variable and variable in os.environ: note += f' {variable}={os.environ[variable]} is set in your shell and wins over config.json.'
        shown = lambda item: json.dumps(item) if not isinstance(item, str) else (item or '(empty)')
        rows = [[key, f'{shown(before)} → {shown(value)}'], ['Saved in', str(path)], ['Applies', 'the next time plh starts' + (f' (as {variable})' if variable else '')]]
        if variable and variable in os.environ: rows.append(['Note', f'{variable}={os.environ[variable]} in your shell wins over config.json'])
        if not yes: return {'confirm': True, 'title': f'Change {key}?', 'detail': detail + '\n' + EXPLAIN[key] + note, 'rows': rows, 'action': 'Save Setting'}
        backup = self.backup(path)
        temporary = path.with_suffix('.tmp'); temporary.write_text(json.dumps({**saved, key: value}, indent=2) + '\n'); temporary.replace(path)
        self.log(command=f'config set {key} {raw}', file=str(path), backup=backup, before=before, after=value)
        return {'changed': True, 'detail': detail, 'result': f'✓ {key} is {shown(value)}. /undo goes back to {shown(before)}.'}

    def choose_model(self, name, effort=None, yes=False):
        installed = self.models()
        if not installed['ollama']: raise ValueError(f'Ollama does not answer at {models.ollama_url()}, so the model cannot be checked. Start the Ollama app first.')
        found = next((item for item in installed['models'] if item['id'] == name), None)
        if not found:
            import difflib
            near = difflib.get_close_matches(name, [item['id'] for item in installed['models']], 1, 0.3) or [item['id'] for item in installed['models'] if item['id'].startswith(name)]
            raise ValueError(f'No model named “{name}”.' + (f' Did you mean {near[0]}?' if near else '') + f" Installed: {', '.join(item['id'] for item in installed['models'])}.")
        if not found['tools']: raise ValueError(f'{name} cannot use tools, which Pi needs.')
        if effort is not None and effort not in models.EFFORTS: raise ValueError(f"The thinking level must be one of {', '.join(models.EFFORTS)}.")
        before = installed['choice']; after = {**before, 'model': name, **({'effort': effort} if effort else {})}
        detail = f"{before['model']} · {before['effort']} → {after['model']} · {after['effort']}. Ollama unloads the previous model, so only one is in memory."
        rows = [['Model', f"{before['model']}  →  {name}"], *([['Thinking', f"{before['effort']} → {after['effort']}"]] if after['effort'] != before['effort'] else []),
                ['Saved in', str(models.choice_path(self.data))], ['Also', f"Ollama unloads {before['model']} first"]]
        if not yes: return {'confirm': True, 'title': f'Switch to {name}?', 'detail': detail, 'rows': rows, 'action': 'Switch Model'}
        path = models.choice_path(self.data); backup = self.backup(path)
        if self.web('/api/config') is not None:  # the running workbench switches and waits until the model answers
            for route, body in [('/api/model', {'model': name}), *([('/api/effort', {'effort': effort})] if effort else [])]:
                request = urllib.request.Request(f'http://127.0.0.1:{self.web_port}{route}', json.dumps(body).encode(), {'Content-Type': 'application/json'})
                with urllib.request.urlopen(request, timeout=600) as response: response.read()
        else:
            models.save(self.data, model=name, effort=after['effort']); models.switch(before['model'], name)
        self.log(command=f"models use {name}" + (f' {effort}' if effort else ''), file=str(path), backup=backup, before=before, after=after)
        return {'changed': True, 'detail': detail, 'result': f"✓ Model is {name}. /undo goes back to {before['model']}."}

    def undo(self, yes=False):
        history = self.history(); undone = {entry.get('undoes') for entry in history}
        last = next((entry for entry in reversed(history) if (entry.get('backup') is not None or entry.get('ollama')) and 'undoes' not in entry and entry.get('id') not in undone), None)
        if not last: raise ValueError('Nothing to undo: no change with a backup in admin-log.jsonl.')
        detail = f"Undo “{last['command']}” ({last['time']}): " + (f"restore {last['file']} from {last['backup']}." if last['backup'] else f"{last['file']} did not exist before; it moves to the backups folder.")
        if last.get('ollama'): detail = f"Undo “{last['command']}” ({last['time']}): {last['ollama']} back to {last['before'] if last['before'] not in (None, '') else 'default'}; Ollama restarts."
        if not yes: return {'confirm': True, 'title': 'Undo the last change?', 'detail': detail, 'rows': [['Undo', last['command']], ['From', last['time']], ['Restores', last['file']]], 'action': 'Undo'}
        if last.get('ollama'):  # Ollama: write the old value back (not the whole file: the app may have changed others)
            self.idle(); restart_ollama_app(between=lambda: self.write_ollama(last['ollama'], last['before']))
        elif last['backup']: Path(last['file']).write_bytes(Path(last['backup']).read_bytes())
        elif Path(last['file']).exists():  # the change created the file: set it aside, never delete it
            folder = self.data / 'backups'; folder.mkdir(exist_ok=True)
            Path(last['file']).rename(folder / f"{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}-{Path(last['file']).name}.undone")
        self.log(command=f"undo {last['command']}", file=last['file'], undoes=last.get('id'), before=last['after'], after=last['before'])
        return {'changed': True, 'detail': detail, 'result': f"✓ Undone: {last['command']}."}

    # -- Ollama and models (task 162) ---------------------------------------------------------------------------------
    def idle(self):
        if self.queue('running'): raise ValueError('Pi is working on a request; change Ollama when the queue is idle (restarting Ollama would stop it).')

    def ollama_value(self, key):
        where, name, _, _ = OLLAMA_KEYS[key]
        if where == 'env': return launchctl_get(name)
        try:
            with sqlite3.connect(f'file:{OLLAMA_SETTINGS}?mode=ro', uri=True, timeout=2) as connection: return connection.execute(f'select {name} from settings where id = 1').fetchone()[0]
        except sqlite3.Error: return None

    def write_ollama(self, key, value):
        where, name, _, _ = OLLAMA_KEYS[key]
        if where == 'env': return (launchctl_unset(name) if value is None else launchctl_set(name, value))
        with sqlite3.connect(OLLAMA_SETTINGS, timeout=5) as connection: connection.execute(f'update settings set {name} = ? where id = 1', (value,))

    def set_ollama(self, key, raw, yes=False):
        if key not in OLLAMA_KEYS: raise ValueError(f"Unknown Ollama setting {key}. Settings: {', '.join(OLLAMA_KEYS)}.")
        where, name, check, about = OLLAMA_KEYS[key]; value = check(raw); before = self.ollama_value(key)
        detail = f"{key}: {before if before not in (None, '', 0) else 'default'} → {value}\n{about}\nPi WorkStation restarts Ollama so it reads the new value; a loaded model unloads."
        rows = [[key, f"{before if before not in (None, '', 0) else 'default'} → {value}"], ['Saved in', str(OLLAMA_SETTINGS) if where == 'db' else f'{name} (launchctl)'], ['Also', 'Ollama restarts; a loaded model unloads']]
        if not yes: return {'confirm': True, 'title': f'Change Ollama’s {key}?', 'detail': detail, 'rows': rows, 'action': 'Change and Restart'}
        self.idle()
        backup = self.backup(OLLAMA_SETTINGS) if where == 'db' else None
        restart_ollama_app(between=lambda: self.write_ollama(key, value))
        self.log(command=f'ollama set {key} {raw}', ollama=key, file=str(OLLAMA_SETTINGS) if where == 'db' else name, backup=backup, before=before, after=value)
        return {'changed': True, 'detail': detail.split('\n')[0], 'result': f"✓ Ollama’s {key} is {value}. /undo goes back to {before if before not in (None, '', 0) else 'default'}."}

    def restart_ollama(self, yes=False):
        if not yes: return {'confirm': True, 'title': 'Restart Ollama?', 'detail': 'Quits and reopens the Ollama app; a loaded model unloads.', 'rows': [['Also', 'a loaded model unloads']], 'action': 'Restart Ollama'}
        self.idle(); restart_ollama_app(); self.log(command='ollama restart')
        return {'changed': True, 'detail': 'Ollama restarted.', 'result': '✓ Ollama restarted.'}

    def manifest_path(self, name):
        model, _, tag = name.partition(':'); parts = model.split('/')
        host, namespace, repository = ('registry.ollama.ai', 'library', parts[0]) if len(parts) == 1 else ('registry.ollama.ai', *parts) if len(parts) == 2 else parts[:3]
        folder = Path(self.ollama_info()['models_folder'])
        return folder, folder / 'manifests' / host / namespace / repository / (tag or 'latest')

    def remove_model(self, name, yes=False):
        """Moves the model's manifest and the files only it uses to the Trash, laid out like the models folder."""
        from harness.documents import to_trash
        folder, manifest = self.manifest_path(name)
        if not manifest.is_file(): raise ValueError(f'{name} is not installed in {folder}.')
        if name == models.current(self.data, self.config()['values']['effort'])['model']: raise ValueError(f'{name} is the chosen model. Choose another one first (/models use <name>).')
        digests = lambda path: {item['digest'] for item in [json.loads(path.read_text()).get('config', {}), *json.loads(path.read_text()).get('layers', [])] if item.get('digest')}
        ours = digests(manifest)
        others = set().union(*[digests(path) for path in (folder / 'manifests').rglob('*') if path.is_file() and path != manifest] or [set()])
        blobs = [folder / 'blobs' / digest.replace(':', '-') for digest in sorted(ours - others)]
        blobs = [blob for blob in blobs if blob.exists()]
        size = sum(blob.stat().st_size for blob in blobs)
        detail = f"Moves {name} (its manifest and {len(blobs)} files only it uses, {size / 1e9:.1f} GB) to the Trash. Put Back brings it back; the space is freed when you empty the Trash."
        rows = [['Moves', f'its manifest and {len(blobs)} files only it uses, to the Trash'], ['Frees', f'{size / 1e9:.1f} GB when you empty the Trash'], ['Undo', f'Put Back in the Finder, then merge into {folder}']]
        if not yes: return {'confirm': True, 'title': f'Remove {name}?', 'detail': detail, 'rows': rows, 'action': 'Remove Model', 'destructive': True}
        self.idle()
        staging = folder / f"Removed model {name.replace('/', ' ').replace(':', ' ')} {datetime.now().strftime('%Y-%m-%d %H%M%S')}"
        for source in [manifest, *blobs]:
            target = staging / source.relative_to(folder); target.parent.mkdir(parents=True, exist_ok=True); source.rename(target)
        (staging / 'README.txt').write_text(f'{name}, removed from {folder} by the Pi WorkStation console.\nTo bring it back, move manifests/ and blobs/ from this folder into {folder} (merge the folders).\n')
        to_trash(staging)
        self.log(command=f'models remove {name}', trash=staging.name, files=len(blobs), bytes=size)
        return {'changed': True, 'detail': detail, 'result': f'✓ {name} is in the Trash.'}

    def pull_model(self, name, yes=False):
        if not re.fullmatch(r'[\w./-]+(:[\w.-]+)?', name): raise ValueError('A model name looks like qwen3:8b or library/qwen3:8b.')
        detail = f"Downloads {name} from ollama.com into {self.ollama_info()['models_folder']}. Large models are many GB; this can take a while."
        if not yes: return {'confirm': True, 'title': f'Pull {name}?', 'detail': detail, 'rows': [['Downloads', f'{name} from ollama.com'], ['Into', self.ollama_info()['models_folder']], ['Also', 'large models are many GB']], 'action': 'Pull Model'}
        request = urllib.request.Request(models.ollama_url() + '/api/pull', json.dumps({'model': name, 'stream': True}).encode(), {'Content-Type': 'application/json'})
        last = ''
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                for line in response:
                    event = json.loads(line)
                    if event.get('error'): raise ValueError(f"Ollama could not pull {name}: {event['error']}")
                    last = event.get('status', last)
        except OSError as error: raise ValueError(f'Ollama does not answer at {models.ollama_url()}: {error}')
        if last != 'success': raise ValueError(f'The pull of {name} ended with “{last}”.')
        self.log(command=f'models pull {name}')
        return {'changed': True, 'detail': f'{name} is installed.', 'result': f'✓ {name} is installed.'}

# -- the command line ----------------------------------------------------------------------------------------------
# name: (usage, what it does). harness/CONSOLE.md documents each one; tests/test_admin.py checks that it does.
COMMANDS = {
    'harness': ('', 'What the harness is and the commands it offers.'),
    'status': ('', 'Services, model, queue and Gate counts, data folder, build.'),
    'queue': ('[all|running|waiting|failed|stopped|interrupted|completed] [edit <id> <words>] [remove <id>]', 'Requests in Activity; in terminal Pi, edit or remove a waiting message (asks first).'),
    'job': ('<id>', 'The Markdown record of one request.'),
    'gate': ('[n] [blocked] [why <id>] [rules [id]]', 'Gate checks, newest first; why <id> explains one; rules lists what Gate enforces.'),
    'models': ('[use <name> [effort]] [check [name] [--all] [--force]] [pull <name>] [remove <name>]', 'Installed models; use, pull and remove ask first (remove goes to the Trash); check measures two at once.'),
    'ollama': ('[set <key> <value>] [restart]', 'Ollama: version, models folder, parallel slots, context, keep-alive; set and restart ask first.'),
    'projects': ('', 'Projects and their folders.'),
    'auto': ('[on|off|status]', 'Run on its own for all projects; on always shows the risks first.'),
    'report': ('', 'The last automatic run’s report.'),
    'config': ('[set <key> <value>]', 'config.json with each key explained; set changes one (asks first).'),
    'paths': ('', 'Where the harness keeps its data.'),
    'doctor': ('', 'Checks with what is wrong and what to do.'),
    'audit': ('[folder]', 'Run the publication checks for this project (asks first; offline).'),
    'setup': ('packages [folder]', 'Install this project’s packages from its lock file (asks first; downloads once; the person’s terminal only).'),
    'undo': ('', 'Undo the last change made from the console (asks first).'),
    'reports': ('[kind]', 'Incidents the harness met (rules, Gate failures, recoveries, wake-ups, stops), for the analysis.'),
    'decisions': ('[--all] [request]', 'The last request’s decisions with their authors (you, auto, Laya, code, model); --all adds those code made, with rules, paths and commands.'),
    'bench': ('', 'The bench: fixed scenarios run with the real model; solved, verified, time, wake-ups per model and harness build.'),
    'guide': ('[words]', 'How to use Pi WorkStation: the guide, or its sections about the words.'),
    'update': ('[now]', 'Is a new version of Pi WorkStation on GitHub, and what changed; now updates (asks first).'),
}


def table(rows, columns):
    if not rows: return '(none)'
    widths = {column: min(60, max(len(column), *(len(str(row.get(column, ''))) for row in rows))) for column in columns}
    cut = lambda value, width: value if len(value) <= width else value[:width - 1] + '…'
    lines = ['  '.join(column.upper().ljust(widths[column]) for column in columns)]
    lines += ['  '.join(cut(str(row.get(column, '') if row.get(column) is not None else ''), widths[column]).ljust(widths[column]) for column in columns) for row in rows]
    return '\n'.join(line.rstrip() for line in lines)


def view(title, *parts, summary='', hint=''):
    return {'title': title, 'summary': summary, 'parts': [part for part in parts if part], 'hint': hint}


def kv(*rows):
    return {'kind': 'kv', 'rows': [list(row) for row in rows if row]}


def short_time(stamp):
    """'10-14 10:31' today-or-not as the boards write it: HH:MM today, MM-DD HH:MM otherwise."""
    stamp = str(stamp or ''); today = datetime.now().astimezone().date().isoformat()
    return stamp[11:16] if stamp[:10] == today else stamp[5:16].replace('T', ' ')


GATE_WORDS = {'ALLOW': '✓ Allowed', 'BLOCK': '✗ Blocked', 'REVISE': '! Revise', 'ESCALATE': '? Escalated', 'VERIFIED': '✓ Verified',
              'EXECUTION_FAILED': '✗ Command failed', 'DRIFT_DETECTED': '✗ Changed after approval'}


def change_view(value):
    """A change: its preview (what changes from what to what, where, side effects) or its one-line result."""
    if value.get('confirm'):
        action = value.get('action', 'Apply'); cancel_first = value.get('destructive')
        hint = 'Return cancels · choose ' + action + ' to go ahead' if cancel_first else f'Return {action.lower()} · Esc cancels'
        return view(value['title'], kv(*value.get('rows', [])) if value.get('rows') else {'kind': 'prose', 'text': value['detail']}, hint=hint)
    lines=[value.get('result') or '✓ ' + value['detail']]
    if value.get('report'):
        counts=value['report']['counts'];lines.append(f"Run report: {counts['done']} tasks · {counts['decisions']} decisions · {counts['external']} external actions · {counts['problems']} problems. /report")
    return view(None, {'kind': 'lines', 'lines': lines})


def report_line(kind,item):
    if kind=='done':return ('✓ ' if item.get('verified') else '! ')+str(item.get('task',''))+(' · '+item['reason'] if item.get('reason') else '')
    if kind=='decisions':return item.get('question','')+': '+item.get('answer','')+' (auto)'
    return str(item.get('action') or item.get('reason') or '')+' · '+item.get('when','')


def build(console, command, args, yes=False):
    """(data, view) for a command: data for --json and tools, the view for people (harness/terminal.py renders it).
    A change without yes returns its preview ({confirm: True, …}) and changes nothing."""
    def changed(value):
        return value, change_view(value)
    if command in ('harness', 'help'):
        rows = [['Ask in words', 'e.g. “is anything stuck?”, “switch to qwen”']] + [[f'/{name}', about] for name, (usage, about) in COMMANDS.items() if name != 'harness']
        return {name: about for name, (_, about) in COMMANDS.items()}, view('Harness commands', kv(*rows), hint='Type a command, or ask in words · python3 -m harness.admin <command> --json for raw data')
    if command=='auto':
        from harness.autonomy import enabled,set_enabled
        action=args[0] if args else 'status'
        if action not in {'on','off','status'}:raise ValueError('Usage: /auto on|off|status')
        if action=='status':
            value={'enabled':enabled(console.data)};return value,view('Run on its own',kv(['Run on its own','on' if value['enabled'] else 'off']))
        return changed(set_enabled(console.data,action=='on',confirmed=yes))
    if command=='report':
        from harness.autonomy import RunReports,KINDS
        value=RunReports(console.data).latest()
        if not value:return None,view('Run report',{'kind':'lines','lines':['No automatic run yet.']})
        titles={'done':'Done','decisions':'Decided on its own','external':'Left this Mac or used the Trash','problems':'Problems'}
        return value,view('Run report',*[{'kind':'lines','heading':f'{titles[kind]} · {value["counts"][kind]}','lines':[report_line(kind,item) for item in value[kind]] or ['None.']} for kind in KINDS],summary=value.get('outcome','Working'))
    if command == 'status':
        value = console.status(); queue = value['queue']; config = console.web('/api/config') or {}
        attention = queue['failed'] + queue['stopped'] + queue['interrupted']
        web = f"✓ Running · http://127.0.0.1:{value['services']['web_port']}" if value['services']['web'] else '✗ Not running'
        parts = [f"▶ {queue['running']} running", f"○ {queue['queued']} waiting"] + ([f'! {attention} need attention'] if attention else [])
        gate = f"{value['gate_today']['checks']} checks today" + (f" · ✗ {value['gate_today']['blocked']} blocked" if value['gate_today']['blocked'] else '')
        phone = f"✓ on · {config['phoneUrl']}" if config.get('phoneUrl') else 'off · /guide phone'
        return value, view('Status', kv(['Web', web], ['Model', f"{value['model']['model']} · {value['model']['effort']} thinking · " + ('✓ Ollama answers' if value['ollama'] else '✗ Ollama does not answer')],
                                         ['Queue', ' · '.join(parts)], ['Gate', gate], ['Phone', phone],
                                         ['Projects', f"{value['projects']} · data in {value['data'].replace(str(Path.home()), '~')} · build {value['build']}"], ['Loop check', 'every 10 s'], ['Run on its own', 'on · /auto off' if autonomy.enabled(console.data) else 'off · /auto on']),
                           hint='/queue · /gate blocked · /doctor')
    if command == 'queue':
        rows = console.queue(args[0] if args else None); names = {item['id']: item['name'] for item in console.projects()}
        counts = {}; [counts.__setitem__(row['status'], counts.get(row['status'], 0) + 1) for row in rows]
        summary = ' · '.join(part for part in [counts.get('running') and f"{counts['running']} running", sum(counts.get(key, 0) for key in ('failed', 'stopped', 'interrupted')) and f"{sum(counts.get(key, 0) for key in ('failed', 'stopped', 'interrupted'))} need attention"] if part)
        table = {'kind': 'table', 'columns': ['STATE', 'WHEN', 'PROJECT', 'REQUEST', 'ID'], 'flex': 3, 'drop': [2, 4], 'dim': [4], 'caps': {'2': 16},
                 'rows': [[terminal.STATE.get(row['status'], row['status']), short_time(row.get('created')), names.get(row['project'], row['project'] or ''), (row['message'] or 'Attached files').replace('\n', ' '), str(row['id'])[:8]] for row in rows],
                 'empty': 'Nothing in the queue.'}
        return rows, view('Queue', table, summary=summary, hint='/job <id> for one request (the first 8 characters are enough) · /queue edit <id> <words> · /queue remove <id>')
    if command == 'job':
        if not args: raise ValueError('Usage: /job <id> (the first 8 characters, from /queue)')
        value = console.job(args[0]); return value, view(f"Request {value['id'][:8]}", {'kind': 'lines', 'lines': value['markdown'].splitlines()}, hint='/queue')
    if command == 'gate':
        if args[:1] == ['rules']:  # plan 179: the registry Gate enforces, always on
            from gate import rules as gate_rules
            fired = {}
            for event in console.gate(10 ** 6): fired[event.get('rule')] = fired.get(event.get('rule'), 0) + 1  # which weaknesses show up (task 178)
            value = [{'id': rule.id, 'name': rule.name, 'when': rule.when, 'scope': rule.scope, 'outcome': rule.outcome, 'summary': rule.summary, 'lesson': rule.lesson, 'fired': fired.get(rule.id, 0)} for rule in gate_rules.RULES]
            if args[1:]:
                rule = gate_rules.BY_ID.get(args[1].upper())
                if not rule: raise ValueError(f"No rule {args[1]}. /gate rules lists them.")
                return vars(rule), view(f'Gate rule {rule.id}', kv(['Rule', rule.name], ['When', rule.when], ['Where', rule.scope], ['Outcome', rule.outcome], ['Lesson', f'docs/lessons/{rule.lesson}' if rule.lesson else '—'], ['Test', rule.test]), {'kind': 'prose', 'text': rule.summary}, hint='/gate rules')
            table = {'kind': 'table', 'columns': ['RULE', 'WHEN', 'OUTCOME', 'FIRED'], 'flex': 0, 'drop': [1], 'rows': [[f'{rule.id} {rule.name}', rule.when, rule.outcome.title(), str(item['fired'])] for rule, item in zip(gate_rules.RULES, value)]}
            return value, view('Gate rules', table, summary=f'{len(value)} rules, always on', hint='/gate rules <id> explains one · FIRED: decisions in Gate\'s history · rules change only through a task with a test')
        if args[:1] == ['why']:
            if len(args) < 2: raise ValueError('Usage: /gate why <id>')
            event = console.gate_event(args[1])
            command_text = (event.get('args') or {}).get('command') or (event.get('args') or {}).get('path') or ''
            return event, view(f"Gate · check {event.get('id')}", kv(['Decision', GATE_WORDS.get(event.get('outcome'), event.get('outcome'))], ['Check', 'before it ran' if event.get('phase') == 'gate' else 'after it ran'],
                                                                    ['Tool', event.get('tool', '')], ['Command', command_text], ['Reason', event.get('reason') or '—'], *([['Rule', event['rule'] + ' · /gate rules ' + event['rule']]] if event.get('rule') else []), ['Where', event.get('cwd') or ''], ['From', event.get('source') or ''], ['When', event.get('timestamp', '')]), hint='/gate · /gate blocked')
        n = next((int(arg) for arg in args if arg.isdigit()), 20); blocked = 'blocked' in args
        rows = console.gate(n, blocked=blocked); projects = sorted(((item['path'], item['name']) for item in console.projects()), key=lambda pair: -len(pair[0]))
        owner = lambda cwd: next((name for path, name in projects if cwd and (cwd == path or cwd.startswith(path + os.sep))), '')
        table = {'kind': 'table', 'columns': ['TIME', 'CHECK', 'DECISION', 'COMMAND', 'PROJECT', 'ID'], 'flex': 3, 'drop': [4, 5], 'dim': [5], 'caps': {'4': 16},
                 'rows': [[short_time(row.get('timestamp')), 'before' if row.get('phase') == 'gate' else 'after', GATE_WORDS.get(row.get('outcome'), row.get('outcome', '')),
                           (row.get('args') or {}).get('command') or (row.get('args') or {}).get('path') or row.get('tool', ''), owner(row.get('cwd')), str(row.get('id', ''))] for row in rows],
                 'empty': 'No checks yet.' if not blocked else 'Nothing blocked.'}
        return rows, view('Gate · blocked' if blocked else 'Gate', table, hint='/gate why <id> for one check · /gate blocked')
    if command == 'models' and args[:1] in (['pull'], ['remove']):
        if len(args) < 2: raise ValueError(f'Usage: /models {args[0]} <name>')
        return changed((console.pull_model if args[0] == 'pull' else console.remove_model)(args[1], yes))
    if command == 'ollama' and args[:1] == ['set']:
        if len(args) < 3: raise ValueError(f"Usage: /ollama set <key> <value>. Keys: {', '.join(OLLAMA_KEYS)}.")
        return changed(console.set_ollama(args[1], ' '.join(args[2:]), yes))
    if command == 'ollama' and args[:1] == ['restart']:
        return changed(console.restart_ollama(yes))
    if command == 'models' and args[:1] == ['check']:
        return check_models(console, args[1:])
    if command == 'models' and args[:1] == ['use']:
        if len(args) < 2: raise ValueError('Usage: /models use <name> [effort]')
        return changed(console.choose_model(args[1], args[2] if len(args) > 2 else None, yes))
    if command == 'models':
        value = console.models()
        if not value['ollama']: return value, view('Models', {'kind': 'lines', 'lines': [f"✗ Ollama does not answer at {models.ollama_url()}.", f"Chosen: {value['choice']['model']}"]}, hint='/doctor')
        loaded = set(console.ollama_info().get('loaded') or [])
        can = lambda item: '✗ no tools' if not item['tools'] else ' · '.join(word for word in [('thinks' if item['thinking'] else 'no thinking'), item['vision'] and 'sees', {'parallel': 'parallel', 'partly parallel': 'one at a time', 'one at a time': 'one at a time', 'checking': 'checking…'}.get(item['at_once'])] if word)
        table = {'kind': 'table', 'columns': ['MODEL', 'SIZE', 'CAN', ''], 'flex': 2, 'dim': [3],
                 'rows': [[('● ' if item['chosen'] else '  ') + item['id'], f"{item['size'] / 1e9:.0f} GB", can(item), 'in memory' if item['id'] in loaded else ''] for item in value['models']]}
        return value, view('Models', table, hint='/models use <name> · /models check · /models pull <name> · /models remove <name>')
    if command == 'ollama':
        value = console.ollama_info()
        return value, view('Ollama', kv(['Running', ('✓ answers at ' if value['running'] else '✗ does not answer at ') + value['url']], ['Version', value['version'] or '—'], ['Models', value['models_folder']],
                                       ['Parallel', str(value['num_parallel'])], ['In memory', ', '.join(value['loaded']) or 'nothing']), hint='/ollama set <key> <value> · /ollama restart · /models')
    if command == 'projects':
        rows = console.projects()
        table = {'kind': 'table', 'columns': ['NAME', 'FOLDER', 'STATE', 'ID'], 'flex': 1, 'drop': [3], 'dim': [3],
                 'rows': [[row['name'], row['path'].replace(str(Path.home()), '~'), '! folder missing' if row.get('missing') else '', str(row['id'])[:8]] for row in rows], 'empty': 'No projects yet: New Project… in the workbench.'}
        return rows, view('Projects', table, hint='Rename, move or remove a project from the workbench’s Project menu')
    if command == 'config' and args[:1] == ['set']:
        if len(args) < 3: raise ValueError('Usage: /config set <key> <value>')
        return changed(console.set_config(args[1], ' '.join(args[2:]), yes))
    if command == 'undo':
        return changed(console.undo(yes))
    if command == 'guide':
        return guide(args)
    if command == 'config' and len(args) == 1:
        value = console.config(); key = args[0]
        if key not in value['values']: raise ValueError(f"Unknown setting {key}. Settings: {', '.join(value['values'])}.")
        return value, view(f'Setting · {key}', kv(['Value', json.dumps(value['values'][key])], ['Default', json.dumps(DEFAULTS.get(key))], ['Variable', value['variables'].get(key) or '—'], ['Meaning', value['explain'][key]]),
                           hint=f'/config set {key} <value> asks first')
    if command == 'config':
        value = console.config()
        try: saved = json.loads((console.data / 'config.json').read_text())
        except (OSError, ValueError): saved = {}
        source = lambda key: f"env {value['variables'][key]}" if key in value['environment'] else 'config' if key in saved and saved[key] != DEFAULTS.get(key) else 'default'
        shown = lambda item: '(none)' if item in ([], '') else (item if isinstance(item, str) else json.dumps(item))
        changed_count = sum(source(key) != 'default' for key in value['values'])
        settings = {'kind': 'table', 'columns': ['KEY', 'VALUE', 'FROM'], 'flex': 1, 'rows': [[key, value['environment'][key] if key in value['environment'] else shown(item), source(key)] for key, item in value['values'].items()]}  # the value in force
        internal = {'kind': 'kv', 'heading': '── Harness variables · read only', 'rows': [[name, item['value'] or '—'] for name, item in value['internal'].items()]}
        return value, view('Settings', settings, internal, summary=f"{len(value['values'])} settings · {changed_count} changed", hint='/config <key> explains one · /config set <key> <value> asks first · Ollama’s own: /ollama')
    if command == 'bench':  # plan 189: how well the model and the harness do on fixed scenarios
        from bench import runner as bench
        results = bench.read_jsonl(console.data / 'bench' / 'results.jsonl'); rows = bench.summary(results)
        totals = {'kind': 'table', 'columns': ['MODEL', 'HARNESS', 'PROMPTS', 'RESOLVED', 'FIRST TRY', 'PASS^K', 'VERIFIED', 'MIN', 'WAKE-UPS'], 'flex': 0, 'drop': [7, 8],
                  'rows': [[f"{row['model']} {row['effort']}", f"{row.get('mode', 'harness')} {row['harness']}", row.get('prompt_level', ''), f"{row['solved']}/{row['runs']}", str(row.get('first_try', '')), row.get('pass_k', ''), str(row['verified']), str(row['minutes']), str(row['wake_ups'])] for row in rows],
                  'empty': 'No runs yet: python3 -m bench run'}
        latest = {'kind': 'table', 'heading': 'Latest runs', 'columns': ['WHEN', 'SCENARIO', 'MODEL', 'RESULT'], 'flex': 3,
                  'rows': [[short_time(line.get('time')), line['scenario'], line['model'], ('✓ solved' if line['solved'] else '✗ not solved') + (' · verified' if line.get('verified') else '') + f" · {line['seconds'] // 60} min"] for line in results[-12:][::-1]], 'empty': '—'}
        return {'summary': rows, 'results': results[-50:]}, view('Bench', totals, latest, summary=f'{len(results)} runs', hint='python3 -m bench run [ids] [--model M] · each run’s files: <data>/bench/runs/')
    if command == 'decisions':  # task 273, board T_Decisions: the decision rows in the terminal
        from harness import decision_rows
        return decision_rows.terminal(console.data, args)
    if command == 'reports':  # plan 184: what went wrong while Pi worked alone
        from harness import reports as incident
        found = incident.read(console.data); found = [item for item in found if not args or item.get('kind') == args[0]]
        counts = {}
        for item in found: counts[item['kind']] = counts.get(item['kind'], 0) + 1
        latest = {'kind': 'table', 'heading': 'Latest', 'columns': ['WHEN', 'KIND', 'WHAT'], 'flex': 2,
                  'rows': [[short_time(item.get('time')), item['kind'] + (f" {item['rule']}" if item.get('rule') else ''), item.get('detail', '').replace('\n', ' ')] for item in found[-20:][::-1]], 'empty': 'Nothing reported.'}
        return {'counts': counts, 'reports': found[-200:]}, view('Reports', kv(*[[kind, str(count)] for kind, count in sorted(counts.items(), key=lambda pair: -pair[1])]) if counts else {'kind': 'lines', 'lines': ['Nothing reported yet.']}, latest,
                                                               summary=f'{len(found)} reported', hint='/reports <kind> · /gate rules · docs/lessons/ turns them into fixes')
    if command == 'paths':
        value = console.paths(); return value, view('Paths', kv(*[[key, path.replace(str(Path.home()), '~')] for key, path in value.items()]), hint='/config · /doctor')
    if command == 'audit':
        from gate.protocol import project_root
        from harness import audit
        root=project_root(Path(args[0]).expanduser().resolve() if args else Path.cwd())
        if root is None:raise ValueError('Open a project with ROADMAP.md before running /audit.')
        if not yes:return changed({'confirm':True,'title':'Run publication audit?','action':'Run Audit','rows':[['Folder',str(root)],['Checks','Files, unused code, references, strict types, tests and app names.'],['Downloads','Offline only; install missing tools separately after approval.']]})
        value=audit.run(root,console.data)
        items=[{'state':'ok' if row['passed'] else 'fix','label':audit.LABELS[row['key']],'detail':row['command'],'fix':row['output']} for row in value['checks']]
        return value,view('Publication audit',{'kind':'checklist','items':items},summary='Ready to publish' if value['ready'] else 'Publication checks need attention or roadmap tasks remain open.')
    if command == 'setup':  # task 331: Project › Install Packages… in terminal Pi
        from gate.protocol import project_root
        from harness import packages
        if args[:1] != ['packages']: raise ValueError('Usage: /setup packages [folder]. The optional parts (laya, music, browser) are `plh setup <part>` in a shell.')
        root = project_root(Path(args[1]).expanduser().resolve() if len(args) > 1 else Path.cwd())
        if root is None: raise ValueError('Open a project with ROADMAP.md before running /setup packages.')
        found = packages.facts(root)
        if not found['manager']: return found, view('Install Packages', {'kind': 'lines', 'lines': ['This project has no lock file with packages to install.']})
        if found['installed']: return found, view('Install Packages', {'kind': 'lines', 'lines': ['✓ This project’s packages are installed: nothing to download.']})
        if not yes: return changed({'confirm': True, 'title': 'Install the project’s packages?', 'action': 'Install Packages', 'detail': found['line'],
                                    'rows': [['Folder', str(root)], ['Downloads', found['line'].split(': ', 1)[1]], ['Runs', found['command']], ['Then', 'Pi’s test runs and the Preview use them offline']]})
        done = packages.install(root)
        from harness.decision_log import record
        record(console.data, None, 'packages_install', 'person', 'installed' if done['installed'] else 'not installed', rule='packages.setup')
        if not done['installed']: raise ValueError('Not installed: ' + done['reason'])
        disk = packages.disk(root)
        return changed({'changed': True, 'detail': f"Installed {done['count']} packages.", 'result': f"✓ Installed {done['count']} packages{f' ({disk} on disk)' if disk else ''}. Pi’s test runs and the Preview use them offline."})
    if command == 'doctor':
        rows = console.doctor(); broken = sum(not row['ok'] and not row.get('note') for row in rows)
        items = [{'state': 'ok' if row['ok'] else 'note' if row.get('note') else 'fix', 'label': row['check'], 'detail': row['detail'].replace(str(Path.home()), '~'), 'fix': row['fix']} for row in rows]
        return rows, view('Doctor', {'kind': 'checklist', 'items': items}, summary=f'{broken} to fix' if broken else 'all good', hint='/status · /guide')
    if command == 'update':  # the person, 2026-10-15: "make it easy for the user to update the app"
        from harness import updates
        source = update_source()
        if args[:1] == ['now']:
            found = updates.check(source)
            if found['state'] != 'available': return found, view('Update', {'kind': 'prose', 'text': found.get('why') or 'Pi WorkStation is up to date.'})
            # Task 263: plh installs the updated clone at its next start only when auto_update is on; otherwise say so.
            manual = f"auto_update is off, so plh keeps running this build. To install it, run python3 {source / 'harness/install.py'}, or turn auto_update on (/config set auto_update true) and start plh again."
            auto = bool(console.config()['values'].get('auto_update', True))
            if not yes:
                return changed({'confirm': True, 'title': 'Update Pi WorkStation?', 'action': 'Update',
                                'rows': [['Changes', f"{found['behind']} from GitHub"], ['Then', 'quit plh and start it again: the new version installs as it starts' if auto else 'the clone is updated; ' + manual]]})
            done = updates.apply(source)
            if done['state'] != 'updated': return done, view('Update', {'kind': 'prose', 'text': done.get('why', '')})
            return changed({'detail': f"Updated to {done['commit']}. " + ('Quit plh and start it again to use it.' if auto else manual)})
        found = updates.check(source)
        if found['state'] == 'available':
            return found, view('Update', {'kind': 'prose', 'text': f"A new version is on GitHub: {found['behind']} change{'s' if found['behind'] != 1 else ''}."},
                               {'kind': 'lines', 'lines': ['· ' + line for line in found['changes']]}, hint='/update now updates (asks first)')
        return found, view('Update', {'kind': 'prose', 'text': found.get('why') or 'Pi WorkStation is up to date.'})
    raise LookupError(f'Unknown command: {command}. Type /harness for the list.')


def update_source():
    """The clone Pi WorkStation was installed from (install.json), or this checkout when it runs from one."""
    record = ROOT / 'install.json'
    try: return Path(json.loads(record.read_text())['source'])
    except (OSError, ValueError, KeyError): return ROOT


def run(console, command, args, yes=False, width=80):
    """(data, text): build() rendered as plain text."""
    value, shape = build(console, command, args, yes)
    return value, terminal.plain(shape, width)

# Task 290: the /guide topics are built from GUIDE.md's headings, one per question in its order. A heading gets its word
# here; a new heading without one gets its first word not taken yet, so the list can never drift from the guide.
GUIDE_WORDS = {'What is this?': 'what', 'How do I start it?': 'start', 'How do I open the workbench in the browser?': 'browser',
               'How do I start a project?': 'project', 'How do I rename, move or delete a project?': 'rename', 'Chat or Work?': 'chat',
               'How do comments work?': 'comments', 'What does Pi see?': 'sees', 'Where do I see what Pi is doing?': 'activity',
               'Can Pi work on a long task?': 'long', 'How do I choose a model or thinking level?': 'model',
               'How do I get a new model, or remove one?': 'pull', "Why does Pi fix small models' tool calls?": 'repair', 'How do I use it from my phone or another device?': 'phone',
               'Can I talk instead of typing?': 'voice', 'How do I change a setting?': 'setting', 'What can the terminal console do?': 'console',
               'How do I change the language?': 'language', "How do I add it to my phone's Home Screen?": 'home',
               'How do I update Pi WorkStation?': 'update', 'Something is wrong. What do I do?': 'wrong', 'Where is my data?': 'data',
               'How do I check whether my app is ready to publish?': 'publish', 'Why does Pi ask me to choose?': 'choose',
               'How do I let Pi work on its own?': 'auto'}


def guide_sections():
    text = (ROOT / 'harness/GUIDE.md').read_text(encoding='utf-8')
    return text, ['## ' + part for part in text.split('\n## ')[1:]]


def guide_topics():
    """[(topic word, question)] for every ## question of GUIDE.md, in order."""
    topics = []
    for section in guide_sections()[1]:
        heading = section.splitlines()[0][3:].strip(); taken = {topic for topic, _ in topics}
        words = [word for word in re.findall(r'[a-z]+', heading.lower()) if word not in taken]
        chosen = GUIDE_WORDS.get(heading) if GUIDE_WORDS.get(heading) not in taken else None
        topics.append((chosen or (words[0] if words else f'q{len(topics) + 1}'), heading))
    return topics

def completions(console, command):
    """[argument, what it is] for Tab after /<command> (task 171, T_Wayfinding): terminal Pi filters them by what is typed."""
    if command == 'guide':
        return [[topic, heading] for topic, heading in guide_topics()]
    if command == 'config': return [[f'set {key}', EXPLAIN.get(key, '')] for key in registry.SETTINGS]
    if command == 'ollama': return [[f'set {key}', about] for key, (*_, about) in OLLAMA_KEYS.items()] + [['restart', 'Quit and reopen the Ollama app (asks first)']]
    if command == 'reports': return [[kind, ''] for kind in ('rule', 'gate-failed', 'recovery', 'wake-up', 'unverified', 'stopped')]
    if command == 'queue':  # task 325: edit and remove take a waiting message's id (terminal Pi's own handler does them)
        waiting = [row for row in console.queue('waiting') if row['status'] == 'queued' and row['id']]
        return [[state, ''] for state in ('all', 'running', 'waiting', 'failed', 'stopped', 'interrupted', 'completed')] + [[f"{verb} {str(row['id'])[:8]}", str(row['message'] or 'Attached files')[:50]] for verb in ('edit', 'remove') for row in waiting[:15]]
    if command == 'gate':
        from gate import rules as gate_rules
        return [['blocked', 'Only checks that did not allow'], ['why ', 'Explain one check: why <id>'], ['rules', 'The rules Gate enforces']] + [[f'rules {rule.id}', rule.name] for rule in gate_rules.RULES]
    if command == 'job':
        names = {project['id']: project['name'] for project in console.projects()}
        return [[str(row['id'])[:8], f"{terminal.STATE.get(row['status'], row['status'])} · {names.get(row['project'], row['project'])} · {str(row['message'] or '')[:50]}"] for row in reversed(console.queue()) if row['id']][:30]
    if command == 'models':
        try: installed = [item['id'] for item in console.models()['models']]
        except (OSError, ValueError): installed = []
        words = [['use ', 'Switch to a model (asks first)'], ['check ', 'Measure whether a model answers two at once'], ['pull ', 'Download a model (asks first)'], ['remove ', 'Move a model to the Trash (asks first)']]
        levels = [[f'use {name} {level}', f'{level} thinking'] for name in installed for level in models.LEVELS]
        return words + [[f'{verb} {name}', ''] for verb in ('use', 'check', 'remove') for name in installed] + levels
    return []


def guide(words):
    """harness/GUIDE.md, or its sections (## questions) that mention every word; else the list of questions (task 167)."""
    text, sections = guide_sections()
    topics = guide_topics()
    if not words:
        rows = [[f'/guide {topic}', heading] for topic, heading in topics]
        return {'guide': text}, view('Guide', kv(*rows), hint='/guide <words> for an answer · or ask in words')
    matches = lambda part: all(word.lower() in part.lower() for word in words)
    named = [section for (topic, _), section in zip(topics, sections) if len(words) == 1 and topic == words[0].lower()]
    found = named or [section for section in sections if matches(section.splitlines()[0])] or [section for section in sections if matches(section)]  # a topic, then questions
    if found:
        parts = [{'kind': 'prose', 'heading': section.splitlines()[0][3:] if len(found) > 1 else '', 'text': '\n'.join(section.splitlines()[1:]).strip()} for section in found]
        return {'sections': found}, view('Guide · ' + (found[0].splitlines()[0][3:].rstrip('?') if len(found) == 1 else ' '.join(words)), *parts, hint='Ask in words for more, or /guide for every topic')
    questions = [section.splitlines()[0][3:] for section in sections]
    return {'sections': [], 'questions': questions}, view('Guide', {'kind': 'lines', 'lines': [f"Nothing in the guide matches “{' '.join(words)}”. Its questions:", *['  ' + question for question in questions]]}, hint='/guide <words>')

def check_models(console, args):
    """/models check [name] [--all] [--force]: measure whether models answer two requests at once (plan 156 § 7)."""
    force = '--force' in args; names = [arg for arg in args if not arg.startswith('--')]
    if console.queue('running'): raise ValueError('Pi is working on a request; check when the queue is idle, so the measurement does not slow it down.')
    if '--all' in args: targets = list(capability.keys()) if force else capability.missing(console.data)
    else: targets = names or [models.current(console.data, console.config()['values']['effort'])['model']]
    results, lines = {}, []
    for name in targets:
        verdict = capability.known(console.data, name)
        if verdict != 'unknown' and not force:
            results[name] = capability.stored(console.data)[name]; lines.append(f'{name}: {verdict} (already measured; --force measures again)'); continue
        result = capability.check(console.data, name); results[name] = result
        lines.append(f"{name}: {result['verdict']} · overlap {result['overlap']:.0%} · {result['alone_tps']} tok/s alone · {result['combined_x']}x with two at once · Ollama {result['ollama']}, OLLAMA_NUM_PARALLEL={result['num_parallel']}")
    if not targets: lines.append('Every installed model is measured. --force measures them again.')
    if any(result.get('num_parallel') in ('default', '1') for result in results.values()):
        lines.append('Note: with OLLAMA_NUM_PARALLEL at 1 (or the default) a model can only answer one request at a time.')
    return results, view('Models · at once', {'kind': 'lines', 'lines': lines}, hint='/models')

def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    complete = '--complete' in argv; raw = '--json' in argv; yes = '--yes' in argv; as_view = '--view' in argv; argv = [arg for arg in argv if arg not in ('--json', '--yes', '--view', '--complete')]  # --view: the view for terminal Pi's renderer
    data = os.getenv('PI_AGENT_DATA', str(Path.home() / 'pi-local-harness-data')); web = os.getenv('PI_WEB_PORT')
    for flag in ('--data', '--web'):
        if flag in argv:
            index = argv.index(flag); value = argv[index + 1] if index + 1 < len(argv) else ''
            if flag == '--data': data = value
            else: web = value
            del argv[index:index + 2]
    command, args = (argv[0], argv[1:]) if argv else ('harness', [])
    console = Console(data, int(web) if web and str(web).isdigit() else None)
    if complete: print(json.dumps(completions(console, command.lstrip('/')), ensure_ascii=False)); return 0
    import shutil
    try: value, shape = build(console, command.lstrip('/'), args, yes); text = terminal.plain(shape, shutil.get_terminal_size((80, 24)).columns)
    except LookupError as error: print(error, file=sys.stderr); return 2
    except ValueError as error: print(error, file=sys.stderr); return 1
    if isinstance(value, dict) and value.get('confirm'):  # exit 3: the person must say yes first
        print(json.dumps(value, ensure_ascii=False, indent=2) if raw else json.dumps({**shape, 'preview': value}, ensure_ascii=False) if as_view else f"{value['title']}\n{value['detail']}\nRun again with --yes to apply.")
        return 3
    print(json.dumps(value, ensure_ascii=False, indent=2, default=str) if raw else json.dumps(shape, ensure_ascii=False) if as_view else text)
    return 0


if __name__ == '__main__':
    sys.exit(main())
