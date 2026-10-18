"""Task 273 (plan 267 section 3, round 12 boards R12_Gate, T_Decisions): the decision row.

The decisions of each answer are listed with their authors (you, auto, Laya, code, model) from decisions.jsonl joined by
request id, the person changes a question's answer from its row (a person-only route), a numbered batch takes all its
recommendations, Settings › Pi › Detail decides what is shown, and terminal Pi's /decisions lists the same rows."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
import tempfile
import unittest
from pathlib import Path

from harness import admin, decision_rows
from harness.decision_log import record

try:
    from test_conversation_repairs import Workbench
except ModuleNotFoundError:
    from tests.test_conversation_repairs import Workbench


def lines(path):
    return [json.loads(line) for line in Path(path).read_text().splitlines() if line.strip()]


class RowsTest(unittest.TestCase):
    def setUp(self):
        self.data = Path(tempfile.mkdtemp()); self.addCleanup(lambda: __import__('shutil').rmtree(self.data, ignore_errors=True))

    def conversation(self, **message):
        return {'messages': [{'role': 'user', 'content': 'Make a notes app'}, {'role': 'assistant', 'content': 'Done.', 'request': 'job1', **message}]}

    def test_each_answer_lists_its_decisions_with_their_authors(self):
        record(self.data, 'job1', 'task_kind', 'model', 'code', proposal=True)
        record(self.data, 'job1', 'guide_chosen', 'code', ['planning'], rule='guides.attach')
        record(self.data, 'job1.build-1a2b', 'plan_approval', 'code', 'approved', rule='G-015', automatic=True)
        record(self.data, 'job1', 'phase_intent', 'laya', 'abstained', confidence=.4, abstained=True)
        record(self.data, 'job1', 'phase_intent', 'laya', 'planning', confidence=.99)
        record(self.data, 'other', 'phase', 'person', 'discussion', rule='G-015')
        value = decision_rows.conversation(self.data, self.conversation(choice={'question': 'Sorting?', 'options': [{'label': 'Newest'}, {'label': 'By subject'}], 'answer': 'Newest', 'state': 'auto', 'when': '2026-10-18T14:06:00+09:00'}), 'expert')
        rows = value['messages']['1']['rows']
        self.assertEqual([(row['name'], row['value'], row['who']) for row in rows],
                         [('Sorting?', 'Newest', 'auto'), ('Kind', 'code', 'model'), ('Guide', 'planning', 'code'), ('Plan approval', 'approved', 'auto'), ('Phase asked for', 'planning', 'Laya')])
        self.assertEqual((value['messages']['1']['total'], value['messages']['1']['automatic']), (5, 3), '“5 decisions · 3 automatic”: auto and model')
        self.assertEqual(rows[4]['confidence'], .99); self.assertEqual(rows[2]['rule'], 'guides.attach')
        self.assertNotIn('0', value['messages'], 'the person’s message has no row')

    def test_beginner_hides_decisions_made_by_code_and_expert_shows_rules(self):
        record(self.data, 'job1', 'guide_chosen', 'code', ['planning'], rule='guides.attach')
        record(self.data, 'job1', 'phase', 'person', 'planning', rule='G-015')
        beginner = decision_rows.conversation(self.data, self.conversation())
        self.assertEqual(beginner['detail'], 'beginner', 'Beginner is the default')
        self.assertEqual([row['who'] for row in beginner['messages']['1']['rows']], ['you'])
        self.assertNotIn('rule', beginner['messages']['1']['rows'][0])
        (self.data / 'config.json').write_text(json.dumps({'detail': 'expert'}))
        expert = decision_rows.conversation(self.data, self.conversation())
        self.assertEqual([row['who'] for row in expert['messages']['1']['rows']], ['code', 'you'])

    def test_a_refusal_names_its_command_for_an_expert_from_the_gate_event_not_from_the_log(self):
        (self.data / 'gate-events.jsonl').write_text(json.dumps({'id': 7, 'tool': 'execute_command', 'args': {'command': 'rm -rf /'}, 'outcome': 'BLOCK'}) + '\n')
        record(self.data, 'job1', 'command_allowed', 'code', 'BLOCK', rule='G-003', event=7)
        record(self.data, 'job1', 'command_allowed', 'code', 'BLOCK', rule='G-003', event=7)
        self.assertNotIn('rm -rf', (self.data / 'decisions.jsonl').read_text(), 'the log keeps no commands')
        row = decision_rows.conversation(self.data, self.conversation(), 'expert')['messages']['1']['rows'][0]
        self.assertEqual((row['name'], row['value'], row['rule']), ('Command', 'refused ×2', 'G-003'), 'repeats are one row')
        self.assertIn('rm -rf /', row['detail'])
        self.assertNotIn('Change', json.dumps(row.get('change')), 'code’s refusal cannot be changed here')
        self.assertIn('rule', row['why'])

    def test_what_can_be_changed_says_how_and_a_settled_question_reads_not_answered(self):
        record(self.data, 'job1', 'phase', 'person', 'planning', rule='G-015')
        record(self.data, 'job1', 'task_acceptance', 'person', 'accept', rule='G-015')
        value = decision_rows.conversation(self.data, self.conversation(check_in={'task': 'tasks/002-count.md'}, choice={'question': 'Sorting?', 'options': [{'label': 'Newest'}], 'settled': 'Start Building', 'when': '2026-10-18T14:12:00+09:00'}))
        rows = value['messages']['1']['rows']
        self.assertEqual((rows[0]['value'], rows[0]['detail']), ('not answered', 'settled by Start Building'))
        self.assertEqual(rows[0]['change']['type'], 'question')
        self.assertEqual(rows[1]['change'], {'type': 'phase', 'value': 'planning'})
        self.assertEqual(rows[2]['change'], {'type': 'reopen', 'task': 'tasks/002-count.md'})

    def test_check_in_evidence_is_the_requests_last_test_run(self):
        from gate import test_runs
        test_runs.record(self.data, request='job1', project='p', cwd='p', command='uv run pytest', exit_code=0, duration=3.1, output='12 passed in 3.10s')
        evidence = decision_rows.conversation(self.data, self.conversation())['messages']['1']['evidence']
        self.assertEqual(evidence['test_run']['command'], 'uv run pytest'); self.assertEqual(evidence['test_run']['counts'], {'pass': 12, 'fail': 0, 'skipped': 0})

    def test_terminal_decisions_lists_the_last_request_with_authors_and_marks_automatic_ones(self):
        record(self.data, 'old', 'phase', 'person', 'discussion', rule='G-015')
        record(self.data, 'job1', 'task_kind', 'model', 'code', proposal=True)
        record(self.data, 'job1', 'guide_chosen', 'code', ['planning'], rule='guides.attach')
        record(self.data, 'job1', 'phase', 'person', 'planning', rule='G-015')
        console = admin.Console(self.data)
        _, text = admin.run(console, 'decisions', [])
        self.assertIn('~ Kind', text); self.assertIn('model', text); self.assertIn('✓ Phase', text)
        self.assertNotIn('Guide', text, 'Beginner: decisions made by code are hidden'); self.assertNotIn('discussion', text.lower().replace('decisions', ''))
        self.assertIn('2 · 1 automatic', text)
        value, text = admin.run(console, 'decisions', ['--all'])
        self.assertIn('Guide', text); self.assertIn('guides.attach', text); self.assertEqual(value['total'], 3)


class RequestIdsTest(unittest.TestCase):
    """The review: decision and Gate logs lacked request ids; controls under a request now carry it."""
    def setUp(self):
        self.bench = Workbench(self); self.data = self.bench.root / 'data'

    def test_gate_events_and_refusals_carry_the_request_and_the_event(self):
        from gate.models import ActionProposal
        self.bench.ledger.record_event('gate', 'BLOCK', ActionProposal(tool_name='execute_command', args={'command': 'rm -rf /'}, reason='test'), 'no', rule='G-003', request='job9')
        event = self.bench.ledger.recent_events()[-1]
        self.assertEqual(event['request'], 'job9')
        row = lines(self.data / 'decisions.jsonl')[-1]
        self.assertEqual((row['request'], row['event']), ('job9', event['id']))

    def test_the_phase_and_check_in_controls_record_their_request(self):
        paperwork = self.bench.ledger.paperwork
        paperwork.phases.choose(self.bench.folder, 'planning', actor='person', request='job3')
        self.assertEqual(lines(self.data / 'decisions.jsonl')[-1]['request'], 'job3')


class ChangeTest(unittest.TestCase):
    def setUp(self):
        self.bench = Workbench(self)

    def test_change_records_the_persons_answer_and_queues_one_redo(self):
        identifier = self.bench.ask()
        status, answered = self.bench.call('/api/choices/answer', {'project': self.bench.project, 'id': identifier, 'option': 0})
        self.assertEqual(status, 200, answered)
        index = len(self.bench.messages()) - 1
        status, refused = self.bench.call('/api/decisions/change', {'project': self.bench.project, 'index': index, 'source': 'choice', 'option': 1}, person=False)
        self.assertEqual(status, 403, 'Change… is a person-only control'); self.assertIn('Reload the page', refused['error'])
        status, same = self.bench.call('/api/decisions/change', {'project': self.bench.project, 'index': index, 'source': 'choice', 'option': 0})
        self.assertEqual(status, 400); self.assertEqual(same['error'], 'That is already the answer.')
        before = len(self.bench.queued())
        status, changed = self.bench.call('/api/decisions/change', {'project': self.bench.project, 'index': index, 'source': 'choice', 'option': 1})
        self.assertEqual(status, 200, changed)
        self.assertEqual(changed['answer'], 'Drop')
        choice = self.bench.messages()[index]['choice']
        self.assertEqual((choice['answer'], choice['changed_from'], choice['state']), ('Drop', 'Park', 'chosen'))
        queued = self.bench.queued()
        self.assertEqual(len(queued), before + 1)
        self.assertEqual(queued[-1]['message'], 'Change: Park or drop? → Drop (was Park). Redo what depended on it.')
        row = lines(self.bench.root / 'data' / 'decisions.jsonl')[-1]
        self.assertEqual((row['kind'], row['who'], row['answer'], row['rule']), ('question_answer', 'person', {'option': 1}, 'decision.change'))

    def test_the_conversation_api_lists_rows_per_answer(self):
        conversation = self.bench.chat.store.get(self.bench.conversation)
        self.bench.chat.store.append(conversation['id'], {'role': 'assistant', 'content': 'Planned.', 'request': 'abc'})
        record(self.bench.root / 'data', 'abc', 'task_kind', 'model', 'docs', proposal=True)
        status, value = self.bench.call(f"/api/conversations/{conversation['id']}/decisions")
        self.assertEqual(status, 200, value)
        self.assertEqual(value['messages'][str(len(self.bench.messages()) - 1)]['rows'][0]['value'], 'docs')


class BatchTest(unittest.TestCase):
    def setUp(self):
        self.bench = Workbench(self)

    def test_take_all_recommendations_answers_the_rest_of_the_batch_with_their_first_options(self):
        paperwork = self.bench.ledger.paperwork
        paperwork.start('one', str(self.bench.folder), 'Make it')
        first = paperwork.choice_pending('one', {'question': 'Who writes notes?', 'options': [{'label': 'Only me'}, {'label': 'The class'}], 'recommended': 0, 'number': 1, 'total': 2})
        paperwork.pause('one')
        self.bench.chat.store.append(self.bench.conversation, {'role': 'assistant', 'content': '', 'choice': {**first, 'number': 1, 'total': 2}})
        status, value = self.bench.call('/api/choices/answer', {'project': self.bench.project, 'id': first['id'], 'option': 0, 'take_all': True})
        self.assertEqual(status, 200, value)
        # The answer's request asks question 2 of 2 and pauses: the harness takes its recommendation at once.
        paperwork.start('two', str(self.bench.folder), 'Choice: Who writes notes? → Only me')
        second = paperwork.choice_pending('two', {'question': 'How should notes be sorted?', 'options': [{'label': 'Newest first'}, {'label': 'By subject'}], 'recommended': 0, 'number': 2, 'total': 2})
        paperwork.pause('two')
        choice = {**second, 'number': 2, 'total': 2}
        self.bench.chat.store.append(self.bench.conversation, {'role': 'assistant', 'content': '', 'choice': choice})
        events = []
        self.assertTrue(decision_rows.take_next(self.bench.chat, self.bench.project, self.bench.conversation, choice, events.append))
        self.assertEqual(self.bench.messages()[-1]['choice']['answer'], 'Newest first')
        self.assertEqual(events[-1]['pending'], False, 'the request is not left waiting')
        self.assertIn('Choice: How should notes be sorted? → Newest first', [job['message'] for job in self.bench.queued()])
        self.assertFalse(decision_rows.take_next(self.bench.chat, self.bench.project, self.bench.conversation, choice, events.append), 'the batch is over')


class SettingsAndNoticeTest(unittest.TestCase):
    def test_detail_is_a_workbench_setting(self):
        from harness.settings import SETTINGS, validate
        self.assertEqual(SETTINGS['detail'][1], 'beginner')
        self.assertEqual(validate({'detail': 'expert'})['detail'], 'expert')
        with self.assertRaises(ValueError): validate({'detail': 'guru'})
        from harness.web_updates import UpdateService
        service = UpdateService(tempfile.mkdtemp(), '.')
        self.assertEqual(service.settings({'detail': 'expert'})['detail'], 'expert')
        with self.assertRaises(ValueError): service.settings({'detail': 'guru'})

    def test_without_laya_the_phase_word_gets_the_harness_notice_that_says_so(self):
        bench = Workbench(self)
        bench.ledger.start_request('explain', str(bench.folder), 'Explain the planning module')
        advice = bench.ledger.request_advice('explain')
        self.assertEqual(advice['notice'], 'Laya isn’t installed, so the phase button can’t suggest the next phase. Everything else works.')


if __name__ == '__main__':
    unittest.main()
