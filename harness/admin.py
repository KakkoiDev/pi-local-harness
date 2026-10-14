"""The harness console's backend (plan 158, task 159): the harness's state as plain data.

One function per question, used by three doors: slash commands in terminal Pi (harness/extension.mjs runs
`python3 -m harness.admin <command> --json`), tools the model can call, and scripts. Reads come from the running
services when their port is known (live queue) and from the data folder otherwise. Nothing here changes anything yet:
changes come in a later phase, each with a confirmation by the person, a backup and a log line (plan 158 § 5).

    python3 -m harness.admin help
    python3 -m harness.admin gate 20 blocked --json
"""
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

from harness import capability, model as models
from harness.documents import DocumentStore
from harness.markdown_records import read_record

ROOT = Path(__file__).resolve().parents[1]
DEFAULTS = {'effort': 'high', 'gate_port': 8000, 'web_port': 3000, 'whisper_model': 'mlx-community/whisper-base-mlx',
            'remote_hosts': [], 'remote_users': [], 'auto_update': True}  # as plh.py's DEFAULTS
EXPLAIN = {
    'effort': 'Default thinking level when none is chosen in the menu bar (off … max).',
    'gate_port': 'Port of Gate, the command checker (0 picks a free one).',
    'web_port': 'Port of the web workbench on 127.0.0.1.',
    'whisper_model': 'Speech-to-text model for voice input (Whisper, MLX).',
    'remote_hosts': 'Tailnet host names allowed to open the web UI from a phone (tailscale serve).',
    'remote_users': 'Tailscale logins allowed with those hosts.',
    'auto_update': 'Update the installed build when plh starts.',
    'model': 'Pinned in harness/model.json; must not be set here.',
}
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
        try: saved = json.loads((self.data / 'config.json').read_text())
        except (OSError, ValueError): saved = {}
        values = {**DEFAULTS, **saved}
        return {'path': str(self.data / 'config.json'), 'values': values, 'explain': {key: EXPLAIN.get(key, 'Not a harness setting.') for key in values}}

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
        return [row for row in rows if not state or row['status'] == {'waiting': 'queued'}.get(state, state)]

    def job(self, identifier):
        if not re.fullmatch(r'[0-9a-f]{32}', str(identifier)): raise ValueError('A request id is 32 hexadecimal characters (see /queue)')
        path = self.data / 'activity' / f'{identifier}.md'
        if not path.exists(): raise ValueError(f'No request {identifier} in Activity')
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
        def check(name, ok, detail, fix=''):
            checks.append({'check': name, 'ok': bool(ok), 'detail': detail, 'fix': '' if ok else fix})
        check('Data folder', self.data.is_dir() and os.access(self.data, os.W_OK), str(self.data), f'Create {self.data} or set PI_AGENT_DATA.')
        try:
            values = self.config()['values']; problem = None
            if 'model' in json.loads((self.data / 'config.json').read_text() or '{}'): problem = "remove 'model': the model is pinned in harness/model.json"
            elif values['effort'] not in models.EFFORTS: problem = f"effort must be one of {', '.join(models.EFFORTS)}"
        except (OSError, ValueError) as error: problem = f'cannot read it: {error}'
        check('Settings', not problem, problem or 'config.json is valid', f'Fix config.json: {problem}.')
        version = self.ollama('/api/version')
        check('Ollama', version is not None, f"{models.ollama_url()} {'answers, version ' + version.get('version', '?') if version else 'does not answer'}", 'Start the Ollama app (or check PI_OLLAMA_URL).')
        if version is not None:
            info = self.models(); chosen = info['choice']['model']
            check('Chosen model', any(item['id'] == chosen for item in info['models']), f'{chosen}', f'Install it (ollama pull {chosen}) or choose another model in the menu bar.')
        lock = self.data / '.agent-lock'
        if lock.exists():
            try: pid = json.loads(lock.read_text()).get('pid'); os.kill(int(pid), 0); alive = True
            except ProcessLookupError: alive = False
            except (OSError, ValueError, TypeError): alive = True
            check('Agent lock', alive, f'held by process {pid}' if alive else f'left by process {pid}, which is gone', f'Remove the stale lock: {lock}')
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
        """A config.json value from what was typed, or a ValueError that says what is allowed."""
        if key == 'model': raise ValueError('The model is pinned in harness/model.json; choose another one with /models use <name>.')
        if key not in DEFAULTS: raise ValueError(f"Unknown setting {key}. Settings: {', '.join(DEFAULTS)}.")
        try: value = json.loads(raw)
        except ValueError: value = raw
        if key == 'effort' and value not in models.EFFORTS: raise ValueError(f"effort must be one of {', '.join(models.EFFORTS)}.")
        if key.endswith('_port') and (not isinstance(value, int) or isinstance(value, bool) or not 0 <= value <= 65535): raise ValueError(f'{key} must be a port number from 0 to 65535.')
        if key in ('remote_hosts', 'remote_users') and (not isinstance(value, list) or not all(isinstance(item, str) and re.fullmatch(r'[\w.@+-]+', item) for item in value)):
            raise ValueError(f'{key} must be a list of bare names, e.g. ["mini.example.ts.net"] or ["you@example.com"].')
        if key == 'auto_update' and not isinstance(value, bool): raise ValueError('auto_update must be true or false.')
        if key == 'whisper_model' and (not isinstance(value, str) or not value): raise ValueError('whisper_model must be a model name.')
        return value

    def set_config(self, key, raw, yes=False):
        value = self.setting(key, raw); path = self.data / 'config.json'
        try: saved = json.loads(path.read_text())
        except (OSError, ValueError): saved = {}
        before = {**DEFAULTS, **saved}.get(key)
        detail = f'{key}: {json.dumps(before)} → {json.dumps(value)} in {path}'.replace('"', '') if isinstance(value, str) else f'{key}: {json.dumps(before)} → {json.dumps(value)} in {path}'
        if not yes: return {'confirm': True, 'title': f'Change {key}?', 'detail': detail + '\n' + EXPLAIN[key] + '\nApplies the next time plh starts.'}
        backup = self.backup(path)
        temporary = path.with_suffix('.tmp'); temporary.write_text(json.dumps({**saved, key: value}, indent=2) + '\n'); temporary.replace(path)
        self.log(command=f'config set {key} {raw}', file=str(path), backup=backup, before=before, after=value)
        return {'changed': True, 'detail': detail}

    def choose_model(self, name, effort=None, yes=False):
        installed = self.models()
        if not installed['ollama']: raise ValueError(f'Ollama does not answer at {models.ollama_url()}, so the model cannot be checked. Start the Ollama app first.')
        found = next((item for item in installed['models'] if item['id'] == name), None)
        if not found: raise ValueError(f"{name} is not installed. Installed: {', '.join(item['id'] for item in installed['models'])}.")
        if not found['tools']: raise ValueError(f'{name} cannot use tools, which Pi needs.')
        if effort is not None and effort not in models.EFFORTS: raise ValueError(f"The thinking level must be one of {', '.join(models.EFFORTS)}.")
        before = installed['choice']; after = {**before, 'model': name, **({'effort': effort} if effort else {})}
        detail = f"{before['model']} · {before['effort']} → {after['model']} · {after['effort']}. Ollama unloads the previous model, so only one is in memory."
        if not yes: return {'confirm': True, 'title': f'Switch to {name}?', 'detail': detail}
        path = models.choice_path(self.data); backup = self.backup(path)
        if self.web('/api/config') is not None:  # the running workbench switches and waits until the model answers
            for route, body in [('/api/model', {'model': name}), *([('/api/effort', {'effort': effort})] if effort else [])]:
                request = urllib.request.Request(f'http://127.0.0.1:{self.web_port}{route}', json.dumps(body).encode(), {'Content-Type': 'application/json'})
                with urllib.request.urlopen(request, timeout=600) as response: response.read()
        else:
            models.save(self.data, model=name, effort=after['effort']); models.switch(before['model'], name)
        self.log(command=f"models use {name}" + (f' {effort}' if effort else ''), file=str(path), backup=backup, before=before, after=after)
        return {'changed': True, 'detail': detail}

    def undo(self, yes=False):
        history = self.history(); undone = {entry.get('undoes') for entry in history}
        last = next((entry for entry in reversed(history) if (entry.get('backup') is not None or entry.get('ollama')) and 'undoes' not in entry and entry.get('id') not in undone), None)
        if not last: raise ValueError('Nothing to undo: no change with a backup in admin-log.jsonl.')
        detail = f"Undo “{last['command']}” ({last['time']}): " + (f"restore {last['file']} from {last['backup']}." if last['backup'] else f"{last['file']} did not exist before; it moves to the backups folder.")
        if last.get('ollama'): detail = f"Undo “{last['command']}” ({last['time']}): {last['ollama']} back to {last['before'] if last['before'] not in (None, '') else 'default'}; Ollama restarts."
        if not yes: return {'confirm': True, 'title': 'Undo the last change?', 'detail': detail}
        if last.get('ollama'):  # Ollama: write the old value back (not the whole file: the app may have changed others)
            self.idle(); restart_ollama_app(between=lambda: self.write_ollama(last['ollama'], last['before']))
        elif last['backup']: Path(last['file']).write_bytes(Path(last['backup']).read_bytes())
        elif Path(last['file']).exists():  # the change created the file: set it aside, never delete it
            folder = self.data / 'backups'; folder.mkdir(exist_ok=True)
            Path(last['file']).rename(folder / f"{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}-{Path(last['file']).name}.undone")
        self.log(command=f"undo {last['command']}", file=last['file'], undoes=last.get('id'), before=last['after'], after=last['before'])
        return {'changed': True, 'detail': detail}

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
        detail = f"{key}: {before if before not in (None, '', 0) else 'default'} → {value}\n{about}\nPi Workbench restarts Ollama so it reads the new value; a loaded model unloads."
        if not yes: return {'confirm': True, 'title': f'Change Ollama’s {key}?', 'detail': detail}
        self.idle()
        backup = self.backup(OLLAMA_SETTINGS) if where == 'db' else None
        restart_ollama_app(between=lambda: self.write_ollama(key, value))
        self.log(command=f'ollama set {key} {raw}', ollama=key, file=str(OLLAMA_SETTINGS) if where == 'db' else name, backup=backup, before=before, after=value)
        return {'changed': True, 'detail': detail.split('\n')[0]}

    def restart_ollama(self, yes=False):
        if not yes: return {'confirm': True, 'title': 'Restart Ollama?', 'detail': 'Quits and reopens the Ollama app; a loaded model unloads.'}
        self.idle(); restart_ollama_app(); self.log(command='ollama restart')
        return {'changed': True, 'detail': 'Ollama restarted.'}

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
        if not yes: return {'confirm': True, 'title': f'Remove {name}?', 'detail': detail}
        self.idle()
        staging = folder / f"Removed model {name.replace('/', ' ').replace(':', ' ')} {datetime.now().strftime('%Y-%m-%d %H%M%S')}"
        for source in [manifest, *blobs]:
            target = staging / source.relative_to(folder); target.parent.mkdir(parents=True, exist_ok=True); source.rename(target)
        (staging / 'README.txt').write_text(f'{name}, removed from {folder} by the Pi Workbench console.\nTo bring it back, move manifests/ and blobs/ from this folder into {folder} (merge the folders).\n')
        to_trash(staging)
        self.log(command=f'models remove {name}', trash=staging.name, files=len(blobs), bytes=size)
        return {'changed': True, 'detail': detail}

    def pull_model(self, name, yes=False):
        if not re.fullmatch(r'[\w./-]+(:[\w.-]+)?', name): raise ValueError('A model name looks like qwen3:8b or library/qwen3:8b.')
        detail = f"Downloads {name} from ollama.com into {self.ollama_info()['models_folder']}. Large models are many GB; this can take a while."
        if not yes: return {'confirm': True, 'title': f'Pull {name}?', 'detail': detail}
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
        return {'changed': True, 'detail': f'{name} is installed.'}

