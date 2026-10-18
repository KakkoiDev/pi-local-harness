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


class SystemQuestionTest(unittest.TestCase):
    """Review items 4 and 5: a system question never swallows the person's message, and never asks again on its answer."""
    def setUp(self):
        self.bench = Workbench(self); self.ledger = self.bench.ledger; self.folder = str(self.bench.folder)

    def test_the_phase_question_never_asks_again_on_its_own_answer(self):
        self.ledger.start_request('answer', self.folder, 'Choice: Which phase would you like to choose with the phase control? → Planning')
        self.assertIsNone(self.ledger.request_advice('answer'))
        self.assertIsNone(self.ledger.paperwork.waiting_choice(self.bench.folder))

    def test_without_laya_a_phase_word_is_a_notice_not_a_blocking_card(self):
        self.ledger.start_request('explain', self.folder, 'Explain the planning module')
        advice = self.ledger.request_advice('explain')
        self.assertNotIn('choice', advice)
        self.assertRegex(advice['notice'], r'phase button')
        self.assertIsNone(self.ledger.paperwork.waiting_choice(self.bench.folder), 'nothing waits for the person')

    def test_a_message_sent_while_a_question_waits_reaches_pi_after_the_answer(self):
        self.bench.ask()
        self.ledger.start_request('plain', self.folder, 'Also add a footer')
        advice = self.ledger.request_advice('plain')
        self.assertEqual(advice['choice']['question'], QUESTION, 'the waiting question is asked again')
        self.ledger.paperwork.pause('plain')
        self.ledger.start_request('answer', self.folder, f'Choice: {QUESTION} → Park')
        self.assertIsNone(self.ledger.request_advice('answer'))
        self.assertEqual(self.ledger.held('answer'), ['Also add a footer'])
        self.assertIsNone(self.ledger.paperwork.waiting_choice(self.bench.folder))
        self.ledger.start_request('later', self.folder, 'Thanks')
        self.assertEqual(self.ledger.held('later'), [], 'held words are delivered once')

    def test_a_system_card_raised_at_the_start_keeps_the_message_it_interrupted(self):
        from harness.judgements import Judgements
        class Unsure:  # an installed Laya that abstains: the card is the person's to answer
            def ask(self, *args, **kwargs): return {'answer': None, 'confidence': .4, 'abstained': True}
            def available(self): return True
        self.ledger.judgements = Judgements(self.ledger.paperwork, classifier=Unsure())
        self.ledger.start_request('first', self.folder, 'Move to implementation and add a footer')
        advice = self.ledger.request_advice('first')
        self.assertIn('choice', advice)
        identifier = self.ledger.paperwork.choice_pending('first', advice['choice'])['id']  # the extension shows it
        self.ledger.paperwork.pause('first')
        self.ledger.start_request('answer', self.folder, f"Choice: {advice['choice']['question']} → Implementation")
        self.assertEqual(self.ledger.held('answer'), ['Move to implementation and add a footer'])
        del identifier


def fake_pi(case, root):
    import sys
    executable = root / 'pi'
    executable.write_text('#!' + sys.executable + '\n' + (ROOT / 'tests/fixtures/fake-pi.py').read_text()); executable.chmod(0o755)
    return executable


class InlineNoticeTest(unittest.TestCase):
    def test_a_harness_notice_stays_under_the_answer_in_the_chat(self):
        import os
        from unittest.mock import patch
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); executable = fake_pi(self, root)
            chat = WebChat(root / 'data', 12345, 3000, gate_token='scratch'); self.addCleanup(chat.close)
            conversation = chat.store.create()
            with patch.dict(os.environ, {'PI_BINARY': str(executable)}):
                chat.send(conversation['id'], {'message': 'Explain the planning module TEST_NOTICE'}, lambda event: None)
            answer = chat.store.get(conversation['id'])['messages'][-1]
            self.assertEqual(answer['notices'], ['Pi cannot change the phase. To move the work, use the phase button: Discussion, Planning or Implementation.'])


PLAN = {'goal': 'A counter', 'tasks': [{'title': 'Count clicks', 'kind': 'code', 'files': ['app.py'], 'done_when': 'A click increments the count.', 'content': 'Check a click. Implement the handler.'}]}


