"""Task 164 (plan 156 phase 2): requests have roles and run in two lanes. The chat lane runs one chat request at a
time; the work lane runs workers, comments and whole-file requests, never two in one project, and only one in all
when the model answers one request at a time. Requests in different lanes run together."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import os
import tempfile
import threading
import time
import unittest
from pathlib import Path

from harness.work_queue import WorkQueue


class LaneTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.release = {}; self.started = []; self.lock = threading.Lock()
        self.mode = 'one at a time'; self.slots = 2

    def execute(self, job, emit):
        gate = threading.Event()
        with self.lock: self.release[job['data']['message']] = gate; self.started.append(job['data']['message'])
        gate.wait(10)

    def queue(self, **options):
        queue = WorkQueue(Path(self.temp.name) / 'queue.json', self.execute, mode=lambda: (self.mode, self.slots), start=False, **options)
        def stop():  # release every request and wait until they have saved their records
            for gate in list(self.release.values()): gate.set()
            deadline = time.monotonic() + 5
            while any(job['status'] == 'running' for job in queue.list()) and time.monotonic() < deadline: time.sleep(0.01)
        self.addCleanup(stop)
        return queue

    def finish(self, queue, message):
        self.release[message].set()
        deadline = time.monotonic() + 5
        while any(job['status'] == 'running' and job['message'] == message for job in queue.list()) and time.monotonic() < deadline: time.sleep(0.01)

    def settle(self):
        time.sleep(0.15)

    def test_roles_name_where_a_request_came_from(self):
        queue = self.queue()
        roles = [queue.add('p', 'c', data)['role'] for data in [{'message': 'hi'}, {'message': 'W', 'worker': {'task': 'tasks/059.md'}},
                 {'message': 'C', 'document_comment': {'path': 'projects/p/a.md', 'id': 'x'}}, {'message': 'D', 'document': 'projects/p/a.md'}]]
        self.assertEqual(roles, ['chat', 'worker', 'comment', 'document'])

    def test_a_chat_runs_beside_the_work_lane_and_one_at_a_time_runs_one_work_request(self):
        queue = self.queue()
        queue.add('p', 'chat-p', {'message': 'W', 'worker': {'task': 'tasks/059.md'}})
        queue.add('q', 'chat-q', {'message': 'C', 'document_comment': {'path': 'projects/q/a.md', 'id': 'x'}})
        queue.add('p', 'chat-p', {'message': 'hello'})
        queue.dispatch(); self.settle()
        self.assertEqual(sorted(self.started), ['W', 'hello'], 'the chat does not wait for the worker; the comment waits (one at a time)')
        self.finish(queue, 'W'); queue.dispatch(); self.settle()
        self.assertIn('C', self.started)

    def test_parallel_runs_one_work_request_per_project_up_to_the_slots(self):
        self.mode = 'parallel'; self.slots = 3
        queue = self.queue()
        queue.add('p', 'chat-p', {'message': 'W1', 'worker': {'task': 'tasks/059.md'}})
        queue.add('p', 'chat-p', {'message': 'W2', 'worker': {'task': 'tasks/060.md'}})
        queue.add('q', 'chat-q', {'message': 'D', 'document': 'projects/q/a.md'})
        queue.add('r', 'chat-r', {'message': 'R', 'document': 'projects/r/a.md'})
        queue.add('q', 'chat-q', {'message': 'hello'})
        queue.dispatch(); self.settle()
        self.assertEqual(sorted(self.started), ['D', 'W1', 'hello'], 'three slots: W2 waits for W1 (one worker per project), R for a slot')
        self.finish(queue, 'W1'); queue.dispatch(); self.settle()
        self.assertIn('W2', self.started, 'FIFO: the next request of the freed project before a later one')

    def test_nothing_starts_while_the_harness_is_busy(self):
        queue = self.queue(busy=lambda: True)
        queue.add('p', 'chat', {'message': 'hello'}); queue.dispatch(); self.settle()
        self.assertEqual(self.started, [])

    def test_one_chat_request_at_a_time(self):
        queue = self.queue()
        queue.add('p', 'chat-p', {'message': 'first'}); queue.add('q', 'chat-q', {'message': 'second'})
        queue.dispatch(); self.settle()
        self.assertEqual(self.started, ['first'])



class WebLaneTest(unittest.TestCase):
    """The workbench side: requests run at the same time in two lanes, the harness holds the agent lock for all of them,
    and with a one-at-a-time model a work request waits at its next model call while a chat request runs."""
    def setUp(self):
        import os, sys
        from unittest.mock import patch
        from harness.web_chat import WebChat
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name).resolve(); executable = root / 'pi'
        executable.write_text('#!' + sys.executable + '\n' + Path('tests/fixtures/fake-pi.py').read_text()); executable.chmod(0o755)
        path = patch.dict(os.environ, {'PATH': str(root) + os.pathsep + os.environ['PATH']}); path.start(); self.addCleanup(path.stop)
        self.chat = WebChat(root / 'chats', 1, 2, data_root=root / 'data'); self.addCleanup(self.chat.close)
        self.project = self.chat.documents.create_project('Lanes')

    def wait(self, check, seconds=15):
        deadline = time.monotonic() + seconds
        while not check() and time.monotonic() < deadline: time.sleep(0.05)
        return check()

    def test_a_chat_and_a_comment_run_at_the_same_time_and_stop_on_their_own(self):
        page = f'projects/{self.project}/ROADMAP.md'; entry = self.chat.documents.comment(page, 'Slowly TEST_SLOW', 'Describe what we are building.')
        chat = self.chat.enqueue({'project': self.project, 'message': 'Hello TEST_WAIT'})
        comment = self.chat.enqueue({'project': self.project, 'message': 'Comment', 'document_comment': {'path': page, 'id': entry['id']}})
        running = lambda: {job['id'] for job in self.chat.queue.list() if job['status'] == 'running'}
        self.assertTrue(self.wait(lambda: running() == {chat['id'], comment['id']}), 'both run: ' + str(self.chat.queue.list()))
        lock = json.loads((self.chat.documents.root / '.agent-lock').read_text())
        self.assertEqual(lock['pid'], os.getpid(), 'the harness holds the agent lock for its requests (terminal Pi waits)')
        self.assertFalse(self.chat.agent_running(), 'its own lock does not hold the queue back')
        self.chat.stop(comment['id'])
        self.assertTrue(self.wait(lambda: running() == {chat['id']}), 'Stop on a request stops that request only')
        self.chat.stop(chat['id'])
        self.assertTrue(self.wait(lambda: not running() and not (self.chat.documents.root / '.agent-lock').exists()), 'the lock goes with the last request')

    def test_a_work_request_waits_at_its_next_model_call_while_the_chat_answers(self):
        events = []
        self.chat.active['chat-job'] = {'process': None, 'cancel': threading.Event(), 'chat': 'c', 'role': 'chat', 'emit': lambda event: None}
        self.chat.active['work-job'] = {'process': None, 'cancel': threading.Event(), 'chat': 'c', 'role': 'comment', 'emit': events.append}
        waited = []
        thread = threading.Thread(target=lambda: waited.append(self.chat.wait_turn('work-job'))); thread.start()
        time.sleep(0.3); self.assertTrue(thread.is_alive(), 'paused while the chat request runs')
        self.assertIn({'type': 'paused', 'paused': True}, events); self.assertIn('Paused while Pi answers you', [event.get('text') for event in events])
        with self.chat.lock: self.chat.active.pop('chat-job'); self.chat.turns.notify_all()
        thread.join(5); self.assertFalse(thread.is_alive()); self.assertIn({'type': 'paused', 'paused': False}, events)
        self.chat._mode = (('parallel', 2), time.monotonic())
        with self.chat.lock: self.chat.active['chat-job'] = {'process': None, 'cancel': threading.Event(), 'chat': 'c', 'role': 'chat', 'emit': lambda event: None}
        self.assertEqual(self.chat.wait_turn('work-job')['waited'], 0, 'a parallel model never pauses the worker')
        with self.chat.lock: self.chat.active.clear()

    def test_the_lock_is_refused_while_terminal_pi_holds_it(self):
        (self.chat.documents.root / '.agent-lock').write_text(json.dumps({'pid': os.getppid(), 'token': 'terminal'}))
        self.assertTrue(self.chat.agent_running())
        with self.assertRaisesRegex(ValueError, 'One agent'): self.chat.hold_lock()


if __name__ == '__main__':
    unittest.main()
