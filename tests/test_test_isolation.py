"""Task 263: the tests never write into the person's data folder (review item 15: 723 report rows were test output)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import glob
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class NodeSuiteIsolationTest(unittest.TestCase):
    def test_node_suite_writes_nothing_into_home(self):
        """The whole Node suite with HOME in an empty folder: the folder stays empty (no pi-local-harness-data)."""
        with tempfile.TemporaryDirectory(prefix='pi-test-home-') as home:
            env = {key: value for key, value in os.environ.items()
                   if not key.startswith(('PI_HARNESS_', 'PI_WEB_REMOTE_')) and key not in ('PI_AGENT_DATA', 'PI_WEB_DATA', 'PI_CODING_AGENT_DIR', 'PI_WEB_PORT', 'PI_GATE_PORT', 'NODE_TEST_CONTEXT')}
            env['HOME'] = home
            files = sorted(glob.glob(str(ROOT / 'tests/harness/*.test.mjs')))
            run = subprocess.run(['node', '--test', *files], cwd=ROOT, env=env, capture_output=True, text=True, timeout=600)
            written = sorted(str(path.relative_to(home)) for path in Path(home).rglob('*'))
            self.assertEqual(written, [], 'the Node tests wrote into HOME:\n' + '\n'.join(written[:20]))
            self.assertEqual(run.returncode, 0, (run.stdout + run.stderr)[-3000:])

    def test_python_tests_have_their_own_data_folder(self):
        """isolation.py: the live workbench's ports and Pi's folder never leak in; the data folder is a temporary one."""
        for name in ('PI_WEB_PORT', 'PI_GATE_PORT', 'PI_CODING_AGENT_DIR', 'PI_WEB_DATA'):
            self.assertNotIn(name, os.environ)
        data = Path(os.environ['PI_AGENT_DATA'])
        self.assertNotEqual(data.resolve(), (Path.home() / 'pi-local-harness-data').resolve())
        self.assertTrue(str(data.resolve()).startswith(str(Path(tempfile.gettempdir()).resolve())))


if __name__ == '__main__':
    unittest.main()