class StaleQuestionTest(unittest.TestCase):
    """Review item 18 and the P2 lines: approval or a new plan settles an older question; one question at a time."""
    def setUp(self):
        self.bench = Workbench(self); self.paperwork = self.bench.ledger.paperwork; self.folder = self.bench.folder

    def plan(self):
        self.paperwork.phase(self.folder, 'planning')
        self.paperwork.start('plan', str(self.folder), 'Plan a counter')
        return self.paperwork.propose_plan('plan', PLAN)

    def test_a_new_plan_settles_an_older_question(self):
        self.bench.ask()
        self.plan()
        self.assertIsNone(self.paperwork.waiting_choice(self.folder), 'the plan replaced the question')
        self.assertEqual(json.loads(self.paperwork.choice_file(self.folder).read_text())['settled'], 'a new plan')

    def test_start_building_settles_an_older_question_in_gate_and_in_the_chat(self):
        self.plan(); self.paperwork.pause('plan')
        identifier = self.bench.ask(request='late')
        status, body = self.bench.call('/api/phase/build', {'project': self.bench.project})
        self.assertEqual(status, 200, body)
        self.assertIsNone(self.paperwork.waiting_choice(self.folder))
        card = self.bench.messages()[-1]['choice']
        self.assertEqual(card['settled'], 'Start Building')
        self.assertTrue(self.bench.call('/api/choices/answer', {'project': self.bench.project, 'id': identifier, 'option': 0, 'key': 'k'})[1]['stale'])

    def test_the_chat_settles_older_cards_when_a_plan_arrives(self):
        store = self.bench.chat.store; chat = self.bench.conversation
        store.append(chat, {'role': 'assistant', 'content': 'Q', 'choice': {'id': 'a', 'question': 'Old?', 'options': [{'label': 'A'}, {'label': 'B'}]}})
        store.append(chat, {'role': 'assistant', 'content': 'Q', 'choice': {'id': 'b', 'question': 'Done?', 'options': [{'label': 'A'}, {'label': 'B'}], 'answer': 'A'}})
        store.settle_choices(chat, 'a new plan')
        cards = [message['choice'] for message in store.get(chat)['messages'] if message.get('choice')]
        self.assertEqual([card.get('settled') for card in cards], ['a new plan', None], 'an answered card keeps its answer')

    def test_a_second_question_in_one_request_is_refused(self):
        self.paperwork.start('two', str(self.folder), 'Tidy')
        self.paperwork.choice_pending('two', {'question': 'First?', 'options': [{'label': 'A'}, {'label': 'B'}], 'recommended': 0})
        with self.assertRaisesRegex(ValueError, 'One question at a time'):
            self.paperwork.choice_pending('two', {'question': 'Second?', 'options': [{'label': 'A'}, {'label': 'B'}], 'recommended': 0})
        self.assertEqual(self.paperwork.waiting_choice(self.folder)['question'], 'First?')


