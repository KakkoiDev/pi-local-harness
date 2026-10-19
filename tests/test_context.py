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

    def test_a_code_task_with_scenarios_brings_the_e2e_recipe_card(self):
        """Task 329: the task in progress has scenarios: Pi gets kit/cards/e2e-scenarios.md with it."""
        self.assertNotIn('Scenarios become e2e tests', self.build('Build task 7', task='tasks/007-queue-badge.md')['text'])
        self.write('tasks/007-queue-badge.md', '# 007: Queue badge\n\nKind: code\n\n- [ ] Red: a test fails.\n\n## Scenarios\n\n### See the count\nGiven two jobs\nWhen I open the page\nThen the badge says 2\n\n## Decisions\n\n')
        text = self.build('Build task 7', task='tasks/007-queue-badge.md')['text']
        self.assertIn('Scenarios become e2e tests', text); self.assertIn('named exactly after its title', text)

    def test_a_code_task_brings_the_test_protocol_card(self):
        """Task 332: every code task gets kit/cards/test-core.md (SCENARIOS.md, the browser helper, test-core's checks)."""
        self.assertNotIn('The test protocol, for Pi', self.build('Build task 7', task='tasks/007-queue-badge.md')['text'])
        self.write('tasks/007-queue-badge.md', '# 007: Queue badge\n\nKind: code\nNo scenarios: an internal change.\n\n- [ ] Red: a test fails.\n')
        text = self.build('Build task 7', task='tasks/007-queue-badge.md')['text']
        self.assertIn('The test protocol, for Pi', text); self.assertIn('SCENARIOS.md', text)
        self.write('tasks/007-queue-badge.md', '# 007: Queue badge\n\nKind: planning\n\n- [ ] Plan it.\n')
        self.assertNotIn('The test protocol, for Pi', self.build('Build task 7', task='tasks/007-queue-badge.md')['text'])

    def test_pong_context_keeps_rules_and_relevant_code_without_generated_files(self):
        self.write('README.md','# Rules\nKeep the skeleton working.\n')
        self.write('js/app.mjs','export const ballSpeed = 3; // the ball crosses the screen\n')
        for name in ['vendor/basecoat/LICENSE.md','vendor/app.mjs','node_modules/ball.mjs','.venv/ball.py','dist/ball.js','static/app.css','uv.lock','LICENSE.md']:
            self.write(name,'ball speed')
        self.write('large-ball.txt','ball speed '*5000);self.write('ball.bin','ball\0speed')
        result=self.build('make the ball faster')
        self.assertTrue({'README.md','ROADMAP.md','tasks/007-queue-badge.md','js/app.mjs'} <= set(result['included']))
        self.assertFalse(any(name in result['text'] for name in ['vendor/','LICENSE','uv.lock','large-ball.txt','ball.bin','dist/ball.js','static/app.css']))
        self.assertEqual(set(result['reasons']),set(result['included']))
        self.assertEqual(result['reasons']['README.md'],'Project rules')
        item=next(item for item in result['items'] if item.get('path')=='README.md')
        self.assertEqual(item['full_path'],str((self.root/'README.md').resolve()))
        self.write('js/app.mjs','export const clock = 3;\n');self.write('js/ball.mjs','export const ballSpeed = 4;\n')
        again=self.build('make the ball faster')
        self.assertIn('js/ball.mjs',again['included']);self.assertNotIn('js/app.mjs',again['included'])

    def test_task_paths_and_last_harness_commit_join_the_selection(self):
        import subprocess
        self.write('README.md','# Rules\n');self.write('js/logic/ball.mjs','export const speed=3;\n')
        self.write('tasks/007-queue-badge.md','# Queue badge\n- [x] Read\n- [ ] Fix\nFiles: js/logic/ball.mjs\n')
        self.write('unrelated.py','x=1\n')
        def git(*args):return subprocess.run(['git','-C',str(self.root),*args],capture_output=True,text=True,check=True).stdout
        git('init','-q');git('add','.');git('-c','user.name=Pi Workbench','-c','user.email=pi@localhost','commit','-qm','Verified request')
        self.write('unrelated.py','x=2\n');git('add','unrelated.py');git('-c','user.name=Person','-c','user.email=person@localhost','commit','-qm','Own edit')
        result=self.build('continue task 7')
        self.assertIn('js/logic/ball.mjs',result['included'])
        self.assertEqual(result['reasons']['js/logic/ball.mjs'],'Listed by the current task')
        self.assertIn('unrelated.py',result['included'])
        self.assertEqual(result['reasons']['unrelated.py'],'Last harness commit')


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
        self.assertIn('harness/fresh.py', self.build('check fresh.py')['included'], 'named in this request')
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


    def test_secrets_licences_build_output_and_ignored_files_never_reach_the_context(self):
        """Task 263 (review 13): .env values, keys, licences, build and cache folders were sent as relevant contents."""
        import subprocess
        key = 'sk-live-FAKEKEY-263-do-not-send'
        secrets = {'.env': f'API_KEY={key}\n', '.env.local': f'API_KEY={key}\n', 'config/.env.production': f'API_KEY={key}\n',
                   'secrets/id_rsa': f'-----BEGIN KEY----- {key}\n', 'certs/server.pem': key, 'certs/server.key': key, 'COPYING': key,
                   'LICENCE.txt': key, 'NOTICE': key, 'THIRD_PARTY_NOTICES.md': key, 'target/debug/api.rs': key, 'out/api.js': key,
                   'venv/lib/api.py': key, 'env/lib/api.py': key, '.tox/py/api.py': key, '.mypy_cache/api.json': key,
                   'pytest_cache/api.txt': key, 'third_party/api/api.py': key, 'private/notes.md': key}
        for name, text in secrets.items(): self.write(name, text)
        self.write('.gitignore', 'private/\n')
        self.write('api.py', 'def api_key():\n    return load("API_KEY")\n')
        subprocess.run(['git', 'init', '-q', str(self.root)], check=True)
        result = self.build('Why does the api key not load? Check .env and secrets/id_rsa')
        self.assertNotIn(key, result['text'])
        self.assertIn('api.py', result['included'])
        excluded = {item['name']: item['reason'] for item in result['excluded']}
        self.assertTrue(set(secrets) <= set(excluded), set(secrets) - set(excluded))
        self.assertEqual(excluded['.env'], 'Private (environment file)')
        self.assertEqual(excluded['secrets/id_rsa'], 'Private (key)')
        self.assertEqual(excluded['COPYING'], 'Licence or notice')
        self.assertEqual(excluded['target/debug/api.rs'], 'Build, cache or environment folder')
        self.assertEqual(excluded['private/notes.md'], 'Ignored by .gitignore')
        for name in ['.env', 'secrets/id_rsa', 'COPYING', 'private/notes.md']:
            self.assertNotIn(name + '\n', result['text'], 'not even listed by name')

if __name__ == '__main__':
    unittest.main()
