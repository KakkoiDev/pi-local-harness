"""Task 329 (plan 328, "The E2E rule for generated apps"): every user-facing control has an e2e step that uses it.

A deterministic checker (System 1, no model): it lists the controls in the app's pages and templates (buttons, links,
fields; by data-testid, else role and accessible name, else id) and, per e2e test, the controls it reaches (Playwright's
getByRole/getByLabel/getByText/getByTestId and their Python spellings, `#id` selectors). At the end of a request it
compares HEAD (before) with the working tree (after):
- a control removed while a test still uses it → "test X uses a control that no longer exists";
- a control removed together with its test → allowed, listed on the check-in as "Removed: <control> and its test X";
- a new control no e2e test uses → "<control> has no e2e step".
A project without any e2e test is not checked (the starters ship one, so new projects are). It starts with the starters'
stack: Jinja templates (names from `t("key")` and messages/en.json), static HTML and the App Blocks' markup.
"""
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
import subprocess

from .scenarios import SKIP_DIRS, TEST_FILE, names_in

PAGE = re.compile(r'\.(?:html?|jinja2?|j2)$')
NOT_PAGES = SKIP_DIRS | {'tests', 'test', 'tasks', 'docs', 'design'}
DYNAMIC = '\x00'
E2E = re.compile(r'\b(?:getBy\w+|get_by_\w+|page\.goto|locator|pilot)\b')
ROLE_WORD = {'button': 'button', 'link': 'link', 'textbox': 'field', 'file': 'field', 'checkbox': 'checkbox', 'radio': 'option',
             'combobox': 'menu', 'tab': 'tab', 'menuitem': 'menu item', 'switch': 'switch'}
INPUT_ROLE = {'submit': 'button', 'button': 'button', 'reset': 'button', 'image': 'button', 'checkbox': 'checkbox', 'radio': 'radio', 'file': 'file'}


def normal(text):
    return ' '.join(str(text or '').split()).casefold()


# -- controls in pages -------------------------------------------------------------------------------------------------
def _template_text(source, messages):
    """Jinja to plain markup: `{{ t("key") }}` → the English message, other expressions → a dynamic marker, tags gone."""
    source = re.sub(r'\{#.*?#\}', ' ', source, flags=re.S)
    source = re.sub(r'\{%.*?%\}', ' ', source, flags=re.S)
    def expression(match):
        key = re.fullmatch(r'''\s*(?:t|_|gettext)\(\s*["']([^"']+)["']\s*\)\s*''', match[1])
        return messages.get(key[1], key[1]) if key else DYNAMIC
    return re.sub(r'\{\{(.*?)\}\}', expression, source, flags=re.S)


class _Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.found, self.open, self.labels, self.label_for = [], [], [], {}

    def handle_starttag(self, tag, attrs):
        attrs = {key: value or '' for key, value in attrs}
        role = attrs.get('role', '').strip()
        if tag == 'label':
            self.labels.append({'for': attrs.get('for', ''), 'text': [], 'inputs': []})
        if tag == 'input':
            kind = attrs.get('type', 'text').lower()
            if kind == 'hidden': return
            control = self._control(INPUT_ROLE.get(kind, 'textbox'), attrs, attrs.get('value', '') if INPUT_ROLE.get(kind) == 'button' else '')
            if self.labels: self.labels[-1]['inputs'].append(control)
            return
        if tag in ('textarea', 'select'):
            control = self._control('textbox' if tag == 'textarea' else 'combobox', attrs, '')
            if self.labels: self.labels[-1]['inputs'].append(control)
        if tag == 'button' or (tag == 'a' and 'href' in attrs) or role in ROLE_WORD:
            self.open.append({'tag': tag, 'control': self._control(role or ('link' if tag == 'a' else 'button'), attrs, ''), 'text': []})

    def _control(self, role, attrs, name):
        control = {'role': role, 'name': attrs.get('aria-label') or name, 'testid': attrs.get('data-testid', ''), 'id': attrs.get('id', ''),
                   'labels': [value for value in (attrs.get('aria-label'), attrs.get('placeholder'), attrs.get('title')) if value]}
        self.found.append(control); return control

    def handle_endtag(self, tag):
        if self.open and self.open[-1]['tag'] == tag:
            item = self.open.pop(); control = item['control']
            if not control['name']: control['name'] = ' '.join(''.join(item['text']).split())
        if tag == 'label' and self.labels:
            label = self.labels.pop(); text = ' '.join(''.join(label['text']).split())
            if label['for']: self.label_for.setdefault(label['for'], text)
            for control in label['inputs']:
                control['labels'].append(text)
                if not control['name']: control['name'] = text

    def handle_data(self, data):
        for item in self.open: item['text'].append(data)
        for label in self.labels: label['text'].append(data)


