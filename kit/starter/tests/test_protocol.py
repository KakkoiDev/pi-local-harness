"""The test protocol, checked with test-core's tools (test-core/, MIT): part of the base check, Python alone,
offline, no browser. `python3 -m unittest tests.test_protocol` runs it; pytest runs it with the rest.

- every scenario in SCENARIOS.md has one e2e test named after its title (scenarios.py);
- every button, link and field in the templates has an e2e step, and no e2e test names a control that is gone
  (e2e_coverage.py; the templates are read with their English texts from messages/en.json);
- no test waits for time, is left focused or reaches a real host (flaky_lint.py).
A failure says what to add or remove, word for word."""
import html
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "test-core" / "tools"


def tool(name: str, *arguments: str) -> tuple[int, str]:
    """Run one of test-core's tools on the project: (exit code, what it printed)."""
    done = subprocess.run([sys.executable, "-I", "-B", str(TOOLS / name), *arguments], cwd=ROOT, capture_output=True, text=True, timeout=120)
    return done.returncode, done.stdout + done.stderr


def e2e_tests() -> list[str]:
    return sorted(str(path.relative_to(ROOT)) for path in (ROOT / "tests" / "e2e").glob("*.py") if path.name.startswith("test_"))


def english_pages(folder: Path) -> list[str]:
    """The templates with `{{ t("key") }}` replaced by its English text, so each control is known by what it says."""
    english: dict[str, str] = json.loads((ROOT / "messages" / "en.json").read_text(encoding="utf-8"))
    def text(match: re.Match[str]) -> str:
        return html.escape(english.get(match[1], match[1]))
    pages: list[str] = []
    for path in sorted((ROOT / "app" / "templates").rglob("*.html")):
        target = folder / path.relative_to(ROOT / "app" / "templates")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(re.sub(r"""\{\{\s*t\(\s*["']([\w.]+)["']\s*\)\s*\}\}""", text, path.read_text(encoding="utf-8")), encoding="utf-8")
        pages.append(str(target))
    return pages


class ProtocolTest(unittest.TestCase):
    def test_every_scenario_has_its_e2e_test_named_after_its_title(self) -> None:
        code, said = tool("scenarios.py", "check", "SCENARIOS.md", "--tests", *e2e_tests())
        self.assertEqual(code, 0, said)

    def test_every_control_has_an_e2e_step_and_no_e2e_test_names_a_control_that_is_gone(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            code, said = tool("e2e_coverage.py", "--pages", *english_pages(Path(folder)), "--tests", *e2e_tests())
        self.assertEqual(code, 0, said)

    def test_no_test_waits_for_time_is_left_focused_or_reaches_a_real_host(self) -> None:
        code, said = tool("flaky_lint.py", "tests")
        self.assertEqual(code, 0, said)


if __name__ == "__main__":
    unittest.main()
