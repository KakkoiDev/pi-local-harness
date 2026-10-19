#!/usr/bin/env python3
"""Task 330: the testing protocols Pi Workbench gives the apps Pi builds, applied to Pi Workbench's own development.

  python3 tests/dogfood.py                     # all three checks (tests/verify_workflow.py runs them too)
  python3 tests/dogfood.py baseline controls   # rewrite tests/baselines/workbench-controls.txt from today's state
  python3 tests/dogfood.py baseline flaky      # rewrite tests/baselines/flaky-browser.txt from today's state

1. Scenarios (plan 328, task 329): a code task from task 330 on has a `## Scenarios` section (or a `No scenarios: <reason>`
   line when nothing the person sees or types changes). Each scenario's heading is the id and title of the e2e story that
   proves it, word for word: `### US-312 the counter shows one after I press Add` is
   `story('US-312', 'the counter shows one after I press Add', …)` in tests/browser/*.cjs, or
   `test('US-312 terminal: …', …)` in tests/harness/*.test.mjs. `US-new <title>` stands for a story not written yet; a
   done task cannot keep one. Older tasks are checked only when they have scenarios.
2. Controls (gate/controls.py, the E2E rule): the workbench's controls (index.html, and the buttons and links js/*.mjs
   renders with literal names) each have an e2e step in tests/browser/*.cjs. A test naming a control that no longer
   exists fails; a control removed with its test is listed as "Removed"; a new control without an e2e step fails.
   Today's gaps are in the baseline, so the check starts green; the baseline may only shrink (an entry that got its test
   or is gone must leave it), and growing it needs an explicit line in the commit message.
3. Flaky rules (test-core's tools/flaky_lint.py, MIT, KakkoiDev): fixed waits, timers used as sleeps, networkidle and real
   hosts in tests/browser/*.cjs. Today's hits are in a baseline; a new one fails; a fixed one must leave the baseline. A
   wait that must stay says why on its line: `/* flaky-lint: allow <reason> */`.
Standard library only; never runs a browser or reaches the network.
"""
from collections import Counter
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from gate import controls as gate_controls  # noqa: E402
from gate.scenarios import normal as words  # noqa: E402

FIRST_TASK = 330
CONTROLS_BASELINE = 'tests/baselines/workbench-controls.txt'
FLAKY_BASELINE = 'tests/baselines/flaky-browser.txt'
E2E_GLOB = 'tests/browser/*.cjs'


def _read(path):
    try: return Path(path).read_text(encoding='utf-8', errors='replace')
    except OSError: return ''


# -- 1. scenarios and their stories ------------------------------------------------------------------------------------
def stories(root):
    """{'US-NNN': [(title, file), …]} for the stories in tests/browser/*.cjs and tests/harness/*.test.mjs."""
    root, out = Path(root), {}
    for path in sorted(root.glob('tests/browser/*.cjs')) + sorted(root.glob('tests/harness/*.test.mjs')):
        source, name = _read(path), path.relative_to(root).as_posix()
        for match in re.finditer(r'''\bstory\(\s*(['"])(US-\d+)\1\s*,\s*(['"`])((?:\\.|(?!\3).)*)\3''', source):
            out.setdefault(match[2], []).append((match[4], name))
        for match in re.finditer(r'''\b(?:test|it)\(\s*(['"`])(US-\d+)\b[\s:]*((?:\\.|(?!\1).)*)\1''', source):
            out.setdefault(match[2], []).append((match[3], name))
    return out


def _title_matches(scenario_title, story_title):
    """Same words; a story title built from a template (`${kind}`) matches any words in that place."""
    parts = re.split(r'\$\{[^}]*\}', story_title)
    if len(parts) == 1: return words(scenario_title) == words(story_title)
    pattern = r'\s*.+?\s*'.join(re.escape(words(part)) for part in parts)
    return bool(re.fullmatch(pattern.strip(), words(scenario_title)))