def key(control):
    """How a control is known across versions: its data-testid, else role and name, else its id."""
    if control['testid'] and DYNAMIC not in control['testid']: return 'testid:' + control['testid']
    if control['name'] and DYNAMIC not in control['name']: return f"{control['role']}:{normal(control['name'])}"
    if control['id'] and DYNAMIC not in control['id']: return '#' + control['id']
    return None


def controls(files, messages):
    """{key: control} for the pages and templates in `files` ({path: text}); messages: {key: English} for t("key")."""
    out = {}
    for path, source in sorted(files.items()):
        page = _Page()
        try: page.feed(_template_text(source, messages)); page.close()
        except Exception: continue  # markup the parser cannot read is not checked, never fatal
        for control in page.found:
            if not control['name'] and control['id'] in page.label_for: control['name'] = page.label_for[control['id']]
            if control['id'] in page.label_for: control['labels'].append(page.label_for[control['id']])
            found = key(control)
            if found: out.setdefault(found, {**control, 'file': path})
    return out


def describe(control):
    word = ROLE_WORD.get(control['role'], control['role'])
    if control['name'] and DYNAMIC not in control['name']: return f"the “{' '.join(control['name'].split())}” {word}"
    if control['testid']: return f'the {word} data-testid="{control["testid"]}"'
    return f"the {word} #{control['id']}"


# -- what the e2e tests use --------------------------------------------------------------------------------------------
_Q = r'''(['"`])((?:(?!\1).)+)\1'''


def refs(source):
    """The controls a piece of test code reaches: ('role', role, name, exact), ('role-re', role, pattern, flags),
    ('testid', v), ('label', v), ('text', v), ('id', v)."""
    found = []
    for match in re.finditer(r'(?:getByRole|get_by_role)\(\s*' + _Q + r'\s*(?:,\s*(\{[^}]*\}|[^)]*))?\)', source):
        role, options = match[2], match[3] or ''
        name = re.search(r'name\s*[:=]\s*' + _Q, options)
        pattern = re.search(r'name\s*:\s*/((?:\\/|[^/])+)/(\w*)', options)
        exact = bool(re.search(r'exact\s*[:=]\s*(?:true|True)', options))
        if name: found.append(('role', role, name[2], exact))
        elif pattern: found.append(('role-re', role, pattern[1], pattern[2]))
    for kind, names in (('testid', 'getByTestId|get_by_test_id'), ('label', 'getByLabel|get_by_label|getByPlaceholder|get_by_placeholder|getByTitle|get_by_title'), ('text', 'getByText|get_by_text')):
        for match in re.finditer(rf'(?:{names})\(\s*' + _Q, source): found.append((kind, match[2]))
    for match in re.finditer(r'''\[data-testid=["']?([\w-]+)["']?\]''', source): found.append(('testid', match[1]))
    for match in re.finditer(r'''(?:locator|click|fill|query_one|press|hover|check|tap|type)\(\s*["']#([\w-]+)''', source): found.append(('id', match[1]))
    return found


def tests(files):
    """{(file, test name): [refs]} for every e2e test in `files` ({path: text}); code before a file's first test (its
    helpers) counts for each of its tests."""
    out = {}
    for path, source in sorted(files.items()):
        if not E2E.search(source): continue
        marks = sorted([(match.start(), match[2]) for match in re.finditer(r'''\b(?:test|it)(?:\.(?:only|skip))?\(\s*(['"`])(.+?)\1''', source)]
                       + [(match.start(), match[1]) for match in re.finditer(r'^\s*(?:async\s+)?def\s+(test_\w+)\s*\(', source, re.M)])
        if not marks: continue
        shared = refs(source[:marks[0][0]])
        for index, (start, name) in enumerate(marks):
            end = marks[index + 1][0] if index + 1 < len(marks) else len(source)
            out[(path, name)] = shared + refs(source[start:end])
    return out


