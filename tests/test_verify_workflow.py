"""The completion gate must fail when a test fails, not only when checkboxes disagree."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).resolve().parent / 'verify_workflow.py'

def project(directory, test_body):
    root = Path(directory)
    (root / 'tasks').mkdir()
    (root / 'tasks/01.md').write_text('- [x] done\n')
    (root / 'ROADMAP.md').write_text('- [x] [01](tasks/01.md)\n')
    (root / 'tests').mkdir()
    (root / 'tests/test_sample.py').write_text('import unittest\nclass T(unittest.TestCase):\n    def test_it(self):\n' + test_body)
    return root

class VerifyWorkflowTest(unittest.TestCase):
    def run_gate(self, root):
        return subprocess.run([sys.executable, str(SCRIPT)], cwd=root, capture_output=True, text=True, timeout=120)

    def test_failing_unit_test_fails_the_gate(self):
        with tempfile.TemporaryDirectory() as directory:
            completed = self.run_gate(project(directory, '        self.fail("red")\n'))
            self.assertEqual(completed.returncode, 1, completed.stdout + completed.stderr)
            self.assertIn('unittest', completed.stdout)

    def test_passing_tests_and_consistent_roadmap_pass(self):
        with tempfile.TemporaryDirectory() as directory:
            completed = self.run_gate(project(directory, '        pass\n'))
            self.assertEqual(completed.returncode, 0, completed.stdout + completed.stderr)


class FinishedButOpenTest(unittest.TestCase):
    def test_an_open_roadmap_line_whose_task_is_complete_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            root = project(directory, '        pass\n')
            (root / 'ROADMAP.md').write_text('- [ ] [01](tasks/01.md)\n')  # the task file has every box checked
            completed = subprocess.run([sys.executable, str(SCRIPT)], cwd=root, capture_output=True, text=True, timeout=120)
            self.assertEqual(completed.returncode, 1, completed.stdout)
            self.assertIn('still open in ROADMAP.md', completed.stdout)

class OptionalQualityGateTest(unittest.TestCase):
    def test_explicit_missing_ruff_fails_instead_of_passing(self):
        with tempfile.TemporaryDirectory() as directory:
            root=project(directory,'        pass\n')
            result=subprocess.run([sys.executable,str(SCRIPT)],cwd=root,capture_output=True,text=True,env={**os.environ,'PI_RUFF_BINARY':str(root/'missing')},timeout=120)
            self.assertEqual(result.returncode,1,result.stdout)
            self.assertIn('Ruff',result.stdout)
    @unittest.skipUnless(os.environ.get('PI_TEST_RUFF'),'Approved real Ruff required')
    def test_real_lint_finding_stops_an_otherwise_passing_workflow(self):
        with tempfile.TemporaryDirectory() as directory:
            root=project(directory,'        pass\n')
            source=root/'latent.py';source.write_text('def latent_bug():\n    return missing_value\n')
            env={**os.environ,'PI_RUFF_BINARY':os.environ['PI_TEST_RUFF']}
            def run():return subprocess.run([sys.executable,str(SCRIPT)],cwd=root,capture_output=True,text=True,env=env,timeout=120)
            result=run();self.assertEqual(result.returncode,1,result.stdout);self.assertIn('F821',result.stdout)
            self.assertIn('missing_value',source.read_text())
            source.write_text('def latent_bug():\n    return 1\n')
            result=run();self.assertEqual(result.returncode,0,result.stdout+result.stderr)
