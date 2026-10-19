#!/usr/bin/env python3
"""Test blocks from App Blocks, like a UI library: each App Block gets its Given/When/Then steps, its states and a
self-test, in Python and JavaScript.

  python3 tools/blocks_from_app_blocks.py --kit HARNESS_FOLDER [--blocks LogIn,DataTable] [--check]
      [--index kit/blocks/index.json] [--spec functional/blocks/spec.json] [--out functional/blocks]

Reads Pi Workbench's App Block catalogue (HARNESS_FOLDER/kit/blocks/index.json, each card's Markdown and markup) and the
step vocabulary of each block (functional/blocks/spec.json), and writes:

  functional/blocks/python/<block>.py   page object + steps (Registry), STATES, SELF_TEST   (+ __init__.py)
  functional/blocks/js/<Block>.js       the same in JavaScript                               (+ index.js)
  functional/blocks/vocabulary.json     every block step, for tools/vocab.py

Every control the spec names must be in the App Block's markup (by role and name, label or text, as
tools/e2e_coverage.py reads a page), and every state it checks must be among the card's `## States`: otherwise nothing
is written and the problem says which control no longer exists. The output is deterministic; --check compares it with
the files on disk and exits 1 when they differ (CI runs it on tests/fixtures/app-blocks). Standard library only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
sys.path.insert(0, str(ROOT))

from e2e_coverage import Name, Ref, matches, parse_page  # noqa: E402
from functional.gherkin import PARAM, compile_pattern  # noqa: E402

GENERATED_BY = "tools/blocks_from_app_blocks.py"
ACTIONS = {"click": 0, "check": 0, "uncheck": 0, "fill": 1, "select": 1, "press": 1}
CHECKS = {"visible": 0, "hidden": 0, "any": 0, "text": 1, "exact_text": 1, "value": 1, "checked": 0, "name": 1,
          "description": 1, "attribute": 2, "count": 1, "absent": 0}
RAW_OPS = {"count", "absent"}  # these count elements, so the control may be missing (0)
CONTROL_KINDS = ("role", "label", "text", "test_id", "css")


class SpecError(Exception):
    pass


# ---------------------------------------------------------------- reading the App Blocks


def card_states(markdown: str) -> list[tuple[str, bool]]:
    """[(state name, is the default)] from the card's `## States` list ("- Empty (default): ...")."""
    states, inside = [], False
    for line in markdown.splitlines():
        if line.startswith("## "):
            inside = line.strip() == "## States"
            continue
        if inside and (m := re.match(r"^- (?P<name>[^:]+?):\s", line)):
            name = m["name"].strip()
            default = bool(re.search(r"\(([^)]*\b)?default\)", name))
            states.append((re.sub(r"\s*\([^)]*\)\s*$", "", name).strip(), default))
    return states


def card_route(markdown: str) -> str:
    m = re.search(r"^- Route: `([^`]+)`", markdown, re.MULTILINE)
    return m.group(1) if m else ""


def places(text) -> list[str]:
    return PARAM.findall(text) if isinstance(text, str) else []


def control_places(controls: dict, key: str) -> list[str]:
    """The step places a control needs (its own and those of the controls it sits in), outermost first."""
    found, seen = [], set()
    chain = []
    while key:
        chain.append(key)
        if key in seen:
            raise SpecError(f"control {key!r} sits in itself")
        seen.add(key)
        key = controls[key].get("within")
    for k in reversed(chain):
        spec = controls[k]
        for field in ("name", "label", "text", "nth", "has_text"):
            for place in places(spec.get(field)):
                if place not in found:
                    found.append(place)
    return found


def template_ref(kind: str, value: str, role: str | None = None, exact: bool = False) -> Ref:
    if "{" in value:
        parts = re.split(r"\{[A-Za-z_]\w*\}", value)
        return Ref("spec", 0, "spec", kind, role=role, value=value,
                   pattern=re.compile(".+".join(re.escape(p) for p in parts), re.I | re.S))
    return Ref("spec", 0, "spec", kind, role=role, value=value, exact=exact)


