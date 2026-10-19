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
        return [UV, 'run', '--offline', 'python', str(Path(__file__).with_name('terminal-preview.py')), str(port)]  # a terminal app (kit/starter-tui): in the browser through textual-serve
    if (folder / 'pyproject.toml').is_file() and (folder / 'app' / 'main.py').is_file():
        server = [UV, 'run', '--offline', 'uvicorn', 'app.main:app', '--reload', '--host', '127.0.0.1', '--port', str(port)]
        if not (folder / 'styles' / 'input.css').is_file(): return server
        # The stack's styles: Tailwind rebuilds static/app.css as templates change, in the same process group as the server.
        styles = [UV, 'run', '--offline', 'tailwindcss', '-i', 'styles/input.css', '-o', 'static/app.css']
        return ['/bin/sh', '-c', f"{shlex.join(styles)} && {{ {shlex.join([*styles, '--watch=always'])} & exec {shlex.join(server)}; }}"]
    if (folder / 'index.html').is_file():
        files = [sys.executable, '-I', str(Path(__file__).with_name('preview_files.py')), str(port)]  # task 304: never outside the project, no dot-paths, no listings, loopback Host only
        if not (folder / 'styles' / 'input.css').is_file(): return files
        # An app with no server (kit/starter-static): the same Tailwind build and watch, then the files.
        styles = [UV, 'tool', 'run', '--from', 'pytailwindcss', 'tailwindcss', '-i', 'styles/input.css', '-o', 'static/app.css']
        return ['/bin/sh', '-c', f"{shlex.join(styles)} && {{ {shlex.join([*styles, '--watch=always'])} & exec {shlex.join(files)}; }}"]
    return None


def packages_missing(folder):
    """Task 331: a project whose lock file lists packages that are not installed: the Preview waits for the person's
    Install Packages… (no second install path; `uv run --offline` never downloads)."""
    from harness.packages import missing
    found = missing(folder) if folder and (Path(folder) / 'pyproject.toml').is_file() else None
    if not found: return None
    return {'state': 'none', 'kind': 'packages', 'line': found['line'],
            'message': f"{Path(folder).name}'s packages aren't installed yet, so the app can't start. Install them once with Project › Install Packages…."}


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


