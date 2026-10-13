"""Owned, loopback-only services. Emits readiness only after both sockets bind."""
import functools
import http.server
import json
import os
import secrets
import signal
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from agent_api import AgentHandler
from laya.engine import LayaEngine
from laya.ledger import ProposalLedger
from harness.web_chat import WebChat, WebHandler


def main():
    os.chdir(ROOT)
    data_dir = Path(os.getenv('PI_AGENT_DATA', str(Path.home() / 'pi-local-harness-data')))
    data_dir.mkdir(parents=True, exist_ok=True)
    laya = LayaEngine(str(ROOT / 'specs/judges.md'), os.getenv('PI_HARNESS_LOG_FILE', str(data_dir / 'laya-audit.log')))
    ledger = ProposalLedger(laya, protocol_file=data_dir / 'laya-protocol.json')
    token = secrets.token_urlsafe(32)
    class Handler(AgentHandler):
        def __init__(self, *args):
            self.laya = laya
            self.ledger = ledger
            self.token = token
            super().__init__(*args)
    servers = []
    chat = None
    try:
        api = http.server.ThreadingHTTPServer(('127.0.0.1', int(os.getenv('PI_LAYA_PORT', '8000'))), Handler)
        servers.append(api)
        web = http.server.ThreadingHTTPServer(('127.0.0.1', int(os.getenv('PI_WEB_PORT', '3000'))), WebHandler)
        chat = WebChat(os.getenv('PI_WEB_DATA', str(data_dir / 'chats')), api.server_port, web.server_port, data_root=data_dir, laya_token=token)
        chat.ledger = ledger
        WebHandler.chat = chat
        servers.append(web)
        for server in servers:
            threading.Thread(target=server.serve_forever, daemon=True).start()
        stopped = threading.Event()
        for sig in (signal.SIGTERM, signal.SIGINT):
            signal.signal(sig, lambda *_: stopped.set())
        print(json.dumps({'laya': api.server_port, 'web': web.server_port, 'token': token}), flush=True)
        owner = os.getppid()
        while not stopped.wait(1):
            if os.getppid() != owner:
                break
    finally:
        if chat: chat.close()
        for server in servers:
            server.server_close()

if __name__ == '__main__':
    main()