def validate_block(name: str, spec: dict, markup: str, controls_found: list, states: list[tuple[str, bool]]) -> list[str]:
    problems = []
    controls = spec["controls"]
    for key, c in controls.items():
        kinds = [k for k in CONTROL_KINDS if k in c]
        if len(kinds) != 1:
            problems.append(f"{name}: control {key!r} needs exactly one of {', '.join(CONTROL_KINDS)}")
            continue
        if c.get("within") and c["within"] not in controls:
            problems.append(f"{name}: control {key!r} sits in {c['within']!r}, which the spec does not name")
        what = f'{c.get("role") or kinds[0]} "{c.get("name") or c.get("label") or c.get("text") or c.get("css")}"'
        if "check" in c:
            if c["check"] not in markup:
                problems.append(f"{name}: the spec uses a part that no longer exists in the App Block's markup: "
                                f"{key} ({what}; the markup has no {c['check']!r})")
        elif kinds[0] in ("role", "label", "text") and not (kinds[0] == "role" and "name" not in c):
            kind, value = kinds[0], c.get("name") if kinds[0] == "role" else c[kinds[0]]
            ref = template_ref(kind, value, c.get("role"), c.get("exact", False))
            if kind == "role" and c.get("starts") and "{" not in value:
                ref = Ref("spec", 0, "spec", "role", role=c["role"], regex=re.compile("^" + re.escape(value)))
            if not any(matches(control, ref) for control in controls_found):
                problems.append(f"{name}: the spec uses a control that no longer exists in the App Block's markup: "
                                f"{key} ({what})")
    state_names = [s for s, _ in states]
    for state in spec.get("states", {}):
        if state not in state_names:
            problems.append(f"{name}: the spec checks the state {state!r}, which the card no longer lists "
                            f"(its states: {', '.join(state_names)})")
    all_steps = list(spec["steps"]) + ([{"step": spec["state_step"], "do": []}] if spec.get("state_step") else [])
    for step in all_steps:
        try:
            _, step_places = compile_pattern(step["step"])
        except ValueError as error:
            problems.append(f"{name}: {error}")
            continue
        for op in step.get("do", []):
            problems += validate_op(name, step["step"], op, controls, step_places, spec.get("route"))
    if spec.get("state_step"):
        _, state_places = compile_pattern(spec["state_step"])
        if "state" not in state_places:
            problems.append(f"{name}: the state step needs a {{state}} place: {spec['state_step']!r}")
        for state, ops in spec.get("states", {}).items():
            for op in ops:
                problems += validate_op(name, f"state {state}", op, controls, state_places, None)
    return problems


def validate_op(name: str, where: str, op: list, controls: dict, step_places: list[str], route) -> list[str]:
    kind, args = op[0], op[1:]
    if kind == "goto":
        return [] if not args else [f"{name}: {where}: goto takes no arguments (it opens the card's route)"]
    arity = ACTIONS.get(kind, CHECKS.get(kind))
    if arity is None:
        return [f"{name}: {where}: unknown op {kind!r}"]
    if len(args) != arity + 1:
        return [f"{name}: {where}: {kind} takes a control and {arity} value(s): {op!r}"]
    key = args[0]
    if key not in controls:
        return [f"{name}: {where}: {kind} uses the control {key!r}, which the spec does not name"]
    problems = []
    needed = control_places(controls, key) + [p for a in args[1:] for p in places(a)]
    for place in needed:
        if place not in step_places:
            problems.append(f"{name}: {where}: {kind} {key} needs {{{place}}}, which the step does not have")
    return problems


def load_blocks(kit: Path, index: Path, spec: dict, wanted: list[str]) -> tuple[list[dict], list[str]]:
    catalogue = json.loads(index.read_text(encoding="utf-8"))
    cards = {card["name"]: card for card in catalogue["cards"]}
    blocks, problems = [], []
    for name in wanted:
        if name not in spec["blocks"]:
            problems.append(f"{name}: no vocabulary in the spec (functional/blocks/spec.json)")
            continue
        if name not in cards:
            problems.append(f"{name}: not in the App Block catalogue {index}")
            continue
        card = cards[name]
        markdown = (kit / card["card"]).read_text(encoding="utf-8")
        html_files = [f for f in card["code"] if f.endswith(".html")]
        markup = "".join((kit / f).read_text(encoding="utf-8") for f in html_files)
        found = [c for f in html_files for c in parse_page(str(kit / f), {}, "data-t")]
        block_spec = spec["blocks"][name]
        states = card_states(markdown)
        problems += validate_block(name, block_spec, markup, found, states)
        demo_names = block_spec.get("demo")
        demo = [f for f in html_files if demo_names is None or Path(f).name in demo_names][: None if demo_names else 1]
        digest = hashlib.sha256(markdown.encode() + markup.encode()).hexdigest()[:12]
        blocks.append({"name": name, "card": card, "spec": block_spec, "states": states, "route": card_route(markdown),
                       "demo": demo, "digest": digest, "group": card["group"], "purpose": card["purpose"]})
    return blocks, problems


