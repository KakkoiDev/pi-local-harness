try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OLD = re.compile('laya', re.I)


class GateNamingTests(unittest.TestCase):
    """The checker is named Gate. Closed task records keep the old name as history."""

    def tracked(self):
        return subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split()

    def open_tasks(self):
        lines = [line for line in (ROOT / 'ROADMAP.md').read_text().splitlines() if line.startswith('- [ ]')]
        return lines, [match for line in lines for match in re.findall(r'\((tasks/[^)]+\.md)\)', line)]

    def test_no_old_name_outside_closed_task_records(self):
        lines, open_files = self.open_tasks()
        found = [line for line in lines if OLD.search(line)]
        for name in self.tracked():
            if name == 'tests/test_naming.py' or name == 'ROADMAP.md' or name.startswith('kit/vendor/') or (name.startswith('tasks/') and name not in open_files):  # third-party code is not ours to rename
                continue
            path = ROOT / name
            if OLD.search(name):
                found.append(name)
            elif path.is_file() and path.suffix not in {'.woff2', '.png', '.jpg', '.ico'}:
                if OLD.search(path.read_text(encoding='utf-8', errors='ignore')):
                    found.append(name)
        self.assertEqual(found, [])


if __name__ == '__main__':
    unittest.main()