# -- the command line ----------------------------------------------------------------------------------------------
# name: (usage, what it does). harness/CONSOLE.md documents each one; tests/test_admin.py checks that it does.
COMMANDS = {
    'harness': ('', 'What the harness is and the commands it offers.'),
    'status': ('', 'Services, model, queue and Gate counts, data folder, build.'),
    'queue': ('[running|waiting|failed|stopped|interrupted|completed]', 'Requests in Activity.'),
    'job': ('<id>', 'The Markdown record of one request.'),
    'gate': ('[n] [blocked] [why <id>]', 'Gate checks, newest first; why <id> explains one.'),
    'models': ('[use <name> [effort]] [check [name] [--all] [--force]] [pull <name>] [remove <name>]', 'Installed models; use, pull and remove ask first (remove goes to the Trash); check measures two at once.'),
    'ollama': ('[set <key> <value>] [restart]', 'Ollama: version, models folder, parallel slots, context, keep-alive; set and restart ask first.'),
    'projects': ('', 'Projects and their folders.'),
    'config': ('[set <key> <value>]', 'config.json with each key explained; set changes one (asks first).'),
    'paths': ('', 'Where the harness keeps its data.'),
    'doctor': ('', 'Checks with what is wrong and what to do.'),
    'undo': ('', 'Undo the last change made from the console (asks first).'),
}


