import hmac
import json
import http.server

class AgentHandler(http.server.BaseHTTPRequestHandler):
    token = None

    def trusted(self, require_token=True):
        """Loopback Host, no browser Origin, and the per-run token from services.py."""
        port = self.server.server_port
        if self.headers.get('Host') not in {f'127.0.0.1:{port}', f'localhost:{port}'} or self.headers.get('Origin') is not None:
            return False
        if not require_token:
            return True
        supplied = self.headers.get('X-Laya-Token', '')
        return bool(self.token) and hmac.compare_digest(supplied.encode(), self.token.encode())

    def do_POST(self):
        if not self.trusted():
            self.send_error_response(403, 'Laya accepts only local harness requests')
            return
        if self.path == '/gatekeep':
            self.handle_gatekeep()
        elif self.path == '/audit':
            self.handle_audit()
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if not self.trusted(require_token=False):
            self.send_error_response(403, 'Laya accepts only local harness requests')
        elif self.path == '/health':
            self.send_json_response({'status': 'ready', 'laya': True})
        else:
            self.send_response(404)
            self.end_headers()

    def handle_gatekeep(self):
        try:
            data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            result = self.ledger.propose(data['tool_name'], data['args'], data.get('auth_level', 'standard'),
                                         pi_tool=data.get('pi_tool'), cwd=data.get('cwd'), tool_call_id=data.get('tool_call_id'))
            self.send_json_response(result)
        except Exception as error:
            self.send_error_response(400, str(error))

    def handle_audit(self):
        try:
            data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            event = self.ledger.complete(data['proposal_id'], data['tool_name'], data['args'],
                                         data.get('output'), data.get('exit_code', 0))
            self.send_json_response({'status': event.status, 'reason': event.reasoning})
        except KeyError as error:
            self.send_error_response(409, str(error))
        except Exception as error:
            self.send_error_response(400, str(error))

    def send_json_response(self, data: dict):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error_response(self, code: int, message: str):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))
