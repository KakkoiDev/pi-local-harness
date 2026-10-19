"""Task 329: a task's scenarios (Given, When, Then) and the e2e test each one becomes.

System 1 does the paperwork and the judging; the model writes the words and the tests (CONSTITUTION.md, Articles 1, 4):
- propose_plan's tasks carry `scenarios: [{title, given, when, then}]`; a code task that changes what the person sees
  needs at least one (`needed`). The harness writes them into the task file in one fixed format (`section`) and reads
  them back (`parse`);
- in Implementation the model writes one e2e test per scenario, named exactly after its title (kit/cards/e2e-scenarios.md);
- before "verified", every scenario's test must exist (`defined`) and have passed on the final code in a run Gate saw
  (`results` reads the names a runner printed); `check` names each scenario that is not there yet.
"""
from pathlib import Path
import re

FIELDS = ('title', 'given', 'when', 'then')
HEADING = '## Scenarios'
# Files that show something to the person: pages, templates, scripts and styles of a page, a terminal app's screens.
USER_FACING = re.compile(r'(?:^|/)(?:templates?|static|pages|components|js|src|public)/'
                         r'|\.(?:html?|jinja2?|j2|mjs|jsx?|tsx?|vue|svelte|css)$'
                         r'|(?:^|/)app/tui\.py$')
TEST_FILE = re.compile(r'(^|/)(?:tests?|specs?|__tests__|e2e)/|(^|/)test[_-][^/]*$|[._-](?:test|spec)s?\.[^/]+$')
SOURCE = ('.py', '.js', '.mjs', '.cjs', '.ts', '.mts', '.tsx', '.jsx')
SKIP_DIRS = {'.git', 'node_modules', '.venv', 'venv', 'vendor', 'dist', 'build', '__pycache__', '.pytest_cache'}


def _one_line(value):
    return ' '.join(str(value).split())


def clean(values):
    """The model's scenarios, checked: a list of {title, given, when, then}, each a non-empty line, titles unique. A
    leading Given/When/Then the model repeated is taken off. ValueError says what does not fit."""
    if values is None: return []
    if not isinstance(values, list): raise ValueError('Scenarios are a list of {title, given, when, then}.')
    out, titles = [], set()
    for value in values:
        if not isinstance(value, dict) or any(not isinstance(value.get(key), str) or not value[key].strip() for key in FIELDS):
            raise ValueError('Each scenario needs a title, given, when and then.')
        item = {key: _one_line(value[key]) for key in FIELDS}
        for key in FIELDS[1:]: item[key] = re.sub(rf'^{key}\b[:,]?\s*', '', item[key], flags=re.I) or item[key]
        if normal(item['title']) in titles: raise ValueError(f'Two scenarios are called “{item["title"]}”: each test is named after one.')
        titles.add(normal(item['title'])); out.append(item)
    return out


def needed(task):
    """A code task whose files show something to the person needs at least one scenario."""
    return task.get('kind', 'code') == 'code' and any(USER_FACING.search(str(path)) for path in task.get('files') or [])


def section(values):
    """The fixed format in the task file: `## Scenarios`, then per scenario `### <title>` and its three lines."""
    lines = [HEADING, '']
    for item in values: lines += [f"### {item['title']}", f"Given {item['given']}", f"When {item['when']}", f"Then {item['then']}", '']
    return '\n'.join(lines)


def parse(text):
    """The scenarios of a task file (its `## Scenarios` section), [] when it has none."""
    found = re.search(r'^## Scenarios[ \t]*\n(.*?)(?=^## |\Z)', text or '', re.M | re.S)
    if not found: return []
    out, item, last = [], None, None
    for line in found[1].splitlines():
        line = line.strip()
        heading = re.match(r'^###\s+(.+)$', line)
        if heading:
            item = {'title': heading[1].strip(), 'given': '', 'when': '', 'then': ''}; out.append(item); last = None; continue
        step = re.match(r'^(Given|When|Then|And|But)\s+(.+)$', line)
        if item is None or not step: continue
        key = step[1].lower()
        if key in ('and', 'but'):
            if last: item[last] = f"{item[last]} and {step[2].strip()}"
        else: item[key] = step[2].strip(); last = key
    return [item for item in out if all(item[key] for key in FIELDS)]


def normal(text):
    """Words only, lower case: how a scenario title and a test name are compared."""
    return ' '.join(re.findall(r'[^\W_]+', str(text).casefold()))


def same(title, name):
    """A test is named after the scenario: the same words (`Add a note`, `test_add_a_note`, `add a note`)."""
    name = re.sub(r'^test[_\s]+', '', str(name).strip(), flags=re.I)
    return bool(normal(title)) and normal(title) == normal(name)


