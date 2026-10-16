"""The preview (plan 198, design/briefs/app-preview.md): the harness runs each project's app on a free local port so the
person sees it beside the chat. A project on the stack runs with uvicorn --reload (it follows Pi's edits by itself); a
plain site (index.html at the top) is served as files. The app's output goes to <data>/previews/<project>.log; when
the app stops by itself, its last lines say why."""
import http.client
import os
import re
from pathlib import Path
import shlex
import shutil
import socket
import subprocess
import sys
import threading
import time

# plh may start at login with a short PATH: find uv where its installers put it.
UV = shutil.which('uv') or next((str(path) for path in (Path.home() / '.local/bin/uv', Path.home() / '.cargo/bin/uv', Path('/opt/homebrew/bin/uv')) if path.is_file()), 'uv')
TAILWIND = 'v4.3.3'  # kit/toolchain.json; one copy for every project, in <data>/toolchain
START_LIMIT = 120
CRASHED = re.compile(r'\b\w*(Error|Exception)\b|^Traceback')  # the app's last line says it crashed  # seconds: the first start of a stack project installs its packages with uv


def run_command(folder, port):
    """How this project's app runs, or None when it has no app to show."""
    folder = Path(folder)
    if (folder / 'pyproject.toml').is_file() and (folder / 'app' / 'tui.py').is_file() and (folder / 'serve.py').is_file():
        return [UV, 'run', 'python', str(Path(__file__).with_name('terminal-preview.py')), str(port)]  # a terminal app (kit/starter-tui): in the browser through textual-serve
    if (folder / 'pyproject.toml').is_file() and (folder / 'app' / 'main.py').is_file():
        server = [UV, 'run', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', str(port)]
        if not (folder / 'styles' / 'input.css').is_file(): return server
        # The stack's styles: Tailwind rebuilds static/app.css as templates change, in the same process group as the server.
        styles = [UV, 'run', 'tailwindcss', '-i', 'styles/input.css', '-o', 'static/app.css']
        return ['/bin/sh', '-c', f"{shlex.join(styles)} && {{ {shlex.join([*styles, '--watch=always'])} & exec {shlex.join(server)}; }}"]
    if (folder / 'index.html').is_file():
        files = [sys.executable, '-m', 'http.server', str(port), '--bind', '127.0.0.1']
        if not (folder / 'styles' / 'input.css').is_file(): return files
        # An app with no server (kit/starter-static): the same Tailwind build and watch, then the files.
        styles = [UV, 'tool', 'run', '--from', 'pytailwindcss', 'tailwindcss', '-i', 'styles/input.css', '-o', 'static/app.css']
        return ['/bin/sh', '-c', f"{shlex.join(styles)} && {{ {shlex.join([*styles, '--watch=always'])} & exec {shlex.join(files)}; }}"]
    return None


def what_it_is(folder):
    """A project with no app, in a few words (P_NotWeb): None when it is just empty."""
    folder = Path(folder)
    if (folder / 'pyproject.toml').is_file() or any(folder.glob('*.py')): return 'a Python program'
    if (folder / 'package.json').is_file(): return 'a JavaScript project'
    if (folder / 'Cargo.toml').is_file(): return 'a Rust program'
    if (folder / 'go.mod').is_file(): return 'a Go program'
    return None


def no_app(folder):
    kind = what_it_is(folder) if folder else None
    if not kind: return {'state': 'none', 'kind': 'empty', 'message': 'This project has no app to show yet.'}
    return {'state': 'none', 'kind': 'notweb', 'message': f'{Path(folder).name} is not a web app: it is {kind}, so there is no page to show here. Its tests run in Activity.'}


def free_port():
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0)); return probe.getsockname()[1]


def answers(port, timeout=2):
    """A page comes back (any status). An open port is not enough: with --reload, uvicorn's reloader keeps the port
    while the app inside has crashed, and every page hangs."""
    try:
        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=timeout)
        connection.request('GET', '/'); connection.getresponse().read(); connection.close()
        return True
    except (OSError, http.client.HTTPException): return False


PHONE_PORT = 8443  # the app's own tailnet address while it runs (P_OnPhone); one app at a time


def tailnet_serve(port, https):
    from harness.services import tailscale_serve
    return tailscale_serve(port, https=https)


class App:
    def __init__(self, process, port, log, first=False):
        self.process, self.port, self.log, self.state, self.error, self.first, self.note = process, port, log, 'starting', '', first, None
        self.phone, self.phone_url = None, ''
        self.terminal=False


