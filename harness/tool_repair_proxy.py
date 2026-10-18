"""The tool-call repair proxy (task 326): a small local server in front of Ollama's OpenAI-compatible endpoint.

Pi's `ollama` provider talks to it instead of Ollama (harness/tool-repair.mjs points the provider here). Every request
goes on to Ollama unchanged. For a chat completion that offered `tools`, the answer is read on the way back: proper
`tool_calls` pass through untouched; a tool call the model wrote as text is turned into a real one by
harness/tool_repair.py (System 1, deterministic), the pseudo call is taken out of the text and finish_reason becomes
"tool_calls". Streaming answers stream as they arrive: thinking passes through at once, prose too, and only text that
may be a pseudo call is held until the turn ends (the chunks it came in still go out, without that text, so Pi sees
activity). Nothing is invented: an unknown tool, prose or arguments that do not fit leave the answer as it is.

Each repair is an automatic decision by code in <data>/decisions.jsonl (kind tool_call_repaired: model, tool, pattern,
request); a call that could not be repaired is a `tool-repair-failed` line in <data>/reports.jsonl. No file contents,
arguments or answers are logged. services.py starts one proxy per workbench and stops it with the other services.
"""
import http.client
import http.server
import json
import socket
import threading
import time
import uuid
from urllib.parse import urlsplit

from harness import decision_log, reports
from harness.tool_repair import Failure, Repair, hold_from, repair

REQUEST_FIELD = '_pi_harness_request'  # the harness request a call belongs to; taken out before Ollama sees the body
HOP = {'connection', 'keep-alive', 'transfer-encoding', 'content-length', 'host', 'proxy-connection', 'upgrade', 'te', 'trailer'}


class _Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 64


class RepairProxy:
    """One proxy: `RepairProxy(upstream, data).start()`, `.url` for Pi, `.close()`."""

    def __init__(self, upstream, data=None, port=0, timeout=900, connect_timeout=10):
        parts = urlsplit(upstream.rstrip('/'))
        if parts.scheme not in ('http', 'https') or not parts.hostname: raise ValueError(f'Not an address: {upstream}')
        self.upstream, self.scheme, self.host = upstream.rstrip('/'), parts.scheme, parts.hostname
        self.port_upstream, self.base = parts.port or (443 if parts.scheme == 'https' else 80), parts.path.rstrip('/')
        self.data, self.timeout, self.connect_timeout = data, timeout, connect_timeout
        proxy = self

        class Handler(_Handler):
            owner = proxy
        self.server = _Server(('127.0.0.1', int(port)), Handler)
        self.thread = None

    @property
    def port(self):
        return self.server.server_address[1]

    @property
    def url(self):
        return f'http://127.0.0.1:{self.port}/v1'

    def start(self):
        self.thread = threading.Thread(target=self.server.serve_forever, name='tool-repair-proxy', daemon=True)
        self.thread.start()
        return self

    def close(self):
        if self.thread: self.server.shutdown()
        self.server.server_close()

    def connection(self):
        kind = http.client.HTTPSConnection if self.scheme == 'https' else http.client.HTTPConnection
        connection = kind(self.host, self.port_upstream, timeout=self.connect_timeout)
        connection.connect()
        connection.sock.settimeout(self.timeout)  # between two pieces of an answer: a long think is fine
        return connection

    def target(self, path):
        """/v1/chat/completions → the upstream's /v1/chat/completions (its base path replaces /v1)."""
        return self.base + path[3:] if path == '/v1' or path.startswith(('/v1/', '/v1?')) else path

    # -- the record ------------------------------------------------------------------------------------------------
    def repaired(self, request, model, result, identifier):
        if not self.data: return
        for call in result.calls:
            try: decision_log.record(self.data, request or f'repair-{identifier}', 'tool_call_repaired', 'code',
                                     {'model': model, 'tool': call['name'], 'pattern': result.pattern, 'id': identifier}, rule='tool_repair', automatic=True)
            except (OSError, ValueError): pass

    def failed(self, request, model, failure, identifier):
        if not self.data: return
        reports.report(self.data, 'tool-repair-failed', f'{model}: a tool call written as text was left as text ({failure.reason})',
                       model=model, request=request, pattern=failure.pattern, tool=failure.tool, id=identifier)


