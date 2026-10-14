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
from datetime import datetime
from pathlib import Path

from harness import model as models
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
        for item in installed: item['chosen'] = item['id'] == choice['model']
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


# -- the command line ----------------------------------------------------------------------------------------------
# name: (usage, what it does). harness/CONSOLE.md documents each one; tests/test_admin.py checks that it does.
COMMANDS = {
    'harness': ('', 'What the harness is and the commands it offers.'),
    'status': ('', 'Services, model, queue and Gate counts, data folder, build.'),
    'queue': ('[running|waiting|failed|stopped|interrupted|completed]', 'Requests in Activity.'),
    'job': ('<id>', 'The Markdown record of one request.'),
    'gate': ('[n] [blocked] [why <id>]', 'Gate checks, newest first; why <id> explains one.'),
    'models': ('', 'Installed models: tools, thinking, vision, size; the chosen one.'),
    'ollama': ('', 'Ollama: version, models folder, parallel slots, loaded models.'),
    'projects': ('', 'Projects and their folders.'),
    'config': ('', 'config.json with each key explained (Pi has its own /settings).'),
    'paths': ('', 'Where the harness keeps its data.'),
    'doctor': ('', 'Checks with what is wrong and what to do.'),
}


def table(rows, columns):
    if not rows: return '(none)'
    widths = {column: min(60, max(len(column), *(len(str(row.get(column, ''))) for row in rows))) for column in columns}
    cut = lambda value, width: value if len(value) <= width else value[:width - 1] + '…'
    lines = ['  '.join(column.upper().ljust(widths[column]) for column in columns)]
    lines += ['  '.join(cut(str(row.get(column, '') if row.get(column) is not None else ''), widths[column]).ljust(widths[column]) for column in columns) for row in rows]
    return '\n'.join(line.rstrip() for line in lines)


def run(console, command, args):
    """(data, text) for a command: data for --json and tools, text for people."""
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
    if command == 'models':
        value = console.models()
        if not value['ollama']: return value, f"Ollama does not answer at {models.ollama_url()}. Chosen: {value['choice']['model']}."
        rows = [{'model': ('* ' if item['chosen'] else '  ') + item['id'], 'tools': 'yes' if item['tools'] else 'no', 'thinks': 'yes' if item['thinking'] else 'no',
                 'sees': 'yes' if item['vision'] else 'no', 'size': f"{item['size'] / 1e9:.1f} GB"} for item in value['models']]
        return value, table(rows, ['model', 'tools', 'thinks', 'sees', 'size']) + '\n* chosen'
    if command == 'ollama':
        value = console.ollama_info()
        return value, '\n'.join(f'{key}: {value[key]}' for key in ['url', 'running', 'version', 'models_folder', 'num_parallel', 'loaded'])
    if command == 'projects':
        rows = console.projects()
        return rows, table([{**row, 'state': 'folder missing' if row.get('missing') else ''} for row in rows], ['name', 'path', 'state', 'id'])
    if command == 'config':
        value = console.config()
        return value, f"{value['path']}\n" + '\n'.join(f"{key}: {json.dumps(item)}\n    {value['explain'][key]}" for key, item in value['values'].items())
    if command == 'paths':
        value = console.paths(); return value, '\n'.join(f'{key}: {path}' for key, path in value.items())
    if command == 'doctor':
        rows = console.doctor()
        return rows, '\n'.join(f"{'ok ' if row['ok'] else 'NO '} {row['check']}: {row['detail']}" + ('' if row['ok'] else f"\n     → {row['fix']}") for row in rows)
    raise LookupError(f'Unknown command: {command}. Type /harness for the list.')


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    raw = '--json' in argv; argv = [arg for arg in argv if arg != '--json']
    data = os.getenv('PI_AGENT_DATA', str(Path.home() / 'pi-local-harness-data')); web = os.getenv('PI_WEB_PORT')
    for flag in ('--data', '--web'):
        if flag in argv:
            index = argv.index(flag); value = argv[index + 1] if index + 1 < len(argv) else ''
            if flag == '--data': data = value
            else: web = value
            del argv[index:index + 2]
    command, args = (argv[0], argv[1:]) if argv else ('harness', [])
    console = Console(data, int(web) if web and str(web).isdigit() else None)
    try: value, text = run(console, command.lstrip('/'), args)
    except LookupError as error: print(error, file=sys.stderr); return 2
    except ValueError as error: print(error, file=sys.stderr); return 1
    print(json.dumps(value, ensure_ascii=False, indent=2, default=str) if raw else text)
    return 0


if __name__ == '__main__':
    sys.exit(main())
