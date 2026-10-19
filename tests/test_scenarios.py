"""Task 329: every planned task has its scenarios (Given, When, Then), and each scenario becomes one e2e test named
exactly after it. System 1 writes the scenarios into the task file in a fixed format, reads them back, reads the test
names a run printed, and says "not verified" naming a scenario whose test is missing, failed, was skipped or did not
run on the final code."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import tempfile
import unittest
from pathlib import Path

from gate import scenarios

ADD = {'title': 'Add a note', 'given': 'the list is empty', 'when': 'I write "milk" and choose Add Note', 'then': '"milk" is in the list'}


class FormatTest(unittest.TestCase):
    def test_the_section_has_a_fixed_format_and_reads_back(self):
        text = scenarios.section([ADD, {'title': 'Delete a note', 'given': 'a note "milk"', 'when': 'I choose Delete', 'then': 'the list is empty'}])
        self.assertEqual(text.splitlines()[:6], ['## Scenarios', '', '### Add a note', 'Given the list is empty', 'When I write "milk" and choose Add Note', 'Then "milk" is in the list'])
        task = '# 002: Notes\n\nKind: code\n\nDone when: Notes work.\n\n- [ ] Red: a test fails.\n\n' + text + '\n## Decisions\n\n'
        self.assertEqual([item['title'] for item in scenarios.parse(task)], ['Add a note', 'Delete a note'])
        self.assertEqual(scenarios.parse(task)[0], ADD)
        self.assertEqual(scenarios.parse('# 002: No scenarios\n\nDone when: x\n'), [])

    def test_clean_takes_the_keyword_off_and_refuses_what_is_missing_or_repeated(self):
        self.assertEqual(scenarios.clean([{'title': ' Add  a note ', 'given': 'Given the list is empty', 'when': 'when I add', 'then': 'THEN it shows'}]),
                         [{'title': 'Add a note', 'given': 'the list is empty', 'when': 'I add', 'then': 'it shows'}])
        for bad in ([{'title': 'x', 'given': 'a', 'when': 'b'}], [{'title': '', 'given': 'a', 'when': 'b', 'then': 'c'}], 'nope', [ADD, dict(ADD)]):
            with self.assertRaises(ValueError): scenarios.clean(bad)
        self.assertEqual(scenarios.clean(None), [])

    def test_code_tasks_that_change_what_the_person_sees_need_a_scenario(self):
        self.assertTrue(scenarios.needed({'kind': 'code', 'files': ['app/templates/pages/index.html', 'tests/']}))
        self.assertTrue(scenarios.needed({'files': ['index.html', 'js/app.mjs']}))
        self.assertTrue(scenarios.needed({'kind': 'code', 'files': ['app/tui.py']}))
        self.assertFalse(scenarios.needed({'kind': 'code', 'files': ['app/logic/notes.py', 'tests/test_logic.py']}))
        self.assertFalse(scenarios.needed({'kind': 'docs', 'files': ['index.html']}))


class RunnerNamesTest(unittest.TestCase):
    def test_the_names_a_run_printed_with_their_result(self):
        node = '✔ Add a note (12.1ms)\n✖ Delete a note (3ms)\n﹣ Export (0.479375ms) # no browser is set up for e2e tests (Playwright is not installed)\n'
        self.assertEqual(scenarios.results(node), {'Add a note': 'passed', 'Delete a note': 'failed', 'Export': 'skipped'})
        tap = 'ok 1 - Add a note\nnot ok 2 - Delete a note\nok 3 - Export # SKIP no browser is set up\n'
        self.assertEqual(scenarios.results(tap), {'Add a note': 'passed', 'Delete a note': 'failed', 'Export': 'skipped'})
        pytest = 'tests/e2e/test_notes.py::test_add_a_note PASSED [ 50%]\ntests/e2e/test_notes.py::NotesTest::test_delete_a_note FAILED [100%]\n'
        self.assertEqual(scenarios.results(pytest), {'test_add_a_note': 'passed', 'test_delete_a_note': 'failed'})
        unit = "test_add_a_note (tests.test_e2e.Notes.test_add_a_note) ... ok\ntest_export (tests.test_e2e.Notes.test_export)\nSaves a backup. ... skipped 'no browser'\n"
        self.assertEqual(scenarios.results(unit), {'test_add_a_note': 'passed', 'test_export': 'skipped'})
        playwright = '  ✓  1 [chromium] › tests/e2e/notes.spec.js:3:1 › Add a note (1.2s)\n  ✘  2 [chromium] › tests/e2e/notes.spec.js:9:1 › Notes › Delete a note (2.0s)\n'
        self.assertEqual(scenarios.results(playwright), {'Add a note': 'passed', 'Delete a note': 'failed'})

    def test_a_test_name_matches_its_scenario_title_exactly_in_words(self):
        self.assertTrue(scenarios.same('Add a note', 'Add a note'))
        self.assertTrue(scenarios.same('Add a note', 'test_add_a_note'))
        self.assertTrue(scenarios.same('Add a note!', 'add a note'))
        self.assertFalse(scenarios.same('Add a note', 'test_add_a_note_twice'))
        self.assertFalse(scenarios.same('Add a note', 'Add'))


class CheckTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'tests/e2e').mkdir(parents=True)
        (self.root / 'tests/e2e/notes.e2e.test.mjs').write_text("import { test } from 'node:test';\ntest('Add a note', async () => {});\n")
        (self.root / 'tests/e2e/test_more.py').write_text('def test_delete_a_note(page):\n    pass\n')

    def test_each_scenario_needs_its_test_passing_on_the_final_code(self):
        delete = {**ADD, 'title': 'Delete a note'}
        self.assertEqual(scenarios.check(self.root, [ADD, delete], {'Add a note': ('passed', 's'), 'test_delete_a_note': ('passed', 's')}, 's'), [])
        missing = scenarios.check(self.root, [{**ADD, 'title': 'Export the notes'}], {}, 's')
        self.assertEqual(missing, ['scenario “Export the notes” has no e2e test named after it'])
        self.assertEqual(scenarios.check(self.root, [ADD], {}, 's'), ['scenario “Add a note”: its test did not run (run the tests with their names shown)'])
        self.assertEqual(scenarios.check(self.root, [ADD], {'Add a note': ('failed', 's')}, 's'), ['scenario “Add a note”: its test failed'])
        self.assertIn('skipped', scenarios.check(self.root, [ADD], {'Add a note': ('skipped', 's')}, 's')[0])
        self.assertIn('before the last change', scenarios.check(self.root, [ADD], {'Add a note': ('passed', 'old')}, 'new')[0])

    def test_test_definitions_in_javascript_and_python(self):
        names = scenarios.defined(self.root)
        self.assertIn('Add a note', names); self.assertIn('test_delete_a_note', names)


from tests import test_paperwork as paperwork  # noqa: E402  (the module, so its own tests do not run twice)

TEST, git = paperwork.TEST, paperwork.git

COUNT = {'title': 'Count a click', 'given': 'the counter shows 1', 'when': 'I click once', 'then': 'it shows 2'}
VERBOSE = 'test_count_a_click (tests.test_app.A.test_count_a_click) ... ok\ntest_x (tests.test_app.A.test_x) ... ok\n\nRan 2 tests in 0.001s\n\nOK\n'


def commit(root, message):
    git(root, 'add', '-A'); git(root, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', message)


class PaperworkTest(unittest.TestCase):
    real_test = paperwork.PaperworkTest.real_test

    def setUp(self):
        paperwork.PaperworkTest.setUp(self)
        roadmap = self.root / 'ROADMAP.md'; roadmap.write_text(roadmap.read_text().replace('- [ ] [002-', '- [x] [002-'))
        commit(self.root, 'the badge is done')


class PlanScenariosTest(PaperworkTest):
    def plan(self, scenarios, files=('app.py', 'tests/')):
        self.paper.phase(self.root, 'planning')
        self.paper.start('plan', str(self.root), 'Plan a counter')
        task = {'title': 'Count clicks', 'kind': 'code', 'files': list(files), 'done_when': 'A click counts.', 'content': 'Count.'}
        if scenarios is not None: task['scenarios'] = scenarios
        return self.paper.propose_plan('plan', {'goal': 'A counter', 'tasks': [task]})

    def test_the_task_file_gets_its_scenarios_and_the_plan_card_shows_them(self):
        value = self.plan([COUNT])
        self.assertEqual(value['tasks'][0]['title'], 'Count clicks')
        text =(self.root / value['tasks'][0]['path']).read_text()
        self.assertIn('## Scenarios\n\n### Count a click\nGiven the counter shows 1\nWhen I click once\nThen it shows 2\n', text)
        self.assertLess(text.index('- [ ] Green:'), text.index('## Scenarios'), 'after the steps')
        self.assertLess(text.index('## Scenarios'), text.index('## Decisions'))
        self.assertEqual(value['tasks'][0]['scenarios'], [COUNT])

    def test_a_code_task_that_changes_a_page_needs_a_scenario(self):
        with self.assertRaisesRegex(ValueError, 'scenario'): self.plan(None, files=('index.html', 'tests/'))
        self.assertTrue(self.plan([COUNT], files=('index.html', 'tests/'))['tasks'])

    def build(self, scenario_test):
        (self.root / 'tests').mkdir(exist_ok=True); (self.root / 'tests/__init__.py').write_text('')
        extra = '\n    def test_count_a_click(self):\n        self.assertEqual(app.x, 2)\n' if scenario_test else ''
        (self.root / 'tests/test_app.py').write_text('import unittest\nimport app\n\n\nclass A(unittest.TestCase):\n    def test_x(self):\n        self.assertEqual(app.x, 2)\n' + extra)
        commit(self.root, 'tests')
        self.plan([COUNT]); self.paper.pause('plan'); self.paper.start_building(self.root)
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'app.py').write_text('x = 2\n'); self.paper.observe('r')
        self.protocol.record(str(self.root), TEST, False); self.paper.ran('r', TEST, False, 'FAILED (failures=1)')
        output = VERBOSE if scenario_test else VERBOSE.splitlines()[1] + '\n'
        self.protocol.record(str(self.root), TEST, True); self.paper.ran('r', TEST, True, output)
        return self.paper.end('r')

    def test_a_missing_scenario_test_ends_not_verified_naming_it(self):
        result = self.build(scenario_test=False)
        self.assertEqual(result['outcome'], 'not verified')
        self.assertIn('scenario “Count a click” has no e2e test named after it', result['reason'])
        self.assertFalse(result['check_in']['verified']); self.assertIn('Count a click', result['check_in']['reason'])

    def test_a_scenario_test_that_passed_on_the_final_code_verifies_it(self):
        result = self.build(scenario_test=True)
        self.assertEqual(result['outcome'], 'committed', result.get('reason')); self.assertTrue(result['check_in']['verified'])


class ControlRuleTest(PaperworkTest):
    E2E = ("def test_add(page):\n    page.get_by_role('button', name='Add').click()\n\n\n"
           "def test_reset(page):\n    page.get_by_role('button', name='Reset').click()\n")

    def remove_reset(self, with_test):
        (self.root / 'index.html').write_text('<button>Add</button>\n<button>Reset</button>\n')
        (self.root / 'tests/e2e').mkdir(parents=True)
        (self.root / 'tests/e2e/test_page_e2e.py').write_text(self.E2E)
        self.real_test(2); commit(self.root, 'page')
        self.paper.start('r', str(self.root), 'Remove the reset button')
        (self.root / 'index.html').write_text('<button>Add</button>\n'); (self.root / 'app.py').write_text('x = 2\n')
        if with_test: (self.root / 'tests/e2e/test_page_e2e.py').write_text(self.E2E.split('\n\n\n')[0] + '\n')
        self.paper.observe('r')
        self.protocol.record(str(self.root), TEST, True); self.paper.ran('r', TEST, True)
        return self.paper.end('r')

    def test_removing_a_button_its_test_still_uses_is_not_verified(self):
        result = self.remove_reset(with_test=False)
        self.assertEqual(result['outcome'], 'not verified')
        self.assertIn('test “test_reset” uses a control that no longer exists: the “Reset” button', result['reason'])

    def test_removing_a_button_with_its_test_is_listed(self):
        result = self.remove_reset(with_test=True)
        self.assertEqual(result['outcome'], 'committed', result.get('reason'))
        self.assertEqual(result['removed'], ['the “Reset” button and its test “test_reset”'])


if __name__ == '__main__':
    unittest.main()
