#!/usr/bin/env python3
"""The fixed step vocabulary: list it, check a task's scenarios against it, suggest the nearest known step.

  python3 tools/vocab.py list VOCAB.json... [--json]
  python3 tools/vocab.py check TASK.md... --vocab VOCAB.json... [--level unit|integration|e2e] [--json]
  python3 tools/vocab.py suggest "When I add task Buy milk" --vocab VOCAB.json...
  python3 tools/vocab.py validate VOCAB.json...

A vocabulary file (JSON):

  {"name": "Tasks", "levels": ["unit", "integration", "e2e"],
   "steps": [{"step": "When I add the task {title}", "params": {"title": "text"}, "ja": "タスク {title} を追加する"},
             {"step": "Then the table shows {n} rows", "params": {"n": "int"}, "block": "DataTable", "levels": ["e2e"]},
             {"step": "Then the log in form is in the {state} state", "params": {"state": {"one_of": ["Empty", "Sending"]}}}]}

`check` passes when every step of every scenario matches exactly one known step, its values have the right type, and
(with --level) the step exists at that level; each step is shown with the block that implements it. An unknown step
fails with the nearest known steps. Standard library only; the matching rules are functional/gherkin.py's.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))  # test-core's folder: functional/ sits next to tools/

from functional.gherkin import LEVELS, compile_pattern, match_pattern, nearest, parse_scenarios, unknown_step_message  # noqa: E402

PARAM_TYPES = ("text", "int")


def load(paths: list[Path]) -> list[dict]:
    """Every step of the vocabulary files, each with its levels and compiled pattern, in file order."""
    entries = []
    for path in paths:
        data = json.loads(path.read_text(encoding="utf-8"))
        levels = data.get("levels", list(LEVELS))
        for entry in data.get("steps", []):
            entries.append({**entry, "levels": entry.get("levels", levels), "file": str(path),
                            "compiled": compile_pattern(entry["step"])})
    return entries


def validate(paths: list[Path]) -> list[str]:
    problems = []
    seen: dict[str, str] = {}
    for path in paths:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            problems.append(f"{path}: {error}")
            continue
        for entry in data.get("steps", []):
            step = entry.get("step", "")
            try:
                _, places = compile_pattern(step)
            except ValueError as error:
                problems.append(f"{path}: {error}")
                continue
            if step in seen:
                problems.append(f"{path}: the step {step!r} is also in {seen[step]}")
            seen[step] = str(path)
            params = entry.get("params", {})
            for name in set(params) - set(places):
                problems.append(f"{path}: {step!r} declares {name!r}, which is not a place in the step")
            for name, kind in params.items():
                if not (kind in PARAM_TYPES or (isinstance(kind, dict) and isinstance(kind.get("one_of"), list))):
                    problems.append(f"{path}: {step!r}: {name!r} must be 'text', 'int' or {{\"one_of\": [...]}}")
            for level in entry.get("levels", data.get("levels", LEVELS)):
                if level not in LEVELS:
                    problems.append(f"{path}: {step!r}: unknown level {level!r}")
    return problems


def check_value(name: str, value, kind) -> str | None:
    if kind == "int" and not isinstance(value, int):
        return f"{name} must be a whole number, got {value!r}"
    if isinstance(kind, dict):
        choices = [str(c) for c in kind["one_of"]]
        if str(value) not in choices:
            close = [c for c in choices if c.lower() == str(value).lower()] or choices
            return f"{name} must be one of {', '.join(repr(c) for c in close)}; got {value!r}"
    return None


def check_step(text: str, entries: list[dict], level: str | None) -> tuple[dict | None, str | None]:
    """(the vocabulary entry, None) or (None, the problem)."""
    found = [(e, v) for e in entries if (v := match_pattern(e["compiled"], text)) is not None]
    if not found:
        return None, unknown_step_message(text, [e["step"] for e in entries])
    if len({e["step"] for e, _ in found}) > 1:
        return None, "ambiguous step, it matches: " + "; ".join(e["step"] for e, _ in found)
    entry, values = found[0]
    for name, value in values.items():
        if problem := check_value(name, value, entry.get("params", {}).get(name, "text")):
            return None, f"{entry['step']}: {problem}"
    if level and level not in entry["levels"]:
        return None, f"{entry['step']}: no {level} function (it has: {', '.join(entry['levels'])})"
    return entry, None


def check(tasks: list[Path], entries: list[dict], level: str | None) -> tuple[list[dict], bool]:
    rows, ok = [], True
    for task in tasks:
        scenarios = parse_scenarios(task.read_text(encoding="utf-8"), source=str(task))
        if not scenarios:
            rows.append({"task": str(task), "scenario": None, "line": 0, "step": None, "ok": False,
                         "problem": "no scenarios (## Scenarios, then ### <title> and Given/When/Then lines)"})
            ok = False
        for scenario in scenarios:
            if not scenario.steps:
                rows.append({"task": str(task), "scenario": scenario.title, "line": scenario.line, "step": None,
                             "ok": False, "problem": "the scenario has no Given/When/Then steps"})
                ok = False
            for step in scenario.steps:
                entry, problem = check_step(step.full, entries, level)
                rows.append({"task": str(task), "scenario": scenario.title, "line": step.line,
                             "step": f"{step.keyword} {step.text}", "ok": entry is not None,
                             "known": entry["step"] if entry else None, "block": (entry or {}).get("block"),
                             "problem": problem})
                ok = ok and entry is not None
    return rows, ok


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    p_list = sub.add_parser("list", help="every step of the vocabulary files")
    p_list.add_argument("vocab", type=Path, nargs="+")
    p_list.add_argument("--json", action="store_true")
    p_check = sub.add_parser("check", help="every scenario step of the task files is a known step")
    p_check.add_argument("tasks", type=Path, nargs="+")
    p_check.add_argument("--vocab", type=Path, nargs="+", required=True)
    p_check.add_argument("--level", choices=LEVELS)
    p_check.add_argument("--json", action="store_true")
    p_suggest = sub.add_parser("suggest", help="the known steps nearest to a step")
    p_suggest.add_argument("step")
    p_suggest.add_argument("--vocab", type=Path, nargs="+", required=True)
    p_validate = sub.add_parser("validate", help="the vocabulary files themselves are well formed")
    p_validate.add_argument("vocab", type=Path, nargs="+")
    args = parser.parse_args(argv)

    if args.command == "validate":
        problems = validate(args.vocab)
        for problem in problems:
            print(problem)
        print("Vocabulary files are well formed." if not problems else f"{len(problems)} problem(s).")
        return 1 if problems else 0
    if problems := validate(args.vocab):
        print("\n".join(problems))
        return 2
    entries = load(args.vocab)
    if args.command == "list":
        if args.json:
            print(json.dumps([{k: v for k, v in e.items() if k != "compiled"} for e in entries], ensure_ascii=False, indent=2))
        else:
            for e in entries:
                block = f"  [{e['block']}]" if e.get("block") else ""
                print(f"{e['step']}{block}  ({', '.join(e['levels'])})")
        return 0
    if args.command == "suggest":
        exact = [e["step"] for e in entries if match_pattern(e["compiled"], args.step) is not None]
        for step in exact or nearest(args.step, [e["step"] for e in entries]):
            print(step)
        return 0 if exact else 1
    rows, ok = check(args.tasks, entries, args.level)
    if args.json:
        print(json.dumps({"ok": ok, "steps": rows}, ensure_ascii=False, indent=2))
        return 0 if ok else 1
    for row in rows:
        where = f"{row['task']}:{row['line']}"
        if row["ok"]:
            block = f"  -> {row['block']}" if row.get("block") else ""
            print(f"ok  {where}  {row['step']}{block}")
        else:
            print(f"NO  {where}  {row['step'] or row['scenario'] or ''}: {row['problem']}")
    print("Every step is a known step." if ok else "Some steps are not in the vocabulary.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