# ---------------------------------------------------------------- writing code


def snake(text: str) -> str:
    text = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", "_", text)
    return re.sub(r"[^0-9a-zA-Z]+", "_", text).strip("_").lower()


def camel(text: str) -> str:
    words = snake(text).split("_")
    return words[0] + "".join(w.capitalize() for w in words[1:])


def py_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def js_str(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "\\'") + "'"


def py_value(template, *, as_int: bool = False) -> str:
    """A spec value ('Sort by {column}', '{n}', 'Log In') as a Python expression over the step's values."""
    template = str(template)
    names = places(template)
    if as_int:
        return f"int({names[0]})" if names and template == f"{{{names[0]}}}" else template
    if not names:
        return py_str(template)
    if template == f"{{{names[0]}}}":
        return f"str({names[0]})"
    return "f" + py_str(template)  # the places are the only braces in a spec value


def js_value(template, *, as_int: bool = False) -> str:
    template = str(template)
    names = places(template)
    if as_int:
        return f"Number({names[0]})" if names and template == f"{{{names[0]}}}" else template
    if not names:
        return js_str(template)
    if template == f"{{{names[0]}}}":
        return f"String({names[0]})"
    body = template.replace("\\", "\\\\").replace("`", "\\`")
    return "`" + PARAM.sub(lambda m: "${" + m.group(1) + "}", body) + "`"


def py_locator_options(c: dict) -> tuple[str, str]:
    """(the keyword arguments for primitives.control, the raw Playwright call) for one control."""
    if "role" in c:
        opts = [f"role={py_str(c['role'])}"]
        raw = [py_str(c["role"])]
        if "name" in c:
            name = py_value(c["name"])
            if c.get("starts"):
                name = f"re.compile('^' + re.escape({name}))"
            opts.append(f"name={name}")
            raw.append(f"name={name}")
            if c.get("exact"):
                opts.append("exact=True")
                raw.append("exact=True")
        if c.get("include_hidden"):
            opts.append("include_hidden=True")
            raw.append("include_hidden=True")
        return ", ".join(opts), f"get_by_role({', '.join(raw)})"
    if "label" in c:
        exact = ", exact=True" if c.get("exact") else ""
        return f"label={py_value(c['label'])}{exact}", f"get_by_label({py_value(c['label'])}{exact})"
    if "text" in c:
        exact = ", exact=True" if c.get("exact") else ""
        return f"text={py_value(c['text'])}{exact}", f"get_by_text({py_value(c['text'])}{exact})"
    if "test_id" in c:
        return f"test_id={py_value(c['test_id'])}", f"get_by_test_id({py_value(c['test_id'])})"
    return f"css={py_str(c['css'])}", f"locator({py_str(c['css'])})"


def js_locator_options(c: dict) -> tuple[str, str]:
    if "role" in c:
        opts = [f"role: {js_str(c['role'])}"]
        raw_opts = []
        if "name" in c:
            name = js_value(c["name"])
            if c.get("starts"):
                name = f"new RegExp(`^${{p.escapeRegExp({name})}}`)"
            opts.append(f"name: {name}")
            raw_opts.append(f"name: {name}")
            if c.get("exact"):
                opts.append("exact: true")
                raw_opts.append("exact: true")
        if c.get("include_hidden"):
            opts.append("includeHidden: true")
            raw_opts.append("includeHidden: true")
        raw = f"getByRole({js_str(c['role'])}" + (f", {{ {', '.join(raw_opts)} }})" if raw_opts else ")")
        return ", ".join(opts), raw
    if "label" in c:
        exact = ", exact: true" if c.get("exact") else ""
        return f"label: {js_value(c['label'])}{exact}", f"getByLabel({js_value(c['label'])}{', { exact: true }' if exact else ''})"
    if "text" in c:
        exact = ", exact: true" if c.get("exact") else ""
        return f"text: {js_value(c['text'])}{exact}", f"getByText({js_value(c['text'])}{', { exact: true }' if exact else ''})"
    if "test_id" in c:
        return f"testId: {js_value(c['test_id'])}", f"getByTestId({js_value(c['test_id'])})"
    return f"css: {js_str(c['css'])}", f"locator({js_str(c['css'])})"


