"""Plan policy is shared by terminal and web through Gate, never guessed independently in JavaScript."""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import unittest
from gate.planning import approval, requires_plan, file_allowed


class PlanningPolicyTest(unittest.TestCase):
    def test_project_defining_requests_and_small_fixes(self):
        for text in ['Build a pong game', 'Add a scoring screen', 'Create a new timer', 'スコア画面を追加して', 'Plan this change']:
            self.assertTrue(requires_plan(text, first=True), text)
        for text in ['Fix the crash', 'Rename the label', 'Correct a typo', 'バグを修正して']:
            self.assertFalse(requires_plan(text, first=True), text)
        self.assertFalse(requires_plan('Make the count blue', task='# Count\n## Progress (kept by the harness)\n- [x] Started'))
        self.assertTrue(requires_plan('Add a scoreboard', task='# Count\n## Progress (kept by the harness)\n- [x] Started'))
        self.assertFalse(requires_plan('Explain this code', first=True))
        self.assertTrue(requires_plan('Make it work', first=True))
        self.assertFalse(requires_plan('Make it work', small_fix=True))
        self.assertTrue(requires_plan('Plan this change', small_fix=True), 'the person can overrule a small-fix declaration')

    def test_only_a_complete_approval_reply_counts(self):
        for text in ['yes', 'Go!', ' ok. ', 'approve', 'はい', 'お願いします。', 'Approve Plan', '計画を承認']:
            self.assertTrue(approval(text), text)
        for text in ['yes but change the speed', 'not ok', 'maybe', 'approve this after tests', '']:
            self.assertFalse(approval(text), text)

    def test_optional_file_scope_cannot_escape_the_active_task(self):
        self.assertTrue(file_allowed('# Task\n', 'app.py'))
        task='# Task\nFiles: src/, tests/test_game.py\n'
        for path in ['src/game.py','src/ui/screen.js','tests/test_game.py']:
            self.assertTrue(file_allowed(task,path),path)
        for path in ['src-other/game.py','tests/test_other.py','../src/game.py','/src/game.py']:
            self.assertFalse(file_allowed(task,path),path)