def _scenario_blocks(text):
    """[(heading, {'given','when','then'} present)] of a task file's `## Scenarios` section, or None without one."""
    found = re.search(r'^## Scenarios[ \t]*\n(.*?)(?=^## |\Z)', text, re.M | re.S)
    if not found: return None
    blocks = []
    for line in found[1].splitlines():
        line = line.strip()
        if (heading := re.match(r'^###\s+(.+?)\s*$', line)): blocks.append((heading[1], set())); continue
        if blocks and (step := re.match(r'^(Given|When|Then)\s+\S', line)): blocks[-1][1].add(step[1].lower())
    return blocks


def roadmap_tasks(root):
    """[(number, path, done)] for every task ROADMAP.md links."""
    root, out = Path(root), []
    for status, path in re.findall(r'[-*+] \[(.)\] \[[^\]]*\]\((tasks/[^)]+)\)', _read(root / 'ROADMAP.md')):
        number = re.match(r'tasks/(\d+)', path.strip())
        if number: out.append((int(number[1]), path.strip(), status == 'x'))
    return out


def check_scenarios(root, first=FIRST_TASK):
    """One line per scenario or task that breaks the rule, [] when all hold."""
    root, problems, index = Path(root), [], None
    for number, name, done in roadmap_tasks(root):
        text = _read(root / name)
        if not text: continue
        kind = re.search(r'^Kind:\s*(\w+)', text, re.M)
        blocks = _scenario_blocks(text)
        if blocks is None:
            if number >= first and kind and kind[1] == 'code' and not re.search(r'^No scenarios:\s*\S', text, re.M):
                problems.append(f'{name}: a code task needs a `## Scenarios` section (### US-NNN <story title>, then Given/When/Then), '
                                'or a `No scenarios: <reason>` line under Kind when nothing the person sees or types changes')
            continue
        if not blocks and number >= first and kind and kind[1] == 'code':
            problems.append(f'{name}: `## Scenarios` has no scenario (### US-NNN <story title>, then Given/When/Then)')
        for heading, steps in blocks:
            missing = [step.title() for step in ('given', 'when', 'then') if step not in steps]
            if missing: problems.append(f'{name}: scenario “{heading}” has no {"/".join(missing)} line')
            story = re.match(r'^(US-(?:\d+|new))\b[\s:]*(.*)$', heading)
            if not story:
                problems.append(f'{name}: scenario “{heading}”: its heading starts with its story id (US-NNN, or US-new while the story is not written)')
                continue
            ident, title = story[1], story[2]
            if ident == 'US-new':
                if done: problems.append(f'{name}: scenario “{heading}” is still US-new in a done task: write its story first (Red), '
                                         'give it a US number and put that number in the heading')
                continue
            index = stories(root) if index is None else index
            if ident not in index:
                problems.append(f'{name}: scenario “{heading}”: there is no story {ident} in tests/browser/stories.cjs '
                                f"(or any tests/browser/*.cjs: story('{ident}', '…')) or tests/harness/*.test.mjs (test('{ident} …'))")
            elif not any(_title_matches(title, story_title) for story_title, _file in index[ident]):
                story_title, story_file = index[ident][0]
                problems.append(f'{name}: scenario “{heading}” does not match story {ident} “{story_title}” ({story_file}): '
                                'the heading is the story’s id and title, word for word')
    return problems


# -- 2. controls of the workbench and the e2e steps that use them ------------------------------------------------------
class _Page(gate_controls._Page):
    def _control(self, role, attrs, name):
        control = super()._control(role, attrs, name)
        control['command'] = attrs.get('data-command', '')
        return control


def _key(control):
    """How the workbench's controls are known: id, else data-command, else role and name."""
    clean = lambda value: value and gate_controls.DYNAMIC not in value and '${' not in value
    if clean(control.get('id')): return '#' + control['id']
    if clean(control.get('command')): return f"[data-command={control['command']}]"
    if clean(control.get('name')): return f"{control['role']}:{gate_controls.normal(control['name'])}"
    return None


