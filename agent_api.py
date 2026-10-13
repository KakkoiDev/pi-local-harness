import hmac
import json
import http.server
import secrets
import socketserver
from datetime import datetime
from laya.engine import LayaEngine
from laya.ledger import ProposalLedger
from laya.models import ActionProposal, ActionOutcome, ExecutionResult

# Configuration
PORT = 8000
POLICY_PATH = "specs/judges.md"
LOG_FILE = "session.log"

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
        if self.path == '/chat':
            self.handle_chat()
        elif self.path == '/gatekeep':
            self.handle_gatekeep()
        elif self.path == '/audit':
            self.handle_audit()
        elif self.path == '/tool_call':
            self.handle_tool_call()
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
                                         pi_tool=data.get('pi_tool'), cwd=data.get('cwd'))
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

    def handle_chat(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data.decode('utf-8'))
            user_message = data.get('message', '')

            # Simulate reasoning step
            timestamp_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            with open(LOG_FILE, "a") as f:
                f.write(f"[{timestamp_str}] REASONING_STEP: I am processing the user message: '{user_message}'\n")

            response_text = f"AGENT_RESPONSE: I received your message: '{user_message}'. I am ready for your requests."

            # Log the response so the Sentinel can see it
            with open(LOG_FILE, "a") as f:
                f.write(f"[{timestamp_str}] {response_text}\n")

            self.send_json_response({'reply': response_text})
        except Exception as e:
            self.send_error_response(500, str(e))

    def handle_tool_call(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data.decode('utf-8'))
            proposal = ActionProposal(
                tool_name=data['tool_name'],
                args=data['args'],
                reason=data['reason'],
                authorization=data.get('authorization', 'standard')
            )

            # Log the intent to the session log so the Sentinel sees it
            timestamp_str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            with open(LOG_FILE, "a") as f:
                f.write(f"[{timestamp_str}] TOOL_CALL: {proposal.tool_name}\n")

            # 1. Gatekeeper Phase
            outcome = self.laya.gatekeep(proposal, auth_level=data.get('auth_level', 'standard'))

            if outcome != ActionOutcome.ALLOW:
                self.send_json_response({
                    'status': 'blocked',
                    'outcome': outcome.value,
                    'message': f"Action blocked by Laya Gatekeeper."
                })
                return

            # 2. Execution (Simulated)
            print(f"[AgentAPI] Executing tool: {proposal.tool_name}")
            result_content = f"Simulated results for {proposal.tool_name}"

            # 3. Auditor Phase (Post-Execution)
            execution = ExecutionResult(
                tool_name=proposal.tool_name,
                args=proposal.args,
                output=result_content,
                exit_code=0
            )
            self.laya.audit(proposal, execution)

            self.send_json_response({
                'status': 'success',
                'output': result_content
            })

        except Exception as e:
            self.send_error_response(500, str(e))

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

class InstrumentedHandler(AgentHandler):
    def __init__(self, request, client_address, server, laya):
        self.laya = laya
        super().__init__(request, client_address, server)

def run_server():
    laya = LayaEngine(policy_path=POLICY_PATH, log_file=LOG_FILE)

    ledger = ProposalLedger(laya)
    class CustomHandler(AgentHandler):
        token = secrets.token_urlsafe(32)
        def __init__(self, request, client_address, server):
            self.laya = laya
            self.ledger = ledger
            super().__init__(request, client_address, server)

    with socketserver.TCPServer(("127.0.0.1", PORT), CustomHandler) as httpd:
        print(f"Agent API is running on http://localhost:{PORT} (X-Laya-Token: {CustomHandler.token})")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
