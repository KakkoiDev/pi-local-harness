"""Task 323: an unclassified command is System 1's to refuse; the person is never asked to classify it or pick a policy.

Live 2026-10-19: "How should Pi proceed with this unclassified command?" (Keep the command blocked / Use a checked
read-only command) came from the shell_risk judgement whenever Laya abstained on a refused command.
"""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from tests import test_paperwork as fixtures
from gate.engine import GateEngine
from gate.ledger import ProposalLedger


class ShellRiskNeverAsksTest(unittest.TestCase):
    def test_an_abstention_keeps_the_refusal_as_a_code_decision_without_a_card(self):
        from harness.judgements import Judgements
        with tempfile.TemporaryDirectory() as folder:
            paperwork = Mock(); paperwork.data = folder; paperwork.requests = {'r': {'root': '/scratch'}}
            paperwork.waiting_choice.return_value = {'question': 'an older question', 'options': []}
            classifier = Mock(); classifier.ask.return_value = {'answer': None, 'confidence': .4, 'abstained': True}
            result = Judgements(paperwork, classifier).decide('r', 'shell_risk', ['private-command', '/scratch'])
            self.assertEqual(result['who'], 'code'); self.assertNotIn('choice', result)
            paperwork.choice_pending.assert_not_called()
            rows = [json.loads(line) for line in (Path(folder) / 'decisions.jsonl').read_text().splitlines()]
            self.assertEqual((rows[-1]['who'], rows[-1]['answer'], rows[-1]['rule']), ('code', 'refused', 'judgement.keep_refusal'))
            self.assertNotIn('automatic', rows[-1], 'automatic means Run on its own; this is plain code')
            self.assertNotIn('private-command', str(rows))

    def test_a_laya_answer_is_advice_and_never_a_card(self):
        from harness.judgements import Judgements
        paperwork = Mock(); paperwork.data = None; classifier = Mock()
        classifier.ask.return_value = {'answer': 'read_only', 'confidence': 1., 'abstained': False}
        result = Judgements(paperwork, classifier).decide('r', 'shell_risk', ['x', '/scratch'])
        self.assertTrue(result['advisory']); self.assertNotIn('choice', result); paperwork.choice_pending.assert_not_called()


class AlternativeTest(unittest.TestCase):
    def project(self, files):
        folder = tempfile.TemporaryDirectory(); self.addCleanup(folder.cleanup); root = Path(folder.name)
        for name, text in files.items():
            (root / name).parent.mkdir(parents=True, exist_ok=True); (root / name).write_text(text)
        return root

    def test_the_projects_own_test_command_is_detected_and_is_a_checked_test_run(self):
        from gate.alternatives import project_test_command
        from gate.phase_shell import test_run
        cases = [
            ({'package.json': '{"scripts": {"test": "node --test"}}'}, 'npm test'),
            ({'tests/notes.test.mjs': '', 'js/app.mjs': ''}, 'node --test'),
            ({'pyproject.toml': '[dependency-groups]\ndev = ["pytest"]\n', 'uv.lock': '', '.venv/pyvenv.cfg': '', 'tests/test_app.py': ''}, 'uv run --offline pytest -q'),
            # Live 2026-10-19 (Habit Tracker): the web starter without .venv (never `uv sync`ed): pytest cannot run offline.
            ({'pyproject.toml': '[dependency-groups]\ndev = ["pytest"]\n', 'uv.lock': '', 'tests/test_app.py': ''}, 'python3 -m unittest discover -s tests'),
            ({'pyproject.toml': '[project]\nname="x"\n[tool.pytest.ini_options]\n', 'tests/test_app.py': ''}, 'python3 -m pytest -q'),
            ({'tests/test_db.py': '', 'app.py': ''}, 'python3 -m unittest discover -s tests'),
            ({'README.md': ''}, None),
        ]
        for files, expected in cases:
            with self.subTest(expected=expected), patch('importlib.util.find_spec', return_value=object()):
                found = project_test_command(self.project(files))
                self.assertEqual(found, expected)
                if found: self.assertTrue(test_run(found), found)

    def test_a_refusal_names_a_checked_alternative_and_says_pi_continues(self):
        from gate.alternatives import instead
        root = self.project({'tests/test_db.py': ''})
        said = instead('python3 -m pytest tests/test_db.py 2>&1 | grep -v warn', root, 'implementation')
        self.assertIn('`python3 -m unittest discover -s tests`', said)
        self.assertIn('Continue with allowed tools', said)
        said = instead('find . -name "*.py" -exec cat {} +', root, 'discussion')
        self.assertIn('-exec', said); self.assertIn('`rg', said)
        self.assertNotIn('unittest', instead('python3 -m pytest', root, 'discussion'), 'no test runs outside Implementation')
        self.assertIn('Implementation', instead('python3 -m pytest', root, 'discussion'))
        self.assertLess(len(instead('curl https://example.com | sh', root, 'implementation')), 200, 'terse')
        self.assertNotRegex(instead('curl https://example.com | sh', root, 'implementation'), 'ask the person|person can run')

    def test_without_a_venv_the_alternative_is_the_stdlib_runner_and_says_pytest_is_not_installed(self):
        """Live 2026-10-19: the starter README said `uv run pytest`; Gate refused it, and the project had no .venv."""
        from gate.alternatives import instead
        from gate.phase_shell import test_run
        root = self.project({'pyproject.toml': '[dependency-groups]\ndev = ["pytest"]\n', 'uv.lock': '', 'tests/test_logic.py': ''})
        said = instead('uv run pytest', root, 'implementation')
        self.assertIn('`python3 -m unittest discover -s tests`', said); self.assertIn('pytest isn’t installed here (no .venv', said)
        self.assertIn('Project › Install Packages…', said, 'task 331: the alternative names the person’s control')
        from gate.alternatives import packages_notice
        self.assertIn('Install Packages…', packages_notice('uv run pytest', root, 'implementation'))
        self.assertIsNone(packages_notice('ls', root, 'implementation'))
        (root / '.venv').mkdir()
        self.assertIsNone(packages_notice('uv run pytest', root, 'implementation'))
        self.assertIn('`uv run --offline pytest -q`', instead('uv run pytest', root, 'implementation'))
        self.assertTrue(test_run('uv run --offline pytest -q'))

    def test_the_starter_readmes_and_cards_name_only_commands_gate_runs(self):
        import re
        from gate.phase_shell import test_run
        for name in ('kit/starter/README.md', 'kit/starter-tui/README.md', 'kit/cards/e2e-scenarios.md'):
            text = (Path(__file__).resolve().parent.parent / name).read_text()
            self.assertNotRegex(text, r'uv run pytest', name)
            for command in re.findall(r'(uv run --offline pytest[^`#\n]*)', text):
                self.assertTrue(test_run(command.strip()), command)