def _page_controls(files):
    out = {}
    for path, source in sorted(files.items()):
        page = _Page()
        try: page.feed(re.sub(r'\$\{[^}]*\}', gate_controls.DYNAMIC, source)); page.close()
        except Exception: continue  # markup the parser cannot read is not checked, never fatal
        for control in page.found:
            if not control['name'] and control['id'] in page.label_for: control['name'] = page.label_for[control['id']]
            if (found := _key(control)): out.setdefault(found, {**control, 'file': path})
    return out


_HELPER = [  # buttons and links the workbench's modules render with a literal English name
    (re.compile(r'''\bbutton\(\s*(['"])((?:(?!\1)[^\\$])+)\1'''), 'button'),
    (re.compile(r'''\blink\(\s*(['"])((?:(?!\1)[^\\$])+)\1'''), 'link'),
    (re.compile(r'''\b(?:el|node|make)\(\s*['"]button['"]\s*,\s*[^,()]+,\s*(['"])((?:(?!\1)[^\\$])+)\1'''), 'button'),
    (re.compile(r'''\b(?:el|node|make)\(\s*['"]a['"]\s*,\s*[^,()]+,\s*(['"])((?:(?!\1)[^\\$])+)\1'''), 'link'),
]
_SNIPPET = re.compile(r'<(button|a|input|select|textarea)\b[^<>]*>(?:[^<>]*</\1>)?', re.S)


def _script_controls(files):
    out = {}
    for path, source in sorted(files.items()):
        for pattern, role in _HELPER:
            for match in pattern.finditer(source):
                control = {'role': role, 'name': match[2], 'testid': '', 'id': '', 'command': '', 'labels': [], 'file': path}
                if (found := _key(control)): out.setdefault(found, control)
        snippets = {path: '\n'.join(match[0] for match in _SNIPPET.finditer(source))}
        for found, control in _page_controls(snippets).items(): out.setdefault(found, control)
    return out


def _ui_files(root, head=False):
    """({'index.html': text}, {'js/x.mjs': text}) in the working tree or at HEAD."""
    root = Path(root)
    if not head:
        pages = {'index.html': _read(root / 'index.html')} if (root / 'index.html').is_file() else {}
        return pages, {path.relative_to(root).as_posix(): _read(path) for path in sorted(root.glob('js/*.mjs'))}
    listed = _git(root, 'ls-tree', '-r', '--name-only', 'HEAD')
    if listed is None: return None
    names = listed.splitlines()
    show = lambda name: _git(root, 'show', f'HEAD:{name}') or ''
    return ({name: show(name) for name in names if name == 'index.html'},
            {name: show(name) for name in names if re.fullmatch(r'js/[^/]+\.mjs', name)})


def _git(root, *args):
    try: done = subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, timeout=60)
    except (OSError, subprocess.SubprocessError): return None
    return done.stdout if done.returncode == 0 else None


def ui_controls(root, files=None):
    """{key: control} for the workbench's own UI."""
    pages, scripts = files or _ui_files(root)
    return {**_script_controls(scripts), **_page_controls(pages)}


_HEX = re.compile(r'(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})')


def _color(value):
    """`#ff0000`, `#fff`: a colour in an assertion, not an id (`#add` stays an id)."""
    return bool(_HEX.fullmatch(value)) and (any(ch.isdigit() for ch in value) or len(set(value.lower())) == 1)


def test_refs(source):
    """What a browser test reaches: ('id', v), ('command', v) and gate/controls.py's role, label, text and testid refs."""
    found = [('id', match[1]) for match in re.finditer(r'(?<![\w&.#/$-])#([A-Za-z][\w-]*)', source) if not _color(match[1])]
    found += [('command', match[1]) for match in re.finditer(r'''data-command=\\?["']?([\w-]+)''', source)]
    found += [ref for ref in gate_controls.refs(source) if not any('${' in str(part) for part in ref) and ref[0] != 'id']
    found = [ref for ref in found if ref[0] != 'id' or not ref[1].endswith('-')]  # `#agent-${name}`: built at run time
    found += [('text', match[1]) for match in re.finditer(r'''has-text\(\\?["']([^"'\\]+)''', source)]
    return found


