"""Gherkin for test-core: read a task's scenarios, match a step against a fixed vocabulary, suggest the nearest step.

Standard library only (tools/vocab.py uses it too). The JavaScript twin is functional/js/gherkin.js: same rules, same
names in camelCase, same results.

A task's scenarios (the task file's `## Scenarios` section; `### Scenario: <title>` works anywhere). The recommended
heading is `### <ID> <title>`: an optional story id (US-312, or US-new for a story not written yet), then the title,
with an optional `Scenario:` prefix. `### Scenario: Add a task` and `### Add a task` (no id) keep working.

    ## Scenarios

    ### US-12 Add a task
    Given I am signed in with an empty list
    When I add the task "Buy milk"
    Then I see "Buy milk" in the list
    And the count says "1 task"

A step pattern is a step with `{name}` places: `When I add the task {title}`. A value is quoted ("Buy milk", “Buy milk”,
「牛乳」) or one word without spaces (3, Saturday). An unquoted whole number becomes an int; everything else is text.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

KEYWORDS = ("Given", "When", "Then")
LEVELS = ("unit", "integration", "e2e")

SECTION = re.compile(r"^\s*##\s+(?P<name>[^#].*?)\s*$")
HEADING = re.compile(r"^\s*###\s+(?:Scenario(?: Outline)?:\s*)?(?P<title>.+?)\s*#*\s*$", re.IGNORECASE)
SCENARIO_LINE = re.compile(r"^\s*(?:[-*]\s+)?(?:#+\s*)?Scenario(?: Outline)?:\s*(?P<title>.+?)\s*#*\s*$", re.IGNORECASE)
SCENARIO_ID = re.compile(r"^(?P<id>[A-Z][A-Z0-9]*-(?:\d+|new))\b[\s:]*(?P<title>.+)$")
STEP_LINE = re.compile(r"^\s*(?:[-*]\s+)?(?P<keyword>Given|When|Then|And|But)\s+(?P<text>.+?)\s*$", re.IGNORECASE)
PARAM = re.compile(r"\{([A-Za-z_]\w*)\}")
VALUE = r'(?:"([^"]*)"|“([^”]*)”|「([^」]*)」|([^\s"“「]+?))'
GROUPS_PER_VALUE = 4
QUOTED = re.compile(r'"[^"]*"|“[^”]*”|「[^」]*」')


@dataclass
class Step:
    keyword: str  # as written: Given, When, Then, And, But
    kind: str  # Given, When or Then (And/But take the kind of the step above)
    text: str  # without the keyword
    line: int = 0

    @property
    def full(self) -> str:
        """The step as the vocabulary knows it: 'When I add the task "Buy milk"'."""
        return f"{self.kind} {self.text}"


@dataclass
class Scenario:
    title: str  # without the id: "Add a task"
    steps: list[Step] = field(default_factory=list)
    line: int = 0
    source: str = ""
    id: str | None = None  # "US-12", "US-new" or None

    @property
    def name(self) -> str:
        """The heading without `Scenario:`, the test's name: "US-12 Add a task" (or "Add a task" without an id)."""
        return f"{self.id} {self.title}" if self.id else self.title


def split_heading(heading: str) -> tuple[str | None, str]:
    """'US-312 the counter shows one' -> ('US-312', 'the counter shows one'); 'Add a task' -> (None, 'Add a task')."""
    match = SCENARIO_ID.match(heading.strip())
    return (match["id"], match["title"].strip()) if match else (None, heading.strip())


def parse_scenarios(text: str, source: str = "") -> list[Scenario]:
    """Every scenario of a task file, in order, each with its steps in order."""
    scenarios: list[Scenario] = []
    in_section = False
    current: Scenario | None = None
    kind: str | None = None
    for number, line in enumerate(text.splitlines(), 1):
        if section := SECTION.match(line):
            in_section = section["name"].lower().startswith("scenarios")
            current = None
            continue
        heading = HEADING.match(line) if in_section else None
        named = SCENARIO_LINE.match(line)
        if heading or named:
            ident, title = split_heading((named or heading)["title"])
            current = Scenario(title, line=number, source=source, id=ident)
            scenarios.append(current)
            kind = None
            continue
        if line.lstrip().startswith("#"):
            current = None
            continue
        if current is None or not (match := STEP_LINE.match(line)):
            continue
        keyword = match["keyword"].capitalize()
        if keyword in ("And", "But"):
            if kind is None:
                raise ValueError(f"{source}:{number}: '{keyword}' needs a Given, When or Then above it")
        else:
            kind = keyword
        current.steps.append(Step(keyword, kind, match["text"], number))
    return scenarios