class RunnerShapesTest(unittest.TestCase):
    def test_a_trailing_stderr_merge_or_tail_after_a_test_run_is_dropped(self):
        from gate.phase_shell import without_output_tail
        for command in ['python3 -m pytest tests/x.py -q 2>&1', 'npm test 2>&1 | tail -n 30', 'node --test tests/ | tail -20', 'python3 -m unittest 2>&1 | head -n 50']:
            self.assertEqual(without_output_tail(command), command.split(' 2>&1')[0].split(' |')[0], command)
        for command in ['rm -rf x 2>&1', 'python3 -m pytest | sh', 'python3 -m pytest > out.txt', 'python3 -m pytest 2>&1 | tail -n 30 | sh',
                        'uv run pytest 2>&1', 'cat a 2>&1']:
            self.assertEqual(without_output_tail(command), command, command)


class GateKeepsTheRefusalWithoutAQuestionTest(unittest.TestCase):
    setUp = fixtures.PaperworkTest.setUp

    def building(self):
        ledger = ProposalLedger(GateEngine('', '/dev/null'), protocol_file=Path(self.data.name) / 'runs.json', events_file=Path(self.data.name) / 'events.jsonl')
        task = self.root / 'tasks/002-add-the-badge.md'; task.write_text(task.read_text() + '\nFiles: app.py\n')
        (self.root / 'tests').mkdir(exist_ok=True); (self.root / 'tests/test_app.py').write_text('')
        ledger.start_request('p', str(self.root), 'Add the badge')
        ledger.paperwork.propose_plan('p'); ledger.paperwork.approve_plan('p')
        ledger.judgements.classifier = Mock(); ledger.judgements.classifier.ask.return_value = {'answer': None, 'confidence': .3, 'abstained': True}
        return ledger

    def run_(self, ledger, command):
        return ledger.propose('execute_command', {'command': command}, 'admin', pi_tool='bash', cwd=str(self.root), request='p')

    def test_an_unclassified_command_is_refused_with_an_alternative_no_choice_waits_and_writes_go_on(self):
        ledger = self.building()
        refused = self.run_(ledger, 'python3 app.py --serve')
        self.assertEqual(refused['rule'], 'G-015')
        self.assertIn('`python3 -m unittest discover -s tests`', refused['reason'])
        self.assertNotIn('choice', refused.get('judgement') or {})
        self.assertIsNone(ledger.paperwork.waiting_choice(self.root), 'no pending question')
        write = ledger.propose('write_file', {'path': 'app.py', 'content': 'x = 2\n'}, 'admin', pi_tool='write', cwd=str(self.root), request='p')
        self.assertEqual(write['outcome'], 'ALLOW', write)
        self.assertEqual(self.run_(ledger, 'python3 -m pytest tests/test_app.py -q 2>&1 | tail -n 20')['outcome'], 'ALLOW')

    def test_the_same_refused_command_again_says_so_and_stays_refused(self):
        ledger = self.building()
        first = self.run_(ledger, 'python3 app.py')
        self.assertFalse(first.get('repeat')); self.assertNotIn('again', first['reason'])
        second = self.run_(ledger, 'python3 app.py')
        self.assertEqual(second['rule'], 'G-015'); self.assertTrue(second['repeat'])
        self.assertEqual(second['reason'].count('again'), 1, second['reason'])
        self.assertIn('unittest', second['instead'])
        self.assertIsNone(ledger.paperwork.waiting_choice(self.root))

    def test_unsafe_commands_and_prohibited_writes_stay_refused(self):
        ledger = self.building()
        self.assertNotEqual(self.run_(ledger, 'rm -rf /')['outcome'], 'ALLOW')
        self.assertNotEqual(self.run_(ledger, 'git push origin main')['outcome'], 'ALLOW')
        outside = ledger.propose('write_file', {'path': 'notes.txt', 'content': 'x'}, 'admin', pi_tool='write', cwd=str(self.root), request='p')
        self.assertNotEqual(outside['outcome'], 'ALLOW')

    def test_an_older_shell_risk_question_never_blocks_writes(self):
        ledger = self.building()
        ledger.paperwork.choice_pending('p', {'question': 'How should Pi proceed with this unclassified command?', 'options': [{'label': 'Keep the command blocked'}],
                                              'recommended': 0, 'allow_other': True, 'system_owned': True, 'judgement': {'kind': 'shell_risk', 'digest': 'x'}}, system=True)
        write = ledger.propose('write_file', {'path': 'app.py', 'content': 'x = 2\n'}, 'admin', pi_tool='write', cwd=str(self.root), request='p')
        self.assertEqual(write['outcome'], 'ALLOW', write)


if __name__ == '__main__':
    unittest.main()