def _matches(ref, control):
    name = normal(control['name'])
    if ref[0] == 'testid': return control['testid'] == ref[1]
    if ref[0] == 'id': return control['id'] == ref[1]
    if ref[0] == 'role':
        if ref[1] != control['role'] and not (ref[1] == 'textbox' and control['role'] in ('textbox', 'combobox')): return False
        return name == normal(ref[2]) if ref[3] else bool(normal(ref[2])) and normal(ref[2]) in name
    if ref[0] == 'role-re':
        try: return ref[1] == control['role'] and bool(re.search(ref[2], control['name'], re.I if 'i' in ref[3] else 0))
        except re.error: return False
    if ref[0] == 'label': return any(normal(ref[1]) and normal(ref[1]) in normal(label) for label in control['labels'] + [control['name']])
    if ref[0] == 'text': return bool(normal(ref[1])) and normal(ref[1]) in name
    return False


def uses(test_refs, control):
    return any(_matches(ref, control) for ref in test_refs)


# -- the end-of-request check ------------------------------------------------------------------------------------------
def _git(root, *args):
    done = subprocess.run(['git', '-C', str(root), *args], capture_output=True, timeout=60)
    return done.stdout if done.returncode == 0 else None


def _wanted(name):
    parts = PurePosixPath(name).parts
    if any(part in SKIP_DIRS for part in parts[:-1]): return None
    if TEST_FILE.search(name) and PurePosixPath(name).suffix in ('.py', '.js', '.mjs', '.cjs', '.ts', '.mts', '.tsx', '.jsx'): return 'test'
    if PAGE.search(name) and not any(part in NOT_PAGES for part in parts[:-1]): return 'page'
    if name == 'messages/en.json': return 'messages'
    return None


def snapshot(root, head=False):
    """(controls, tests) of the project at HEAD (head=True) or in the working tree."""
    root = Path(root)
    listed = _git(root, 'ls-tree', '-r', '-z', '--name-only', 'HEAD') if head else _git(root, 'ls-files', '-z', '-c', '-o', '--exclude-standard')
    pages, test_sources, messages = {}, {}, {}
    for name in (listed or b'').decode(errors='surrogateescape').split('\0'):
        kind = name and _wanted(name)
        if not kind: continue
        if head: data = _git(root, 'show', f'HEAD:./{name}')
        else:
            path = root / name
            data = path.read_bytes() if path.is_file() and not path.is_symlink() else None
        if data is None or len(data) > 1_000_000: continue
        text = data.decode('utf-8', errors='replace')
        if kind == 'page': pages[name] = text
        elif kind == 'test': test_sources[name] = text
        else:
            try: messages = {key: value for key, value in json.loads(text).items() if isinstance(value, str)}
            except (ValueError, AttributeError): messages = {}
    return controls(pages, messages), tests(test_sources)


def compare(before, after):
    """{'problems': [...], 'removed': [...]} between two snapshots (see the module's docstring)."""
    (old, old_tests), (new, new_tests) = before, after
    problems, removed = [], []
    if not old_tests and not new_tests: return {'problems': problems, 'removed': removed}
    for gone in [old[key] for key in old if key not in new]:
        dangling = [name for (path, name), found in new_tests.items()
                    if any(_matches(ref, gone) and not any(_matches(ref, control) for control in new.values()) for ref in found)]
        if dangling:
            problems += [f'test “{name}” uses a control that no longer exists: {describe(gone)}' for name in dangling]; continue
        with_it = [name for test, found in old_tests.items() if test not in new_tests and uses(found, gone) for name in [test[1]]]
        removed.append(f"{describe(gone)} and its test{'s' if len(with_it) > 1 else ''} {', '.join(f'“{name}”' for name in with_it)}" if with_it else describe(gone))
    for added in [new[key] for key in new if key not in old]:
        if not any(uses(found, added) for found in new_tests.values()): problems.append(f'{describe(added)} has no e2e step')
    return {'problems': problems, 'removed': removed}


def check(root):
    """The E2E control rule for the request's changes (HEAD → working tree). Never raises for unreadable files."""
    try: return compare(snapshot(root, head=True), snapshot(root))
    except (OSError, subprocess.SubprocessError): return {'problems': [], 'removed': []}