def _literal(text: str) -> str:
    return "".join(r"\s+" if part.isspace() else re.escape(part) for part in re.split(r"(\s+)", text) if part)


def compile_pattern(pattern: str) -> tuple[re.Pattern, list[str]]:
    """'When I add the task {title}' -> (a regex matching the step, ['title'])."""
    words = pattern.split(None, 1)
    if not words or words[0] not in KEYWORDS:
        raise ValueError(f"a step pattern starts with Given, When or Then: {pattern!r}")
    parts = PARAM.split(pattern.strip())
    names = parts[1::2]
    if len(set(names)) != len(names):
        raise ValueError(f"a place name appears twice in {pattern!r}")
    regex = "".join(_literal(part) if i % 2 == 0 else VALUE for i, part in enumerate(parts))
    return re.compile(f"^{regex}$", re.IGNORECASE), names


def match_pattern(compiled: tuple[re.Pattern, list[str]], step: str) -> dict | None:
    """The values of a step for one compiled pattern, or None when the step does not match it."""
    regex, names = compiled
    found = regex.match(step.strip())
    if found is None:
        return None
    values = {}
    groups = found.groups()
    for index, name in enumerate(names):
        quoted_or_bare = groups[index * GROUPS_PER_VALUE:(index + 1) * GROUPS_PER_VALUE]
        bare = quoted_or_bare[-1]
        if bare is not None:
            values[name] = int(bare) if re.fullmatch(r"-?\d+", bare) else bare
        else:
            values[name] = next(v for v in quoted_or_bare[:-1] if v is not None)
    return values


def shape(text: str) -> str:
    """A step without its values, for comparing: 'When I add the task "Buy milk"' -> 'when i add the task {}'."""
    text = QUOTED.sub("{}", text)
    text = PARAM.sub("{}", text)
    text = re.sub(r"(?<![\w{])-?\d+(?![\w}])", "{}", text)
    return re.sub(r"\s+", " ", text).strip().lower()


def _bigrams(text: str) -> list[str]:
    return [text[i:i + 2] for i in range(len(text) - 1)] or [text]


def similarity(a: str, b: str) -> float:
    """Dice coefficient over character pairs of the two shapes (0 to 1). The JavaScript twin computes the same."""
    left, right = _bigrams(shape(a)), _bigrams(shape(b))
    pool = list(right)
    common = 0
    for pair in left:
        if pair in pool:
            pool.remove(pair)
            common += 1
    return 2 * common / (len(left) + len(right))


def nearest(step: str, patterns: list[str], n: int = 3, cutoff: float = 0.5) -> list[str]:
    """The known steps closest to an unknown one, best first (ties keep the vocabulary's order)."""
    unique = list(dict.fromkeys(patterns))
    scored = sorted(((similarity(step, p), -i, p) for i, p in enumerate(unique)), reverse=True)
    close = [p for score, _, p in scored if score >= cutoff][:n]
    if close:
        return close
    keyword = step.split(None, 1)[0].capitalize() if step.strip() else ""
    return [p for _, _, p in scored if p.split(None, 1)[0] == keyword][:n]


def unknown_step_message(step: str, patterns: list[str]) -> str:
    suggestions = nearest(step, patterns)
    hint = ""
    if suggestions and "{" in suggestions[0] and not QUOTED.search(step):
        hint = ' (a value with spaces goes in quotes: "Buy milk")'
    if not suggestions:
        return f"unknown step {step!r}{hint}; no known step is close."
    listed = "\n".join(f"  - {s}" for s in suggestions)
    return f"unknown step {step!r}{hint}. Nearest known steps:\n{listed}"
