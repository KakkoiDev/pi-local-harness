"""Task 326: the tool-call repair proxy between Pi and Ollama, against a fake OpenAI-compatible upstream.

Proper tool_calls and answers without tools pass through unchanged; a pseudo call becomes a real one (streamed or not);
thinking passes through; errors, timeouts and an unreachable Ollama reach Pi plainly; each repair is a code decision."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import http.client
import http.server
import json
import socket
import tempfile
import threading
import time
import unittest
from pathlib import Path

from harness.tool_repair_proxy import RepairProxy, REQUEST_FIELD

TOOLS = [{'type': 'function', 'function': {'name': 'read', 'description': 'Read a file', 'parameters': {
    'type': 'object', 'properties': {'path': {'type': 'string'}}, 'required': ['path']}}}]


class Upstream:
    """A fake Ollama /v1: each test sets `reply` (status, body or list of SSE chunks, delay between pieces)."""

    def __init__(self):
        self.received, self.reply = [], None
        upstream = self

        class Handler(http.server.BaseHTTPRequestHandler):
            protocol_version = 'HTTP/1.1'
            def log_message(self, *args): pass

            def do_GET(self):
                upstream.received.append({'path': self.path, 'method': 'GET'})
                body = json.dumps({'object': 'list', 'data': [{'id': 'gemma4:e4b-mlx'}]}).encode()
                self.send_response(200); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

            def do_POST(self):
                body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
                upstream.received.append({'path': self.path, 'body': body, 'auth': self.headers.get('Authorization')})
                status, answer, delay = upstream.reply
                if isinstance(answer, list):
                    self.send_response(status); self.send_header('Content-Type', 'text/event-stream'); self.send_header('Transfer-Encoding', 'chunked'); self.end_headers()
                    for piece in answer:
                        time.sleep(delay)
                        data = (piece if isinstance(piece, str) else 'data: ' + json.dumps(piece) + '\n\n').encode()
                        try: self.wfile.write(b'%x\r\n%s\r\n' % (len(data), data)); self.wfile.flush()
                        except OSError: return
                    self.wfile.write(b'0\r\n\r\n')
                else:
                    time.sleep(delay)
                    data = json.dumps(answer).encode()
                    self.send_response(status); self.send_header('Content-Type', 'application/json'); self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)

        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        self.server.daemon_threads = True
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        self.url = f'http://127.0.0.1:{self.server.server_address[1]}/v1'

    def close(self):
        self.server.shutdown(); self.server.server_close()


def completion(content, tool_calls=None, reasoning=None):
    message = {'role': 'assistant', 'content': content, **({'tool_calls': tool_calls} if tool_calls else {}), **({'reasoning': reasoning} if reasoning else {})}
    return {'id': 'chatcmpl-1', 'object': 'chat.completion', 'created': 1, 'model': 'gemma4:e4b-mlx',
            'choices': [{'index': 0, 'message': message, 'finish_reason': 'tool_calls' if tool_calls else 'stop'}], 'usage': {'prompt_tokens': 5, 'completion_tokens': 7}}


def chunks(pieces, reasoning=(), tool_calls=None, usage=True):
    base = {'id': 'chatcmpl-2', 'object': 'chat.completion.chunk', 'created': 1, 'model': 'gemma4:e4b-mlx'}
    out = [{**base, 'choices': [{'index': 0, 'delta': {'role': 'assistant', 'reasoning': text}, 'finish_reason': None}]} for text in reasoning]
    out += [{**base, 'choices': [{'index': 0, 'delta': {'content': text}, 'finish_reason': None}]} for text in pieces]
    if tool_calls: out.append({**base, 'choices': [{'index': 0, 'delta': {'tool_calls': tool_calls}, 'finish_reason': None}]})
    out.append({**base, 'choices': [{'index': 0, 'delta': {}, 'finish_reason': 'tool_calls' if tool_calls else 'stop'}]})
    if usage: out.append({**base, 'choices': [], 'usage': {'prompt_tokens': 5, 'completion_tokens': 7}})
    return out + ['data: [DONE]\n\n']


def events(raw):
    found = []
    for block in raw.decode().split('\n\n'):
        if block.startswith('data: '):
            data = block[6:]
            found.append(data if data == '[DONE]' else json.loads(data))
    return found


def assembled(stream):
    """What Pi builds from a stream: text, thinking, tool calls, finish reason."""
    text, thinking, calls, finish = '', '', {}, None
    for event in stream:
        if event == '[DONE]' or not event.get('choices'): continue
        choice = event['choices'][0]; delta = choice.get('delta') or {}
        text += delta.get('content') or ''; thinking += delta.get('reasoning') or ''
        for call in delta.get('tool_calls') or []:
            entry = calls.setdefault(call['index'], {'name': '', 'arguments': ''})
            entry['name'] += call.get('function', {}).get('name') or ''; entry['arguments'] += call.get('function', {}).get('arguments') or ''
        finish = choice.get('finish_reason') or finish
    return text, thinking, [{'name': call['name'], 'arguments': json.loads(call['arguments'])} for call in calls.values()], finish


class ProxyTest(unittest.TestCase):
    def setUp(self):
        self.upstream = Upstream()
        self.data = Path(tempfile.mkdtemp())
        self.proxy = RepairProxy(self.upstream.url, data=self.data, port=0, timeout=2).start()

    def tearDown(self):
        self.proxy.close(); self.upstream.close()

    def post(self, body, path='/v1/chat/completions'):
        connection = http.client.HTTPConnection('127.0.0.1', self.proxy.port, timeout=10)
        connection.request('POST', path, body=json.dumps(body), headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ollama'})
        response = connection.getresponse(); raw = response.read(); connection.close()
        return response.status, raw

    def request(self, stream=False, tools=TOOLS, **extra):
        return {'model': 'gemma4:e4b-mlx', 'messages': [{'role': 'user', 'content': 'Fix app/db.py'}], 'stream': stream, **({'tools': tools} if tools else {}), **extra}

    def decisions(self):
        path = self.data / 'decisions.jsonl'
        return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []

    def reports(self):
        path = self.data / 'reports.jsonl'
        return [json.loads(line) for line in path.read_text().splitlines()] if path.exists() else []

    # -- non-streaming ------------------------------------------------------------------------------------------------
    def test_proper_tool_calls_pass_through_unchanged(self):
        answer = completion('', tool_calls=[{'id': 'call_1', 'type': 'function', 'function': {'name': 'read', 'arguments': '{"path":"a"}'}}])
        self.upstream.reply = (200, answer, 0)
        status, raw = self.post(self.request())
        self.assertEqual((status, json.loads(raw)), (200, answer))
        self.assertEqual(self.decisions(), [])

    def test_a_pseudo_call_becomes_a_real_one(self):
        self.upstream.reply = (200, completion('I will read it.\n<execute_tool>\nread{path:app/db.py}\n</execute_tool>', reasoning='The file first.'), 0)
        status, raw = self.post(self.request(**{REQUEST_FIELD: 'job-1'}))
        choice = json.loads(raw)['choices'][0]
        self.assertEqual(status, 200)
        self.assertEqual(choice['finish_reason'], 'tool_calls')
        self.assertEqual(choice['message']['content'], 'I will read it.')
        self.assertEqual(choice['message']['reasoning'], 'The file first.', 'thinking passes through')
        call = choice['message']['tool_calls'][0]
        self.assertEqual((call['type'], call['function']['name'], json.loads(call['function']['arguments'])), ('function', 'read', {'path': 'app/db.py'}))
        self.assertTrue(call['id'].startswith('call_'))
        self.assertNotIn(REQUEST_FIELD, self.upstream.received[0]['body'], 'Ollama never sees the harness field')
        self.assertEqual(self.upstream.received[0]['auth'], 'Bearer ollama')
        [row] = self.decisions()
        self.assertEqual((row['request'], row['kind'], row['who'], row['automatic'], row['rule']), ('job-1', 'tool_call_repaired', 'code', True, 'tool_repair'))
        self.assertEqual({key: row['answer'][key] for key in ('model', 'tool', 'pattern')}, {'model': 'gemma4:e4b-mlx', 'tool': 'read', 'pattern': 'execute_tool-tag/brace'})
        self.assertNotIn('app/db.py', json.dumps(row), 'no arguments or contents in the log')

    def test_without_tools_nothing_is_touched(self):
        answer = completion('read(path="a")')
        self.upstream.reply = (200, answer, 0)
        self.assertEqual(json.loads(self.post(self.request(tools=None))[1]), answer)

    def test_prose_and_unknown_tools_are_left_and_a_failure_is_reported(self):
        prose = completion('I will read app/db.py next.')
        self.upstream.reply = (200, prose, 0)
        self.assertEqual(json.loads(self.post(self.request())[1]), prose)
        unknown = completion('<execute_tool>\nrm{path:/}\n</execute_tool>')
        self.upstream.reply = (200, unknown, 0)
        self.assertEqual(json.loads(self.post(self.request(**{REQUEST_FIELD: 'job-2'}))[1]), unknown)
        self.assertEqual(self.decisions(), [])
        [report] = self.reports()
        self.assertEqual((report['kind'], report['tool'], report['request'], report['model']), ('tool-repair-failed', 'rm', 'job-2', 'gemma4:e4b-mlx'))

    def test_errors_pass_through_with_their_status(self):
        self.upstream.reply = (404, {'error': {'message': 'model "nope" not found', 'type': 'api_error'}}, 0)
        status, raw = self.post(self.request())
        self.assertEqual((status, json.loads(raw)['error']['message']), (404, 'model "nope" not found'))

    def test_other_routes_pass_through(self):
        connection = http.client.HTTPConnection('127.0.0.1', self.proxy.port, timeout=5)
        connection.request('GET', '/v1/models'); response = connection.getresponse()
        self.assertEqual((response.status, json.loads(response.read())['data'][0]['id']), (200, 'gemma4:e4b-mlx'))
        self.assertEqual(self.upstream.received[-1]['path'], '/v1/models')

    def test_a_slow_upstream_is_a_timeout(self):
        self.upstream.reply = (200, completion('late'), 3)  # the proxy waits 2 s in this test
        status, raw = self.post(self.request())
        self.assertEqual(status, 504)
        self.assertIn('did not answer in time', json.loads(raw)['error']['message'])

    def test_an_unreachable_ollama_says_so(self):
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0)); closed = probe.getsockname()[1]
        proxy = RepairProxy(f'http://127.0.0.1:{closed}/v1', data=self.data).start()
        try:
            connection = http.client.HTTPConnection('127.0.0.1', proxy.port, timeout=5)
            connection.request('POST', '/v1/chat/completions', body=json.dumps(self.request()), headers={'Content-Type': 'application/json'})
            response = connection.getresponse(); error = json.loads(response.read())['error']
        finally: proxy.close()
        self.assertEqual((response.status, error['type']), (502, 'upstream_unreachable'))
        self.assertIn(f'could not reach Ollama at http://127.0.0.1:{closed}/v1', error['message'])
        self.assertIn('Start Ollama', error['message'])

    # -- streaming ----------------------------------------------------------------------------------------------------
    def test_streamed_tool_calls_pass_through(self):
        calls = [{'index': 0, 'id': 'call_9', 'type': 'function', 'function': {'name': 'read', 'arguments': '{"path":"a"}'}}]
        self.upstream.reply = (200, chunks(['Reading.'], reasoning=['Hmm.'], tool_calls=calls), 0)
        status, raw = self.post(self.request(stream=True))
        self.assertEqual(status, 200)
        self.assertEqual(assembled(events(raw)), ('Reading.', 'Hmm.', [{'name': 'read', 'arguments': {'path': 'a'}}], 'tool_calls'))
        self.assertEqual(events(raw)[-1], '[DONE]')
        self.assertEqual(self.decisions(), [])

    def test_a_streamed_pseudo_call_is_repaired(self):
        pieces = ['I will ', 'read it.\n', '<execute', '_tool>\nread{pa', 'th:app/db.py}\n</execute_tool>']
        self.upstream.reply = (200, chunks(pieces, reasoning=['Look ', 'first.']), 0)
        status, raw = self.post(self.request(stream=True, **{REQUEST_FIELD: 'job-3'}))
        stream = events(raw)
        self.assertEqual(assembled(stream), ('I will read it.', 'Look first.', [{'name': 'read', 'arguments': {'path': 'app/db.py'}}], 'tool_calls'))
        self.assertFalse(any('execute_tool' in json.dumps(event) for event in stream), 'the pseudo call never reaches Pi')
        usage = [event for event in stream if event != '[DONE]' and event.get('usage')]
        self.assertEqual(len(usage), 1, 'usage still arrives')
        self.assertEqual(stream[-1], '[DONE]')
        self.assertEqual([row['answer']['tool'] for row in self.decisions()], ['read'])

    def test_streamed_prose_arrives_live_and_unchanged(self):
        pieces = ['The fix ', 'is in ', '`db.py`', '. Use the read tool to check.']
        self.upstream.reply = (200, chunks(pieces, reasoning=['Thinking.']), 0)
        stream = events(self.post(self.request(stream=True))[1])
        self.assertEqual(assembled(stream), (''.join(pieces), 'Thinking.', [], 'stop'))
        texts = [event['choices'][0]['delta'].get('content') for event in stream if event != '[DONE]' and event.get('choices') and event['choices'][0]['delta'].get('content')]
        self.assertGreaterEqual(len(texts), 3, 'text streams as it comes, not in one piece at the end')

    def test_a_bare_streamed_call_at_the_end(self):
        self.upstream.reply = (200, chunks(['Let me check.\n\nre', 'ad(path="app/db.py")']), 0)
        stream = events(self.post(self.request(stream=True))[1])
        self.assertEqual(assembled(stream), ('Let me check.', '', [{'name': 'read', 'arguments': {'path': 'app/db.py'}}], 'tool_calls'))

    def test_a_streamed_gemma_call_without_its_quote_tokens(self):
        pieces = ['Reading it.', 'call:re', 'ad{path:app/', 'db.py}<tool_call|>']  # Ollama dropped <|tool_call> and the <|"|> quotes
        self.upstream.reply = (200, chunks(pieces), 0)
        stream = events(self.post(self.request(stream=True))[1])
        self.assertEqual(assembled(stream), ('Reading it.', '', [{'name': 'read', 'arguments': {'path': 'app/db.py'}}], 'tool_calls'))

    def test_a_stream_that_stops_mid_answer_is_not_completed(self):
        self.upstream.reply = (200, chunks(['Partial'])[:1] + [], 3)  # one chunk, after longer than the proxy waits
        status, raw = self.post(self.request(stream=True))
        self.assertEqual(status, 200)
        self.assertNotIn('[DONE]', raw.decode(), 'Pi sees the stream end without a finish, as it would from Ollama')

    def test_an_error_in_the_stream_reaches_pi(self):
        self.upstream.reply = (200, chunks(['Hello'])[:1] + ['data: {"error": {"message": "out of memory"}}\n\n'], 0)
        stream = events(self.post(self.request(stream=True))[1])
        self.assertIn({'error': {'message': 'out of memory'}}, stream)


class InActivity(unittest.TestCase):
    """Each request shows the calls the workbench fixed; a model that keeps needing it is named (harness/tool_repairs.py)."""

    def test_requests_and_a_model_that_keeps_needing_repairs(self):
        from datetime import datetime, timedelta, timezone
        from harness import decision_log, tool_repairs
        with tempfile.TemporaryDirectory() as directory:
            workspace = {'jobs': [{'id': 'a'}, {'id': 'b'}, {'id': 'c'}]}
            self.assertEqual(tool_repairs.annotate(workspace, directory), workspace, 'nothing logged: unchanged')
            for request, tool in [('a', 'read'), ('a.1234', 'write'), ('b', 'read')]:
                decision_log.record(directory, request, 'tool_call_repaired', 'code', {'model': 'gemma4:e4b-mlx', 'tool': tool, 'pattern': 'bare/python'}, rule='tool_repair', automatic=True)
            shown = tool_repairs.annotate(workspace, directory)
            self.assertEqual(shown['jobs'][0]['tool_repairs'], {'count': 2, 'model': 'gemma4:e4b-mlx', 'tools': ['read', 'write']}, 'a chained request counts for its job')
            self.assertNotIn('tool_repairs', shown['jobs'][2])
            self.assertEqual(shown['tool_repairs'], [], 'two requests are not yet a pattern')
            decision_log.record(directory, 'c', 'tool_call_repaired', 'code', {'model': 'gemma4:e4b-mlx', 'tool': 'read', 'pattern': 'bare/python'}, rule='tool_repair', automatic=True)
            self.assertEqual(tool_repairs.annotate(workspace, directory)['tool_repairs'], [{'model': 'gemma4:e4b-mlx', 'requests': 3, 'calls': 4}])
            later = datetime.now(timezone.utc) + timedelta(days=15)
            self.assertEqual(tool_repairs.recurring(tool_repairs.rows(directory), now=later), [], 'old repairs fade')


class WithTheServices(unittest.TestCase):
    """The proxy starts and stops with the workbench's services, one per workbench, and its address reaches Pi."""

    def services(self, directory, **extra):
        import os, subprocess, sys
        env = {**os.environ, 'PI_AGENT_DATA': directory, 'PI_GATE_PORT': '0', 'PI_WEB_PORT': '0', 'PI_TAILSCALE': 'false', **extra}
        return subprocess.Popen([sys.executable, str(Path(__file__).resolve().parents[1] / 'harness/services.py')], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    def test_started_announced_and_stopped_with_the_services(self):
        upstream = Upstream(); self.addCleanup(upstream.close)
        upstream.reply = (200, completion('<call>read(path="a.txt")</call>'), 0)
        with tempfile.TemporaryDirectory() as directory:
            process = self.services(directory, PI_OLLAMA_URL=upstream.url[:-3])
            try:
                ready = json.loads(process.stdout.readline())
                self.assertRegex(ready['repair'], r'^http://127\.0\.0\.1:\d+/v1$')
                port = int(ready['repair'].split(':')[2].split('/')[0])
                connection = http.client.HTTPConnection('127.0.0.1', port, timeout=10)
                connection.request('POST', '/v1/chat/completions', body=json.dumps({'model': 'm', 'messages': [], 'tools': TOOLS}), headers={'Content-Type': 'application/json'})
                answer = json.loads(connection.getresponse().read())
                self.assertEqual(answer['choices'][0]['message']['tool_calls'][0]['function']['name'], 'read')
                self.assertTrue((Path(directory) / 'decisions.jsonl').is_file(), 'logged in the workbench data folder')
            finally:
                process.terminate(); process.wait(timeout=15); process.stdout.close(); process.stderr.close()
            with self.assertRaises(OSError, msg='gone with the services'):
                http.client.HTTPConnection('127.0.0.1', port, timeout=2).request('GET', '/v1/models')

    def test_turned_off_and_an_occupied_port(self):
        with tempfile.TemporaryDirectory() as directory:
            process = self.services(directory, PI_TOOL_REPAIR='0', PI_OLLAMA_URL='http://127.0.0.1:9')
            try: self.assertNotIn('repair', json.loads(process.stdout.readline()))
            finally: process.terminate(); process.wait(timeout=15); process.stdout.close(); process.stderr.close()
        with tempfile.TemporaryDirectory() as directory, socket.socket() as occupied:
            occupied.bind(('127.0.0.1', 0)); occupied.listen()
            process = self.services(directory, PI_TOOL_REPAIR_PORT=str(occupied.getsockname()[1]), PI_OLLAMA_URL='http://127.0.0.1:9')
            _, stderr = process.communicate(timeout=15)
            self.assertNotEqual(process.returncode, 0)
            self.assertNotIn('Traceback', stderr)
            self.assertIn(f'port {occupied.getsockname()[1]} (the tool-call repair proxy) is already in use', stderr)


if __name__ == '__main__':
    unittest.main()