def table(rows, columns):
    if not rows: return '(none)'
    widths = {column: min(60, max(len(column), *(len(str(row.get(column, ''))) for row in rows))) for column in columns}
    cut = lambda value, width: value if len(value) <= width else value[:width - 1] + '…'
    lines = ['  '.join(column.upper().ljust(widths[column]) for column in columns)]
    lines += ['  '.join(cut(str(row.get(column, '') if row.get(column) is not None else ''), widths[column]).ljust(widths[column]) for column in columns) for row in rows]
    return '\n'.join(line.rstrip() for line in lines)


def run(console, command, args, yes=False):
    """(data, text) for a command: data for --json and tools, text for people. A change without yes returns its
    preview ({confirm: True, title, detail}) and changes nothing."""
    def changed(value):
        return value, (value['detail'] if value.get('confirm') else 'Done. ' + value['detail'] + '\n/undo restores the previous value.')
    if command in ('harness', 'help'):
        text = 'Pi Workbench harness console. Commands (type them with a slash in terminal Pi):\n' + '\n'.join(f'  /{name} {usage}'.rstrip().ljust(52) + f' {about}' for name, (usage, about) in COMMANDS.items())
        return {name: about for name, (_, about) in COMMANDS.items()}, text + '\nRaw data: add --json to any command when running python3 -m harness.admin.'
    if command == 'status':
        value = console.status(); queue = value['queue']
        return value, '\n'.join([
            f"Web workbench: {'running on 127.0.0.1:' + str(value['services']['web_port']) if value['services']['web'] else 'not running'}",
            f"Model: {value['model']['model']} · {value['model']['effort']} thinking · Ollama {'answers' if value['ollama'] else 'does not answer'}",
            f"Queue: {queue['running']} running · {queue['queued']} waiting · {queue['failed'] + queue['stopped'] + queue['interrupted']} need attention · {queue['completed']} completed",
            f"Gate today: {value['gate_today']['checks']} checks · {value['gate_today']['blocked']} not allowed",
            f"Projects: {value['projects']} · Data: {value['data']} · Build: {value['build']}"])
    if command == 'queue':
        rows = console.queue(args[0] if args else None)
        return rows, table(rows, ['status', 'created', 'project', 'message', 'id'])
    if command == 'job':
        if not args: raise ValueError('Usage: /job <id> (ids are in /queue)')
        value = console.job(args[0]); return value, value['markdown']
    if command == 'gate':
        if args[:1] == ['why']:
            if len(args) < 2: raise ValueError('Usage: /gate why <id>')
            event = console.gate_event(args[1])
            return event, '\n'.join(f'{key}: {json.dumps(value, ensure_ascii=False) if isinstance(value, (dict, list)) else value}' for key, value in event.items())
        n = next((int(arg) for arg in args if arg.isdigit()), 20)
        rows = console.gate(n, blocked='blocked' in args)
        shown = [{**row, 'time': str(row.get('timestamp', ''))[11:19], 'command': row.get('args', {}).get('command') or row.get('args', {}).get('path') or ''} for row in rows]
        return rows, table(shown, ['id', 'time', 'phase', 'outcome', 'source', 'command', 'reason'])
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
        if not value['ollama']: return value, f"Ollama does not answer at {models.ollama_url()}. Chosen: {value['choice']['model']}."
        rows = [{'model': ('* ' if item['chosen'] else '  ') + item['id'], 'tools': 'yes' if item['tools'] else 'no', 'thinks': 'yes' if item['thinking'] else 'no',
                 'sees': 'yes' if item['vision'] else 'no', 'at once': item['at_once'], 'size': f"{item['size'] / 1e9:.1f} GB"} for item in value['models']]
        return value, table(rows, ['model', 'tools', 'thinks', 'sees', 'at once', 'size']) + '\n* chosen · at once: whether it answers two requests at the same time (/models check)'
    if command == 'ollama':
        value = console.ollama_info()
        return value, '\n'.join(f'{key}: {value[key]}' for key in ['url', 'running', 'version', 'models_folder', 'num_parallel', 'loaded'])
    if command == 'projects':
        rows = console.projects()
        return rows, table([{**row, 'state': 'folder missing' if row.get('missing') else ''} for row in rows], ['name', 'path', 'state', 'id'])
    if command == 'config' and args[:1] == ['set']:
        if len(args) < 3: raise ValueError('Usage: /config set <key> <value>')
        return changed(console.set_config(args[1], ' '.join(args[2:]), yes))
    if command == 'undo':
        return changed(console.undo(yes))
    if command == 'config':
        value = console.config()
        return value, f"{value['path']}\n" + '\n'.join(f"{key}: {json.dumps(item)}\n    {value['explain'][key]}" for key, item in value['values'].items())
    if command == 'paths':
        value = console.paths(); return value, '\n'.join(f'{key}: {path}' for key, path in value.items())
    if command == 'doctor':
        rows = console.doctor()
        return rows, '\n'.join(f"{'ok ' if row['ok'] else 'NO '} {row['check']}: {row['detail']}" + ('' if row['ok'] else f"\n     → {row['fix']}") for row in rows)
    raise LookupError(f'Unknown command: {command}. Type /harness for the list.')


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
    return results, '\n'.join(lines)

