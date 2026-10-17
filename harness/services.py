"""Owned, loopback-only services. Emits readiness only after both sockets bind."""
from collections import deque
import functools
import http.server
import json
import os
import secrets
import signal
import subprocess
import sys
import threading
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from agent_api import AgentHandler
from gate.engine import GateEngine
from gate.ledger import ProposalLedger
from harness.web_chat import WebChat, WebHandler



class Server(http.server.ThreadingHTTPServer):
    """The standard library's default listen backlog is 5: a page load opens more connections than that at once
    (modules, styles, API calls) and macOS resets the rest. Request threads never keep the process alive."""
    request_queue_size = 128
    daemon_threads = True

def _tailscale_start(port, settle=6.0, https=None, stopped=None):
    """Run `tailscale serve <port>` in the foreground: the tailnet HTTPS proxy lasts only as long as this process.

    When Serve is off for the tailnet, tailscale prints an enable link on stdout and waits instead of exiting;
    that counts as a failure (the process is stopped) so plh never shows a phone address that cannot load.
    Ready as soon as tailscale prints "Available …"; otherwise still running after `settle` seconds counts as ready
    (6 s: a slow first start, e.g. macOS checking a new executable, must not pass for a running serve)."""
    try:
        target = [f'--https={https}', f'localhost:{port}'] if https else [str(port)]  # https: a second tailnet port (the Preview's app, P_OnPhone)
        process = subprocess.Popen([os.getenv('PI_TAILSCALE', 'tailscale'), 'serve', *target],
                                   stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    except OSError as error:
        return None, f'cannot run tailscale: {error}'
    output = deque(maxlen=64)
    def drain():
        try:
            for line in process.stdout:output.append(line[-2000:])
        finally:process.stdout.close()
    threading.Thread(target=drain, daemon=True).start()
    deadline = time.monotonic() + settle
    while not (stopped and stopped.is_set()) and time.monotonic() < deadline and process.poll() is None and 'not enabled' not in ''.join(list(output)) and 'Available' not in ''.join(list(output)):
        time.sleep(0.05)
    if stopped and stopped.is_set():
        process.terminate()
        try:process.wait(timeout=2)
        except subprocess.TimeoutExpired:process.kill();process.wait()
        return None,None
    text = ''.join(list(output))
    if 'not enabled' in text:
        process.terminate()
        try: process.wait(5)
        except subprocess.TimeoutExpired: process.kill()
        link = next((word for word in text.split() if word.startswith('https://')), '')
        return None, 'Serve is not enabled on your tailnet' + (f'; enable it once at {link}' if link else '')
    if process.poll() is None:
        return process, None
    return None, f'tailscale serve exited ({process.returncode}): {text.strip()[-500:]}'



class ServeProcess:
    """Own one foreground share and reconnect after a Serve-session exit, without persistent tailnet changes."""
    def __init__(self, process, restart):
        self.process,self.restart=process,restart
        self.stopped=threading.Event();self.done=threading.Event();self.lock=threading.Lock()
        self.thread=threading.Thread(target=self.watch,daemon=True)
        self.thread.start()

    def watch(self):
        try:
            while not self.stopped.wait(1):
                if self.process.poll() is None:continue
                replacement,_=self.restart(self.stopped)
                if replacement:
                    with self.lock:self.process=replacement
                elif self.stopped.wait(2):break
        finally:
            with self.lock:
                if self.process.poll() is None:self.process.terminate()
                try:self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:self.process.kill();self.process.wait()
            self.done.set()

    def poll(self):
        return 0 if self.done.is_set() else None

    def terminate(self):
        self.stopped.set()
        with self.lock:
            if self.process.poll() is None:self.process.terminate()

    def wait(self, timeout=None):
        if not self.done.wait(timeout):raise subprocess.TimeoutExpired('tailscale serve',timeout)
        return 0

    def kill(self):
        self.stopped.set()
        with self.lock:
            if self.process.poll() is None:self.process.kill()


def tailscale_serve(port, settle=6.0, https=None):
    """Keep this owned foreground share alive across Tailscale restarts; terminate still ends sharing."""
    process,problem=_tailscale_start(port,settle=settle,https=https)
    if not process:return None,problem
    return ServeProcess(process,lambda stopped:_tailscale_start(port,settle=settle,https=https,stopped=stopped)),None


def main():
    os.chdir(ROOT)
    data_dir = Path(os.getenv('PI_AGENT_DATA', str(Path.home() / 'pi-local-harness-data')))
    data_dir.mkdir(parents=True, exist_ok=True)
    gate = GateEngine(str(ROOT / 'specs/judges.md'), os.getenv('PI_HARNESS_LOG_FILE', str(data_dir / 'gate-audit.log')))
    ledger = ProposalLedger(gate, protocol_file=data_dir / 'gate-protocol.json', events_file=data_dir / 'gate-events.jsonl')
    token = secrets.token_urlsafe(32)
    class Handler(AgentHandler):
        def __init__(self, *args):
            self.gate = gate
            self.ledger = ledger
            self.token = token
            super().__init__(*args)
    servers = []
    chat = None
    serve = None
    try:
        api = Server(('127.0.0.1', int(os.getenv('PI_GATE_PORT', '8000'))), Handler)
        servers.append(api)
        web = Server(('127.0.0.1', int(os.getenv('PI_WEB_PORT', '3000'))), WebHandler)
        chat = WebChat(os.getenv('PI_WEB_DATA', str(data_dir / 'chats')), api.server_port, web.server_port, data_root=data_dir, gate_token=token)
        chat.ledger = ledger
        ledger.paperwork.projects = chat.documents
        Handler.context_provider = staticmethod(chat.turn_context)
        WebHandler.chat = chat
        WebHandler.remote_hosts = frozenset(filter(None, os.getenv('PI_WEB_REMOTE_HOSTS', '').split(',')))
        WebHandler.remote_users = frozenset(filter(None, os.getenv('PI_WEB_REMOTE_USERS', '').split(',')))
        servers.append(web)
        for server in servers:
            threading.Thread(target=server.serve_forever, daemon=True).start()
        ready = {'gate': api.server_port, 'web': web.server_port, 'token': token}
        if WebHandler.remote_hosts:
            serve, problem = tailscale_serve(web.server_port)
            if serve: ready['remote'] = WebHandler.phone_url = 'https://' + sorted(WebHandler.remote_hosts)[0]
            else: ready['remote_error'] = WebHandler.phone_error = problem
        stopped = threading.Event()
        for sig in (signal.SIGTERM, signal.SIGINT):
            signal.signal(sig, lambda *_: stopped.set())
        print(json.dumps(ready), flush=True)
        threading.Thread(target=chat.measure_if_unknown, daemon=True).start()  # task 161: a model never measured with this Ollama
        owner = os.getppid()
        while not stopped.wait(1):
            if os.getppid() != owner:
                break
    finally:
        if serve:
            serve.terminate()
            try: serve.wait(5)
            except subprocess.TimeoutExpired: serve.kill()
        if chat: chat.close()
        for server in servers:
            server.server_close()

if __name__ == '__main__':
    main()
