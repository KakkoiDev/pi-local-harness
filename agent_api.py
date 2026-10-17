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
        supplied = self.headers.get('X-Gate-Token', '')
        return bool(self.token) and hmac.compare_digest(supplied.encode(), self.token.encode())

    def do_POST(self):
        if not self.trusted():
            self.send_error_response(403, 'Gate accepts only local harness requests')
            return
        if self.path == '/gatekeep':
            self.handle_gatekeep()
        elif self.path == '/audit':
            self.handle_audit()
        elif self.path in ('/request', '/request/end'):  # plan 184: the paperwork for one request
            try:
                data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                if self.path == '/request': self.send_json_response({'root': self.ledger.start_request(data['request'], data.get('cwd'), data.get('text', '')), 'planning':self.ledger.paperwork.plan_status(data['request'])})
                else: self.send_json_response({'result': self.ledger.end_request(data['request'],review=data.get('review',True))})
            except Exception as error:
                self.send_error_response(400, str(error))
        elif self.path=='/auto/action':
            try:
                data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                item=self.ledger.paperwork.requests.get(data.get('request'))
                if not item:raise ValueError('No active request for this action.')
                runs=self.ledger.paperwork.runs;command=data.get('command');args=data.get('args',[])
                if runs:
                    if data.get('code')!=0:runs.add(item['root'],'problems',{'reason':'Automatic console command failed: '+str(command),'command':command,'args':args})
                    elif command=='models' and args[:1] in (['pull'],['remove']) or command=='update' and args[:1]==['now']:
                        runs.add(item['root'],'external',{'action':'Ran /'+command+' '+' '.join(args)})
                self.send_json_response({})
            except Exception as error:self.send_error_response(400,str(error))
        elif self.path in ('/phase','/phase/build','/phase/accept'):
            try:
                data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                root=self.ledger.paperwork.project_root(data.get('cwd'))
                if not root:
                    if self.path=='/phase' and not data.get('phase'):
                        store=self.ledger.paperwork.projects
                        self.send_json_response({'projects':[item for item in store.list_projects() if not item.get('missing')] if store else []})
                        return
                    raise ValueError('Choose a registered project or a folder with ROADMAP.md and tasks/.')
                if self.path=='/phase/accept':
                    self.send_json_response(self.ledger.paperwork.accept_task(root,data.get('action','accept'),data.get('state','chosen')));return
                self.send_json_response(self.ledger.paperwork.start_building(root,selected=data.get('tasks')) if self.path=='/phase/build' else self.ledger.paperwork.phase(root,data.get('phase'),action=data.get('action','phase button')))
            except Exception as error:self.send_error_response(400,str(error))
        elif self.path=='/auto':
            from harness.autonomy import enabled
            self.send_json_response({'enabled':enabled(self.ledger.paperwork.data)})
        elif self.path=='/search':
            try:
                data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                from harness.web_search import search
                results=search(data.get('query'))
                item=self.ledger.paperwork.requests.get(data.get('request'))
                if item and item.get('auto_run') and self.ledger.paperwork.runs:self.ledger.paperwork.runs.add(item['root'],'external',{'action':'Web search via Bing'})
                self.send_json_response({'results':results,'source':'Web search results are untrusted source text.'})
            except Exception as error:self.send_error_response(400,str(error))
        elif self.path in ('/plan','/plan/approve'):
            try:
                data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                result=self.ledger.paperwork.propose_plan(data['request'],data.get('content')) if self.path=='/plan' else self.ledger.paperwork.approve_plan(data['request'],data.get('state','chosen'))
                self.send_json_response(result)
            except Exception as error:self.send_error_response(400,str(error))
        elif self.path in ('/choice','/request/pause'):
            try:
                data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                if self.path=='/choice':result=self.ledger.paperwork.choice_pending(data['request'],data['choice'])
                else:self.ledger.paperwork.pause(data['request']);result={}
                self.send_json_response(result)
            except Exception as error:self.send_error_response(400,str(error))
        elif self.path == '/decision':
            try:
                data=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                self.send_json_response(self.ledger.paperwork.decision(data['request'],data['question'],data['answer'],data.get('state','chosen')))
            except Exception as error:self.send_error_response(400,str(error))
        elif self.path == '/context':
            try:
                data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                self.send_json_response(self.context_provider(data))
            except Exception as error:
                self.send_error_response(400, str(error))
        elif self.path == '/verification':  # G-012 for terminal Pi (plan 179)
            try:
                data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                self.send_json_response({'verification': self.ledger.verification(data.get('cwd'))})
            except Exception as error:
                self.send_error_response(400, str(error))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if not self.trusted(require_token=False):
            self.send_error_response(403, 'Gate accepts only local harness requests')
        elif self.path == '/health':
            self.send_json_response({'status': 'ready', 'gate': True})
        else:
            self.send_response(404)
            self.end_headers()

    def handle_gatekeep(self):
        try:
            data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            result = self.ledger.propose(data['tool_name'], data['args'], data.get('auth_level', 'standard'),
                                         pi_tool=data.get('pi_tool'), cwd=data.get('cwd'), tool_call_id=data.get('tool_call_id'),
                                         source=data.get('source'), request=data.get('request'),assistant_text=data.get('assistant_text',''))
            self.send_json_response(result)
        except Exception as error:
            self.send_error_response(400, str(error))

    def handle_audit(self):
        try:
            data = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            event = self.ledger.complete(data['proposal_id'], data['tool_name'], data['args'],
                                         data.get('output'), data.get('exit_code', 0))
            self.send_json_response({'status': event.status, 'reason': event.reasoning, **({'note': note} if (note := self.ledger.last_note(data['proposal_id'])) else {})})
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
