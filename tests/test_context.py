"""Task 114: a small, chosen context per request instead of the whole project snapshot."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import os
from pathlib import Path
import tempfile
import time
import unittest

from harness.context import build_context
from harness.documents import DocumentStore


class ContextTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'repo'; (self.root / 'tasks').mkdir(parents=True); (self.root / 'harness').mkdir()
        self.store = DocumentStore(Path(self.temp.name) / 'data')
        self.write('ROADMAP.md', '# Repo roadmap\n\n## Goal\n\nShip it.\n\n## Tasks\n\n- [x] [001-Setup](tasks/001-setup.md)\n- [x] Old done item\n- [ ] [007-Queue badge](tasks/007-queue-badge.md)\n- [~] Blocked: waiting on Serve\n')
        self.write('tasks/001-setup.md', '# Setup\n\n- [x] a\n- [x] b\n')
        self.write('tasks/007-queue-badge.md', '# Queue badge\n\n- [x] Read\n- [ ] Fix\n\nDetails about the badge.\n')
        self.write('tasks/008-later.md', '# Later\n\n- [ ] One\n')
        self.write('harness/work_queue.py', 'QUEUE = []\n' * 20)
        self.write('harness/other.py', 'OTHER = 1\n')
        self.write('notes.md', '# Notes\n\nSee [the queue](harness/work_queue.py).\n')
        old = time.time() - 7200
        for path in self.root.rglob('*'):
            if path.is_file(): os.utime(path, (old, old))
        self.project = self.store.register(str(self.root), 'Repo')

    def write(self, name, text):
        (self.root / name).parent.mkdir(parents=True, exist_ok=True); (self.root / name).write_text(text)

    def build(self, request, **options):
        return build_context(self.store, self.project, request, **options)

    def test_plan_is_compressed_to_headings_and_open_work(self):
        result = self.build('What next?')
        self.assertIn('# Repo roadmap', result['text']); self.assertIn('## Tasks', result['text'])
        self.assertIn('- [ ] [007-Queue badge](tasks/007-queue-badge.md)', result['text']); self.assertIn('- [~] Blocked: waiting on Serve', result['text'])
        self.assertNotIn('Old done item', result['text']); self.assertIn('2 done', result['text'])
        self.assertIn('tasks/007-queue-badge.md 1/2', result['text']); self.assertIn('tasks/008-later.md 0/1', result['text'])
        self.assertNotIn('tasks/001-setup.md 2/2', result['text'], 'finished tasks are counted, not listed')
        self.assertNotIn('# Later', result['text'], 'task bodies are not sent unless chosen (008 is open but not active)')

    def test_mentioned_files_are_included(self):
        for request in ['Look at harness/other.py', 'Look at other.py', 'Check [this](harness/other.py)']:
            result = self.build(request)
            self.assertIn('OTHER = 1', result['text'], request); self.assertIn('harness/other.py', result['included'], request)
        result = self.build('How is task 7 going?')
        self.assertIn('Details about the badge', result['text']); self.assertIn('tasks/007-queue-badge.md', result['included'])
        for request in ['Yes, do tasks 7 right now.', 'Now do Task #7']:  # the person's own words (2026-10-14)
            kinds = {item.get('path'): item.get('kind') for item in self.build(request)['items']}
            self.assertEqual(kinds.get('tasks/007-queue-badge.md'), 'mentioned', request)
        self.assertNotIn('missing.py', ' '.join(self.build('Open missing.py')['included']))

    def test_current_document_whole_when_small_and_sectioned_when_large(self):
        small = self.build('Tighten this', current=f'projects/{self.project}/notes.md')
        self.assertIn('See [the queue]', small['text'])
        body = '# Big\n\n' + ''.join(f'## Part {n}\n\n' + f'Line {n}. ' * 300 + '\n\n' for n in range(12))
        self.write('big.md', body)
        large = self.build('Tighten this', current=f'projects/{self.project}/big.md', passage='Line 7.')
        self.assertIn('## Part 7', large['text']); self.assertIn('## Part 11', large['text'], 'headings outline')
        self.assertNotIn('Line 3. Line 3.', large['text'], 'other sections stay out')

    def test_auto_selection_fills_remaining_room_in_order(self):
        result = self.build('Tighten this', current=f'projects/{self.project}/notes.md')
        self.assertIn('harness/work_queue.py', result['included'], 'linked from the current document')
        self.assertIn('tasks/007-queue-badge.md', self.build('Anything?')['included'], 'the active task: open with some boxes checked')
        self.write('harness/fresh.py', 'FRESH = 1\n')
        self.assertIn('harness/fresh.py', self.build('Anything?')['included'], 'changed in the last hour')
        self.assertIn('harness/work_queue.py', self.build('Why is the queue slow?')['included'], 'file name shares a word')

    def test_budget_leaves_lower_priority_out_and_says_so(self):
        result = self.build('Look at harness/other.py and harness/work_queue.py', budget=450)
        self.assertLessEqual(len(result['text']), 450 + 400, 'budget plus the footer')
        self.assertIn('harness/other.py', result['included']); self.assertIn('harness/work_queue.py', result['omitted'], 'the second mention no longer fits')
        self.assertIn('Not included', result['text'])

    def test_file_names_only_and_deterministic(self):
        result = self.build('Hello')
        self.assertIn('harness/other.py', result['text']); self.assertNotIn('OTHER = 1', result['text'])
        self.assertEqual(result, self.build('Hello'))

    def test_large_project_stays_small(self):
        for n in range(80):
            self.write(f'tasks/{n + 100:03d}-task-{n}.md', f'# Task {n}\n\n' + '- [x] done\n' * 5 + 'Long body. ' * 200)
        snapshot = len(self.store.snapshot(self.project))
        result = self.build('What is left?')
        self.assertLess(len(result['text']), 16000 + 400)
        self.assertLess(len(result['text']) * 4, snapshot)

    def test_items_name_each_part_with_its_kind_and_count_open_tasks(self):
        """Task 133: the "Pi sees:" line reads these items, in the harness's priority for that kind of request."""
        chat = self.build('Look at harness/other.py')
        self.assertEqual([(item['kind'], item.get('path')) for item in chat['items']][:3], [('plan', 'ROADMAP.md'), ('tasks', None), ('mentioned', 'harness/other.py')])
        self.assertEqual(chat['items'][1]['label'], '2 open tasks'); self.assertEqual(chat['open_tasks'], 2)
        self.assertEqual(chat['items'][0]['label'], 'ROADMAP.md')
        comment = self.build('Tighten this', current=f'projects/{self.project}/notes.md')
        kinds = [(item['kind'], item.get('path')) for item in comment['items']]
        self.assertEqual(kinds[0], ('this file', 'notes.md'), 'comments and whole-file requests: the current file first')
        self.assertIn(('related', 'harness/work_queue.py'), kinds, 'a file the page links to')
        self.assertEqual([path for kind, path in kinds if path and kind != 'tasks'], [comment['items'][0]['path']] + [name for name in comment['included'] if name != 'notes.md'])
        empty = DocumentStore(Path(self.temp.name) / 'other'); bare = Path(self.temp.name) / 'bare'; bare.mkdir()
        self.assertEqual(build_context(empty, empty.register(str(bare), 'Bare'), 'hi')['items'], [], 'nothing from this project')


if __name__ == '__main__':
    unittest.main()