def e2e_tests(root, files=None):
    """{test file: set(refs)} for tests/browser/*.cjs (each suite is one long journey, so a file is the unit)."""
    root = Path(root)
    files = files if files is not None else {path.relative_to(root).as_posix(): _read(path) for path in sorted(root.glob(E2E_GLOB))}
    return {name: set(test_refs(source)) for name, source in files.items()}


def _covers(ref, control):
    if ref[0] == 'id': return control.get('id') == ref[1]
    if ref[0] == 'command': return control.get('command') == ref[1]
    return gate_controls._matches(ref, control)


def uncovered(root, controls=None, tests=None):
    controls = ui_controls(root) if controls is None else controls
    refs = set().union(*(e2e_tests(root) if tests is None else tests).values())
    return sorted(key for key, control in controls.items() if not any(_covers(ref, control) for ref in refs))


def _universe(root, pages, scripts):
    """The UI's own text (pages, modules, messages, the server's pages): where a test's names must still be found."""
    root = Path(root)
    extra = [path for folder in ('messages', 'harness', 'kit') for path in sorted((root / folder).rglob('*'))
             if path.is_file() and path.suffix in ('.json', '.html', '.mjs', '.js', '.py', '.md') and path.stat().st_size < 2_000_000
             and 'vendor' not in path.parts and 'node_modules' not in path.parts]
    text = '\n'.join([*pages.values(), *scripts.values(), *(_read(path) for path in extra)])
    return re.sub(r'\\u([0-9a-fA-F]{4})', lambda match: chr(int(match[1], 16)), text)


def absent(root, controls=None, tests=None, files=None):
    """{ref label: [test files]} for the names a test uses that the UI no longer has (a control removed while its test
    stays; or a test checking that something is gone)."""
    pages, scripts = files or _ui_files(root)
    controls = ui_controls(root, (pages, scripts)) if controls is None else controls
    tests = e2e_tests(root) if tests is None else tests
    universe = _universe(root, pages, scripts); folded = gate_controls.normal(universe)
    ids = set(re.findall(r'''(?:\bid\s*[=:]\s*\\?["'`]?|\.id\s*=\s*["'`]|getElementById\(\s*["'`]|[#])([A-Za-z][\w-]*)''', universe))
    commands = set(re.findall(r'''(?:data-command\s*=\s*\\?["']?|command\s*[=:]\s*["']|dataset\.command\s*={1,3}\s*["'])([\w-]+)''', universe))
    out = {}
    for name, refs in tests.items():
        for ref in refs:
            if ref[0] == 'id': gone = ref[1] not in ids
            elif ref[0] == 'command': gone = ref[1] not in commands
            elif ref[0] in ('role-re', 'text', 'label'): gone = False  # a pattern, or text Pi or the test wrote: not a control
            else:
                value = ref[2] if ref[0] == 'role' else ref[1]
                gone = not any(_covers(ref, control) for control in controls.values()) and gate_controls.normal(value) not in folded
            if gone: out.setdefault(_ref_label(ref), []).append(name)
    return out


def _ref_label(ref):
    if ref[0] == 'id': return '#' + ref[1]
    if ref[0] == 'command': return f'[data-command={ref[1]}]'
    if ref[0] == 'role': return f"{ref[1]}:{' '.join(ref[2].split())}"
    return f"{ref[0]}:{' '.join(ref[1].split())}"


def _describe(key, control=None):
    file = f" ({control['file']})" if control and control.get('file') else ''
    return f'{key}{file}'


def _baseline(root, name):
    return [line.strip() for line in _read(Path(root) / name).splitlines() if line.strip() and not line.startswith('#')]


