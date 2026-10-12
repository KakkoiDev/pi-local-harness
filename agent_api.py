import json
import http.server
import socketserver
from datetime import datetime
from laya.engine import LayaEngine
from laya.models import ActionProposal, ActionOutcome

# Configuration
PORT = 8000
POLICY_PATH = "specs/judges.md"
LOG_FILE = "session.log"

class AgentHandler(http.server.BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == '/chat':
            self.handle_chat()
        elif self.path == '/tool_call':
            self.handle_tool_call()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_chat(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data.decode('utf-8'))
            user_message = data.get('message', '')
            response_text = f"AGENT_RESPONSE: I received your message: '{user_message}'. I am ready for your requests."
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
            
            self.send_json_response({
                'status': 'success',
                'output': result_content
            })

        except Exception as e:
            self.send_error_response(500, str(e))

    def send_json_response(self, data: dict):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error_response(self, code: int, message: str):
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))

class InstrumentedHandler(AgentHandler):
    def __init__(self, request, client_address, laya):
        super().__init__(request, client_address)
        self.laya = laya

def run_server():
    laya = LayaEngine(policy_path=POLICY_PATH, log_file=LOG_FILE)
    
    class CustomHandler(AgentHandler):
        def __init__(self, request, client_address):
            super().__init__(request, client_address)
            self.laya = laya

    with socketserver.TCPServer(("127.0.0.1", PORT), CustomHandler) as httpd:
        print(f"🤖 Agent API is running on http://localhost:{PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()
