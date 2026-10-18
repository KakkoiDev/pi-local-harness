"""Task 324, the chat critical path (the owner, 2026-10-18: "the critical path of user chatting with agent is completely
broken. audit it."). A model stream that stalls after a tool ends the request (it no longer holds the queue for an
hour); a request whose worker is gone never stays running; [CANARY] is never saved or shown; an unreachable Ollama is
said plainly. Docs: docs/reviews/2026-10-18-chat-critical-path-audit.md."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import os
import sys
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from harness import web_chat
from harness.canary import strip_canary
from harness.web_chat import WebChat, readable_error
from harness.work_queue import WorkQueue, display_text


class CanaryTest(unittest.TestCase):
    def test_a_leading_marker_goes_bare_in_code_or_bold(self):
        for text in ['[CANARY] Done.', '[CANARY]Done.', '  [CANARY]\n\nDone.', '`[CANARY]` Done.', '**[CANARY]** Done.', '**[CANARY]**\n\nDone.', '[CANARY]: Done.', '_[CANARY]_ Done.']:
            self.assertEqual(strip_canary(text), 'Done.', text)

    def test_the_rest_of_the_answer_stays_as_written(self):
        self.assertEqual(strip_canary('Quoting [CANARY] mid-text stays.'), 'Quoting [CANARY] mid-text stays.')
        self.assertEqual(strip_canary('[CANARY]\n- one\n- two'), '- one\n- two', 'a list after the marker keeps its first bullet')
        self.assertEqual(strip_canary('[CANARY]\n**Bold** start'), '**Bold** start')
        self.assertEqual(strip_canary(''), '')

    def test_a_reply_still_streaming_never_flashes_the_marker(self):
        for head in ['[', '[CAN', '`[CANARY', '**[CANARY]']:
            self.assertEqual(strip_canary(head, streaming=True), '', head)
            self.assertEqual(display_text(head, streaming=True), '', head)
        self.assertEqual(strip_canary('Hello', streaming=True), 'Hello')
        self.assertEqual(display_text('`[CANARY]` Planned.'), 'Planned.')


class ReadableErrorTest(unittest.TestCase):
    def test_an_unreachable_ollama_is_said_plainly(self):
        self.assertRegex(readable_error('Connection error.'), r'^Ollama is not answering .*Start Ollama.*Retry\.$')
        self.assertRegex(readable_error('connect ECONNREFUSED 127.0.0.1:11434'), r'^Ollama is not answering')
        self.assertEqual(readable_error('Something else'), 'Something else')


class FakePi(unittest.TestCase):
    """A WebChat with the fake Pi on PATH, in a scratch folder."""
    model_silence = 1.5
    silence = 3600

    def setUp(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); self.root = root = Path(temp.name)
        executable = root / 'pi'; executable.write_text('#!' + sys.executable + '\n' + Path('tests/fixtures/fake-pi.py').read_text()); executable.chmod(0o755)
        for patcher in [patch.dict(os.environ, {'PATH': str(root) + os.pathsep + os.environ['PATH']}),
                        patch.object(web_chat, 'MODEL_SILENCE', self.model_silence), patch.object(web_chat, 'SILENCE', self.silence)]:
            patcher.start(); self.addCleanup(patcher.stop)
        self.chat = WebChat(root / 'chats', 12345, 3000, data_root=root / 'workspace'); self.addCleanup(self.chat.close)
        self.project = self.chat.documents.create_project('Pong')
        self.conversation = self.chat.project_chat(self.project)['id']

    def messages(self):
        return self.chat.store.get(self.conversation)['messages']

    def job(self, identifier, states=('completed', 'failed', 'stopped', 'interrupted', 'waiting'), timeout=20):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            job = next((item for item in self.chat.queue.list() if item['id'] == identifier), None)
            if job and job['status'] in states: return job
            time.sleep(0.05)
        self.fail(f'{identifier} did not reach {states}: {job}')


class StalledModelTest(FakePi):
    def test_a_stream_that_stalls_after_a_tool_fails_the_request_and_stops_its_pi(self):
        started = time.monotonic()
        with self.assertRaisesRegex(ValueError, r'^the model stopped answering \(no reply in 1\.5 s\)\.$'):
            self.chat.send(self.conversation, {'message': 'Plan the icons TEST_HANG_AFTER_TOOL'}, lambda event: None)
        self.assertLess(time.monotonic() - started, 15, 'not the hour-long silence limit')
        pid = int((self.chat.store.folder(self.conversation) / 'session.pid').read_text())
        with self.assertRaises(ProcessLookupError, msg='the Pi process the harness started is stopped'): os.kill(pid, 0)
        answer = self.messages()[-1]
        self.assertEqual(answer['content'], 'Reading the roadmap first.', 'the partial answer is kept')
        self.assertEqual(answer['ended'], {'state': 'failed', 'reason': 'the model stopped answering (no reply in 1.5 s).'})
        self.assertEqual(self.chat.active, {}, 'no worker is left')

    def test_the_next_queued_request_starts_after_a_stall(self):
        stuck = self.chat.enqueue({'project': self.project, 'message': 'Plan the icons TEST_HANG_AFTER_TOOL'})
        self.job(stuck['id'], ('running',))
        waiting = self.chat.enqueue({'project': self.project, 'message': "let's plan the icons now"})
        self.assertEqual(self.job(stuck['id'])['status'], 'failed')
        self.assertEqual(self.job(stuck['id'])['progress'], 'the model stopped answering (no reply in 1.5 s).')
        done = self.job(waiting['id'])
        self.assertEqual(done['status'], 'completed', 'the request behind the stall runs')
        self.assertRegex(self.messages()[-1]['content'], r'^reply \d+$')

    def test_a_thinking_model_that_keeps_streaming_is_not_stalled(self):
        started = time.monotonic()
        self.chat.send(self.conversation, {'message': 'Think it through TEST_THINK'}, lambda event: None)  # 8 thoughts, 0.6 s apart
        self.assertGreater(time.monotonic() - started, 3, 'longer than the model limit in all')
        self.assertRegex(self.messages()[-1]['content'], r'^reply \d+$')

    def test_a_slow_first_token_is_not_a_stall(self):
        """2026-10-19 (live): qwen3.8:27b took over 120 s to load and read a long prompt; the request was healthy."""
        with patch.object(web_chat, 'MODEL_START', 10):
            self.chat.send(self.conversation, {'message': 'Start slowly TEST_SLOW_START'}, lambda event: None)  # 3 s before any output
        self.assertRegex(self.messages()[-1]['content'], r'^reply \d+$')

    def test_a_model_that_never_starts_fails_with_its_own_reason(self):
        with patch.object(web_chat, 'MODEL_START', 2), self.assertRaisesRegex(ValueError, r'^the model did not start answering \(no reply in 2 s\)\.$'):
            self.chat.send(self.conversation, {'message': 'Start slowly TEST_SLOW_START'}, lambda event: None)

    def test_long_work_that_keeps_reporting_is_not_stalled(self):
        self.chat.send(self.conversation, {'message': 'Long work TEST_TICK'}, lambda event: None)
        self.assertNotIn('ended', self.messages()[-1])


class ProgressTextTest(FakePi):
    def test_progress_never_claims_attachments_and_says_the_model_may_be_loading(self):
        events = []
        self.chat.send(self.conversation, {'message': 'Hello'}, events.append)
        said = [event['text'] for event in events if event.get('type') == 'status']
        self.assertNotIn('Preparing attachments…', said)
        self.assertEqual(said[:2], ['Starting Pi…', 'Waiting for the model (it may be loading)…'])


class RunningToolTest(FakePi):
    model_silence = 1
    silence = 3

    def test_a_running_command_has_the_long_limit_not_the_model_limit(self):
        with self.assertRaisesRegex(ValueError, 'Pi sent nothing for 3 seconds'):
            self.chat.send(self.conversation, {'message': 'Build it TEST_WAIT'}, lambda event: None)


class CanaryInTheChatTest(FakePi):
    def test_the_marker_is_never_saved_in_the_chat_the_job_or_its_record(self):
        for trigger in ('TEST_CANARY_CODE', 'TEST_CANARY_BOLD', 'TEST_FINAL_TEXT'):
            job = self.chat.enqueue({'project': self.project, 'message': f'Say it {trigger}'})
            finished = self.job(job['id'])
            self.assertEqual(finished['status'], 'completed')
            self.assertNotIn('[CANARY]', finished['text'])
            self.assertNotIn('[CANARY]', self.messages()[-1]['content'])
            record = (self.chat.documents.root / 'activity' / (job['id'] + '.md')).read_text()
            self.assertNotIn('[CANARY]', record.split('## Request', 1)[1])
        self.assertRegex(self.messages()[-3]['content'], r'^reply \d+$')


class OllamaDownTest(FakePi):
    def test_an_unreachable_ollama_fails_the_request_with_what_to_do_and_the_queue_goes_on(self):
        down = self.chat.enqueue({'project': self.project, 'message': 'Hello TEST_OLLAMA_DOWN'})
        later = self.chat.enqueue({'project': self.project, 'message': 'Hello again'})
        failed = self.job(down['id'])
        self.assertEqual(failed['status'], 'failed'); self.assertRegex(failed['progress'], r'^Ollama is not answering')
        self.assertEqual(self.job(later['id'])['status'], 'completed')

    def test_a_model_error_keeps_the_partial_answer_and_the_reason(self):
        job = self.chat.enqueue({'project': self.project, 'message': 'Hello TEST_MODEL_ERROR'})
        self.assertEqual(self.job(job['id'])['status'], 'failed')
        failed = next(message for message in self.messages() if message.get('ended'))
        self.assertEqual(failed['content'], 'Starting the answer')
        self.assertIn('model runner has unexpectedly stopped', failed['ended']['reason'])


class NoZombieTest(unittest.TestCase):
    def test_a_running_request_whose_worker_is_gone_is_settled_and_the_lane_moves_on(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        ran = []
        queue = WorkQueue(Path(temp.name) / 'queue.json', lambda job, emit: ran.append(job['data']['message']), start=False)
        first = queue.add('p', 'c', {'message': 'first'}); queue.add('p', 'd', {'message': 'second'})  # another chat: never joined
        job = next(item for item in queue.jobs if item['id'] == first['id'])
        with queue.condition: queue.claim(job)
        dead = threading.Thread(target=lambda: None); dead.start(); dead.join()
        queue.owners[first['id']] = dead  # its thread ended without settling it (the lane would wait forever)
        queue.dispatch()
        deadline = time.monotonic() + 5
        while ran != ['second'] and time.monotonic() < deadline: time.sleep(0.02)
        states = {item['id']: item['status'] for item in queue.list()}
        self.assertEqual(states[first['id']], 'failed')
        self.assertEqual(ran, ['second'])
        self.assertIn('ended without finishing', next(item for item in queue.list() if item['id'] == first['id'])['progress'])

    def test_a_restart_never_leaves_a_request_running(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup)
        queue = WorkQueue(Path(temp.name) / 'queue.json', lambda job, emit: None, start=False)
        added = queue.add('p', 'c', {'message': 'first'})
        with queue.condition: queue.claim(next(item for item in queue.jobs if item['id'] == added['id']))
        again = WorkQueue(Path(temp.name) / 'queue.json', lambda job, emit: None, start=False)
        self.assertEqual([item['status'] for item in again.list()], ['interrupted'])



class GuideNeverAskedTest(unittest.TestCase):
    def test_an_unsure_guide_pick_is_no_guide_decided_by_code_never_a_card(self):
        import json
        from unittest.mock import Mock
        from harness.judgements import Judgements
        with tempfile.TemporaryDirectory() as folder:
            classifier = Mock(); classifier.ask.return_value = {'answer': None, 'confidence': .4, 'abstained': True}
            paperwork = Mock(); paperwork.data = Path(folder); paperwork.requests = {}
            result = Judgements(paperwork, classifier).decide('r', 'applicable_guide', ['add a habit', ['python', 'planning']])
            self.assertIsNone(result['answer']); self.assertNotIn('choice', result); paperwork.choice_pending.assert_not_called()
            rows = [json.loads(line) for line in (Path(folder) / 'decisions.jsonl').read_text().splitlines()]
            self.assertEqual((rows[-1]['who'], rows[-1]['answer']), ('code', 'none'), 'recorded as an automatic decision')
            classifier.ask.return_value = {'answer': 'python', 'confidence': .99, 'abstained': False}
            self.assertEqual(Judgements(paperwork, classifier).decide('r', 'applicable_guide', ['add a habit', ['python']])['answer'], 'python')



class StopKeepsTheTaskTest(unittest.TestCase):
    """Live finding 17: after Stop, every call of the next request was refused "No approved task is in progress"."""
    def test_a_stopped_request_leaves_its_task_in_progress_and_the_harness_notes_do_not_change_the_plan(self):
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        from harness.documents import DocumentStore
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); base = Path(temp.name).resolve(); data = base / 'data'; data.mkdir()
        store = DocumentStore(data); root = Path(store.project_path(store.create_project('Probe', str(base), 'empty')))
        roadmap = root / 'ROADMAP.md'; roadmap.write_text(roadmap.read_text().replace('Describe what we are building.', 'Count clicks.') + '- [ ] [002-Count](tasks/002-count.md)\n')
        (root / 'tasks/002-count.md').write_text('# 002: Count\n\nKind: code\nFiles: counter.py\n\nDone when: Counts.\n\n- [ ] Red: a test fails for this change.\n- [ ] Green: the test passes with this change.\n\n## Decisions\n\n')
        paper = Paperwork(Protocol(), data=data); paper.projects = store; paths = ['tasks/002-count.md']
        paper.plan_state(root, {'tasks': paths, 'pending': True, 'digest': paper.plan_digest(root, paths)}); paper.start_building(root)
        paper.start('job1', str(root), 'Build the approved task.'); (root / 'counter.py').write_text('x = 1\n')
        result = paper.end('job1', review=False, stopped=True)
        self.assertEqual(result['outcome'], 'not verified'); self.assertNotIn('check_in', result, 'no check-in for a stop')
        self.assertIn('Not verified at', (root / paths[0]).read_text(), 'the harness noted it in the task')
        self.assertTrue(paper.active_scope(root), 'the task is still in progress')
        (root / paths[0]).write_text((root / paths[0]).read_text() + '- Colour?: Red (chosen 2026-10-18T10:00:00+09:00)\n')
        self.assertTrue(paper.active_scope(root), 'a decision the harness records is not a change of the plan')


    def test_an_old_digest_saved_with_fewer_decisions_still_names_the_plan_and_is_upgraded(self):
        """Live, 2026-10-19: the old build re-saved its digest after each decision (Decisions counted); the new build
        appended one more decision without re-saving, and every call was refused "No approved task is in progress"."""
        from gate.paperwork import Paperwork
        from gate.protocol import Protocol
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); base = Path(temp.name).resolve(); data = base / 'data'; data.mkdir()
        root = base / 'proj'; (root / 'tasks').mkdir(parents=True)
        (root / 'ROADMAP.md').write_text('# P\n\n## Goal\n\nCount clicks.\n\n## Tasks\n\n- [ ] [002-Count](tasks/002-count.md)\n')
        task = root / 'tasks/002-count.md'
        task.write_text('# 002: Count\n\nPlan approved: chosen 2026-10-18T09:00:00+09:00\n\nKind: code\nFiles: counter.py\n\nDone when: Counts.\n\n## Decisions\n'
                        + ''.join(f'- Guide?: None (chosen 2026-10-18T1{n}:00:00+09:00)\n' for n in range(3)))
        paper = Paperwork(Protocol(), data=data); paths = ['tasks/002-count.md']
        old_digest = paper.plan_digest(root, paths, legacy=True)  # what the old build saved after the third decision
        paper.plan_state(root, {'tasks': paths, 'approved': True, 'index': 0, 'digest': old_digest})
        task.write_text(task.read_text() + '- Guide?: None (chosen 2026-10-19T00:56:25+09:00)\n')  # the new build's fourth
        self.assertTrue(paper.active_scope(root), 'the approved task is still in progress')
        self.assertEqual(paper.plan_state(root)['digest'], paper.plan_digest(root, paths), 'the digest is upgraded to the new form')
        task.write_text(task.read_text().replace('Files: counter.py', 'Files: counter.py, other.py'))
        self.assertFalse(paper.active_scope(root), 'a real change of the scope still stops the plan')


if __name__ == '__main__':
    unittest.main()