def wrap_doc(text: str, width: int = 116, prefix: str = "") -> list[str]:
    lines, line = [], prefix
    for word in text.split():
        if len(line) + len(word) + 1 > width and line.strip():
            lines.append(line.rstrip())
            line = prefix
        line += word + " "
    if line.strip():
        lines.append(line.rstrip())
    return lines


def step_entries(block: dict) -> list[dict]:
    """The block's steps, the state step last, each with its declared value types."""
    spec = block["spec"]
    entries = [dict(s) for s in spec["steps"]]
    checkable = list(spec.get("states", {}))
    if spec.get("state_step"):
        entries.append({"step": spec["state_step"], "params": {"state": {"one_of": checkable}}, "state": True, "do": []})
    return entries


def function_name(pattern: str, used: set[str]) -> str:
    base = snake(PARAM.sub(lambda m: m.group(1), pattern))
    name, n = base, 2
    while name in used:
        name, n = f"{base}_{n}", n + 1
    used.add(name)
    return name


def py_op(op: list, controls: dict, cls_var: str = "b") -> str:
    kind, args = op[0], op[1:]
    if kind == "goto":
        return f"p.goto(world.page, {cls_var}.base_url + ROUTE)"
    key = args[0]
    call_args = ", ".join(control_places(controls, key))
    target = f"{cls_var}.{key}({call_args})"
    raw = f"{cls_var}.{key}_all({call_args})"
    values = args[1:]
    if kind in ACTIONS:
        extra = f", {py_value(values[0])}" if values else ""
        return f"p.{kind}({target}{extra})"
    if kind == "visible":
        return f"p.expect_visible({target})"
    if kind == "hidden":
        return f"p.expect_hidden({target})"
    if kind == "any":
        return f"p.expect_visible({target}.first)"
    if kind == "text":
        return f"p.expect_text({target}, {py_value(values[0])})"
    if kind == "exact_text":
        return f"p.expect_text({target}, {py_value(values[0])}, exact=True)"
    if kind == "value":
        return f"p.expect_value({target}, {py_value(values[0])})"
    if kind == "checked":
        return f"p.expect_checked({target})"
    if kind == "name":
        return f"p.expect_name({target}, {py_value(values[0])})"
    if kind == "description":
        return f"p.expect_description({target}, {py_value(values[0])})"
    if kind == "attribute":
        return f"p.expect_attribute({target}, {py_value(values[0])}, {py_value(values[1])})"
    if kind == "count":
        return f"p.expect_count({raw}, {py_value(values[0], as_int=True)})"
    if kind == "absent":
        return f"p.expect_count({raw}, 0)"
    raise SpecError(f"unknown op {kind!r}")


def js_op(op: list, controls: dict, cls_var: str = "b") -> str:
    kind, args = op[0], op[1:]
    if kind == "goto":
        return f"await p.goto(world.page, `${{{cls_var}.baseURL}}${{ROUTE}}`);"
    key = args[0]
    call_args = ", ".join(control_places(controls, key))
    target = f"await {cls_var}.{camel(key)}({call_args})"
    raw = f"await {cls_var}.{camel(key)}All({call_args})"
    values = args[1:]
    if kind in ACTIONS:
        extra = f", {js_value(values[0])}" if values else ""
        return f"await p.{kind}({target}{extra});"
    simple = {"visible": "expectVisible", "hidden": "expectHidden", "checked": "expectChecked"}
    if kind in simple:
        return f"await p.{simple[kind]}({target});"
    if kind == "any":
        return f"await p.expectVisible(({target}).first());"
    one = {"text": "expectText", "value": "expectValue", "name": "expectName", "description": "expectDescription"}
    if kind in one:
        return f"await p.{one[kind]}({target}, {js_value(values[0])});"
    if kind == "exact_text":
        return f"await p.expectText({target}, {js_value(values[0])}, {{ exact: true }});"
    if kind == "attribute":
        return f"await p.expectAttribute({target}, {js_value(values[0])}, {js_value(values[1])});"
    if kind == "count":
        return f"await p.expectCount({raw}, {js_value(values[0], as_int=True)});"
    if kind == "absent":
        return f"await p.expectCount({raw}, 0);"
    raise SpecError(f"unknown op {kind!r}")


