#!/usr/bin/env python3
"""Find the patterns that make tests flaky, in Python and JavaScript test files (recipe flaky-rules).

  python3 tools/flaky_lint.py PATH...          # files or folders; exit 1 when something is found

Flags: fixed waits (time.sleep, asyncio.sleep, wait_for_timeout/waitForTimeout, setTimeout in a test), tests left
focused (test.only, it.only, describe.only), "networkidle" waits, and real hosts in page.goto. A line that must keep one
says why: `# flaky-lint: allow <reason>` or `// flaky-lint: allow <reason>`. Standard library only.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

RULES = [
    (re.compile(r"\btime\.sleep\(|\basyncio\.sleep\(\s*[1-9.]"), "fixed sleep: wait for the state (expect, a response, an event)"),
    (re.compile(r"\bwait_for_timeout\(|\bwaitForTimeout\("), "fixed wait: wait for a locator, a response or a value"),
    (re.compile(r"\bsetTimeout\(|new Promise\(\s*\(?\s*r(?:esolve)?\s*\)?\s*=>\s*setTimeout"), "timer in a test: wait for the state instead"),
    (re.compile(r"\b(?:test|it|describe)\.only\("), "focused test left in: remove .only"),
    (re.compile(r"""['"`]networkidle['"`]"""), "networkidle is unreliable: wait for the element or response you need"),
    (re.compile(r"""\.goto\(\s*['"`]https?://(?!127\.0\.0\.1|localhost|\[::1\])"""), "a real host in goto: serve the app locally"),
]
ALLOW = re.compile(r"(?:#|//)\s*flaky-lint:\s*allow\s+\S")
TEST_FILE = re.compile(r"(^test_.*\.py$|_test\.py$|\.(?:test|spec)\.[cm]?[jt]sx?$|\.nodetest\.[cm]?js$)")


def test_files(paths: list[Path]) -> list[Path]:
    found = []
    for path in paths:
        if path.is_dir():
            found += [p for p in sorted(path.rglob("*")) if p.is_file() and TEST_FILE.search(p.name)
                      and not {"node_modules", ".venv"} & set(p.parts)]
        elif path.is_file():
            found.append(path)
    return found


def lint(path: Path) -> list[tuple[int, str, str]]:
    problems = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if ALLOW.search(line):
            continue
        for pattern, message in RULES:
            if pattern.search(line):
                problems.append((number, message, line.strip()))
    return problems


def main(argv: list[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    count = 0
    files = test_files([Path(arg) for arg in argv])
    for path in files:
        for number, message, line in lint(path):
            count += 1
            print(f"{path}:{number}: {message}\n    {line}")
    print(f"{count} flaky pattern(s) in {len(files)} test file(s)." if count else f"No flaky patterns in {len(files)} test file(s).")
    return 1 if count else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
