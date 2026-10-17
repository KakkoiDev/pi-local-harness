"""Task 290: conversation repairs. Choice answers have their own route, drafts stay the person's, messages are never
swallowed by a system question, stale questions settle, and a crash or a stop keeps what Pi had written.

Adapted from the 2026-10-18 review's scratch repros (items 4, 5, 8, 9, 18 and the P2 lines)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import http.client
import http.server
import json
import re
import tempfile
import threading
import unittest
from pathlib import Path

from gate.engine import GateEngine
from gate.ledger import ProposalLedger
from harness.web_chat import WebChat, WebHandler

ROOT = Path(__file__).resolve().parent.parent
QUESTION = 'Park or drop?'


class Workbench:
    """A workbench (web routes, queue, Gate's ledger in process) whose queue holds every request until released."""
    def __init__(self, case):
        directory = tempfile.TemporaryDirectory(); case.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.chat = WebChat(self.root / 'chats', 9, 0, data_root=self.root / 'data'); case.addCleanup(self.chat.close)
        self.held = True; self.chat.queue.busy = lambda: self.held
        engine = GateEngine(str(ROOT / 'specs/judges.md'), str(self.root / 'gate-audit.log'))
        self.ledger = ProposalLedger(engine, protocol_file=self.root / 'data' / 'gate-protocol.json', events_file=self.root / 'data' / 'gate-events.jsonl')
        self.chat.ledger = self.ledger; self.ledger.paperwork.projects = self.chat.documents
        class Handler(WebHandler): pass
        Handler.chat = self.chat; Handler.log_message = lambda *args: None
        self.server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        threading.Thread(target=self.server.serve_forever, daemon=True).start()
        case.addCleanup(self.server.server_close); case.addCleanup(self.server.shutdown)
        self.case = case
        self.project = self.chat.documents.create_project('Counter', None, 'empty')
        self.conversation = self.chat.project_chat(self.project)['id']
        self.folder = self.chat.documents.project_path(self.project)

    def call(self, path, body=None, person=True):
        connection = http.client.HTTPConnection('127.0.0.1', self.server.server_port, timeout=10)
        headers = {'Content-Type': 'application/json', 'Host': f'127.0.0.1:{self.server.server_port}'}
        if person: headers['X-Pi-Person'] = WebHandler.person_secret
        connection.request('GET' if body is None else 'POST', path, body=None if body is None else json.dumps(body), headers=headers)
        response = connection.getresponse(); raw = response.read(); connection.close()
        return response.status, json.loads(raw)

    def ask(self, question=QUESTION, labels=('Park', 'Drop'), identifier='q1', request='paused'):
        """Pi asked a question and paused: Gate holds it pending; the chat shows its card."""
        paperwork = self.ledger.paperwork
        paperwork.start(request, str(self.folder), 'Tidy the list')
        pending = paperwork.choice_pending(request, {'question': question, 'options': [{'label': label} for label in labels], 'recommended': 0})
        paperwork.pause(request)
        identifier = pending.get('id', identifier)
        self.chat.store.append(self.conversation, {'role': 'assistant', 'content': 'Before the question.', 'choice': {**pending, 'id': identifier}})
        return identifier

    def queued(self):
        return [job for job in self.chat.queue.list() if job['status'] == 'queued']

    def messages(self):
        return self.chat.store.get(self.conversation)['messages']


class ChoiceRouteTest(unittest.TestCase):
    def setUp(self):
        self.bench = Workbench(self)

    def test_an_answer_goes_through_its_own_route_once_and_locks_the_card(self):
        bench = self.bench; identifier = bench.ask()
        status, body = bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'option': 0, 'key': 'tab-a'})
        self.assertEqual(status, 200, body)
        self.assertEqual(body['answer'], 'Park')
        self.assertEqual([job['message'] for job in bench.queued()], [f'Choice: {QUESTION} → Park'])
        card = bench.messages()[-1]['choice']
        self.assertEqual((card['answer'], card['state']), ('Park', 'chosen'), 'the card is locked once answered')
        again = bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'option': 0, 'key': 'tab-a'})[1]
        self.assertEqual(again['job'], body['job'], 'the same key answers with the same request')
        other = bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'option': 1, 'key': 'tab-b'})[1]
        self.assertTrue(other['answered']); self.assertEqual(other['answer'], 'Park', 'a second tab cannot change it')
        self.assertEqual(len(bench.queued()), 1)

    def test_only_the_persons_page_answers(self):
        bench = self.bench; identifier = bench.ask()
        status, body = bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'option': 0, 'key': 'k'}, person=False)
        self.assertEqual(status, 403, body)
        self.assertEqual(bench.queued(), [])

    def test_a_stale_or_unknown_question_id_is_a_no_op(self):
        bench = self.bench; bench.ask()
        status, body = bench.call('/api/choices/answer', {'project': bench.project, 'id': 'not-this-one', 'option': 0, 'key': 'k'})
        self.assertEqual(status, 200, body); self.assertTrue(body['stale'])
        self.assertEqual(bench.queued(), [])
        self.assertNotIn('answer', bench.messages()[-1]['choice'])

    def test_an_older_card_is_stale_once_a_newer_question_waits(self):
        bench = self.bench; old = bench.ask()
        new = bench.ask('Which colour?', ('Red', 'Blue'), request='second')
        self.assertNotEqual(old, new)
        self.assertTrue(bench.call('/api/choices/answer', {'project': bench.project, 'id': old, 'option': 0, 'key': 'k'})[1]['stale'])
        self.assertEqual(bench.call('/api/choices/answer', {'project': bench.project, 'id': new, 'option': 1, 'key': 'k2'})[1]['answer'], 'Blue')

    def test_something_else_takes_the_persons_words(self):
        bench = self.bench; identifier = bench.ask()
        self.assertEqual(bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'text': ' ', 'key': 'k3'})[0], 400)
        body = bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'text': '  Archive it ', 'key': 'k'})[1]
        self.assertEqual(body['answer'], 'Archive it')
        self.assertEqual(bench.queued()[0]['message'], f'Choice: {QUESTION} → Archive it')

    def test_two_tabs_answering_at_once_make_one_request(self):
        bench = self.bench; identifier = bench.ask(); results = []
        def answer(option, key): results.append(bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'option': option, 'key': key})[1])
        threads = [threading.Thread(target=answer, args=(index % 2, f'tab-{index}')) for index in range(6)]
        [thread.start() for thread in threads]; [thread.join() for thread in threads]
        self.assertEqual(len(bench.queued()), 1)
        self.assertEqual(len({result['answer'] for result in results}), 1)

    def test_an_answer_never_merges_with_queued_messages_and_runs_before_them(self):
        bench = self.bench; identifier = bench.ask()
        plain = bench.chat.enqueue({'project': bench.project, 'message': 'Also add a footer'})
        answer = bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'option': 0, 'key': 'k'})[1]
        later = bench.chat.enqueue({'project': bench.project, 'message': 'And a header'})
        self.assertNotEqual(answer['job'], plain['id']); self.assertFalse(later.get('merged') and later['id'] == answer['job'])
        messages = [job['message'] for job in bench.queued()]
        self.assertIn(f'Choice: {QUESTION} → Park', messages)
        self.assertTrue(any(message == 'Also add a footer\n\nAnd a header' or message == 'Also add a footer' for message in messages))
        self.assertEqual(messages[0], f'Choice: {QUESTION} → Park', 'Pi gets the answer it waits for first')
        with bench.chat.queue.condition:
            first = next(job for job in bench.chat.queue.jobs if job['status'] == 'queued' and bench.chat.queue.runnable(job))
        self.assertEqual(first['id'], answer['job'])

    def test_a_choice_message_sent_as_a_plain_request_takes_the_same_path(self):
        bench = self.bench; identifier = bench.ask()
        status, body = bench.call('/api/jobs/create', {'project': bench.project, 'message': f'Choice: {QUESTION} → Drop'})
        self.assertEqual(status, 200, body)
        self.assertEqual(bench.messages()[-1]['choice']['answer'], 'Drop')
        self.assertEqual(bench.call('/api/jobs/create', {'project': bench.project, 'message': f'Choice: {QUESTION} → Park'})[1].get('answered'), True)
        self.assertEqual(len(bench.queued()), 1)
        self.assertTrue(bench.call('/api/jobs/create', {'project': bench.project, 'message': 'Choice: Nothing asked this? → Yes'})[1]['stale'])
        self.assertEqual(len(bench.queued()), 1)
        del identifier

    def test_gate_gives_each_question_an_id_and_keeps_it_while_it_is_asked_again(self):
        paperwork = self.bench.ledger.paperwork; folder = str(self.bench.folder)
        paperwork.start('one', folder, 'Tidy')
        first = paperwork.choice_pending('one', {'question': QUESTION, 'options': [{'label': 'Park'}, {'label': 'Drop'}], 'recommended': 0})
        self.assertRegex(first['id'], r'^[0-9a-f]{12,}$')
        paperwork.pause('one'); paperwork.start('two', folder, 'Something else')
        again = paperwork.choice_pending('two', {'question': QUESTION, 'options': [{'label': 'Park'}, {'label': 'Drop'}], 'recommended': 0, 'system_owned': True})
        self.assertEqual(again['id'], first['id'])


if __name__ == '__main__':
    unittest.main()