HELPER = Path(__file__).with_name('theme-helper.js')
HELPER_PATH = '/__pi-workbench/theme.js'
HOP = {'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'trailers', 'transfer-encoding', 'upgrade'}


def inject(page):
    """The helper's script tag at the top of an HTML page: in <head>, else after <html> or the doctype (never before
    the doctype, which would put the page in quirks mode)."""
    tag = f'<script src="{HELPER_PATH}"></script>'.encode()
    for pattern in (rb'<head\b[^>]*>', rb'<html\b[^>]*>', rb'<!doctype[^>]*>'):
        found = re.search(pattern, page, re.I)
        if found: return page[:found.end()] + tag + page[found.end():]
    return tag + page


class Frame:
    """Task 312: what the Preview frame loads. The app is another origin, so the theme panel reaches it only by
    postMessage; this small proxy in front of the app adds the theme helper (harness/theme-helper.js) to its HTML pages
    and passes everything else through as it is. Only for the workbench's own frame: Open on Phone serves the app itself."""
    def __init__(self, port, origins):
        from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
        import json
        from harness.theme import ALLOWED
        helper = HELPER.read_text(encoding='utf-8').replace('__ORIGINS__', json.dumps(list(origins))).replace('__TOKENS__', json.dumps(list(ALLOWED))).encode()

        class Handler(BaseHTTPRequestHandler):
            protocol_version = 'HTTP/1.0'  # one response per connection: a stream (server-sent events) ends when the app's does
            def log_message(self, *args): pass
            def relay(self):
                from harness.preview_files import loopback
                if not loopback(self.headers.get('Host')): self.send_error(403, 'This preview answers only on this computer'); return  # task 304: no DNS rebinding
                if self.path.split('?', 1)[0] == HELPER_PATH:
                    self.send_response(200); self.send_header('Content-Type', 'text/javascript; charset=utf-8'); self.send_header('Content-Length', str(len(helper)))
                    self.send_header('Cache-Control', 'no-store'); self.send_header('X-Content-Type-Options', 'nosniff'); self.end_headers(); self.wfile.write(helper); return
                size = int(self.headers.get('Content-Length') or 0)
                body = self.rfile.read(size) if size > 0 else None
                headers = {key: value for key, value in self.headers.items() if key.lower() not in HOP | {'accept-encoding', 'content-length'}}  # plain bytes back, so the page can be read
                connection = http.client.HTTPConnection('127.0.0.1', port, timeout=300)
                try:
                    connection.request(self.command, self.path, body=body, headers=headers); response = connection.getresponse()
                except (OSError, http.client.HTTPException):
                    connection.close(); self.send_error(502, 'The app did not answer'); return
                try:
                    page = 'text/html' in (response.getheader('Content-Type') or '') and not response.getheader('Content-Encoding') and self.command != 'HEAD'
                    self.send_response_only(response.status, response.reason)
                    for key, value in response.getheaders():
                        if key.lower() not in HOP and not (page and key.lower() == 'content-length'): self.send_header(key, value)
                    if page:
                        content = inject(response.read()); self.send_header('Content-Length', str(len(content))); self.end_headers(); self.wfile.write(content); return
                    self.end_headers()
                    while chunk := response.read1(65536): self.wfile.write(chunk); self.wfile.flush()
                except (OSError, http.client.HTTPException): pass
                finally: connection.close()
            do_GET = do_POST = do_PUT = do_PATCH = do_DELETE = do_HEAD = do_OPTIONS = relay

        self.server = ThreadingHTTPServer(('127.0.0.1', 0), Handler); self.server.daemon_threads = True
        self.port = self.server.server_address[1]
        threading.Thread(target=self.server.serve_forever, daemon=True).start()

    def close(self):
        self.server.shutdown(); self.server.server_close()


PHONE_PORT = 8443  # the app's own tailnet address while it runs (P_OnPhone); one app at a time


def tailnet_serve(port, https):
    from harness.services import tailscale_serve
    return tailscale_serve(port, https=https)


class App:
    def __init__(self, process, port, log, first=False):
        self.process, self.port, self.log, self.state, self.error, self.first, self.note = process, port, log, 'starting', '', first, None
        self.phone, self.phone_url, self.guard = None, '', None  # task 304: the Tailscale user check in front of the app
        self.terminal=False
        self.frame=None  # the theme helper's proxy (Frame), for the workbench's own Preview frame


class Previews:
    def __init__(self, folder, command=run_command, limit=START_LIMIT, serve=tailnet_serve, origins=()):
        self.folder, self.command, self.limit, self.serve = Path(folder), command, limit, serve
        self.origins = tuple(origins)  # task 312: the workbench page's origins; with them the frame loads through Frame
        self.apps, self.lock = {}, threading.RLock()

    def status(self, project, folder=None):
        """The state (none · starting · running · stopped) and what the Preview shows with it: while starting, whether it
        is the first start and the app's last line; when stopped, its last 8 lines; the note after a change."""
        with self.lock: app = self.apps.get(project)
        terminal=bool(folder and (Path(folder)/'app/tui.py').is_file() and (Path(folder)/'serve.py').is_file()) if not app else app.terminal
        extra={'terminal':True,'command':'python -m app.tui'} if terminal else {}
        if not app and folder and self.command(folder, 0) and packages_missing(folder): return {**packages_missing(folder), **extra}
        if not app: return ({'state': 'none', 'kind': 'app',**extra} if self.command(folder, 0) else no_app(folder)) if folder else {'state': 'none'}
        found = {**extra,'state': app.state, 'port': app.port, 'url': f'http://127.0.0.1:{app.frame.port if app.frame else app.port}/', 'first': app.first}
        if app.state == 'starting':
            lines = [line for line in app.log.read_text(encoding='utf-8', errors='replace').splitlines() if line.strip()] if app.log.exists() else []
            if lines: found['last'] = lines[-1]
        if app.error: found['error'] = app.error
        if app.note and app.state == 'running': found['note'] = app.note
        if app.phone and app.phone.poll() is None: found['phone'] = app.phone_url
        return found

    def phone(self, project, host, users=()):
        """Open on Phone (P_OnPhone): the app on the tailnet while it runs, https://<host>:8443/ (tailscale serve). The
        workbench's own phone address (host) must be on: it is the same machine and the same Serve. Task 304: Serve
        reaches the app through a guard that admits only the workbench's own Tailscale logins (remote_users)."""
        if not host: return {'problem': 'Phone access is off: the workbench is not on the tailnet (remote_hosts in config.json).'}
        if not users: return {'problem': 'Phone access is off: no Tailscale login is allowed (remote_users in config.json).'}
        with self.lock:
            app = self.apps.get(project)
            if not app or app.state != 'running': return {'problem': 'The app is not running. Start it in the Preview first.'}
            if app.phone and app.phone.poll() is None: return {'url': app.phone_url}
            for other in self.apps.values():
                if other is not app and other.phone: self.end_phone(other)
            from harness.preview_guard import Guard
            guard = Guard(app.port, host, users, PHONE_PORT)
            process, problem = self.serve(guard.listen_port, PHONE_PORT)
            if not process: guard.close(); return {'problem': problem or 'Tailscale could not serve the app.'}
            app.phone, app.phone_url, app.guard = process, f'https://{host}:{PHONE_PORT}/', guard
            return {'url': app.phone_url}

    @staticmethod
    def end_phone(app):
        if app.guard: app.guard.close(); app.guard = None
        if not app.phone: return
        app.phone.terminate()
        try: app.phone.wait(timeout=5)
        except subprocess.TimeoutExpired: app.phone.kill()
        app.phone, app.phone_url = None, ''

    def note(self, project, text):
        """"Pi changed 2 files. Reloaded." (P_Changed): the app reloads itself; the Preview says so, with the time."""
        with self.lock: app = self.apps.get(project)
        if app and app.state == 'running': app.note = {'text': text, 'time': time.strftime('%H:%M')}

    def restarted(self, project, text):
        """Round 12 (task 262): after Rename or Move, the note says where the app runs now (shown once it answers)."""
        with self.lock: app = self.apps.get(project)
        if app: app.note = {'text': text, 'time': time.strftime('%H:%M')}

    def start(self, project, folder):
        with self.lock:
            app = self.apps.get(project)
            if app and app.state in ('starting', 'running'): return self.status(project)
            if app and app.process.poll() is None: app.state = 'none'; self.end_phone(app); self.end(app)  # Start Again on an app that hangs under its reloader
            if app: self.end_frame(app)  # the stopped app's proxy goes with it
            port = free_port(); command = self.command(folder, port)
            if not command: return no_app(folder)
            if packages_missing(folder): return packages_missing(folder)
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
            if self.origins and not app.terminal: app.frame = Frame(port, self.origins)  # a terminal app speaks WebSocket: no helper there
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

    def active(self, project):
        """The harness started this project's app and it is starting or running (task 262: Rename and Move restart it)."""
        with self.lock: app = self.apps.get(project)
        return bool(app and app.state in ('starting', 'running') and app.process.poll() is None)

    def stop(self, project):
        with self.lock: app = self.apps.pop(project, None)
        if app: app.state = 'none'; self.end_phone(app); self.end(app); self.end_frame(app)
        return {'state': 'none'}

    @staticmethod
    def end_frame(app):
        if app.frame: app.frame.close(); app.frame = None

    def close(self):
        for project in list(self.apps): self.stop(project)