CONTROLS_HEADER = """\
# Workbench controls without an e2e step today (task 330; tests/dogfood.py). This list may only shrink.
# `uncovered <control>`: a control in index.html or js/*.mjs no tests/browser/*.cjs step uses yet.
# `absent <name>`: a name a browser test uses that the UI no longer has (a check that something is gone, or an id
#   built at run time). Write the control's e2e step, then delete its line. Adding a line needs an explicit
#   "Controls baseline: + <line> because …" line in the commit message.
"""


def write_controls_baseline(root):
    root = Path(root); path = root / CONTROLS_BASELINE; path.parent.mkdir(parents=True, exist_ok=True)
    lines = [f'uncovered {key}' for key in uncovered(root)] + [f'absent {label}' for label in sorted(absent(root))]
    path.write_text(CONTROLS_HEADER + ''.join(line + '\n' for line in lines))
    return lines


def check_controls(root):
    """(problems, notes): problems fail the workflow check; notes say what was removed with its test."""
    root = Path(root); files = _ui_files(root); controls = ui_controls(root, files); tests = e2e_tests(root)
    baseline = _baseline(root, CONTROLS_BASELINE)
    known_gaps = {line.split(' ', 1)[1] for line in baseline if line.startswith('uncovered ')}
    known_absent = {line.split(' ', 1)[1] for line in baseline if line.startswith('absent ')}
    gaps, gone = set(uncovered(root, controls, tests)), absent(root, controls, tests, files)
    problems, notes = [], []
    for label in sorted(set(gone) - known_absent):
        problems.append(f'{", ".join(sorted(set(gone[label])))} uses {label}, a control that no longer exists in index.html or js/*.mjs: '
                        'remove the step with the control (both go in the same commit), or restore the control')
    for key in sorted(gaps - known_gaps):
        problems.append(f'{_describe(key, controls.get(key))} has no e2e step in {E2E_GLOB}: add one '
                        f'(Red first), or, knowingly, a line in {CONTROLS_BASELINE}')
    for key in sorted(known_gaps - gaps):
        state = 'is gone' if key not in controls else 'now has an e2e step'
        problems.append(f'{key} {state}: remove it from {CONTROLS_BASELINE} (the baseline only shrinks)')
    for label in sorted(known_absent - set(gone)):
        problems.append(f'absent {label}: no browser test uses it any more, or the UI has it again: remove it from {CONTROLS_BASELINE}')
    before = _ui_files(root, head=True)
    if before:
        old_controls = ui_controls(root, before)
        head_tests = {}
        for name in (_git(root, 'ls-tree', '-r', '--name-only', 'HEAD') or '').splitlines():
            if re.fullmatch(r'tests/browser/[^/]+\.cjs', name): head_tests[name] = _git(root, 'show', f'HEAD:{name}') or ''
        old_tests = e2e_tests(root, head_tests)
        for key in sorted(set(old_controls) - set(controls)):
            used = sorted(name for name, refs in old_tests.items() if any(_covers(ref, old_controls[key]) for ref in refs))
            notes.append(f'Removed: {_describe(key, old_controls[key])}' + (f' and its e2e step in {", ".join(used)}' if used else ''))
    return problems, notes


