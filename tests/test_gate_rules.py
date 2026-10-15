"""Plan 179: Gate's rules are one registry in code, always enforced; every decision names its rule; the prompt summary,
/gate rules and the lessons come from the same list."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

from gate import rules
from gate.engine import GateEngine
from gate.ledger import ProposalLedger
from gate.models import ActionOutcome, ActionProposal

ROOT = Path(__file__).resolve().parent.parent


class RegistryTest(unittest.TestCase):
    def test_every_rule_is_complete_and_proven_by_a_test(self):
        ids = [rule.id for rule in rules.RULES]
        self.assertEqual(len(ids), len(set(ids)), 'unique ids')
        for rule in rules.RULES:
            self.assertRegex(rule.id, r'^G-\d{3}$')
            self.assertIn(rule.when, rules.WHEN, rule.id); self.assertIn(rule.outcome, ('BLOCK', 'REVISE', 'FLAG', 'STOP', 'MARK'), rule.id)
            self.assertTrue(rule.name and rule.summary and rule.scope, rule.id)
            test = ROOT / rule.test.split('::')[0]
            self.assertTrue(test.is_file(), f'{rule.id}: {rule.test}')
            self.assertIn(rule.id, test.read_text(), f'{rule.id} is named in its test {rule.test}')
            if rule.lesson: self.assertTrue((ROOT / 'docs/lessons' / rule.lesson).is_file(), f'{rule.id}: {rule.lesson}')

    def test_the_summary_lists_every_rule_in_one_line_each(self):
        summary = rules.summary()
        for rule in rules.RULES: self.assertIn(f'{rule.id} {rule.name}', summary)
        self.assertLess(len(summary), 3000, 'short: it is in every system prompt')
        self.assertIn(summary, rules.SUMMARY_FILE.read_text(), 'harness/gate-rules.md is current: run python3 -m gate.rules')

    def test_agent_md_no_longer_restates_what_gate_enforces(self):
        text = (ROOT / 'AGENT.md').read_text()
        self.assertNotIn('test red, implementation, test green', text, 'the commit order lives in the registry (G-005)')
        self.assertIn('/gate rules', text)


class DecisionsNameTheirRuleTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.engine = GateEngine('', str(self.root / 'audit.log'))
        self.ledger = ProposalLedger(self.engine)

    def propose(self, tool, args, pi_tool=None):
        return self.ledger.propose(tool, args, 'admin', pi_tool=pi_tool, cwd=str(self.root))

    def test_existing_checks_keep_their_outcome_and_name_their_rule(self):
        self.assertEqual(self.propose('execute_command', {'command': 'rm -rf ~'})['rule'], 'G-003')
        self.assertEqual(self.propose('delete_everything', {})['rule'], 'G-001')
        self.assertEqual(self.ledger.propose('execute_command', {'command': 'ls'}, 'nobody')['rule'], 'G-002')
        (self.root / 'a.md').write_text('one\none\n')
        self.assertEqual(self.propose('write_file', {'path': 'a.md', 'edits': [{'oldText': 'one', 'newText': '1'}]}, 'edit')['rule'], 'G-004')
        missing = self.propose('write_file', {'path': 'nowhere.md', 'edits': [{'oldText': 'a', 'newText': 'b'}]}, 'edit')
        self.assertEqual((missing['outcome'], missing['rule']), ('REVISE', 'G-004')); self.assertIn('use write to create it', missing['reason'])
        events = self.ledger.recent_events()
        self.assertEqual([event.get('rule') for event in events], ['G-003', 'G-001', 'G-002', 'G-004', 'G-004'])
        self.assertTrue(events[0]['reason'].startswith('G-003 '), 'Pi reads the rule id and can look it up')

    def test_the_audit_names_its_rule(self):
        path = self.root / 'b.txt'
        allowed = self.propose('write_file', {'path': 'b.txt', 'content': 'x'}, 'write')
        path.write_text('y')
        self.ledger.complete(allowed['proposal_id'], 'write_file', {'path': 'b.txt', 'content': 'x'}, 'ok', 0)
        self.assertEqual(self.ledger.recent_events()[-1]['rule'], 'G-007')
        drift = self.propose('read_file', {'path': 'b.txt'})
        self.ledger.complete(drift['proposal_id'], 'read_file', {'path': 'other.txt'}, 'ok', 0)
        self.assertEqual(self.ledger.recent_events()[-1]['rule'], 'G-006', 'what ran was not what was approved')


class ProjectMarkdownTest(unittest.TestCase):
    """G-008 (L-003): a project's ROADMAP.md and task files change through edit or write, so Gate checks the change."""
    def test_shell_writes_to_the_plan_are_sent_back(self):
        engine = GateEngine('', '/dev/null')
        for command in ["printf '- [ ] x\\n' >> ROADMAP.md", 'sed -i "" "s/- \\[ \\]/- [x]/" tasks/001-a.md', 'echo hi > tasks/002-b.md',
                        "python3 - <<'PY'\nopen('tasks/173-x.md','w').write(s)\nPY", "cd repo && python3 -c \"import pathlib; pathlib.Path('ROADMAP.md').write_text('')\"",
                        'cat notes | tee -a ROADMAP.md', "perl -pi -e 's/a/b/' tasks/3.md"]:
            rule, reason = engine.rejection(ActionProposal('execute_command', {'command': command}, 'test'), 'admin')
            self.assertEqual(getattr(rule, 'id', None), 'G-008', command)
            self.assertIn('edit', reason)
        for command in ['cat ROADMAP.md', 'grep -n x tasks/1.md', 'git diff ROADMAP.md', 'sed -n 1,5p tasks/1.md', 'git checkout ROADMAP.md',
                        'python3 tests/verify_workflow.py > /tmp/out.txt', 'wc -l tasks/*.md']:
            self.assertEqual(engine.rejection(ActionProposal('execute_command', {'command': command}, 'test'), 'admin'), (None, None), command)
        self.assertEqual(engine.gatekeep(ActionProposal('execute_command', {'command': 'echo x >> ROADMAP.md'}, 'test'), 'admin'), ActionOutcome.REVISE)


