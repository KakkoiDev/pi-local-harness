#!/usr/bin/env python3
"""Given/When/Then scenarios in a task file -> one end-to-end test each, named after the scenario's heading.

  python3 tools/scenarios.py list TASK.md [--json]
  python3 tools/scenarios.py skeleton TASK.md --lang python|js     # print a test file to fill in
  python3 tools/scenarios.py check TASK.md --tests FILE... [--junit REPORT.xml...]

A scenario in the task file's `## Scenarios` section (Markdown list, plain lines or a ```gherkin block; "And"/"But"
continue the step above). The recommended heading is `### <ID> <title>`: an optional story id (US-312, or US-new while
the story is not written), then the title, with an optional `Scenario:` prefix. `### Scenario: <title>` (anywhere in
the file) and `### <title>` (inside `## Scenarios`) keep working.

  ## Scenarios

  ### US-12 Add a task
  - Given I am signed in with an empty list
  - When I add the task "Buy milk"
  - Then I see "Buy milk" in the list

The test for it is named after its heading (with or without the id), or is the story with that id and title:
  Python      @pytest.mark.scenario("US-12 Add a task")  def test_us_12_add_a_task(...)   (either one is enough)
  JavaScript  test('US-12 Add a task', ...)  or  story('US-12', 'Add a task', ...)
  Without an id: @pytest.mark.scenario("Add a task") / def test_add_a_task / test('Add a task', ...).
A test file that runs the task file through functional/ (scenario_tests, load_scenarios, loadScenarios) and names the
task file implements all its scenarios; --junit still requires each one to have run and passed.

`check` exits 1 when a scenario has no test, or (with --junit) when its test did not run and pass. Standard library
only.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass, field
from pathlib import Path

SCENARIO = re.compile(r"^\s*(?:[-*]\s+)?(?:#+\s*)?Scenario(?: Outline)?:\s*(?P<title>.+?)\s*#*\s*$", re.IGNORECASE)
SECTION = re.compile(r"^\s*##\s+(?P<name>[^#].*?)\s*$")
HEADING = re.compile(r"^\s*###\s+(?:Scenario(?: Outline)?:\s*)?(?P<title>.+?)\s*#*\s*$", re.IGNORECASE)
SCENARIO_ID = re.compile(r"^(?P<id>[A-Z][A-Z0-9]*-(?:\d+|new))\b[\s:]*(?P<title>.+)$")
STORY = re.compile(r"""\bstory\(\s*(?P<q>['"`])(?P<id>[A-Z][A-Z0-9]*-\d+)(?P=q)\s*,\s*(?P<q2>['"`])(?P<title>(?:\\.|(?!(?P=q2)).)*)(?P=q2)""")
RUNS_TASK = re.compile(r"\b(?:scenario_tests|load_scenarios|loadScenarios)\(")
STEP = re.compile(r"^\s*(?:[-*]\s+)?(?P<keyword>Given|When|Then|And|But)\s+(?P<text>.+?)\s*$", re.IGNORECASE)
PY_MARK = re.compile(r"""@pytest\.mark\.scenario\(\s*(?P<q>['"])(?P<title>.+?)(?P=q)\s*\)""")
PY_DEF = re.compile(r"^\s*(?:async\s+)?def\s+(?P<name>test_\w+)\s*\(", re.MULTILINE)
JS_TEST = re.compile(r"""\btest(?:\.(?:only|fixme|fail|slow))?\(\s*(?P<q>['"`])(?P<title>(?:\\.|(?!(?P=q)).)+)(?P=q)""")


@dataclass
class Scenario:
    title: str  # without the id
    id: str | None = None
    given: list[str] = field(default_factory=list)
    when: list[str] = field(default_factory=list)
    then: list[str] = field(default_factory=list)


    @property
    def name(self) -> str:
        """The heading without `Scenario:`: "US-12 Add a task", or "Add a task" without an id."""
        return f"{self.id} {self.title}" if self.id else self.title


def split_heading(heading: str) -> tuple[str | None, str]:
    match = SCENARIO_ID.match(heading.strip())
    return (match["id"], match["title"].strip()) if match else (None, heading.strip())


def parse(text: str) -> list[Scenario]:
    """Every scenario in a task file, in order."""
    scenarios: list[Scenario] = []
    current_part = None
    in_section = False
    for line in text.splitlines():
        if section := SECTION.match(line):
            in_section = section["name"].lower().startswith("scenarios")
            continue
        if match := (SCENARIO.match(line) or (HEADING.match(line) if in_section else None)):
            ident, title = split_heading(match["title"])
            scenarios.append(Scenario(title, ident))
            current_part = None
        elif scenarios and (match := STEP.match(line)):
            keyword = match["keyword"].lower()
            if keyword in ("and", "but"):
                if current_part is None:
                    continue
            else:
                current_part = keyword
            getattr(scenarios[-1], current_part).append(match["text"])
    return scenarios


def python_name(title: str) -> str:
    """'Add a task' -> 'test_add_a_task'. Japanese stays: 'タスクを追加する' -> 'test_タスクを追加する'."""
    words = re.sub(r"[^\w]+", "_", title.lower(), flags=re.UNICODE).strip("_")
    return f"test_{words}"


def test_titles(path: Path) -> set[str]:
    """Scenario names a test file implements (marker strings, test function names, JS test titles, stories)."""
    text = path.read_text(encoding="utf-8")
    if path.suffix == ".py":
        return {m["title"] for m in PY_MARK.finditer(text)} | {m["name"] for m in PY_DEF.finditer(text)}
    titles = {m["title"].replace(f"\\{m['q']}", m["q"]) for m in JS_TEST.finditer(text)}
    return titles | {f"{m['id']} {m['title']}" for m in STORY.finditer(text)}


def runs_task(path: Path, task: Path) -> bool:
    """The test file runs the task file through functional/ (scenario_tests, load_scenarios, loadScenarios)."""
    text = path.read_text(encoding="utf-8")
    return bool(RUNS_TASK.search(text)) and task.name in text


def keys(scenario: Scenario) -> list[str]:
    """The test names that implement a scenario: its heading and its title, as written and as a Python name."""
    names = [scenario.name, scenario.title]
    return list(dict.fromkeys(names + [python_name(n) for n in names]))


def implemented(scenario: Scenario, names: set[str]) -> bool:
    return any(key in names for key in keys(scenario))


def junit_results(paths: list[Path]) -> dict[str, bool]:
    """Test name -> passed, from JUnit XML reports (pytest --junitxml, Playwright's junit reporter)."""
    results: dict[str, bool] = {}
    for path in paths:
        for case in ET.parse(path).getroot().iter("testcase"):
            name = re.sub(r"\[[^\]]*\]$", "", case.get("name", ""))  # test_x[chromium] -> test_x
            passed = not any(child.tag in ("failure", "error", "skipped") for child in case)
            for key in {name, name.split(" › ")[-1]}:
                results[key] = results.get(key, True) and passed
    return results


def skeleton(scenarios: list[Scenario], lang: str, source: str) -> str:
    if lang == "python":
        out = [f'"""End-to-end tests for {source}: one test per scenario, named after its title."""',
               "import pytest", "from playwright.sync_api import expect", ""]
        for s in scenarios:
            out += ["", f"@pytest.mark.scenario({json.dumps(s.name, ensure_ascii=False)})",
                    f"def {python_name(s.name)}(signed_in_page):"]
            out += [f"    # Given {step}" for step in s.given] or ["    # Given"]
            out += [f"    # When {step}" for step in s.when] or ["    # When"]
            out += [f"    # Then {step}" for step in s.then] or ["    # Then"]
            out += ['    raise NotImplementedError("Arrange (Given), Act (When), Assert (Then) with expect()")', ""]
        return "\n".join(out).rstrip() + "\n"
    out = [f"// End-to-end tests for {source}: one test per scenario, named after its title.",
           "import { test, expect } from './fixtures.js';", ""]
    for s in scenarios:
        out += [f"test({json.dumps(s.name, ensure_ascii=False)}, async ({{ signedInPage: page }}) => {{"]
        out += [f"  // Given {step}" for step in s.given] or ["  // Given"]
        out += [f"  // When {step}" for step in s.when] or ["  // When"]
        out += [f"  // Then {step}" for step in s.then] or ["  // Then"]
        out += ["  throw new Error('Arrange (Given), Act (When), Assert (Then) with expect()');", "});", ""]
    return "\n".join(out).rstrip() + "\n"


def check(task: Path, tests: list[Path], reports: list[Path]) -> tuple[list[dict], bool]:
    scenarios = parse(task.read_text(encoding="utf-8"))
    names: dict[str, list[str]] = {}
    for path in tests:
        found = test_titles(path)
        if runs_task(path, task):
            found |= {key for s in scenarios for key in keys(s)}
        for name in found:
            names.setdefault(name, []).append(str(path))
    results = junit_results(reports) if reports else None
    rows, ok = [], bool(scenarios)
    for s in scenarios:
        files = [f for key in keys(s) for f in names.get(key, [])]
        row = {"scenario": s.name, "tests": sorted(set(files)), "status": "has a test" if files else "no test"}
        if files and results is not None:
            ran = [results[key] for key in keys(s) if key in results]
            row["status"] = "passed" if ran and all(ran) else ("failed" if ran else "did not run")
        ok = ok and row["status"] in ("has a test", "passed")
        rows.append(row)
    return rows, ok


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    p_list = sub.add_parser("list", help="the scenarios in a task file")
    p_list.add_argument("task", type=Path)
    p_list.add_argument("--json", action="store_true")
    p_skel = sub.add_parser("skeleton", help="print a test file with one test per scenario")
    p_skel.add_argument("task", type=Path)
    p_skel.add_argument("--lang", choices=["python", "js"], required=True)
    p_check = sub.add_parser("check", help="every scenario has a test (and, with --junit, it passed)")
    p_check.add_argument("task", type=Path)
    p_check.add_argument("--tests", type=Path, nargs="+", required=True)
    p_check.add_argument("--junit", type=Path, nargs="*", default=[])
    p_check.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    if args.command == "list":
        scenarios = parse(args.task.read_text(encoding="utf-8"))
        if args.json:
            print(json.dumps([{**asdict(s), "name": s.name} for s in scenarios], ensure_ascii=False, indent=2))
        else:
            for s in scenarios:
                print(f"Scenario: {s.name}  ({len(s.given)} given, {len(s.when)} when, {len(s.then)} then)")
        return 0 if scenarios else 1
    if args.command == "skeleton":
        print(skeleton(parse(args.task.read_text(encoding="utf-8")), args.lang, args.task.name), end="")
        return 0
    rows, ok = check(args.task, args.tests, args.junit)
    if args.json:
        print(json.dumps({"ok": ok, "scenarios": rows}, ensure_ascii=False, indent=2))
    else:
        if not rows:
            print(f"{args.task}: no scenarios found (## Scenarios, then ### <ID> <title> and Given/When/Then lines)")
        for row in rows:
            where = ", ".join(row["tests"]) or "-"
            print(f"{'ok ' if row['status'] in ('has a test', 'passed') else 'NO '} {row['scenario']}: {row['status']} ({where})")
        print("All scenarios have their test." if ok else "Some scenarios have no passing test.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
