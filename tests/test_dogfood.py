"""Task 330: the testing protocols the harness gives generated apps, applied to Pi Workbench's own development
(tests/dogfood.py, run by tests/verify_workflow.py). Each check is shown failing on a small repository that breaks it."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
from pathlib import Path
import subprocess
import sys
import tempfile
import textwrap
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dogfood  # noqa: E402

STORIES = """\
story('US-310', 'the counter shows one after I press Add', async t => {});
story('US-311', `a ${kind} project opens its chat`, async t => {});
"""
TERMINAL = "test('US-100 terminal: /plan shows the phase', async t => {});\n"


def write(root, files):
    for name, text in files.items():
        path = Path(root) / name; path.parent.mkdir(parents=True, exist_ok=True); path.write_text(textwrap.dedent(text))


def repo(root, task, done=False, number=330, extra=None):
    write(root, {'ROADMAP.md': f"- [{'x' if done else ' '}] [{number}-T](tasks/{number}-t.md)\n",
                 f'tasks/{number}-t.md': task, 'tests/browser/stories.cjs': STORIES, 'tests/harness/stories.test.mjs': TERMINAL,
                 **(extra or {})})
    return Path(root)


def scenario(heading, given='Given an empty counter', when='When I press Add', then='Then it shows 1'):
    return f'### {heading}\n{given}\n{when}\n{then}\n'


class ScenarioStoryTest(unittest.TestCase):
    def check(self, task, **kw):
        with tempfile.TemporaryDirectory() as directory:
            return dogfood.check_scenarios(repo(directory, task, **kw))

    def test_a_scenario_named_after_its_story_passes(self):
        task = '# 330: T\n\nKind: code\n\n- [ ] Red\n\n## Scenarios\n\n' + scenario('US-310 the counter shows one after I press Add')
        self.assertEqual(self.check(task), [])

    def test_a_terminal_story_and_a_template_title_match_too(self):
        task = ('# 330: T\n\nKind: code\n\n## Scenarios\n\n' + scenario('US-100 terminal: /plan shows the phase')
                + '\n' + scenario('US-311 a terminal project opens its chat'))
        self.assertEqual(self.check(task), [])

    def test_a_new_code_task_without_scenarios_fails(self):
        problems = self.check('# 330: T\n\nKind: code\n\n- [ ] Red\n')
        self.assertEqual(len(problems), 1); self.assertIn('tasks/330-t.md', problems[0]); self.assertIn('## Scenarios', problems[0])
        self.assertIn('No scenarios:', problems[0])

    def test_no_scenarios_with_a_reason_passes_and_other_kinds_need_none(self):
        self.assertEqual(self.check('# 330: T\n\nKind: code\nNo scenarios: only the repository checks change.\n'), [])
        self.assertEqual(self.check('# 330: T\n\nKind: docs\n'), [])

    def test_older_tasks_are_grandfathered_unless_they_have_scenarios(self):
        self.assertEqual(self.check('# 120: T\n\nKind: code\n', number=120), [])
        problems = self.check('# 120: T\n\nKind: code\n\n## Scenarios\n\n' + scenario('US-999 nothing like it'), number=120)
        self.assertEqual(len(problems), 1); self.assertIn('US-999', problems[0])

    def test_a_scenario_without_a_story_id_fails(self):
        problems = self.check('# 330: T\n\nKind: code\n\n## Scenarios\n\n' + scenario('the counter shows one after I press Add'))
        self.assertEqual(len(problems), 1); self.assertIn('starts with its story id', problems[0])

    def test_a_missing_story_fails(self):
        problems = self.check('# 330: T\n\nKind: code\n\n## Scenarios\n\n' + scenario('US-319 a story nobody wrote'))
        self.assertEqual(len(problems), 1); self.assertIn('no story US-319', problems[0]); self.assertIn('stories.cjs', problems[0])

    def test_a_story_with_other_words_fails_and_quotes_both(self):
        problems = self.check('# 330: T\n\nKind: code\n\n## Scenarios\n\n' + scenario('US-310 the counter shows two'))
        self.assertEqual(len(problems), 1)
        self.assertIn('the counter shows two', problems[0]); self.assertIn('the counter shows one after I press Add', problems[0])

    def test_a_scenario_missing_a_step_fails(self):
        problems = self.check('# 330: T\n\nKind: code\n\n## Scenarios\n\n### US-310 the counter shows one after I press Add\nGiven x\nWhen y\n')
        self.assertEqual(len(problems), 1); self.assertIn('Then', problems[0])

    def test_us_new_is_allowed_while_open_and_refused_once_done(self):
        task = '# 330: T\n\nKind: code\n\n- [x] Red\n\n## Scenarios\n\n' + scenario('US-new the counter resets')
        self.assertEqual(self.check(task), [])
        problems = self.check(task, done=True)
        self.assertEqual(len(problems), 1); self.assertIn('US-new', problems[0]); self.assertIn('write its story', problems[0])


UI = """\
<!doctype html><body>
<button id="add">Add</button>
<button id="reset">Reset</button>
<div id="menu-file"><button data-command="new-file">New File</button></div>
<a href="/help">Help</a>
</body>
"""
JS = "const b=button('Retry Task',()=>go());\nconst link2=link('Open Log',()=>log());\n"
E2E = """\
await page.locator('#add').click();
await page.locator('#menu-file [data-command="new-file"]').click();
await page.getByRole('link',{name:'Help'}).click();
await page.getByRole('button',{name:'Retry Task'}).click();
await page.getByText('Open Log').click();
"""


class ControlCoverageTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(); self.root = Path(self.directory.name)
        write(self.root, {'index.html': UI, 'js/a.mjs': JS, 'tests/browser/chat.cjs': E2E})

    def tearDown(self): self.directory.cleanup()

    def test_the_index_lists_static_and_rendered_controls_and_which_are_covered(self):
        found = dogfood.ui_controls(self.root)
        for key in ('#add', '#reset', '[data-command=new-file]', 'link:help', 'button:retry task', 'link:open log'):
            self.assertIn(key, found)
        self.assertEqual(dogfood.uncovered(self.root), ['#reset'])

    def test_a_baseline_lists_todays_gaps_so_the_check_starts_green(self):
        dogfood.write_controls_baseline(self.root)
        self.assertEqual(dogfood.check_controls(self.root)[0], [])

    def test_a_new_control_without_an_e2e_step_fails(self):
        dogfood.write_controls_baseline(self.root)
        write(self.root, {'index.html': UI.replace('</body>', '<button id="undo">Undo</button>\n</body>')})
        problems = dogfood.check_controls(self.root)[0]
        self.assertEqual(len(problems), 1); self.assertIn('#undo', problems[0]); self.assertIn('no e2e step', problems[0])

    def test_a_control_removed_while_a_test_uses_it_fails(self):
        dogfood.write_controls_baseline(self.root)
        write(self.root, {'index.html': UI.replace('<button id="add">Add</button>', '')})
        problems = dogfood.check_controls(self.root)[0]
        self.assertTrue(any('#add' in line and 'no longer exists' in line and 'chat.cjs' in line for line in problems), problems)

    def test_a_removed_rendered_control_is_caught_by_its_name(self):
        dogfood.write_controls_baseline(self.root)
        write(self.root, {'js/a.mjs': "const link2=link('Open Log',()=>log());\n"})
        problems = dogfood.check_controls(self.root)[0]
        self.assertTrue(any('Retry Task' in line and 'no longer exists' in line for line in problems), problems)

    def test_a_baseline_control_that_got_its_test_must_leave_the_baseline(self):
        dogfood.write_controls_baseline(self.root)
        write(self.root, {'tests/browser/chat.cjs': E2E + "await page.locator('#reset').click();\n"})
        problems = dogfood.check_controls(self.root)[0]
        self.assertEqual(len(problems), 1); self.assertIn('#reset', problems[0]); self.assertIn('remove it from', problems[0])

    def test_a_control_removed_with_its_test_is_listed_as_removed(self):
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        subprocess.run(['git', '-C', str(self.root), '-c', 'user.name=t', '-c', 'user.email=t@t', 'add', '-A'], check=True)
        dogfood.write_controls_baseline(self.root)
        subprocess.run(['git', '-C', str(self.root), 'add', '-A'], check=True)
        subprocess.run(['git', '-C', str(self.root), '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'x'], check=True)
        write(self.root, {'index.html': UI.replace('<button id="add">Add</button>', ''),
                          'tests/browser/chat.cjs': E2E.replace("await page.locator('#add').click();\n", '')})
        problems, notes = dogfood.check_controls(self.root)
        self.assertEqual(problems, []); self.assertTrue(any('Removed' in note and '#add' in note for note in notes), notes)

    def test_absence_checks_can_name_a_gone_control_when_listed(self):
        write(self.root, {'tests/browser/chat.cjs': E2E + "assert.equal(await page.locator('#old-sidebar').count(),0);\n"})
        dogfood.write_controls_baseline(self.root)
        self.assertEqual(dogfood.check_controls(self.root)[0], [])
        self.assertIn('absent #old-sidebar', (self.root / dogfood.CONTROLS_BASELINE).read_text())


class FlakyLintTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(); self.root = Path(self.directory.name)
        write(self.root, {'tests/browser/a.cjs': "await page.waitForTimeout(500);\nawait page.locator('#x').waitFor();\n"})

    def tearDown(self): self.directory.cleanup()

    def test_the_rules_find_sleeps_networkidle_and_real_hosts(self):
        write(self.root, {'tests/browser/b.cjs': "await page.goto('https://example.com');\nawait page.waitForLoadState('networkidle');\n"
                                                 "await new Promise(r => setTimeout(r, 200));\n"})
        messages = ' '.join(hit[1] for hit in dogfood.flaky_hits(self.root))
        for word in ('fixed wait', 'real host', 'networkidle', 'timer'): self.assertIn(word, messages)

    def test_baselined_hits_pass_and_a_new_one_fails(self):
        dogfood.write_flaky_baseline(self.root)
        self.assertEqual(dogfood.check_flaky(self.root), [])
        write(self.root, {'tests/browser/a.cjs': "await page.waitForTimeout(500);\nawait page.waitForTimeout(100);\n"})
        problems = dogfood.check_flaky(self.root)
        self.assertTrue(any('a.cjs:2' in line and 'waitForTimeout(100)' in line for line in problems), problems)

    def test_a_fixed_hit_must_leave_the_baseline(self):
        dogfood.write_flaky_baseline(self.root)
        write(self.root, {'tests/browser/a.cjs': "await page.locator('#x').waitFor();\n"})
        problems = dogfood.check_flaky(self.root)
        self.assertEqual(len(problems), 1); self.assertIn('remove it from', problems[0])

    def test_an_allow_comment_with_a_reason_keeps_a_wait(self):
        write(self.root, {'tests/browser/a.cjs': "await page.waitForTimeout(500); /* flaky-lint: allow the animation has no end event */\n"})
        self.assertEqual(dogfood.flaky_hits(self.root), [])


class WorkflowGateTest(unittest.TestCase):
    def test_verify_workflow_fails_on_a_new_code_task_without_scenarios(self):
        with tempfile.TemporaryDirectory() as directory:
            root = repo(directory, '# 330: T\n\nKind: code\n\n- [ ] Red\n')
            write(root, {'tests/test_ok.py': 'import unittest\nclass T(unittest.TestCase):\n    def test_ok(self): pass\n'})
            script = Path(__file__).resolve().parent / 'verify_workflow.py'
            done = subprocess.run([sys.executable, str(script)], cwd=root, capture_output=True, text=True, timeout=120)
            self.assertEqual(done.returncode, 1, done.stdout + done.stderr)
            self.assertIn('tasks/330-t.md: a code task needs a `## Scenarios` section', done.stdout)


if __name__ == '__main__':
    unittest.main()
