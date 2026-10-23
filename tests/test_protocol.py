"""Gate allows `git commit` in a ROADMAP.md + tasks/ project only after the AGENT.md protocol:
red test run, implementation, green test run on the final code, checked task, checked roadmap."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from gate.engine import GateEngine
from gate.ledger import ProposalLedger

def git(root, *args):
    subprocess.run(['git', '-C', str(root), *args], check=True, capture_output=True)

class ProtocolTest(unittest.TestCase):
    def setUp(self):
        # These exercise G-005's independent commit protocol, not Pi's phase permission (tests/test_phases.py).
        permission = patch('gate.phases.refusal', return_value=None); permission.start(); self.addCleanup(permission.stop)
        directory = tempfile.TemporaryDirectory(); self.addCleanup(directory.cleanup)
        self.root = Path(directory.name).resolve()
        (self.root / 'tasks').mkdir()
        (self.root / 'tasks/01-feature.md').write_text('# Feature\n\nKind: code\n\n- [ ] Red\n- [ ] Green\n')
        (self.root / 'ROADMAP.md').write_text('- [ ] [01](tasks/01-feature.md)\n')
        (self.root / 'app.py').write_text('VALUE = 1\n')
        git(self.root, 'init', '-q'); git(self.root, 'add', '.')
        git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'base')
        log = tempfile.NamedTemporaryFile(suffix='.log', delete=False); log.close(); self.addCleanup(Path(log.name).unlink)
        self.ledger = ProposalLedger(GateEngine('specs/judges.md', log.name))

    def run_bash(self, command, exit_code=0, cwd=None, execute=False):
        gate = self.ledger.propose('execute_command', {'command': command}, 'admin', pi_tool='bash', cwd=str(cwd or self.root))
        if gate['outcome'] == 'ALLOW':
            if execute:exit_code = subprocess.run(command, shell=True, cwd=cwd or self.root, capture_output=True).returncode
            self.ledger.complete(gate['proposal_id'], 'execute_command', {'command': command}, '', exit_code)
        return gate

    def commit(self, cwd=None):
        return self.run_bash('git add -A && git -c user.name=t -c user.email=t@t commit -q -m work', cwd=cwd, execute=True)

    def check_boxes(self, kind='code'):
        (self.root / 'tasks/01-feature.md').write_text(f'# Feature\n\nKind: {kind}\n\n- [x] Red\n- [x] Green\n')
        (self.root / 'ROADMAP.md').write_text('- [x] [01](tasks/01-feature.md)\n')

    def test_unavailable_test_commands_never_supply_red_evidence(self):
        for code in (126,127):
            with self.subTest(code=code):
                self.run_bash('python3 -m unittest',exit_code=code)
                self.assertFalse(self.ledger.protocol.failed_run(self.root))

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

    def test_cd_prefixed_commands_use_the_target_folder(self):
        home = self.root.parent
        (self.root / 'app.py').write_text('VALUE = 2\n')
        gate = self.run_bash(f'cd {self.root} && git commit -qam work', cwd=home)
        self.assertEqual(gate['outcome'], 'REVISE')
        self.assertEqual(self.run_bash(f'git -C {self.root} commit -qam work', cwd=home)['outcome'], 'REVISE')
        self.run_bash(f'cd {self.root} && python3 -m unittest', exit_code=1, cwd=home)
        (self.root / 'app.py').write_text('VALUE = 3\n')
        self.run_bash(f'cd {self.root}; python3 -m unittest', cwd=home)
        self.check_boxes()
        self.assertEqual(self.run_bash(f'cd {self.root} && git add -A && git -c user.name=t -c user.email=t@t commit -qm w', cwd=home, execute=True)['outcome'], 'ALLOW')

    def test_project_in_a_subfolder_of_a_larger_repository(self):
        project = self.root / 'app'
        (project / 'tasks').mkdir(parents=True)
        (project / 'tasks/01.md').write_text('Kind: code\n- [ ] Do\n'); (project / 'ROADMAP.md').write_text('- [ ] [01](tasks/01.md)\n'); (project / 'main.py').write_text('x = 1\n')
        git(self.root, 'add', '.'); git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'sub')
        (self.root / 'app.py').write_text('VALUE = 9\n')
        self.run_bash('pytest', exit_code=1, cwd=project)
        (project / 'main.py').write_text('x = 2\n')
        self.run_bash('pytest', cwd=project)
        (project / 'tasks/01.md').write_text('Kind: code\n- [x] Do\n'); (project / 'ROADMAP.md').write_text('- [x] [01](tasks/01.md)\n')
        self.assertEqual(self.run_bash('git commit -qm w -- .', cwd=project)['outcome'], 'ALLOW')

    def test_git_failure_revises_instead_of_raising(self):
        from unittest.mock import patch
        import subprocess as process
        (self.root / 'app.py').write_text('VALUE = 2\n')
        with patch('gate.protocol.subprocess.run', side_effect=process.TimeoutExpired('git', 15)):
            gate = self.commit()
            self.assertEqual(gate['outcome'], 'REVISE'); self.assertIn('could not be checked', gate['reason'])
            self.run_bash('pytest')

    def test_large_changed_files_are_fingerprinted_without_reading_them(self):
        from gate.protocol import code_state, changed_paths
        big = self.root / 'model.bin'; big.write_bytes(b'0' * (2 * 1024 * 1024))
        original = Path.read_bytes
        def guarded(path):
            if path.name == 'model.bin': raise AssertionError('large file was read')
            return original(path)
        from unittest.mock import patch
        with patch.object(Path, 'read_bytes', guarded):
            first = code_state(self.root, changed_paths(self.root))[0]
        big.write_bytes(b'1' * (2 * 1024 * 1024 + 1))
        self.assertNotEqual(first, code_state(self.root, changed_paths(self.root))[0])

    def test_interrupted_test_run_is_not_red(self):
        for status in ['Command aborted', 'Command terminated without an exit code', 'Command timed out after 60 seconds']:
            gate = self.ledger.propose('execute_command', {'command': 'pytest'}, 'admin', pi_tool='bash', cwd=str(self.root))
            self.ledger.complete(gate['proposal_id'], 'execute_command', {'command': 'pytest'}, [{'type': 'text', 'text': f'partial\n\n{status}'}], 1)
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.run_bash('pytest'); self.check_boxes()
        self.assertIn('failing (red) test', self.commit()['reason'])

    def test_runs_survive_a_restart(self):
        state = Path(tempfile.mkdtemp()) / 'gate-protocol.json'
        self.ledger = ProposalLedger(self.ledger.engine, protocol_file=state)
        self.run_bash('pytest', exit_code=1)
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.ledger = ProposalLedger(self.ledger.engine, protocol_file=state)
        self.run_bash('pytest'); self.check_boxes()
        self.assertEqual(self.commit()['outcome'], 'ALLOW')
        self.assertEqual(ProposalLedger(self.ledger.engine, protocol_file=state).protocol.runs, {})

    def test_chore_task_needs_green_but_not_red(self):
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.run_bash('pytest'); self.check_boxes('chore')
        self.assertEqual(self.commit()['outcome'], 'ALLOW')

    def test_docs_task_needs_no_runs_but_cannot_change_code(self):
        (self.root / 'NOTES.md').write_text('notes\n'); self.check_boxes('docs')
        self.assertEqual(self.commit()['outcome'], 'ALLOW')
        (self.root / 'app.py').write_text('VALUE = 2\n'); self.check_boxes('docs')
        (self.root / 'tasks/01-feature.md').write_text('Kind: docs\n\n- [x] Red\n- [x] Green\n- [x] More\n')
        (self.root / 'ROADMAP.md').write_text('- [x] [01](tasks/01-feature.md)\n- [x] more\n')
        self.assertIn('Kind: docs', self.commit()['reason'])

    def test_missing_or_unknown_kind_names_the_fix(self):
        for line in ['', 'Kind: stuff\n', 'Kind: config\n']:
            (self.root / 'tasks/01-feature.md').write_text(f'{line}- [x] Red\n')
            (self.root / 'ROADMAP.md').write_text('- [x] [01](tasks/01-feature.md)\n')
            gate = self.commit()
            self.assertEqual(gate['outcome'], 'REVISE'); self.assertIn('Kind: code|chore|docs|planning', gate['reason'])

    def test_planning_commit_adds_unchecked_tasks_with_kinds(self):
        (self.root / 'tasks/02-next.md').write_text('# Next\n\nKind: code\n\n- [ ] Red\n')
        (self.root / 'ROADMAP.md').write_text('- [ ] [01](tasks/01-feature.md)\n- [ ] [02](tasks/02-next.md)\n')
        self.assertEqual(self.commit()['outcome'], 'ALLOW')
        (self.root / 'tasks/03-later.md').write_text('# Later\n\n- [ ] Red\n')
        gate = self.commit()
        self.assertEqual(gate['outcome'], 'REVISE'); self.assertIn('tasks/03-later.md', gate['reason'])

    def test_folders_without_roadmap_and_tasks_are_unaffected(self):
        (self.root / 'ROADMAP.md').unlink()
        (self.root / 'app.py').write_text('VALUE = 2\n')
        self.assertEqual(self.commit()['outcome'], 'ALLOW')

    def test_untracked_interpreter_cache_is_not_request_work_but_tracked_cache_is(self):
        from gate.protocol import changed_paths
        cache=self.root/'__pycache__';cache.mkdir()
        bytecode=cache/'app.cpython-314.pyc';bytecode.write_bytes(b'cache')
        source=cache/'source.py';source.write_text('VALUE = 2')
        paths=changed_paths(self.root)
        self.assertNotIn('__pycache__/app.cpython-314.pyc',paths)
        self.assertIn('__pycache__/source.py',paths)
        git(self.root,'add',str(bytecode));git(self.root,'-c','user.name=t','-c','user.email=t@t','commit','-qm','tracked cache')
        bytecode.write_bytes(b'changed');self.assertIn('__pycache__/app.cpython-314.pyc',changed_paths(self.root))

    def test_new_project_history_ignores_generated_cache_without_hiding_source(self):
        from kit.new_project import start_history
        project=self.root/'new';project.mkdir();(project/'ROADMAP.md').write_text('# Plan')
        start_history(project)
        cache=project/'tests/__pycache__';cache.mkdir(parents=True)
        (cache/'app.cpython-314.pyc').write_bytes(b'generated')
        result=subprocess.run(['git','-C',str(project),'status','--porcelain'],capture_output=True,text=True,check=True)
        self.assertEqual(result.stdout,'')
        (cache/'source.py').write_text('pass')
        result=subprocess.run(['git','-C',str(project),'status','--porcelain','--untracked-files=all'],capture_output=True,text=True,check=True)
        self.assertIn('source.py',result.stdout)