# -- what a run printed ------------------------------------------------------------------------------------------------
_STATUS = {'ok': 'passed', 'passed': 'passed', 'fail': 'failed', 'failed': 'failed', 'error': 'failed', 'skipped': 'skipped'}


def results(output):
    """{test name: 'passed' | 'failed' | 'skipped'} from the runners' own lines: node's spec and TAP reporters,
    Playwright's list reporter, pytest -v and unittest -v. A name printed twice keeps its last result."""
    text = re.sub(r'\x1b\[[0-9;]*m', '', str(output or ''))
    found, previous = {}, ''
    for raw in text.splitlines():
        line = raw.strip()
        if not line: previous = ''; continue
        playwright = re.match(r'^([✓✔✘✖×-])\s+\d+\s+(?:\[[^\]]+\]\s+)?›.*›\s*(.+?)(?:\s+\(\d[\d.]*m?s\))?$', line)
        if playwright:
            found[playwright[2].strip()] = 'skipped' if playwright[1] == '-' else 'passed' if playwright[1] in '✓✔' else 'failed'
        elif (spec := re.match(r'^([✔✖﹣])\s+(.+?)(?:\s+\(\d[\d.]*m?s\))?(\s+#.*)?$', line)):
            found[spec[2].strip()] = 'skipped' if spec[1] == '﹣' or spec[3] else 'passed' if spec[1] == '✔' else 'failed'
        elif (tap := re.match(r'^(not ok|ok)\s+\d+\s+-\s+(.+?)(\s+#\s*(?:SKIP|skip).*)?$', line)):
            found[tap[2].strip()] = 'skipped' if tap[3] else 'passed' if tap[1] == 'ok' else 'failed'
        elif (pytest := re.match(r'^\S+::(?:\w+::)*(\w+)(?:\[[^\]]*\])?\s+(PASSED|FAILED|ERROR|SKIPPED)\b', line)):
            found[pytest[1]] = _STATUS[pytest[2].lower()]
        elif (unit := re.match(r'^(.*?)\s*\.\.\.\s+(ok|FAIL|ERROR|skipped)\b', line)):
            named = re.match(r'^(\w+) \([\w.]+\)', unit[1]) or re.match(r'^(\w+) \([\w.]+\)$', previous)
            if named: found[named[1]] = _STATUS[unit[2].lower()]
        previous = line
    return found


# -- the tests in the project ------------------------------------------------------------------------------------------
def test_files(root):
    """Test source files in the project (not in dependencies or build output)."""
    import os
    root = Path(root)
    for folder, dirs, files in os.walk(root):
        dirs[:] = sorted(name for name in dirs if name not in SKIP_DIRS)  # never walks dependencies or build output
        for name in sorted(files):
            path = Path(folder) / name; relative = path.relative_to(root).as_posix()
            if path.suffix in SOURCE and TEST_FILE.search(relative) and path.is_file() and not path.is_symlink(): yield relative, path


def names_in(source):
    """The tests a file defines: `test('name', …)` / `it("name", …)` in JavaScript, `def test_name(` in Python."""
    js = [match[2] for match in re.finditer(r'''\b(?:test|it)(?:\.(?:only|skip|todo))?\(\s*(['"`])(.+?)\1''', source)]
    py = re.findall(r'^\s*(?:async\s+)?def\s+(test_\w+)\s*\(', source, re.M)
    return js + py


def defined(root):
    """{test name: [file, …]} for every test the project's test files define."""
    out = {}
    for name, path in test_files(root):
        try: source = path.read_text(encoding='utf-8', errors='replace')
        except OSError: continue
        for test in names_in(source): out.setdefault(test, []).append(name)
    return out


def check(root, values, seen, state):
    """Why the scenarios are not verified yet, one line per scenario ([] when every one is): its test exists, ran and
    passed on the final code. `seen` is {test name: (result, code state)} from this request's runs; `state` is the
    final code's state."""
    if not values: return []
    names = defined(root); problems = []
    for item in values:
        title = item['title']
        if not any(same(title, name) for name in names):
            problems.append(f'scenario “{title}” has no e2e test named after it'); continue
        runs = [value for name, value in seen.items() if same(title, name)]
        if not runs: problems.append(f'scenario “{title}”: its test did not run (run the tests with their names shown)'); continue
        result, when = runs[-1]
        if result == 'failed': problems.append(f'scenario “{title}”: its test failed')
        elif result == 'skipped': problems.append(f'scenario “{title}”: its test was skipped (is a browser set up for the tests?)')
        elif when != state: problems.append(f'scenario “{title}”: its test passed only before the last change; run it again')
    return problems
