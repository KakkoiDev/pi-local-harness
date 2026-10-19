"""The test protocol, checked with test-core's tools (test-core/, MIT): part of the base check, Python alone,
offline. `python3 -m unittest tests.test_protocol` runs it; pytest runs it with the rest.

- every scenario in SCENARIOS.md has one pilot test named after its title (scenarios.py), in tests/test_tui.py or
  tests/e2e/;
- no test waits for time, is left focused or reaches a real host (flaky_lint.py).
A terminal app has no pages, so test-core's control check (e2e_coverage.py, for HTML) does not apply: each key and
widget a person uses is reached through its scenario's pilot test instead. A failure says what to add, word for word."""
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "test-core" / "tools"


def tool(name: str, *arguments: str) -> tuple[int, str]:
    """Run one of test-core's tools on the project: (exit code, what it printed)."""
    done = subprocess.run([sys.executable, "-I", "-B", str(TOOLS / name), *arguments], cwd=ROOT, capture_output=True, text=True, timeout=120)
    return done.returncode, done.stdout + done.stderr


def scenario_tests() -> list[str]:
    found = [ROOT / "tests" / "test_tui.py", *sorted((ROOT / "tests" / "e2e").glob("test_*.py"))]
    return [str(path.relative_to(ROOT)) for path in found if path.is_file()]


class ProtocolTest(unittest.TestCase):
    def test_every_scenario_has_its_pilot_test_named_after_its_title(self) -> None:
        code, said = tool("scenarios.py", "check", "SCENARIOS.md", "--tests", *scenario_tests())
        self.assertEqual(code, 0, said)

    def test_no_test_waits_for_time_is_left_focused_or_reaches_a_real_host(self) -> None:
        code, said = tool("flaky_lint.py", "tests")
        self.assertEqual(code, 0, said)


if __name__ == "__main__":
    unittest.main()
