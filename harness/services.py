"""Owned, loopback-only services. Emits readiness only after both sockets bind."""
import functools
import http.server
import json
import os
import signal
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from agent_api import AgentHandler
from laya.engine import LayaEngine


def main():
    os.chdir(ROOT)
    laya = LayaEngine(str(ROOT / 'specs/judges.md'), str(ROOT / 'session.log'))
    class Handler(AgentHandler):
        def __init__(self, *args):
            self.laya = laya
            super().__init__(*args)
    servers = []
    try:
        api = http.server.ThreadingHTTPServer(('127.0.0.1', int(os.getenv('PI_LAYA_PORT', '8000'))), Handler)
        servers.append(api)
        web = http.server.ThreadingHTTPServer(('127.0.0.1', int(os.getenv('PI_WEB_PORT', '3000'))), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)))
        servers.append(web)
        for server in servers:
            threading.Thread(target=server.serve_forever, daemon=True).start()
        stopped = threading.Event()
        for sig in (signal.SIGTERM, signal.SIGINT):
            signal.signal(sig, lambda *_: stopped.set())
        print(json.dumps({'laya': api.server_port, 'web': web.server_port}), flush=True)
        owner = os.getppid()
        while not stopped.wait(1):
            if os.getppid() != owner:
                break
    finally:
        for server in servers:
            server.server_close()

if __name__ == '__main__':
    main()