class EndedAnswerTest(unittest.TestCase):
    """Review P2: a crash or a stop mid-answer keeps the partial text in the chat, marked, exactly once; Gate gets the
    request's end; a failed request shows the question it left waiting."""
    def setUp(self):
        import os
        from unittest.mock import patch
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        root = Path(directory.name); executable = fake_pi(self, root)
        binary = patch.dict(os.environ, {'PI_BINARY': str(executable)}); binary.start(); self.addCleanup(binary.stop)
        self.chat = WebChat(root / 'chats', 12345, 3000, data_root=root / 'data', gate_token='scratch'); self.addCleanup(self.chat.close)
        engine = GateEngine(str(ROOT / 'specs/judges.md'), str(root / 'gate-audit.log'))
        self.ledger = ProposalLedger(engine, protocol_file=root / 'data' / 'gate-protocol.json', events_file=root / 'data' / 'gate-events.jsonl')
        self.chat.ledger = self.ledger; self.ledger.paperwork.projects = self.chat.documents
        self.project = self.chat.documents.create_project('Ended', None, 'empty')
        self.conversation = self.chat.project_chat(self.project)['id']

    def run_request(self, message):
        import uuid
        job = uuid.uuid4().hex
        self.ledger.paperwork.start(job, str(self.chat.documents.project_path(self.project)), message)  # as the extension does
        try: self.chat.send(self.conversation, {'message': message, 'project': self.project}, lambda event: None, job=job); error = None
        except ValueError as raised: error = str(raised)
        return job, error, self.chat.store.get(self.conversation)['messages']

    def test_a_crash_mid_answer_keeps_the_partial_text_marked_failed_once(self):
        job, error, messages = self.run_request('Explain TEST_CRASH')
        self.assertIn('Pi exited unexpectedly', error)
        answers = [message for message in messages if message['role'] == 'assistant']
        self.assertEqual(len(answers), 1, 'exactly once')
        self.assertEqual(answers[0]['content'], 'PARTIAL: the first half of a long answer')
        self.assertEqual(answers[0]['ended']['state'], 'failed'); self.assertIn('segfault', answers[0]['ended']['reason'])
        self.assertNotIn(job, self.ledger.paperwork.requests, 'Gate got the request’s end')

    def test_a_crash_before_any_text_still_says_so_in_the_chat(self):
        job, error, messages = self.run_request('Do the thing TEST_FAIL')
        self.assertIn('Model crashed', error)
        self.assertEqual(messages[-1]['role'], 'assistant'); self.assertEqual(messages[-1]['content'], '')
        self.assertEqual(messages[-1]['ended']['state'], 'failed'); self.assertIn('Model crashed', messages[-1]['ended']['reason'])
        self.assertEqual(messages[-1]['ended']['job'], job)

    def test_a_crash_after_the_answer_keeps_the_whole_answer(self):
        _, error, messages = self.run_request('Explain TEST_CRASH_AFTER_END')
        self.assertIn('crash after message_end', error)
        self.assertEqual([message['content'] for message in messages if message['role'] == 'assistant'], ['COMPLETE ANSWER before crash'])
        self.assertEqual(messages[-1]['ended']['state'], 'failed')

    def test_a_stop_mid_answer_keeps_the_partial_text_marked_stopped(self):
        import time
        def stop():
            for _ in range(100):
                time.sleep(0.1)
                if any(entry.get('process') for entry in self.chat.active.values()):time.sleep(0.5);self.chat.stop(self.conversation);return
        threading.Thread(target=stop, daemon=True).start()
        job, error, messages = self.run_request('Explain TEST_STREAM_WAIT')
        self.assertEqual(error, 'Stopped')
        self.assertEqual(messages[-1]['content'], 'PARTIAL before the stop')
        self.assertEqual(messages[-1]['ended'], {'state': 'stopped', 'job': job}, 'Retry queues this request again')
        self.assertNotIn(job, self.ledger.paperwork.requests)

    def test_a_failed_request_shows_the_question_it_left_waiting(self):
        _, error, messages = self.run_request('Tidy TEST_ABORTED_CHOICE')
        self.assertIn('Provider connection lost', error)
        self.assertEqual(messages[-1]['choice']['question'], 'Park or drop?')
        self.assertEqual(messages[-1]['content'], 'Answer text before the question.')
        self.assertEqual(messages[-1]['ended']['state'], 'failed')


class ActivityPauseTest(unittest.TestCase):
    """Review P2: a question or a plan pause is waiting in Activity, not Completed; "stopped by a question" is not
    "stopped by you"."""
    def queue(self, execute):
        from harness.work_queue import WorkQueue
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        return WorkQueue(Path(directory.name) / 'queue.json', execute, start=False)

    def test_a_question_or_a_plan_pause_is_waiting_for_the_person(self):
        for event, words in [({'type': 'choice', 'question': QUESTION, 'options': [], 'pending': True}, 'Stopped by a question: waiting for your answer'),
                             ({'type': 'plan', 'goal': 'A counter', 'tasks': [], 'pending': True}, 'Stopped for the plan: waiting for Start Building')]:
            with self.subTest(kind=event['type']):
                queue = self.queue(lambda job, emit, event=event: emit(event))
                queue.add('One', 'chat', {'message': 'work'}); queue.run_one()
                job = queue.list()[0]
                self.assertEqual((job['status'], job['progress']), ('waiting', words))
                queue.resume_waiting('chat', 'Answered: Park')
                self.assertEqual((queue.list()[0]['status'], queue.list()[0]['progress']), ('completed', 'Answered: Park'))

    def test_an_approved_plan_or_an_answered_question_completes(self):
        queue = self.queue(lambda job, emit: emit({'type': 'plan', 'goal': 'A counter', 'tasks': [], 'pending': False, 'approved': True}))
        queue.add('One', 'chat', {'message': 'work'}); queue.run_one()
        self.assertEqual(queue.list()[0]['status'], 'completed')

    def test_stopped_by_you_says_so(self):
        def execute(job, emit): raise ValueError('Stopped')
        queue = self.queue(execute); queue.add('One', 'chat', {'message': 'work'}); queue.run_one()
        self.assertEqual((queue.list()[0]['status'], queue.list()[0]['progress']), ('stopped', 'Stopped by you'))

    def test_answering_completes_the_paused_request_in_activity(self):
        bench = Workbench(self)
        paused = bench.chat.queue.add(bench.project, bench.conversation, {'message': 'Tidy'})
        with bench.chat.queue.condition:
            job = bench.chat.queue.jobs[0]; job.update(status='waiting', progress='Stopped by a question: waiting for your answer')
        identifier = bench.ask()
        bench.call('/api/choices/answer', {'project': bench.project, 'id': identifier, 'option': 0, 'key': 'k'})
        record = next(item for item in bench.chat.queue.list() if item['id'] == paused['id'])
        self.assertEqual((record['status'], record['progress']), ('completed', 'Answered: Park'))