def raw_keys(spec: dict) -> set[str]:
    ops = [op for s in spec["steps"] for op in s.get("do", [])] + [op for ops in spec.get("states", {}).values() for op in ops]
    return {op[1] for op in ops if op[0] in RAW_OPS}


def header_lines(block: dict) -> list[str]:
    card = block["card"]
    return [
        f"Test block {block['name']} ({block['group']}): {block['purpose']}",
        "",
        f"Generated by {GENERATED_BY} from the App Block card {card['card']} and its markup",
        f"({', '.join(f for f in card['code'] if f.endswith('.html'))}; source {block['digest']}), with the vocabulary in",
        "functional/blocks/spec.json. Do not edit: change the spec (or the App Block) and generate again.",
    ]


def python_module(block: dict) -> str:
    name, spec = block["name"], block["spec"]
    controls = spec["controls"]
    cls = name
    entries = step_entries(block)
    uses_re = any(c.get("starts") for c in controls.values())
    out = ['"""' + header_lines(block)[0]]
    out += header_lines(block)[1:]
    out += ["", "Steps (e2e):"] + [f"  {e['step']}" for e in entries]
    states = [s for s, _ in block["states"]]
    out += wrap_doc(f"States (from the card): {', '.join(states)}. Checked by the state step: "
                    f"{', '.join(spec.get('states', {})) or 'none'}.", prefix="")
    out += ['"""']
    out += ["from __future__ import annotations", ""]
    if uses_re:
        out += ["import re", ""]
    out += ["from functional import Registry", "from functional import primitives as p", ""]
    out += [f"BLOCK = {py_str(name)}",
            f"ROUTE = {py_str(block['route'])}",
            f"STATES = {json.dumps(states, ensure_ascii=False)}",
            f"DEFAULT_STATE = {py_str(next((s for s, d in block['states'] if d), states[0] if states else ''))}",
            f"CHECKED_STATES = {json.dumps(list(spec.get('states', {})), ensure_ascii=False)}",
            f"DEMO = {json.dumps(block['demo'], ensure_ascii=False)}",
            "SELF_TEST = ["] + [f"    {py_str(s)}," for s in spec.get("self_test", [])] + ["]",
            "",
            f"steps = Registry(block=BLOCK)", "", ""]
    out += [f"class {cls}:",
            f'    """The {name} block on a page: its controls, found as a person finds them (role and name, label, text)."""',
            "",
            "    def __init__(self, page, base_url: str = \"\"):",
            "        self.page = page",
            "        self.base_url = base_url"]
    raws = raw_keys(spec)
    for key, c in controls.items():
        args = control_places(controls, key)
        sig = ", ".join(["self", *args])
        parent = f"self.{c['within']}({', '.join(control_places(controls, c['within']))})" if c.get("within") else "self.page"
        options, raw = py_locator_options(c)
        tail = f".nth(int({places(c['nth'])[0]}) - 1)" if c.get("nth") else ""
        tail += f".filter(has_text={py_value(c['has_text'])})" if c.get("has_text") else ""
        out += ["", f"    def {key}({sig}):",
                f"        return p.control({parent}, {options}, block=BLOCK){tail}"]
        if key in raws:
            out += ["", f"    def {key}_all({sig}):",
                    f'        """Every match, possibly none (for counting)."""',
                    f"        return {parent}.{raw}{tail}"]
    if spec.get("state_step"):
        _, state_places = compile_pattern(spec["state_step"])
        others = [pl for pl in state_places if pl != "state"]
        out += ["", f"    def expect_state(self, state: str{''.join(f', {o}' for o in others)}) -> None:",
                f'        """Check one of the card\'s states: {", ".join(spec.get("states", {}))}."""',
                "        b = self"]
        for i, (state, ops) in enumerate(spec.get("states", {}).items()):
            out.append(f"        {'if' if i == 0 else 'elif'} state == {py_str(state)}:")
            out += [f"            {py_op(op, controls)}" for op in ops]
        out += ["        else:" if spec.get("states") else "        if True:",
                f"            raise AssertionError(f\"{name} has no check for the state {{state!r}}; checked: \" + \", \".join(CHECKED_STATES))"]
    used: set[str] = set()
    for entry in entries:
        fn = function_name(entry["step"], used)
        _, step_places = compile_pattern(entry["step"])
        sig = ", ".join(["world", *step_places])
        out += ["", "", f"@steps.step({py_str(entry['step'])}, level=\"e2e\")", f"def {fn}({sig}):",
                f"    b = {cls}(world.page, getattr(world, \"base_url\", \"\"))"]
        if entry.get("state"):
            others = [pl for pl in step_places if pl != "state"]
            out.append(f"    b.expect_state(state{''.join(f', {o}' for o in others)})")
        else:
            out += [f"    {py_op(op, controls)}" for op in entry["do"]]
    return "\n".join(out) + "\n"