class _Handler(http.server.BaseHTTPRequestHandler):
    owner = None
    protocol_version = 'HTTP/1.0'  # an answer ends when the connection closes: a stream needs no length

    def log_message(self, *args):  # Pi's requests are not the person's business on the services' stderr
        pass

    def do_GET(self): self.forward()
    def do_POST(self): self.forward()
    def do_DELETE(self): self.forward()

    def error(self, status, message, kind):
        body = json.dumps({'error': {'message': message, 'type': kind}}).encode()
        try:
            self.send_response(status); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body)))
            self.end_headers(); self.wfile.write(body)
        except OSError: pass

    def forward(self):
        proxy = self.owner
        body = self.rfile.read(int(self.headers.get('Content-Length') or 0)) if self.command == 'POST' else None
        request, tools, payload = None, None, None
        if body and self.path.split('?')[0].endswith('/chat/completions'):
            try: payload = json.loads(body)
            except ValueError: payload = None
            if isinstance(payload, dict):
                request = payload.pop(REQUEST_FIELD, None)
                request = request if isinstance(request, str) and len(request) < 200 else None
                tools = payload.get('tools') if isinstance(payload.get('tools'), list) and payload.get('tools') else None
                body = json.dumps(payload).encode()
        headers = {key: value for key, value in self.headers.items() if key.lower() not in HOP}
        if body is not None: headers['Content-Length'] = str(len(body))
        try:
            connection = proxy.connection()
            connection.request(self.command, proxy.target(self.path), body=body, headers=headers)
            response = connection.getresponse()
        except socket.timeout:
            return self.error(504, f'Ollama at {proxy.upstream} did not answer in time.', 'upstream_timeout')
        except OSError as error:
            return self.error(502, f'Pi Workbench could not reach Ollama at {proxy.upstream} ({error.__class__.__name__}: {error}). '
                                   'Start Ollama, or check ollama_url in the Workbench config.', 'upstream_unreachable')
        try:
            if tools and response.status == 200:
                identifier = uuid.uuid4().hex[:12]
                model = str(payload.get('model', ''))
                if payload.get('stream'): self.stream(response, tools, request, model, identifier)
                else: self.whole(response, tools, request, model, identifier)
            else: self.relay(response)
        except socket.timeout:
            pass  # mid-answer: the connection closes and Pi sees the stream end without a finish
        except OSError:
            pass  # Pi went away (stopped): closing the upstream connection stops Ollama too
        finally:
            connection.close()

    def start(self, response, length=None):
        self.send_response(response.status)
        for key, value in response.getheaders():
            if key.lower() not in HOP: self.send_header(key, value)
        if length is not None: self.send_header('Content-Length', str(length))
        self.end_headers()

    def relay(self, response):
        """Unchanged, piece by piece (errors and their status included)."""
        self.start(response)
        while True:
            piece = response.read1(65536) if hasattr(response, 'read1') else response.read(65536)
            if not piece: break
            self.wfile.write(piece); self.wfile.flush()

    def whole(self, response, tools, request, model, identifier):
        raw = response.read()
        try: answer = json.loads(raw)
        except ValueError: answer = None
        choice = (answer.get('choices') or [None])[0] if isinstance(answer, dict) else None
        message = choice.get('message') if isinstance(choice, dict) else None
        if isinstance(message, dict) and not message.get('tool_calls'):
            result = repair(message.get('content'), tools)
            if isinstance(result, Repair):
                message['tool_calls'] = result.tool_calls(); message['content'] = result.content
                choice['finish_reason'] = 'tool_calls'
                raw = json.dumps(answer).encode()
                self.owner.repaired(request, model, result, identifier)
            elif isinstance(result, Failure): self.owner.failed(request, model, result, identifier)
        self.start(response, len(raw)); self.wfile.write(raw)

    def stream(self, response, tools, request, model, identifier):
        self.start(response)
        content, emitted, held, native, template = '', 0, [], False, None

        def send(value):
            self.wfile.write(b'data: ' + (value if isinstance(value, bytes) else json.dumps(value, ensure_ascii=False).encode()) + b'\n\n'); self.wfile.flush()

        def chunk(delta, finish=None):
            base = {key: template[key] for key in ('id', 'object', 'created', 'model', 'system_fingerprint') if key in template} if template else {'object': 'chat.completion.chunk', 'created': int(time.time()), 'model': model}
            return {**base, 'choices': [{'index': 0, 'delta': delta, 'finish_reason': finish}]}

        def flush_text():
            nonlocal emitted
            if emitted < len(content): send(chunk({'content': content[emitted:]})); emitted = len(content)

        for data in _events(response):
            if data is None: continue
            try: value = json.loads(data)
            except ValueError: value = None
            if native or not isinstance(value, dict):
                if data.strip() == '[DONE]': break
                send(data.encode()); continue
            choices = value.get('choices') if isinstance(value.get('choices'), list) else []
            choice = choices[0] if choices and isinstance(choices[0], dict) else None
            if choice is None:
                if 'error' in value: flush_text(); send(value)
                else: held.append(value)  # usage at the end: after the calls
                continue
            delta = choice.get('delta') if isinstance(choice.get('delta'), dict) else {}
            if delta.get('tool_calls'):  # the model made a proper call: everything passes through from here
                native = True; flush_text()
                for item in held: send(item)
                held = []; send(value); continue
            template = value
            piece = delta.get('content') if isinstance(delta.get('content'), str) else ''
            content += piece
            safe = max(emitted, min(hold_from(content, tools), len(content)))
            shown, emitted = content[emitted:safe], safe
            out = {**value, 'choices': [{**choice, 'delta': {**{key: item for key, item in delta.items() if key != 'content'}, **({'content': shown} if shown else {})}}]}
            if choice.get('finish_reason'):
                if out['choices'][0]['delta']: send({**out, 'choices': [{**out['choices'][0], 'finish_reason': None}]})  # its text and thinking now; the finish after the calls
                held.insert(0, {**out, 'choices': [{**out['choices'][0], 'delta': {}}]})
            else: send(out)  # thinking and the text so far; an empty delta still tells Pi the model is working
        if not native:
            result = repair(content, tools)
            if isinstance(result, Repair) and result.spans[0][0] >= emitted:
                rest = _without(content, result.spans, emitted)
                if rest: send(chunk({'content': rest}))
                send(chunk({'tool_calls': [{'index': index, **call} for index, call in enumerate(result.tool_calls())]}))
                finished = False
                for item in held:
                    if item.get('choices'): item = {**item, 'choices': [{**item['choices'][0], 'finish_reason': 'tool_calls'}]}; finished = True
                    send(item)
                if not finished: send(chunk({}, 'tool_calls'))
                self.owner.repaired(request, model, result, identifier)
            else:
                if isinstance(result, Repair): result = Failure('already shown while streaming', result.pattern)
                if isinstance(result, Failure): self.owner.failed(request, model, result, identifier)
                flush_text()
                for item in held: send(item)
        else:
            for item in held: send(item)
        send(b'[DONE]')


def _events(response):
    """The data of each server-sent event, as text (comments and other fields skipped)."""
    lines = []
    while True:
        raw = response.readline()
        if not raw:
            if lines: yield '\n'.join(lines)
            return
        line = raw.decode('utf-8', errors='replace').rstrip('\r\n')
        if not line:
            if lines: yield '\n'.join(lines); lines = []
            continue
        if line.startswith('data:'): lines.append(line[5:].lstrip(' ') if line[5:6] == ' ' else line[5:])


def _without(content, spans, start):
    """content[start:] without the repaired spans, tidied like Repair.content."""
    import re
    pieces, index = [], start
    for begin, end in spans:
        pieces.append(content[index:begin]); index = end
    pieces.append(content[index:])
    text = re.sub(r'\n{3,}', '\n\n', ''.join(pieces))
    return text.rstrip() if start else text.strip()


def start_for_services(data, upstream, port=0, enabled=True):
    """services.py: the one proxy of this workbench, or None when turned off (tool_repair: false)."""
    if not enabled: return None
    return RepairProxy(upstream.rstrip('/') + '/v1', data=data, port=port).start()