class HarnessToolAndMemoryTest(unittest.TestCase):
    """Pi's harness tool proposes changes again (a preview changes nothing), and AGENTS.md's lessons can be written."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve() / 'project'; (self.root / 'tasks').mkdir(parents=True)
        (self.root / 'ROADMAP.md').write_text('# Counter\n\n## Goal\nCount clicks.\n')
        self.data = Path(self.temp.name).resolve() / 'data'; self.data.mkdir()
        self.ledger = ProposalLedger(GateEngine('', str(self.data / 'audit.log')), events_file=self.data / 'gate-events.jsonl')
        self.memory = self.data / 'AGENTS.md'; self.memory.write_text('# Local AI operating instructions\n\nStart every answer with [CANARY].\n')

    def propose(self, tool, args, pi_tool=None):
        return self.ledger.propose(tool, args, 'admin', cwd=str(self.root), pi_tool=pi_tool)

    def test_a_previewed_change_is_allowed_in_discussion(self):
        for args in [{'command': 'config', 'args': 'set language ja'}, {'command': 'models', 'args': 'use qwen3:8b'}, {'command': 'ollama', 'args': 'set keep_alive 10m'}, {'command': 'update', 'args': 'now'}]:
            with self.subTest(args=args):
                self.assertEqual(self.propose('read_file', args, 'harness')['outcome'], 'ALLOW', 'a preview changes nothing: the person runs it')

    def test_update_and_models_check_are_reads_even_when_changes_run_on_their_own(self):
        from harness.autonomy import set_enabled
        set_enabled(self.data, True, confirmed=True)
        for args in [{'command': 'update', 'args': ''}, {'command': 'models', 'args': 'check'}, {'command': 'models', 'args': 'check qwen3:8b'}]:
            with self.subTest(args=args):
                self.assertEqual(self.propose('read_file', args, 'harness')['outcome'], 'ALLOW')
        self.assertEqual(self.propose('read_file', {'command': 'update', 'args': 'now'}, 'harness')['rule'], 'G-015', 'applied on its own, it is a change')

    def test_a_lesson_can_be_added_to_the_memory_file_in_any_phase(self):
        lesson = self.memory.read_text() + '\n### Lesson\n- Run the tests without pipes.\n'
        self.assertEqual(self.propose('write_file', {'path': str(self.memory), 'content': lesson}, 'write')['outcome'], 'ALLOW')
        edit = {'path': str(self.memory), 'edits': [{'oldText': 'Start every answer with [CANARY].', 'newText': 'Start every answer with [CANARY].\n- Keep answers short.'}]}
        self.assertEqual(self.propose('write_file', edit, 'edit')['outcome'], 'ALLOW')
        self.assertEqual(self.propose('write_file', {'path': str(self.root / 'app.py'), 'content': 'x=1'}, 'write')['rule'], 'G-015', 'other files still follow the phase')

    def test_the_memory_file_stays_small(self):
        refused = self.propose('write_file', {'path': str(self.memory), 'content': self.memory.read_text() + 'x' * 5000}, 'write')
        self.assertNotEqual(refused['outcome'], 'ALLOW'); self.assertIn('at most', refused['reason'])
        self.memory.write_text('y' * 32000)
        self.assertNotEqual(self.propose('write_file', {'path': str(self.memory), 'content': 'y' * 33000}, 'write')['outcome'], 'ALLOW')
        self.assertNotEqual(self.propose('write_file', {'path': str(self.memory), 'content': 'gone'}, 'write')['outcome'], 'ALLOW', 'never emptied')


class DocsMatchBehaviourTest(unittest.TestCase):
    """The second bug hunt's documentation drift (task 290's part): the docs say what the code does."""
    def read(self, path): return (ROOT / path).read_text(encoding='utf-8')

    def test_wake_ups_are_documented_as_the_setting_with_its_default(self):
        from harness.settings import SETTINGS
        default = SETTINGS['wake_ups'][1]
        for path in ('docs/reference.md', 'harness/AGENTS.md', 'harness/GUIDE.md'):
            with self.subTest(path=path):
                text = self.read(path)
                self.assertNotRegex(text, r'(?i)one (automatic )?retry')
                self.assertIn('wake_ups', text); self.assertRegex(text, rf'default {default}\b')

    def test_every_console_command_is_in_each_list(self):
        from harness.admin import COMMANDS
        for path in ('harness/CONSOLE.md', 'harness/GUIDE.md', 'harness/README.md'):
            text = self.read(path)
            for name in COMMANDS:
                with self.subTest(path=path, command=name): self.assertRegex(text, rf'`/{name}\b')

    def test_guide_topics_are_built_from_the_guides_headings(self):
        from harness import admin
        headings = re.findall(r'^## (.+)$', self.read('harness/GUIDE.md'), re.M)
        topics = admin.guide_topics()
        self.assertEqual([heading for _, heading in topics], headings, 'one topic per question, in order')
        self.assertEqual(len({topic for topic, _ in topics}), len(headings), 'each topic names one question')
        for topic, heading in topics:
            with self.subTest(topic=topic):
                self.assertEqual(admin.guide([topic])[0]['sections'][0].splitlines()[0], '## ' + heading)
        self.assertEqual([row[0] for row in admin.completions(None, 'guide')], [topic for topic, _ in topics])

    def test_the_git_read_form_in_the_docs_is_the_one_gate_allows(self):
        from gate.phase_shell import read_only
        for path in ('docs/reference.md', 'harness/GUIDE.md'):
            commands = re.findall(r'`(git --no-pager[^`]*)`', self.read(path))
            with self.subTest(path=path):
                self.assertTrue(commands, 'the git read form is written out')
                for command in commands: self.assertTrue(read_only(command), command)

    def test_a_refused_command_says_what_pi_may_run(self):
        from gate.phases import refusal
        from gate.phase_shell import read_only
        with tempfile.TemporaryDirectory() as directory:
            for phase in ('discussion', 'planning'):
                reason = refusal(phase, directory, 'execute_command', {'command': 'git status'}, cwd=directory)
                self.assertIn('git --no-pager --no-optional-locks -c core.fsmonitor=false status', reason)
                self.assertTrue(read_only(re.search(r'`(git --no-pager[^`]*status)`', reason)[1]))
            reason = refusal('implementation', directory, 'execute_command', {'command': 'make build'}, cwd=directory, task='# 001: Count\nFiles: app.py\n', approved=True)
            self.assertIn('test runners', reason); self.assertNotIn('bash is not part', reason)
            self.assertNotIn('Not written', reason)

    def test_refusals_for_commands_have_japanese_copy(self):
        from gate import phases
        messages = json.loads(self.read('messages/ja.json'))
        for text in phases.COMMAND_REFUSALS.values():
            with self.subTest(text=text[:40]): self.assertIn(text, messages['exact'])

    def test_the_commit_protocol_says_the_harness_commits(self):
        section = self.read('docs/reference.md').split('### Commit protocol', 1)[1].split('\n## ', 1)[0]
        self.assertIn('G-013', section); self.assertIn('the harness commits', section.lower())
        self.assertIn('G-005', section)

    def test_readme_says_when_an_update_installs_and_what_laya_cannot_do(self):
        text = self.read('README.md')
        updating = text.split('## Updating', 1)[1].split('\n## ', 1)[0]
        self.assertIn('auto_update', updating)
        laya = text.split('## Local classifier', 1)[1].split('\n## ', 1)[0]
        self.assertIn('phase button', laya); self.assertIn('Without Laya', laya)

    def test_model_facing_guides_use_paths_that_resolve_and_never_ask_for_refused_commands(self):
        import subprocess
        script = "import {loadGuides} from './harness/guides.mjs';console.log(JSON.stringify(loadGuides()))"
        guides = json.loads(subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT, capture_output=True, text=True, check=True).stdout)
        texts = {guide['name']: guide['text'] for guide in guides}
        texts['AGENTS.md'] = self.read('harness/AGENTS.md')
        for name, text in texts.items():
            with self.subTest(guide=name):
                self.assertNotIn('{harness}', text, 'placeholders are filled in')
                self.assertNotRegex(text, r'(?<![/\w])kit/', 'a kit/ path does not resolve from the project')
                for path in re.findall(r'(/[^\s`,;)]+/kit/[^\s`,;)]+)', text): self.assertTrue(Path(path.rstrip('.')).exists(), path)
                for line in text.splitlines():
                    if re.search(r'\b(uv add|pip install|npm install|plh setup)\b', line): self.assertIn('person', line, line)


if __name__ == '__main__':
    unittest.main()