def js_module(block: dict) -> str:
    name, spec = block["name"], block["spec"]
    controls = spec["controls"]
    entries = step_entries(block)
    states = [s for s, _ in block["states"]]
    out = [f"// {line}".rstrip() for line in header_lines(block)]
    out += ["//", "// Steps (e2e):"] + [f"//   {e['step']}" for e in entries]
    out += wrap_doc(f"States (from the card): {', '.join(states)}. Checked by the state step: "
                    f"{', '.join(spec.get('states', {})) or 'none'}.", prefix="// ")
    out += ["import { Registry } from '../../js/registry.js';",
            "import * as p from '../../js/primitives.js';", "",
            f"export const BLOCK = {js_str(name)};",
            f"export const ROUTE = {js_str(block['route'])};",
            f"export const STATES = {json.dumps(states, ensure_ascii=False)};",
            f"export const DEFAULT_STATE = {js_str(next((s for s, d in block['states'] if d), states[0] if states else ''))};",
            f"export const CHECKED_STATES = {json.dumps(list(spec.get('states', {})), ensure_ascii=False)};",
            f"export const DEMO = {json.dumps(block['demo'], ensure_ascii=False)};",
            "export const SELF_TEST = ["] + [f"  {json.dumps(s, ensure_ascii=False)}," for s in spec.get("self_test", [])] + ["];",
            "",
            "export const steps = new Registry({ block: BLOCK });", "",
            f"/** The {name} block on a page: its controls, found as a person finds them (role and name, label, text). */",
            f"export class {name} {{",
            "  constructor(page, baseURL = '') {",
            "    this.page = page;",
            "    this.baseURL = baseURL;",
            "  }"]
    raws = raw_keys(spec)
    for key, c in controls.items():
        args = ", ".join(control_places(controls, key))
        parent = (f"await this.{camel(c['within'])}({', '.join(control_places(controls, c['within']))})"
                  if c.get("within") else "this.page")
        options, raw = js_locator_options(c)
        tail = f".nth(Number({places(c['nth'])[0]}) - 1)" if c.get("nth") else ""
        tail += f".filter({{ hasText: {js_value(c['has_text'])} }})" if c.get("has_text") else ""
        control_call = f"p.control({parent}, {{ {options}, block: BLOCK }})"
        body = f"(await {control_call}){tail}" if tail else control_call
        out += ["", f"  async {camel(key)}({args}) {{", f"    return {body};", "  }"]
        if key in raws:
            raw_parent = f"({parent})" if c.get("within") else parent
            out += ["", f"  /** Every match, possibly none (for counting). */",
                    f"  async {camel(key)}All({args}) {{", f"    return {raw_parent}.{raw}{tail};", "  }"]
    if spec.get("state_step"):
        _, state_places = compile_pattern(spec["state_step"])
        others = [pl for pl in state_places if pl != "state"]
        out += ["", f"  /** Check one of the card's states: {', '.join(spec.get('states', {}))}. */",
                f"  async expectState(state{''.join(f', {o}' for o in others)}) {{", "    const b = this;"]
        for i, (state, ops) in enumerate(spec.get("states", {}).items()):
            out.append(f"    {'if' if i == 0 else '} else if'} (state === {js_str(state)}) {{")
            out += [f"      {js_op(op, controls)}" for op in ops]
        out += ["    } else {" if spec.get("states") else "    {",
                f"      throw new Error(`{name} has no check for the state '${{state}}'; checked: ${{CHECKED_STATES.join(', ')}}`);",
                "    }", "  }"]
    out += ["}"]
    for entry in entries:
        _, step_places = compile_pattern(entry["step"])
        values = f"{{ {', '.join(step_places)} }}" if step_places else "_values"
        out += ["", f"steps.step({json.dumps(entry['step'], ensure_ascii=False)}, async (world, {values}) => {{",
                f"  const b = new {name}(world.page, world.baseURL ?? '');"]
        if entry.get("state"):
            others = [pl for pl in step_places if pl != "state"]
            out.append(f"  await b.expectState(state{''.join(f', {o}' for o in others)});")
        else:
            out += [f"  {js_op(op, controls)}" for op in entry["do"]]
        out.append("}, { level: 'e2e' });")
    return "\n".join(out) + "\n"