def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    raw = '--json' in argv; yes = '--yes' in argv; argv = [arg for arg in argv if arg not in ('--json', '--yes')]
    data = os.getenv('PI_AGENT_DATA', str(Path.home() / 'pi-local-harness-data')); web = os.getenv('PI_WEB_PORT')
    for flag in ('--data', '--web'):
        if flag in argv:
            index = argv.index(flag); value = argv[index + 1] if index + 1 < len(argv) else ''
            if flag == '--data': data = value
            else: web = value
            del argv[index:index + 2]
    command, args = (argv[0], argv[1:]) if argv else ('harness', [])
    console = Console(data, int(web) if web and str(web).isdigit() else None)
    try: value, text = run(console, command.lstrip('/'), args, yes)
    except LookupError as error: print(error, file=sys.stderr); return 2
    except ValueError as error: print(error, file=sys.stderr); return 1
    if isinstance(value, dict) and value.get('confirm'):  # exit 3: the person must say yes first
        print(json.dumps(value, ensure_ascii=False, indent=2) if raw else f"{value['title']}\n{value['detail']}\nRun again with --yes to apply.")
        return 3
    print(json.dumps(value, ensure_ascii=False, indent=2, default=str) if raw else text)
    return 0


if __name__ == '__main__':
    sys.exit(main())
