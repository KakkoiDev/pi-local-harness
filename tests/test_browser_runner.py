"""L-005: one command runs the browser suites from any shell, or says plainly that they did not run and how to set up."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from gate.protocol import test_folder

ROOT = Path(__file__).resolve().parent.parent


class BrowserRunnerTest(unittest.TestCase):
    def test_without_playwright_it_says_not_run_and_how_to_set_up(self):
        with tempfile.TemporaryDirectory() as home:
            env = {**{key: value for key, value in os.environ.items() if key not in ('NODE_PATH', 'PI_PLAYWRIGHT')}, 'HOME': home}
            run = subprocess.run([sys.executable, 'tests/browser/run.py', 'design'], cwd=ROOT, env=env, capture_output=True, text=True, timeout=60)
        self.assertEqual(run.returncode, 2, run.stdout + run.stderr)
        self.assertIn('Not run: Playwright is not installed', run.stdout)
        self.assertIn('npm install playwright@1.56.1', run.stdout)

    def test_unknown_suite_is_refused(self):
        run = subprocess.run([sys.executable, 'tests/browser/run.py', 'nope'], cwd=ROOT, capture_output=True, text=True, timeout=30)
        self.assertEqual(run.returncode, 2); self.assertIn('design, chat, stories or all', run.stdout + run.stderr)

    def test_gate_counts_it_as_a_test_run(self):
        self.assertEqual(test_folder('python3 tests/browser/run.py chat', str(ROOT)), ROOT)


if __name__ == '__main__':
    unittest.main()