def python_init(blocks: list[dict]) -> str:
    out = ['"""Every generated test block, and `steps`: all their steps in one Registry.', "",
           f"Generated by {GENERATED_BY}. Do not edit.", '"""',
           "from functional import Registry", ""]
    out += [f"from . import {snake(b['name'])}" for b in blocks]
    out += ["", "BLOCKS = {" + ", ".join(f"{py_str(b['name'])}: {snake(b['name'])}" for b in blocks) + "}",
            "steps = Registry(*(module.steps for module in BLOCKS.values()))", ""]
    return "\n".join(out)


def js_index(blocks: list[dict]) -> str:
    out = ["// Every generated test block, and `steps`: all their steps in one Registry.",
           f"// Generated by {GENERATED_BY}. Do not edit.",
           "import { Registry } from '../../js/registry.js';"]
    out += [f"import * as {b['name']} from './{b['name']}.js';" for b in blocks]
    out += ["", "export const BLOCKS = { " + ", ".join(b["name"] for b in blocks) + " };",
            "export const steps = new Registry(...Object.values(BLOCKS).map((block) => block.steps));", ""]
    return "\n".join(out)


def vocabulary(blocks: list[dict]) -> str:
    steps = []
    for block in blocks:
        for entry in step_entries(block):
            item = {"step": entry["step"], "block": block["name"], "levels": ["e2e"]}
            if entry.get("params"):
                item["params"] = entry["params"]
            steps.append(item)
    data = {"name": "Test blocks generated from App Blocks",
            "note": f"Generated by {GENERATED_BY} from Pi Workbench's App Blocks and functional/blocks/spec.json. "
                    "Do not edit. Check a task: python3 tools/vocab.py check TASK.md --vocab functional/blocks/vocabulary.json",
            "levels": ["e2e"], "steps": steps}
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def generate(kit: Path, index: Path, spec_path: Path, names: list[str] | None) -> dict[str, str]:
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    names = names or list(spec["blocks"])
    blocks, problems = load_blocks(kit, index, spec, names)
    if problems:
        raise SpecError("\n".join(problems))
    files = {"vocabulary.json": vocabulary(blocks), "python/__init__.py": python_init(blocks), "js/index.js": js_index(blocks)}
    for block in blocks:
        files[f"python/{snake(block['name'])}.py"] = python_module(block)
        files[f"js/{block['name']}.js"] = js_module(block)
    return files


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--kit", type=Path, required=True, help="the Pi Workbench folder (holds kit/blocks/index.json)")
    parser.add_argument("--index", type=Path, help="the App Block catalogue (default: KIT/kit/blocks/index.json)")
    parser.add_argument("--spec", type=Path, default=ROOT / "functional/blocks/spec.json")
    parser.add_argument("--out", type=Path, default=ROOT / "functional/blocks")
    parser.add_argument("--blocks", help="comma-separated App Block names (default: every block in the spec)")
    parser.add_argument("--check", action="store_true", help="compare with the files on disk; write nothing")
    args = parser.parse_args(argv)
    index = args.index or args.kit / "kit/blocks/index.json"
    try:
        files = generate(args.kit, index, args.spec, args.blocks.split(",") if args.blocks else None)
    except SpecError as error:
        print(f"Not generated:\n{error}")
        return 1
    if args.check:
        stale = [path for path, text in files.items()
                 if not (args.out / path).is_file() or (args.out / path).read_text(encoding="utf-8") != text]
        if not args.blocks:
            on_disk = {str(p.relative_to(args.out)) for folder in ("python", "js") for p in (args.out / folder).glob("*.*")
                       if p.suffix in (".py", ".js")}
            stale += sorted(f"{path} (not generated any more: remove it)" for path in on_disk - set(files))
        for path in stale:
            print(f"out of date: {args.out / path}")
        print(f"{len(files)} generated file(s) " + ("up to date." if not stale else f"differ: run {GENERATED_BY} again."))
        return 1 if stale else 0
    for path, text in files.items():
        target = args.out / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")
    print(f"Wrote {len(files)} file(s) to {args.out}: " + ", ".join(sorted(files)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