# -- 3. flaky patterns in the browser suites ---------------------------------------------------------------------------
FLAKY_RULES = [  # after test-core's tools/flaky_lint.py (MIT, KakkoiDev); a timer counts only when it is used as a sleep
    ('sleep', re.compile(r'\btime\.sleep\(|\basyncio\.sleep\(\s*[1-9.]'), 'fixed sleep: wait for the state (expect, a response, an event)'),
    ('wait', re.compile(r'\bwait_for_timeout\(|\bwaitForTimeout\('), 'fixed wait: wait for a locator, a response or a value'),
    ('timer', re.compile(r'new Promise\(\s*\(?\s*(?:r|res|resolve)\s*\)?\s*=>\s*setTimeout\(|\bsetTimeout\(\s*(?:r|res|resolve)\s*,'),
     'timer in a test used as a sleep: wait for the state instead'),
    ('only', re.compile(r'\b(?:test|it|describe)\.only\('), 'focused test left in: remove .only'),
    ('idle', re.compile(r'''['"`]networkidle['"`]'''), 'networkidle is unreliable: wait for the element or response you need'),
    ('host', re.compile(r'''\.goto\(\s*['"`]https?://(?!127\.0\.0\.1|localhost|\[::1\])'''), 'a real host in goto: serve the app locally'),
]
ALLOW = re.compile(r'flaky-lint:\s*allow\s+\S')
FLAKY_HEADER = """\
# Flaky patterns in tests/browser/*.cjs today (task 330; tests/dogfood.py; rules after test-core's flaky_lint.py).
# file<TAB>rule<TAB>the code around the hit. This list may only shrink: fix a hit (wait for the state), then delete its
# line. A wait that must stay says why on its line: /* flaky-lint: allow <reason> */.
"""


def flaky_hits(root):
    """[(file, message, snippet, line number, rule)] for every flaky pattern in the browser suites."""
    root, out = Path(root), []
    for path in sorted(root.glob(E2E_GLOB)):
        name = path.relative_to(root).as_posix()
        for number, line in enumerate(_read(path).splitlines(), 1):
            for rule, pattern, message in FLAKY_RULES:
                for match in pattern.finditer(line):
                    if ALLOW.search(line[match.start():match.end() + 200]): continue
                    snippet = ' '.join(line[max(0, match.start() - 30):match.end() + 30].split())
                    out.append((name, message, snippet, number, rule))
    return out


def _flaky_key(hit): return f'{hit[0]}\t{hit[4]}\t{hit[2]}'


def write_flaky_baseline(root):
    root = Path(root); path = root / FLAKY_BASELINE; path.parent.mkdir(parents=True, exist_ok=True)
    lines = [_flaky_key(hit) for hit in flaky_hits(root)]
    path.write_text(FLAKY_HEADER + ''.join(line + '\n' for line in lines))
    return lines


def check_flaky(root):
    hits = flaky_hits(root); baseline = Counter(_baseline(root, FLAKY_BASELINE)); now = Counter(_flaky_key(hit) for hit in hits)
    problems, extra = [], now - baseline
    for hit in hits:
        key = _flaky_key(hit)
        if extra[key] > 0:
            extra[key] -= 1
            problems.append(f'{hit[0]}:{hit[3]}: {hit[1]}: …{hit[2]}…')
    for key, count in (baseline - now).items():
        file, rule, snippet = key.split('\t', 2)
        problems += [f'{file}: the {rule} hit “{snippet}” is fixed or changed: remove it from {FLAKY_BASELINE} (the baseline only shrinks)'] * count
    return problems


# -- all of it ---------------------------------------------------------------------------------------------------------
def check_all(root=ROOT):
    root = Path(root); problems, notes = check_scenarios(root), []
    found, removed = check_controls(root); problems += found; notes += removed
    problems += check_flaky(root)
    return problems, notes


def main(argv):
    if argv[:2] == ['baseline', 'controls']:
        print(f'{len(write_controls_baseline(Path.cwd()))} line(s) in {CONTROLS_BASELINE}'); return 0
    if argv[:2] == ['baseline', 'flaky']:
        print(f'{len(write_flaky_baseline(Path.cwd()))} line(s) in {FLAKY_BASELINE}'); return 0
    if argv: print(__doc__); return 2
    problems, notes = check_all(Path.cwd())
    for note in notes: print(f'ℹ️ {note}')
    for problem in problems: print(f'❌ {problem}')
    print('✅ Dogfood checks passed (scenarios, controls, flaky rules)' if not problems else f'{len(problems)} problem(s).')
    return 1 if problems else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
