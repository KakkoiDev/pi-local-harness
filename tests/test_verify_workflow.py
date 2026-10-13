"""The completion gate must fail when a test fails, not only when checkboxes disagree."""
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
