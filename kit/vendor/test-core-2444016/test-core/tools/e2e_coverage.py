#!/usr/bin/env python3
"""The E2E rule, checked: every control a person can use has at least one e2e step that uses it.

  python3 tools/e2e_coverage.py --pages 'app/templates/**/*.html' --tests 'tests/e2e/**/*.py' 'tests/e2e/**/*.js' \
      [--messages 'app/static/messages/*.json'] [--text-attribute data-text] [--allow-untested] [--json]

Reads the pages (HTML and server templates: Jinja, Django, Handlebars, EJS) and lists their controls: buttons, links,
inputs, selects, text areas and elements with a control role, each by role + accessible name, label and data-testid.
Reads the e2e tests and page objects (Python pytest-playwright, JavaScript @playwright/test) and finds the locators:
get_by_role / getByRole, get_by_label / getByLabel, get_by_test_id / getByTestId, get_by_placeholder, get_by_text and
[data-testid=...] selectors. Then reports:

  - orphaned references: a test uses a control that no longer exists (always fails: remove the test knowingly);
  - untested controls: a control no test uses (fails, or only reported with --allow-untested: "not verified").

Dynamic names count: template expressions ({{ x }}, {% %}, ${x}) and controls inside <template> match any text there,
and an element whose text comes from a messages file (--messages, by the key in --text-attribute) is known by its text
in every language. A control a person cannot reach on purpose carries data-e2e-ignore="reason"; a test line that must
keep a locator for a removed control carries the comment `e2e-coverage: ignore`. Standard library only.
"""
from __future__ import annotations

import argparse
import glob
import json
import re
import sys
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path

CONTROL_ROLES = {"button", "link", "checkbox", "radio", "textbox", "searchbox", "combobox", "listbox", "option",
                 "switch", "tab", "menuitem", "menuitemcheckbox", "menuitemradio", "slider", "spinbutton", "treeitem"}