class PlanFilesTest(unittest.TestCase):
    """G-009 (L-004) and G-010 (L-005, L-006), in a project with ROADMAP.md and tasks/."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        (self.root / 'tasks').mkdir(); (self.root / 'ROADMAP.md').write_text('- [ ] [001](tasks/001-a.md)\n')
        self.task = self.root / 'tasks/001-a.md'
        self.task.write_text('# 001\n\nKind: code\n\n- [x] Planned\n- [ ] Red: the test fails\n- [ ] Green: it passes\n\nNotes one\ntwo\nthree\nfour\nfive\nsix\n')
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        self.ledger = ProposalLedger(GateEngine('', str(self.root / 'audit.log')))

    def propose(self, pi_tool, args):
        return self.ledger.propose('write_file', {'path': str(self.task), **args}, 'admin', pi_tool=pi_tool, cwd=str(self.root))

    def test_a_write_over_a_task_file_may_not_drop_ticked_boxes_or_many_lines(self):
        lost = self.propose('write', {'content': '# 001\n\nKind: code\n\n- [ ] Planned\n'})
        self.assertEqual((lost['outcome'], lost['rule']), ('REVISE', 'G-009')); self.assertIn('Use edit', lost['reason'])
        grown = self.propose('write', {'content': self.task.read_text() + 'seven\n'})
        self.assertEqual(grown['outcome'], 'ALLOW', 'adding is fine')
        new = self.ledger.propose('write_file', {'path': str(self.root / 'tasks/002-b.md'), 'content': '# 002\n'}, 'admin', pi_tool='write', cwd=str(self.root))
        self.assertEqual(new['outcome'], 'ALLOW', 'a new file')

    def test_red_and_green_are_ticked_only_after_gate_saw_the_runs(self):
        tick = lambda word: {'edits': [{'oldText': f'- [ ] {word}', 'newText': f'- [x] {word}'}]}
        refused = self.propose('edit', tick('Red'))
        self.assertEqual((refused['outcome'], refused['rule']), ('REVISE', 'G-010')); self.assertIn('failing test run', refused['reason'])
        (self.root / 'app.py').write_text('x = 1\n')
        self.ledger.protocol.record(str(self.root), 'python3 -m unittest', False)
        self.assertEqual(self.propose('edit', tick('Red'))['outcome'], 'ALLOW', 'Gate saw it fail')
        self.ledger.pending.clear()
        self.assertEqual(self.propose('edit', tick('Green'))['rule'], 'G-010', 'no passing run yet')
        self.ledger.protocol.record(str(self.root), 'python3 -m unittest', True)
        self.assertEqual(self.propose('edit', tick('Green'))['outcome'], 'ALLOW')
        self.ledger.pending.clear()
        planned = self.propose('edit', {'edits': [{'oldText': 'Notes one', 'newText': '- [x] Notes one'}]})
        self.assertEqual(planned['outcome'], 'ALLOW', 'other boxes are not about tests')


class UnverifiedTest(unittest.TestCase):
    """G-012 (L-005): a request that changed code and ran no passing test after its last change ends marked."""
    def test_the_note_follows_what_gate_saw(self):
        from harness.web_chat import verification_note
        from gate.protocol import Protocol
        with tempfile.TemporaryDirectory() as folder, tempfile.TemporaryDirectory() as data:
            runs = Path(data) / 'runs.json'  # in the data folder, as in use
            root = Path(folder).resolve(); (root / 'tasks').mkdir(); (root / 'ROADMAP.md').write_text('- [ ] x\n')
            subprocess.run(['git', 'init', '-q', str(root)], check=True)
            protocol = Protocol(runs)
            before = protocol.verification(root)
            self.assertIsNone(verification_note(before, protocol.verification(root)), 'nothing changed: nothing to say')
            (root / 'app.py').write_text('x = 1\n')
            note = verification_note(before, Protocol(runs).verification(root))
            self.assertIn('Not verified (G-012)', note); self.assertIn('app.py', note)
            protocol.record(str(root), 'python3 -m unittest', True)
            self.assertIsNone(verification_note(before, Protocol(runs).verification(root)), 'a passing run on this code')
            (root / 'app.py').write_text('x = 2\n')
            self.assertIn('Not verified', verification_note(before, Protocol(runs).verification(root)), 'changed after the run')
            from gate.engine import GateEngine
            ledger = ProposalLedger(GateEngine('', '/dev/null'), protocol_file=runs)
            answer = ledger.verification(str(root / 'tasks'))
            self.assertEqual((answer['code'], answer['verified']), (['app.py'], False), 'G-012 for terminal Pi: Gate answers for the project around a folder')
            self.assertIsNone(ledger.verification(data), 'outside a project: nothing to say')
            (root / 'notes.md').write_text('only words\n')
            self.assertIsNone(verification_note(protocol.verification(root), protocol.verification(root)))


class ConsoleTest(unittest.TestCase):
    def test_gate_rules_lists_the_registry(self):
        from harness import admin
        data = tempfile.mkdtemp()
        Path(data, 'gate-events.jsonl').write_text(''.join(json.dumps({'id': n, 'phase': 'gate', 'outcome': 'REVISE', 'rule': 'G-008', 'timestamp': '2026-10-15T10:00:00+09:00'}) + '\n' for n in (1, 2)))
        value, text = admin.run(admin.Console(data), 'gate', ['rules'])
        self.assertEqual(next(rule['fired'] for rule in value if rule['id'] == 'G-008'), 2, 'how often each rule sent something back: which weaknesses show up')
        self.assertEqual([rule['id'] for rule in value], [rule.id for rule in rules.RULES])
        self.assertIn('── Gate rules', text); self.assertIn('G-008', text)


if __name__ == '__main__':
    unittest.main()


class BareTest(unittest.TestCase):
    """The bench baseline (PI_HARNESS_BARE=1): Gate keeps its core safety rules (G-001 to G-007) and nothing else."""
    def test_only_the_core_rules_apply(self):
        from unittest.mock import patch
        engine = GateEngine('', '/dev/null')
        with patch.dict('os.environ', {'PI_HARNESS_BARE': '1'}):
            self.assertEqual(engine.rejection(ActionProposal('execute_command', {'command': 'echo x >> ROADMAP.md'}, 't'), 'admin'), (None, None), 'G-008 is the harness, not safety')
            self.assertEqual(engine.rejection(ActionProposal('execute_command', {'command': 'rm -rf ~'}, 't'), 'admin')[0].id, 'G-003', 'safety stays')
        self.assertEqual([rule.id for rule in rules.RULES if rule.core], ['G-001', 'G-002', 'G-003', 'G-004', 'G-005', 'G-006', 'G-007'])
