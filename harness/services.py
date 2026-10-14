"""Owned, loopback-only services. Emits readiness only after both sockets bind."""
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

def tailscale_serve(port, settle=2.0):
    """Run `tailscale serve <port>` in the foreground: the tailnet HTTPS proxy lasts only as long as this process.

    When Serve is off for the tailnet, tailscale prints an enable link on stdout and waits instead of exiting;
    that counts as a failure (the process is stopped) so plh never shows a phone address that cannot load."""
    try:
        process = subprocess.Popen([os.getenv('PI_TAILSCALE', 'tailscale'), 'serve', str(port)],
                                   stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    except OSError as error:
        return None, f'cannot run tailscale: {error}'
    output = []
    threading.Thread(target=lambda: output.extend(process.stdout), daemon=True).start()
    deadline = time.monotonic() + settle
    while time.monotonic() < deadline and process.poll() is None and 'not enabled' not in ''.join(output):
        time.sleep(0.05)
    text = ''.join(output)
    if 'not enabled' in text:
        process.terminate()
        try: process.wait(5)
        except subprocess.TimeoutExpired: process.kill()
        link = next((word for word in text.split() if word.startswith('https://')), '')
        return None, 'Serve is not enabled on your tailnet' + (f'; enable it once at {link}' if link else '')
    if process.poll() is None:
        return process, None
    return None, f'tailscale serve exited ({process.returncode}): {text.strip()[-500:]}'


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