INPUT_ROLES = {"button": "button", "submit": "button", "reset": "button", "image": "button", "checkbox": "checkbox",
               "radio": "radio", "search": "searchbox", "number": "spinbutton", "range": "slider", "text": "textbox",
               "email": "textbox", "tel": "textbox", "url": "textbox", "password": "textbox", "": "textbox"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
TEMPLATE_EXPR = re.compile(r"\{\{.*?\}\}|\{%.*?%\}|\$\{.*?\}|<%.*?%>|\{[A-Za-z_][\w.]*\}")


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


@dataclass
class Name:
    """A control's name or label: literal text, or a pattern when parts of it are filled in at run time."""
    text: str
    pattern: re.Pattern | None = None  # set when dynamic

    @classmethod
    def of(cls, text: str, dynamic: bool = False) -> "Name":
        text = normalize(text)
        if dynamic and not text:
            return cls("", re.compile(r".*", re.S))
        if TEMPLATE_EXPR.search(text):
            parts = TEMPLATE_EXPR.split(text)
            regex = ".+".join(re.escape(part) for part in parts)
            return cls(TEMPLATE_EXPR.sub("…", text), re.compile(regex, re.I | re.S))
        return cls(text)

    @property
    def wildcard(self) -> bool:
        return self.pattern is not None and self.pattern.pattern == ".*"

    def matches(self, ref: "Ref") -> bool:
        """Playwright's rule: a string matches a case-insensitive substring unless exact; a regex searches.

        A wildcard (a name filled in entirely at run time) matches only a role locator: it must never swallow a label
        or text locator, or a removed control's test would never be reported."""
        if self.wildcard:
            return ref.kind == "role"
        if ref.regex is not None:
            return bool(ref.regex.search(self.text.replace("…", "")))
        if ref.value is None:
            return True
        if ref.pattern is not None:  # the test's string is itself dynamic (f-string, template literal)
            return self.pattern is not None or bool(ref.pattern.search(self.text))
        value = normalize(ref.value)
        if self.pattern is not None:
            return bool(self.pattern.fullmatch(value)) or (
                not ref.exact and any(value.lower() in part.lower() for part in self.text.split("…") if part))
        return value == self.text if ref.exact else value.lower() in self.text.lower()


@dataclass
class Control:
    file: str
    line: int
    tag: str
    role: str | None
    names: list[Name] = field(default_factory=list)
    labels: list[Name] = field(default_factory=list)
    testid: str | None = None
    placeholder: str | None = None
    ignored: str | None = None
    used_by: list[str] = field(default_factory=list)

    def describe(self) -> str:
        name = next((n.text for n in self.names if n.text), "")
        label = next((n.text for n in self.labels if n.text), "")
        what = self.role or self.tag
        parts = [f'{what} "{name or label}"' if (name or label) else what]
        if self.testid:
            parts.append(f'data-testid="{self.testid}"')
        return " ".join(parts)


@dataclass
class Ref:
    file: str
    line: int
    test: str
    kind: str  # role, label, testid, placeholder, text
    role: str | None = None
    value: str | None = None
    regex: re.Pattern | None = None
    pattern: re.Pattern | None = None
    exact: bool = False
    source: str = ""


# ---------------------------------------------------------------- pages


def load_messages(paths: list[str]) -> dict[str, list[str]]:
    """key -> its text in every messages file (nested objects flatten to dotted keys)."""
    texts: dict[str, list[str]] = {}

    def walk(prefix: str, value) -> None:
        if isinstance(value, dict):
            for key, inner in value.items():
                walk(f"{prefix}.{key}" if prefix else key, inner)
        elif isinstance(value, str):
            texts.setdefault(prefix, []).append(value)

    for path in paths:
        walk("", json.loads(Path(path).read_text(encoding="utf-8")))
    return texts


class PageParser(HTMLParser):
    def __init__(self, file: str, messages: dict[str, list[str]], text_attribute: str):
        super().__init__(convert_charrefs=True)
        self.file, self.messages, self.text_attribute = file, messages, text_attribute
        self.stack: list[dict] = []
        self.controls: list[Control] = []
        self.id_text: dict[str, str] = {}
        self.id_alternatives: dict[str, list[str]] = {}
        self.label_for: list[tuple[str, str, list[str], bool]] = []  # (for id, text, alternatives, dynamic)
        self.by_id: dict[str, Control] = {}
        self.labelledby: list[tuple[Control, list[str]]] = []

    def in_template(self) -> bool:
        return any(element["tag"] == "template" for element in self.stack)

    def alternatives(self, attrs: dict) -> list[str]:
        key = attrs.get(self.text_attribute)
        return self.messages.get(key, []) if key else []

    def handle_starttag(self, tag, attr_list):
        attrs = {key: (value or "") for key, value in attr_list}
        line = self.getpos()[0]
        if tag == "img" and attrs.get("alt"):
            for element in self.stack:
                element["text"].append(" " + attrs["alt"] + " ")
        control = self.make_control(tag, attrs, line)
        element = {"tag": tag, "attrs": attrs, "text": [], "control": control, "inner_controls": []}
        if control is not None:
            for outer in self.stack:
                if outer["tag"] == "label":
                    outer["inner_controls"].append(control)
        if tag not in VOID:
            self.stack.append(element)
        elif control is not None:
            self.finish_control(element)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID and self.stack and self.stack[-1]["tag"] == tag:
            self.handle_endtag(tag)

    def handle_data(self, data):
        for element in self.stack:
            element["text"].append(data)

    def handle_endtag(self, tag):
        if not any(element["tag"] == tag for element in self.stack):
            return
        while self.stack:
            element = self.stack.pop()
            self.close_element(element)
            if element["tag"] == tag:
                break

    def close_element(self, element):
        text = normalize("".join(element["text"]))
        attrs, dynamic = element["attrs"], self.in_template()
        alternatives = self.alternatives(attrs)
        if attrs.get("id"):
            self.id_text[attrs["id"]] = text
            self.id_alternatives[attrs["id"]] = alternatives
        if element["tag"] == "label":
            names = [Name.of(text, dynamic)] + [Name.of(alt) for alt in alternatives]
            for control in element["inner_controls"]:
                control.labels += names
                if control.role in ("checkbox", "radio", "textbox", "searchbox", "combobox", "listbox", "spinbutton", "slider", None):
                    if not control.names or control.names == [Name("")]:
                        control.names = list(names)
            if attrs.get("for"):
                self.label_for.append((attrs["for"], text, alternatives, dynamic))
        if element["control"] is not None:
            control = element["control"]
            if control.role in ("button", "link", "tab", "menuitem", "option", "treeitem", "switch") and not attrs.get("aria-label"):
                control.names = [Name.of(text, dynamic)] + [Name.of(alt) for alt in alternatives]
            self.finish_control(element)

    def make_control(self, tag, attrs, line) -> Control | None:
        role = attrs.get("role") or None
        if role is None:
            if tag == "button":
                role = "button"
            elif tag == "a" and "href" in attrs:
                role = "link"
            elif tag == "input":
                kind = attrs.get("type", "").lower()
                if kind == "hidden":
                    return None
                role = INPUT_ROLES.get(kind)
            elif tag == "textarea":
                role = "textbox"
            elif tag == "select":
                role = "listbox" if "multiple" in attrs else "combobox"
            elif tag not in ("input", "select", "textarea"):
                return None
        elif role not in CONTROL_ROLES:
            return None
        if tag not in ("button", "a", "input", "textarea", "select") and role not in CONTROL_ROLES:
            return None
        dynamic = self.in_template()
        control = Control(self.file, line, tag, role, testid=attrs.get("data-testid") or attrs.get("data-test-id"),
                          placeholder=attrs.get("placeholder") or None, ignored=attrs.get("data-e2e-ignore"))
        if "data-e2e-ignore" in attrs and not control.ignored:
            control.ignored = "ignored"
        if attrs.get("aria-label"):
            control.names = [Name.of(attrs["aria-label"], dynamic)]
            control.labels = [Name.of(attrs["aria-label"], dynamic)]
        if attrs.get("aria-labelledby"):
            self.labelledby.append((control, attrs["aria-labelledby"].split()))
        if tag == "input" and attrs.get("type", "").lower() in ("submit", "button", "reset") and attrs.get("value"):
            control.names = control.names or [Name.of(attrs["value"], dynamic)] + [Name.of(a) for a in self.alternatives(attrs)]
        if attrs.get("id"):
            self.by_id[attrs["id"]] = control
        return control

    def finish_control(self, element):
        control = element["control"]
        attrs = element["attrs"]
        if not control.names and attrs.get("title"):
            control.names = [Name.of(attrs["title"])]
        if not control.names and control.placeholder:
            control.names = [Name.of(control.placeholder)]
        self.controls.append(control)

    def resolve(self) -> list[Control]:
        for target, text, alternatives, dynamic in self.label_for:
            control = self.by_id.get(target)
            if control is not None:
                names = [Name.of(text, dynamic)] + [Name.of(alt) for alt in alternatives]
                control.labels += names
                if not control.names or all(not n.text and n.pattern is None for n in control.names):
                    control.names = list(names)
        for control, ids in self.labelledby:
            text = " ".join(self.id_text.get(i, "") for i in ids)
            alternatives = [alt for i in ids for alt in self.id_alternatives.get(i, [])]
            names = [Name.of(text)] + [Name.of(alt) for alt in alternatives]
            control.names, control.labels = names, control.labels + names
        for control in self.controls:
            if not control.names:
                control.names = [Name.of("", self.in_template())]
        return self.controls


def parse_page(path: str, messages: dict[str, list[str]], text_attribute: str) -> list[Control]:
    parser = PageParser(path, messages, text_attribute)
    parser.feed(Path(path).read_text(encoding="utf-8"))
    parser.close()
    while parser.stack:
        parser.close_element(parser.stack.pop())
    return parser.resolve()


# ---------------------------------------------------------------- tests

STRING = r"""(?P<prefix>[fFrRbB]{0,2})(?P<q>'|"|`)(?P<s>(?:\\.|(?!(?P=q)).)*)(?P=q)"""
REGEX_PY = r"""re\.compile\(\s*[rR]?(?P<rq>'|")(?P<r>(?:\\.|(?!(?P=rq)).)*)(?P=rq)\s*(?:,\s*(?P<rflags>re\.\w+))?\s*\)"""
REGEX_JS = r"""/(?P<jr>(?:\\.|[^/\n])+)/(?P<jflags>[a-z]*)"""
VALUE = rf"(?:{REGEX_PY}|{STRING}|{REGEX_JS})"
CALLS = {
    "role": re.compile(r"\.(?:get_by_role|getByRole)\(\s*" + STRING + r"(?P<rest>[^\n]*)"),
    "label": re.compile(r"\.(?:get_by_label|getByLabel)\(\s*" + VALUE + r"(?P<rest>[^\n]*)"),
    "testid": re.compile(r"\.(?:get_by_test_id|getByTestId)\(\s*" + STRING),
    "placeholder": re.compile(r"\.(?:get_by_placeholder|getByPlaceholder)\(\s*" + VALUE + r"(?P<rest>[^\n]*)"),
    "text": re.compile(r"\.(?:get_by_text|getByText)\(\s*" + VALUE + r"(?P<rest>[^\n]*)"),
    "css_testid": re.compile(r"""\[data-test-?id\s*=\s*\\?['"]?(?P<s>[^'"\]\\]+)\\?['"]?\]"""),
}
# test-core's functional primitive: control(page, role="button", name="Add") / control(page, { role: 'button', ... })
CONTROL_CALL = re.compile(r"\bcontrol\((?P<args>[^\n]*)")
CONTROL_ARGS = {
    "role": re.compile(r"\brole\s*[:=]\s*" + STRING),
    "label": re.compile(r"\blabel\s*[:=]\s*" + VALUE),
    "testid": re.compile(r"\btest_?[iI]d\s*[:=]\s*" + STRING),
    "text": re.compile(r"\btext\s*[:=]\s*" + VALUE),
}
CONTROL_NAME = re.compile(r"\bname\s*[:=]\s*" + VALUE)
ROLE_NAME = re.compile(r"""^\s*,\s*(?:\{[^}]*?\bname\s*:\s*|[^)]*?\bname\s*=\s*)""" + VALUE)
EXACT = re.compile(r"""\bexact\s*[:=]\s*(?:true|True)\b""")
PY_TEST = re.compile(r"^\s*(?:async\s+)?def\s+(test_\w+)\s*\(")
JS_TEST = re.compile(r"""\btest(?:\.\w+)?\(\s*(['"`])(.+?)\1""")
PY_HELPER = re.compile(r"^\s*(?:async\s+)?def\s+(\w+)\s*\(")
JS_HELPER = re.compile(r"^\s*(?:export\s+)?(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)\s*\{")
IGNORE_LINE = re.compile(r"e2e-coverage:\s*ignore")


def value_of(match: re.Match) -> tuple[str | None, re.Pattern | None, re.Pattern | None]:
    """(literal, regex, pattern) from a matched VALUE/STRING: a regex locator, a dynamic string or a literal."""
    groups = match.groupdict()
    if groups.get("r") is not None:
        flags = re.I if (groups.get("rflags") or "").endswith(("I", "IGNORECASE")) else 0
        return None, re.compile(groups["r"], flags), None
    if groups.get("jr") is not None:
        return None, re.compile(groups["jr"], re.I if "i" in (groups.get("jflags") or "") else 0), None
    text = groups.get("s")
    if text is None:
        return None, None, None
    text = re.sub(r"\\(.)", r"\1", text)
    dynamic = ("f" in (groups.get("prefix") or "").lower() and re.search(r"\{[^}]+\}", text)) or \
              (groups.get("q") == "`" and "${" in text)
    if dynamic:
        parts = re.split(r"\$?\{[^}]+\}", text)
        return text, None, re.compile(".+".join(re.escape(p) for p in parts), re.I | re.S)
    return text, None, None


def parse_tests(path: str) -> list[Ref]:
    refs: list[Ref] = []
    current = "(page object or helper)"
    for number, line in enumerate(Path(path).read_text(encoding="utf-8").splitlines(), 1):
        if m := PY_TEST.match(line):
            current = m.group(1)
        elif m := JS_TEST.search(line):
            current = m.group(2)
        elif (m := PY_HELPER.match(line) or JS_HELPER.match(line)) and m.group(1) not in ("if", "for", "while", "switch", "catch"):
            current = f"helper {m.group(1)}()"
        if IGNORE_LINE.search(line):
            continue
        for kind, regex in CALLS.items():
            for m in regex.finditer(line):
                ref = Ref(path, number, current, "testid" if kind == "css_testid" else kind, source=m.group(0)[:100].strip())
                if kind == "role":
                    ref.role = m.group("s")
                    rest = m.group("rest")
                    if named := ROLE_NAME.match(rest):
                        ref.value, ref.regex, ref.pattern = value_of(named)
                        ref.exact = bool(EXACT.search(rest[: named.end() + 40]))
                    if ref.role not in CONTROL_ROLES:
                        continue
                elif kind in ("testid", "css_testid"):
                    ref.value = m.group("s")
                else:
                    ref.value, ref.regex, ref.pattern = value_of(m)
                    ref.exact = bool(EXACT.search(m.groupdict().get("rest") or ""))
                refs.append(ref)
        if ref := control_ref(path, number, current, line):
            refs.append(ref)
    return refs


def control_ref(path: str, number: int, current: str, line: str) -> Ref | None:
    """A Ref for a test-core control(...) call on this line (role and name, label, test id or text), if any."""
    call = CONTROL_CALL.search(line)
    if call is None or re.search(r"\bdef\s+control\(|\bfunction\s+control\(", line):
        return None
    args = call.group("args")
    exact = bool(EXACT.search(args))
    for kind, regex in CONTROL_ARGS.items():
        if (m := regex.search(args)) is None:
            continue
        ref = Ref(path, number, current, kind, source=call.group(0)[:100].strip(), exact=exact)
        if kind == "role":
            ref.role = m.group("s")
            if ref.role not in CONTROL_ROLES:
                return None
            if named := CONTROL_NAME.search(args):
                ref.value, ref.regex, ref.pattern = value_of(named)
        elif kind == "testid":
            ref.value = m.group("s")
        else:
            ref.value, ref.regex, ref.pattern = value_of(m)
        return ref
    return None


# ---------------------------------------------------------------- matching


def matches(control: Control, ref: Ref) -> bool:
    if ref.kind == "role":
        return control.role == ref.role and (ref.value is None and ref.regex is None or any(n.matches(ref) for n in control.names))
    if ref.kind == "label":
        return any(n.matches(ref) for n in control.labels)
    if ref.kind == "testid":
        return control.testid is not None and control.testid == ref.value
    if ref.kind == "placeholder":
        return control.placeholder is not None and Name.of(control.placeholder).matches(ref)
    if ref.kind == "text":
        return any(n.text and n.matches(ref) for n in control.names)
    return False


def expand(patterns: list[str]) -> list[str]:
    files: list[str] = []
    for pattern in patterns:
        found = sorted(glob.glob(pattern, recursive=True)) if any(c in pattern for c in "*?[") else [pattern]
        files += [f for f in found if Path(f).is_file() and f not in files]
    return files


def run(pages: list[str], tests: list[str], messages: list[str], text_attribute: str) -> dict:
    texts = load_messages(messages)
    controls = [c for page in pages for c in parse_page(page, texts, text_attribute)]
    refs = [r for test in tests for r in parse_tests(test)]
    orphans = []
    for ref in refs:
        hits = [c for c in controls if matches(c, ref)]
        for control in hits:
            control.used_by.append(f"{ref.file}:{ref.line} ({ref.test})")
        if not hits and ref.kind != "text":
            orphans.append(ref)
    active = [c for c in controls if not c.ignored]
    untested = [c for c in active if not c.used_by]
    return {"controls": controls, "orphans": orphans, "untested": untested,
            "ignored": [c for c in controls if c.ignored], "pages": pages, "tests": tests}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--pages", nargs="+", required=True, help="page files or globs (HTML, templates)")
    parser.add_argument("--tests", nargs="+", required=True, help="e2e test and page-object files or globs")
    parser.add_argument("--messages", nargs="*", default=[], help="messages JSON files (one per language)")
    parser.add_argument("--text-attribute", default="data-text", help="attribute holding a messages key (data-text)")
    parser.add_argument("--allow-untested", action="store_true", help="report untested controls without failing")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args(argv)

    pages, tests, messages = expand(args.pages), expand(args.tests), expand(args.messages)
    if not pages or not tests:
        print(f"Nothing to check: {len(pages)} page file(s), {len(tests)} test file(s) matched.")
        return 2
    result = run(pages, tests, messages, args.text_attribute)
    ok = not result["orphans"] and (args.allow_untested or not result["untested"])
    if args.json:
        print(json.dumps({
            "ok": ok,
            "controls": [{"control": c.describe(), "where": f"{c.file}:{c.line}", "used_by": c.used_by,
                          **({"ignored": c.ignored} if c.ignored else {})} for c in result["controls"]],
            "untested": [{"control": c.describe(), "where": f"{c.file}:{c.line}"} for c in result["untested"]],
            "orphans": [{"reference": r.source, "where": f"{r.file}:{r.line}", "test": r.test} for r in result["orphans"]],
        }, ensure_ascii=False, indent=2))
        return 0 if ok else 1
    print(f"Controls in {len(pages)} page file(s), used by {len(tests)} test file(s):")
    for c in result["controls"]:
        if c.ignored:
            print(f"  --   {c.describe()}  {c.file}:{c.line}  ignored: {c.ignored}")
        elif c.used_by:
            more = f" (+{len(c.used_by) - 1} more)" if len(c.used_by) > 1 else ""
            print(f"  ok   {c.describe()}  {c.file}:{c.line}  <- {c.used_by[0]}{more}")
        else:
            print(f"  NO   {c.describe()}  {c.file}:{c.line}  not used by any e2e test (not verified)")
    if result["orphans"]:
        print("Tests that use a control that no longer exists (remove the test knowingly, or restore the control):")
        for r in result["orphans"]:
            print(f"  {r.file}:{r.line} ({r.test}): {r.source}")
    active = len(result["controls"]) - len(result["ignored"])
    print(f"{active} controls: {active - len(result['untested'])} tested, {len(result['untested'])} untested; "
          f"{len(result['orphans'])} orphaned reference(s).")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
