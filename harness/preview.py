"""The preview (plan 198, design/briefs/app-preview.md): the harness runs each project's app on a free local port so the
person sees it beside the chat. A project on the stack runs with uvicorn --reload (it follows Pi's edits by itself); a
plain site (index.html at the top) is served as files. The app's output goes to <data>/previews/<project>.log; when
the app stops by itself, its last lines say why."""
import os
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
START_LIMIT = 120  # seconds: the first start of a stack project installs its packages with uv


def run_command(folder, port):
    """How this project's app runs, or None when it has no app to show."""
    folder = Path(folder)
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


def free_port():
    with socket.socket() as probe:
        probe.bind(('127.0.0.1', 0)); return probe.getsockname()[1]


def answers(port):
    try:
        with socket.create_connection(('127.0.0.1', port), timeout=0.5): return True
    except OSError: return False


class App:
    def __init__(self, process, port, log):
        self.process, self.port, self.log, self.state, self.error = process, port, log, 'starting', ''


class Previews:
    def __init__(self, folder, command=run_command, limit=START_LIMIT):
        self.folder, self.command, self.limit = Path(folder), command, limit
        self.apps, self.lock = {}, threading.RLock()

    def status(self, project):
        with self.lock: app = self.apps.get(project)
        if not app: return {'state': 'none'}
        return {'state': app.state, 'port': app.port, 'url': f'http://127.0.0.1:{app.port}/', **({'error': app.error} if app.error else {})}

    def start(self, project, folder):
        with self.lock:
            app = self.apps.get(project)
            if app and app.state in ('starting', 'running'): return self.status(project)
            port = free_port(); command = self.command(folder, port)
            if not command: return {'state': 'none', 'message': 'This project has no app to show yet.'}
            self.folder.mkdir(parents=True, exist_ok=True)
            log = self.folder / f'{project}.log'
            env = {key: value for key, value in os.environ.items() if not key.startswith(('PI_', 'VIRTUAL_ENV'))}
            env.update(TAILWINDCSS_VERSION=TAILWIND, TAILWINDCSS_BIN_DIR=str(self.folder.parent / 'toolchain' / 'tailwindcss'))
            with log.open('w', encoding='utf-8') as output:
                process = subprocess.Popen(command, cwd=folder, env=env, stdout=output, stderr=subprocess.STDOUT, stdin=subprocess.DEVNULL, start_new_session=True)
            self.apps[project] = app = App(process, port, log)
        threading.Thread(target=self.watch, args=(app,), daemon=True).start()
        return self.status(project)

    def watch(self, app):
        """Running once the port answers; stopped, with the last lines, when the process ends by itself."""
        deadline = time.monotonic() + self.limit
        while app.process.poll() is None:
            if app.state == 'starting' and answers(app.port): app.state = 'running'
            if app.state == 'starting' and time.monotonic() > deadline:
                app.error = f'The app did not answer within {self.limit} seconds.'; self.end(app); break
            time.sleep(0.1)
        if app.state != 'none':
            lines = [line for line in app.log.read_text(encoding='utf-8', errors='replace').splitlines() if line.strip()]
            app.state, app.error = 'stopped', app.error or '\n'.join(lines[-8:]) or f'The app ended (exit code {app.process.returncode}).'

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
        if app: app.state = 'none'; self.end(app)
        return {'state': 'none'}

    def close(self):
        for project in list(self.apps): self.stop(project)