class Previews:
    def __init__(self, folder, command=run_command, limit=START_LIMIT, serve=tailnet_serve):
        self.folder, self.command, self.limit, self.serve = Path(folder), command, limit, serve
        self.apps, self.lock = {}, threading.RLock()

    def status(self, project, folder=None):
        """The state (none · starting · running · stopped) and what the Preview shows with it: while starting, whether it
        is the first start and the app's last line; when stopped, its last 8 lines; the note after a change."""
        with self.lock: app = self.apps.get(project)
        terminal=bool(folder and (Path(folder)/'app/tui.py').is_file() and (Path(folder)/'serve.py').is_file()) if not app else app.terminal
        extra={'terminal':True,'command':'python -m app.tui'} if terminal else {}
        if not app: return ({'state': 'none', 'kind': 'app',**extra} if self.command(folder, 0) else no_app(folder)) if folder else {'state': 'none'}
        found = {**extra,'state': app.state, 'port': app.port, 'url': f'http://127.0.0.1:{app.port}/', 'first': app.first}
        if app.state == 'starting':
            lines = [line for line in app.log.read_text(encoding='utf-8', errors='replace').splitlines() if line.strip()] if app.log.exists() else []
            if lines: found['last'] = lines[-1]
        if app.error: found['error'] = app.error
        if app.note and app.state == 'running': found['note'] = app.note
        if app.phone and app.phone.poll() is None: found['phone'] = app.phone_url
        return found

    def phone(self, project, host):
        """Open on Phone (P_OnPhone): the app on the tailnet while it runs, https://<host>:8443/ (tailscale serve). The
        workbench's own phone address (host) must be on: it is the same machine and the same Serve."""
        if not host: return {'problem': 'Phone access is off: the workbench is not on the tailnet (remote_hosts in config.json).'}
        with self.lock:
            app = self.apps.get(project)
            if not app or app.state != 'running': return {'problem': 'The app is not running. Start it in the Preview first.'}
            if app.phone and app.phone.poll() is None: return {'url': app.phone_url}
            for other in self.apps.values():
                if other is not app and other.phone: self.end_phone(other)
            process, problem = self.serve(app.port, PHONE_PORT)
            if not process: return {'problem': problem or 'Tailscale could not serve the app.'}
            app.phone, app.phone_url = process, f'https://{host}:{PHONE_PORT}/'
            return {'url': app.phone_url}

    @staticmethod
    def end_phone(app):
        if not app.phone: return
        app.phone.terminate()
        try: app.phone.wait(timeout=5)
        except subprocess.TimeoutExpired: app.phone.kill()
        app.phone, app.phone_url = None, ''

    def note(self, project, text):
        """"Pi changed 2 files. Reloaded." (P_Changed): the app reloads itself; the Preview says so, with the time."""
        with self.lock: app = self.apps.get(project)
        if app and app.state == 'running': app.note = {'text': text, 'time': time.strftime('%H:%M')}

    def start(self, project, folder):
        with self.lock:
            app = self.apps.get(project)
            if app and app.state in ('starting', 'running'): return self.status(project)
            if app and app.process.poll() is None: app.state = 'none'; self.end_phone(app); self.end(app)  # Start Again on an app that hangs under its reloader
            port = free_port(); command = self.command(folder, port)
            if not command: return no_app(folder)
            self.folder.mkdir(parents=True, exist_ok=True)
            log = self.folder / f'{project}.log'
            env = {key: value for key, value in os.environ.items() if not key.startswith(('PI_', 'VIRTUAL_ENV'))}
            from harness.autonomy import read
            language=read(self.folder.parent/'config.json',{}).get('language')
            if language in ('en','ja'):env['APP_LANG']=language
            env.update(TAILWINDCSS_VERSION=TAILWIND, TAILWINDCSS_BIN_DIR=str(self.folder.parent / 'toolchain' / 'tailwindcss'))
            with log.open('w', encoding='utf-8') as output:
                process = subprocess.Popen(command, cwd=folder, env=env, stdout=output, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, start_new_session=True)
            first = (Path(folder) / 'pyproject.toml').is_file() and not (Path(folder) / '.venv').exists()
            self.apps[project] = app = App(process, port, log, first)
            app.terminal=(Path(folder)/'app/tui.py').is_file() and (Path(folder)/'serve.py').is_file()
        threading.Thread(target=self.watch, args=(app,), daemon=True).start()
        return self.status(project)

    def last_lines(self, app):
        lines = [line for line in app.log.read_text(encoding='utf-8', errors='replace').splitlines() if line.strip()] if app.log.exists() else []
        return '\n'.join(lines[-8:])

    def watch(self, app):
        """Running once a page comes back. Stopped, with the last lines, when the process ends by itself, or when it
        keeps running but answers nothing (a crashed app under the reloader): then a fix brings it back by itself."""
        deadline, misses = time.monotonic() + self.limit, 0
        while app.process.poll() is None and app.state != 'none':
            if app.state == 'starting':
                lines = self.last_lines(app)
                if answers(app.port, 0.5): app.state, app.error = 'running', ''
                elif time.monotonic() > deadline: app.state, app.error = 'stopped', lines or f'The app did not answer within {self.limit} seconds.'
                elif time.monotonic() > deadline - self.limit + 3 and CRASHED.search(lines.rsplit('\n', 1)[-1]): app.state, app.error = 'stopped', lines  # it said why: no need to wait
                time.sleep(0.2); continue
            if answers(app.port): misses = 0; app.state, app.error = 'running', ''
            else:
                misses += 1
                if misses >= 2 and app.state == 'running': app.state, app.error = 'stopped', self.last_lines(app) or 'The app stopped answering.'
            time.sleep(2)
        if app.state != 'none':
            app.state, app.error = 'stopped', self.last_lines(app) or f'The app ended (exit code {app.process.returncode}).'

    @staticmethod
    def end(app):
        try: os.killpg(app.process.pid, 15)
        except (ProcessLookupError, PermissionError): pass
        try: app.process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            try: os.killpg(app.process.pid, 9)
            except (ProcessLookupError, PermissionError): pass
            app.process.wait(timeout=5)

    def stop(self, project):
        with self.lock: app = self.apps.pop(project, None)
        if app: app.state = 'none'; self.end_phone(app); self.end(app)
        return {'state': 'none'}

    def close(self):
        for project in list(self.apps): self.stop(project)
