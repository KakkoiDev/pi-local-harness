"""Task 362: Gate's phase reply carries the building progress, so the web can draw a checklist of the plan:
each approved task with its state, and the task in progress with its steps (the task file's checkboxes).

Each project is a real git repository with the shared calculator plan; the data folders are scratch."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import unittest

try:
    from test_trustworthy_verification import Base, SUB
except ModuleNotFoundError:
    from tests.test_trustworthy_verification import Base, SUB

TWO = ('tasks/002-add-subtraction.md', 'tasks/003-add-multiply.md')


class PlanProgress(Base):
    files = 'app.py, tests/test_sub.py'

    def states(self, progress):
        return [(t['path'], t['state']) for t in progress['tasks']]

    def test_no_progress_before_a_plan_is_approved(self):
        self.assertIsNone(self.paper.build_progress(self.root))
        self.paper.plan_state(self.root, {'tasks': list(TWO), 'pending': True, 'digest': self.paper.plan_digest(self.root, list(TWO))})
        self.assertIsNone(self.paper.build_progress(self.root), 'a plan waiting for approval is not being built')
        self.assertIsNone(self.paper.phase(self.root)['progress'])

    def test_building_the_first_of_two_tasks(self):
        self.approve(TWO)
        progress = self.paper.phase(self.root)['progress']
        self.assertEqual((progress['total'], progress['current'], progress['finished']), (2, 0, False))
        self.assertEqual(self.states(progress), [(TWO[0], 'in_progress'), (TWO[1], 'next')])
        self.assertEqual([t['title'] for t in progress['tasks']], ['Add subtraction', 'Add multiply'])
        first, second = progress['tasks']
        self.assertEqual(first['steps'], [{'text': 'Red: a test fails for this change.', 'done': False},
                                          {'text': 'Green: the test passes with this change.', 'done': False}])
        self.assertNotIn('steps', second, 'only the task in progress carries its steps')

    def test_a_step_ticked_in_the_task_file_shows_as_done(self):
        self.approve(TWO)
        task = self.root / TWO[0]
        task.write_text(task.read_text().replace('- [ ] Red:', '- [x] Red:'))
        steps = self.paper.build_progress(self.root)['tasks'][0]['steps']
        self.assertEqual([s['done'] for s in steps], [True, False])

    def test_a_step_on_several_lines_is_one_step(self):
        self.approve(TWO)
        task = self.root / TWO[0]
        task.write_text(task.read_text().replace('- [ ] Red: a test fails for this change.',
                                                 '- [ ] Red: a test fails\n  for this change.'))
        steps = self.paper.build_progress(self.root)['tasks'][0]['steps']
        self.assertEqual(steps[0]['text'], 'Red: a test fails for this change.')
        self.assertEqual(len(steps), 2)

    def test_a_task_waiting_for_the_check_in_says_so_and_the_next_is_not_started(self):
        self.approve(TWO)
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'app.py').write_text(SUB)
        self.paper.end('r')
        self.assertTrue(self.paper.plan_state(self.root).get('check_in'))
        self.assertEqual(self.states(self.paper.build_progress(self.root)), [(TWO[0], 'check_in'), (TWO[1], 'next')])

    def test_accepted_anyway_is_done_but_says_so_and_the_next_task_is_in_progress(self):
        self.approve(TWO)
        self.paper.start('r', str(self.root), 'Build the approved task.')
        (self.root / 'app.py').write_text(SUB)
        self.paper.end('r')
        self.paper.accept_task(self.root, 'anyway')
        progress = self.paper.build_progress(self.root)
        self.assertEqual(progress['current'], 1)
        self.assertEqual(self.states(progress), [(TWO[0], 'accepted_anyway'), (TWO[1], 'in_progress')])
        self.assertIn('steps', progress['tasks'][1])

    def test_a_finished_plan_shows_every_task_done(self):
        self.approve(TWO)
        plan = self.paper.plan_state(self.root)
        plan.update(index=1, finished=True, check_in=False)
        self.paper.plan_state(self.root, plan)
        progress = self.paper.build_progress(self.root)
        self.assertTrue(progress['finished'])
        self.assertEqual([t['state'] for t in progress['tasks']], ['done', 'done'])
        self.assertTrue(all('steps' not in t for t in progress['tasks']))

    def test_a_task_file_outside_the_project_is_refused(self):
        self.approve(TWO)
        plan = self.paper.plan_state(self.root)
        plan['tasks'] = ['../outside.md']
        self.paper.plan_state(self.root, plan)
        with self.assertRaises(ValueError):
            self.paper.build_progress(self.root)


if __name__ == '__main__':
    unittest.main()
