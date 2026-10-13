"""Laya allows `git commit` in a ROADMAP.md + tasks/ project only after the AGENT.md protocol:
red test run, implementation, green test run on the final code, checked task, checked roadmap."""
from pathlib import Path
import subprocess
import tempfile
import unittest
from laya.engine import LayaEngine
from laya.ledger import ProposalLedger

def git(root, *args):
    subprocess.run(['git', '-C', str(root), *args], check=True, capture_output=True)

class ProtocolTest(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        self.root = Path(directory.name).resolve()
        (self.root / 'tasks').mkdir()
        (self.root / 'tasks/01-feature.md').write_text('# Feature\n\n- [ ] Red\n- [ ] Green\n')
        (self.root / 'ROADMAP.md').write_text('- [ ] [01](tasks/01-feature.md)\n')
        (self.root / 'app.py').write_text('VALUE = 1\n')
        git(self.root, 'init', '-q'); git(self.root, 'add', '.')
        git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'base')
        log = tempfile.NamedTemporaryFile(suffix='.log', delete=False); log.close(); self.addCleanup(Path(log.name).unlink)
        self.ledger = ProposalLedger(LayaEngine('specs/judges.md', log.name))

    def run_bash(self, command, exit_code=0, cwd=None, execute=False):
        gate = self.ledger.propose('execute_command', {'command': command}, 'admin', pi_tool='bash', cwd=str(cwd or self.root))
        if gate['outcome'] == 'ALLOW':
            if execute:exit_code = subprocess.run(command, shell=True, cwd=cwd or self.root, capture_output=True).returncode
            self.ledger.complete(gate['proposal_id'], 'execute_command', {'command': command}, '', exit_code)
        return gate

    def commit(self, cwd=None):
        return self.run_bash('git add -A && git -c user.name=t -c user.email=t@t commit -q -m work', cwd=cwd, execute=True)

    def check_boxes(self):
        (self.root / 'tasks/01-feature.md').write_text('# Feature\n\n- [x] Red\n- [x] Green\n')
        (self.root / 'ROADMAP.md').write_text('- [x] [01](tasks/01-feature.md)\n')

    def test_full_protocol_allows_commit(self):
        (self.root / 'test_app.py').write_text('assert False\n')
        self.assertEqual(self.run_bash('python3 -m unittest', exit_code=1)['outcome'], 'ALLOW')
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.run_bash('python3 -m unittest')
        self.check_boxes()
        self.assertEqual(self.commit()['outcome'], 'ALLOW')

    def test_missing_steps_are_named(self):
        (self.root / 'app.py').write_text('VALUE = 2\n')
        gate = self.commit()
        self.assertEqual(gate['outcome'], 'REVISE')
        for step in ['failing (red) test', 'passing (green) test', 'tasks/', 'ROADMAP.md']:
            self.assertIn(step, gate['reason'])
        self.assertNotIn('proposal_id', gate)

    def test_red_without_implementation_change_is_not_enough(self):
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.run_bash('python3 -m unittest', exit_code=1)
        self.run_bash('python3 -m unittest')
        self.check_boxes()
        self.assertIn('failing (red) test', self.commit()['reason'])

    def test_code_change_after_green_requires_new_green(self):
        self.run_bash('pytest', exit_code=1)
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.run_bash('pytest')
        self.check_boxes()
        (self.root / 'app.py').write_text('VALUE = 3\n')
        self.assertIn('passing (green) test', self.commit()['reason'])
        self.run_bash('pytest')
        self.assertEqual(self.commit()['outcome'], 'ALLOW')

    def test_piped_or_masked_test_runs_do_not_count(self):
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.run_bash('python3 -m unittest', exit_code=1)
        (self.root / 'app.py').write_text('VALUE = 3\n')
        self.run_bash('python3 -m unittest 2>&1 | tail -5')
        self.run_bash('python3 -m unittest || true')
        self.check_boxes()
        self.assertIn('passing (green) test', self.commit()['reason'])
        self.run_bash('cd . && python3 -m unittest')
        self.assertEqual(self.commit()['outcome'], 'ALLOW')

    def test_documentation_only_commit_needs_task_and_roadmap_but_no_tests(self):
        (self.root / 'NOTES.md').write_text('notes\n')
        gate = self.commit()
        self.assertEqual(gate['outcome'], 'REVISE'); self.assertNotIn('failing (red) test', gate['reason']); self.assertIn('ROADMAP.md', gate['reason'])
        self.check_boxes()
        self.assertEqual(self.commit()['outcome'], 'ALLOW')

    def test_successful_commit_starts_a_new_cycle(self):
        self.run_bash('npm test', exit_code=1)
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.run_bash('npm test'); self.check_boxes()
        self.assertEqual(self.commit()['outcome'], 'ALLOW')
        (self.root / 'app.py').write_text('VALUE = 3\n')
        self.run_bash('npm test')
        self.assertIn('failing (red) test', self.commit()['reason'])

    def test_commit_from_subdirectory_and_wrapped_commit_are_checked(self):
        (self.root / 'src').mkdir(); (self.root / 'src/a.py').write_text('x = 1\n')
        self.assertEqual(self.commit(cwd=self.root / 'src')['outcome'], 'REVISE')
        self.assertEqual(self.run_bash('sh -c "git commit -qam work"')['outcome'], 'REVISE')

    def test_folders_without_roadmap_and_tasks_are_unaffected(self):
        (self.root / 'ROADMAP.md').unlink()
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.assertEqual(self.commit()['outcome'], 'ALLOW')
