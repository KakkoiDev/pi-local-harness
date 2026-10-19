"""Task 329 (plan 328, the E2E rule): System 1 lists the app's user-facing controls (buttons, links, fields, by role
and name, label, id or data-testid) in its pages and templates, and which e2e tests use them. At the end of a request:
a control removed while a test still uses it, or a new control no e2e test uses, is "not verified"; a control removed
together with its test is allowed and listed on the check-in."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import subprocess
import tempfile
import unittest
from pathlib import Path

from gate import controls

TEMPLATE = '''<form id="note-form" hx-post="/notes">
  <label class="label" for="title">{{ t("notes.title") }}</label>
  <input class="input" id="title" name="title" value="{{ title }}"{% if problems %} aria-invalid="true"{% endif %}>
  <button class="btn">{{ t("notes.add") }}</button>
</form>
<li id="note-{{ note.id }}"><span>{{ note.title }}</span><button hx-delete="/notes/{{ note.id }}">{{ t("notes.delete") }}</button></li>
<a href="/help">Help</a>
<a href="/notes/{{ note.id }}">{{ note.title }}</a>
<button data-testid="export">{{ t("backup.export") }}</button>
<label class="btn"><span>Restore a Backup…</span><input id="import" type="file"></label>
<input type="hidden" name="csrf" value="x">
'''
MESSAGES = {'notes.title': 'New note', 'notes.add': 'Add Note', 'notes.delete': 'Delete', 'backup.export': 'Save a Backup'}


def git(root, *args):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, check=True).stdout


class ControlsTest(unittest.TestCase):
    def test_controls_in_a_jinja_template_by_role_and_name_label_and_test_id(self):
        found = controls.controls({'app/templates/pages/index.html': TEMPLATE}, MESSAGES)
        described = sorted(controls.describe(item) for item in found.values())
        self.assertEqual(described, sorted(['the “New note” field', 'the “Add Note” button', 'the “Delete” button', 'the “Help” link',
                                            'the “Save a Backup” button', 'the “Restore a Backup…” field']))
        self.assertIn('testid:export', found, 'a data-testid names the control')

    def test_static_html_names_come_from_the_text(self):
        found = controls.controls({'index.html': '<button class="btn" data-t="notes.add">Add Note</button><button aria-label="Close">×</button>'}, {})
        self.assertEqual(sorted(found), ['button:add note', 'button:close'])

    def test_the_tests_that_use_a_control_in_javascript_and_python(self):
        js = ("import { test } from 'node:test';\nconst open = page => page.goto(base);\n"
              "test('Add a note', async () => { await page.getByLabel('New note').fill('milk'); await page.getByRole('button', { name: 'Add Note' }).click(); });\n"
              "test('Export', async () => { await page.getByTestId('export').click(); });\n")
        py = 'def test_delete_a_note(page):\n    page.get_by_role("button", name="Delete", exact=True).click()\n    page.locator("#import")\n'
        tests = controls.tests({'tests/e2e/notes.e2e.test.mjs': js, 'tests/e2e/test_notes.py': py, 'tests/test_logic.py': 'def test_x():\n    assert 1\n'})
        self.assertEqual(sorted(name for _, name in tests), ['Add a note', 'Export', 'test_delete_a_note'], 'unit tests are not e2e tests')
        found = controls.controls({'app/templates/pages/index.html': TEMPLATE}, MESSAGES)
        using = lambda key: sorted(name for (_, name), refs in tests.items() if controls.uses(refs, found[key]))
        self.assertEqual(using('button:add note'), ['Add a note'])
        self.assertEqual(using('textbox:new note'), ['Add a note'])
        self.assertEqual(using('button:delete'), ['test_delete_a_note'])
        self.assertEqual(using('testid:export'), ['Export'])
        self.assertEqual(using('file:restore a backup…'), ['test_delete_a_note'], 'by its id')
        self.assertEqual(using('link:help'), [])


class CompareTest(unittest.TestCase):
    """The end-of-request check, on a real repository: HEAD is before the request, the working tree after it."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'tests/e2e').mkdir(parents=True)
        self.page('<button>Add Note</button>\n<button>Reset</button>\n')
        self.e2e(add=True, reset=True)
        git(self.root, 'init', '-q'); git(self.root, 'add', '-A'); git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'start')

    def page(self, body): (self.root / 'index.html').write_text('<!doctype html><title>Notes</title>\n' + body)

    def e2e(self, add=False, reset=False, extra=''):
        body = "import { test } from 'node:test';\n"
        if add: body += "test('Add a note', async () => { await page.getByRole('button', { name: 'Add Note' }).click(); });\n"
        if reset: body += "test('Reset the notes', async () => { await page.getByRole('button', { name: 'Reset' }).click(); });\n"
        (self.root / 'tests/e2e/notes.e2e.test.mjs').write_text(body + extra)

    def test_nothing_changed_nothing_to_say(self):
        self.assertEqual(controls.check(self.root), {'problems': [], 'removed': []})

    def test_a_control_removed_while_a_test_still_uses_it_is_not_verified(self):
        self.page('<button>Add Note</button>\n')
        self.assertEqual(controls.check(self.root)['problems'], ['test “Reset the notes” uses a control that no longer exists: the “Reset” button'])

    def test_a_control_removed_with_its_test_is_allowed_and_listed(self):
        self.page('<button>Add Note</button>\n'); self.e2e(add=True)
        self.assertEqual(controls.check(self.root), {'problems': [], 'removed': ['the “Reset” button and its test “Reset the notes”']})

    def test_a_new_control_needs_an_e2e_step(self):
        self.page('<button>Add Note</button>\n<button>Reset</button>\n<a href="/help">Help</a>\n')
        self.assertEqual(controls.check(self.root)['problems'], ['the “Help” link has no e2e step'])
        self.e2e(add=True, reset=True, extra="test('Open the help', async () => { await page.getByRole('link', { name: 'Help' }).click(); });\n")
        self.assertEqual(controls.check(self.root)['problems'], [])

    def test_a_project_without_e2e_tests_is_not_checked(self):
        (self.root / 'tests/e2e/notes.e2e.test.mjs').unlink(); git(self.root, 'rm', '-q', '--cached', 'tests/e2e/notes.e2e.test.mjs')
        git(self.root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'no e2e')
        self.page('<button>Add Note</button>\n<a href="/help">Help</a>\n')
        self.assertEqual(controls.check(self.root), {'problems': [], 'removed': []})


if __name__ == '__main__':
    unittest.main()
