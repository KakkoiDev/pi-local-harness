from pathlib import Path
import tempfile
import unittest
from harness.documents import DocumentStore, DocumentConflict

class DocumentTest(unittest.TestCase):
    def test_pages_are_real_markdown_with_revision_checks(self):
        with tempfile.TemporaryDirectory() as directory:
            store=DocumentStore(Path(directory))
            page=store.create('Demo project','Plan')
            saved=store.save(page['path'],'# Plan\n\n- [ ] Build it\n',page['revision'])
            self.assertEqual((Path(directory)/page['path']).read_text(),saved['markdown'])
            with self.assertRaises(DocumentConflict):store.save(page['path'],'stale edit',page['revision'])
            self.assertEqual(store.get(page['path'])['markdown'],saved['markdown'])
            self.assertEqual(store.list()[0]['project'],'Demo project')
    def test_containment_and_external_agent_edits(self):
        with tempfile.TemporaryDirectory() as directory, tempfile.TemporaryDirectory() as outside:
            root=Path(directory);store=DocumentStore(root);page=store.create('Project','Notes')
            for path in ['../secret.md','/etc/passwd','chats/log.md']:
                with self.assertRaises(ValueError):store.get(path)
            (root/'projects'/'escape').symlink_to(outside,target_is_directory=True)
            with self.assertRaises(ValueError):store.get('projects/escape/secret.md')
            (root/page['path']).write_text('# Edited by agent\n')
            with self.assertRaises(DocumentConflict):store.save(page['path'],'overwrite',page['revision'])
            self.assertEqual(store.get(page['path'])['title'],'Edited by agent')
    def test_comments_are_explicit_context_and_can_be_resolved(self):
        with tempfile.TemporaryDirectory() as directory:
            store=DocumentStore(Path(directory));page=store.create('Project','Plan')
            store.save(page['path'],'# Plan\n\nBuild it\n',page['revision'])
            comment=store.comment(page['path'],'Add the Japanese audio task','Build it')
            self.assertFalse(comment['resolved'])
            prompt=store.comment_prompt(page['path'],comment['id'])
            self.assertIn('Add the Japanese audio task',prompt)
            self.assertIn(str(Path(directory)/page['path']),prompt)
            self.assertIn('Build it',prompt)
            store.resolve(page['path'],comment['id'],True)
            with self.assertRaisesRegex(ValueError,'resolved'):store.comment_prompt(page['path'],comment['id'])
            self.assertEqual(store.get(page['path'])['comments'][0]['resolved'],True)
            store.delete(page['path'])
            self.assertEqual(store.list(),[])
            self.assertTrue(list((Path(directory)/'.trash').rglob('*.md')))
    def test_suggested_change_is_applied_or_kept(self):
        with tempfile.TemporaryDirectory() as directory:
            store=DocumentStore(Path(directory));page=store.create('Project','Plan')
            page=store.save(page['path'],'# Plan\n\nBuild it\n\nShip it\n',page['revision'])
            first=store.comment(page['path'],'Tighten','Build it');second=store.comment(page['path'],'Rewrite','Ship it')
            self.assertIn('"replacement"',store.comment_prompt(page['path'],first['id']))
            with self.assertRaisesRegex(ValueError,'no suggested change'):store.apply_suggestion(page['path'],first['id'],page['revision'])
            comments=store.comments(page['path'])
            comments[0]['suggestion']={'anchor':'Build it','replacement':'Build it twice'};comments[1]['suggestion']={'anchor':'Ship it','replacement':'Ship it now'}
            store.write_comments(page['path'],comments)
            self.assertIn('Build it twice',store.sidecar(page['path']).read_text())
            with self.assertRaises(DocumentConflict):store.apply_suggestion(page['path'],first['id'],'stale')
            applied=store.apply_suggestion(page['path'],first['id'],page['revision'])
            self.assertEqual(applied['markdown'],'# Plan\n\nBuild it twice\n\nShip it\n')
            entry=applied['comments'][0];self.assertTrue(entry['resolved']);self.assertRegex(entry['suggestion']['applied'],r'^\d{4}-')
            with self.assertRaisesRegex(ValueError,'already'):store.apply_suggestion(page['path'],first['id'],applied['revision'])
            kept=store.keep_suggestion(page['path'],second['id'])
            self.assertFalse(kept['resolved']);self.assertRegex(kept['suggestion']['kept'],r'^\d{4}-')
            with self.assertRaisesRegex(ValueError,'already'):store.apply_suggestion(page['path'],second['id'],applied['revision'])
            self.assertEqual(store.get(page['path'])['markdown'],applied['markdown'])
            third=store.comment(page['path'],'Again','Ship it');comments=store.comments(page['path'])
            comments[2]['suggestion']={'anchor':'Not in the page','replacement':'x'};store.write_comments(page['path'],comments)
            with self.assertRaisesRegex(ValueError,'no longer'):store.apply_suggestion(page['path'],third['id'],applied['revision'])
            comments[2]['suggestion']={'anchor':'Ship it','replacement':42};store.write_comments(page['path'],comments)
            with self.assertRaisesRegex(ValueError,'no suggested change'):store.keep_suggestion(page['path'],third['id'])
    def test_unsent_comments_soft_delete_and_restore(self):
        with tempfile.TemporaryDirectory() as directory:
            store=DocumentStore(Path(directory));page=store.create('Project','Plan')
            store.save(page['path'],'# Plan\n\nBuild it\n\nShip it\n',page['revision'])
            comment=store.comment(page['path'],'Too vague','Build it')
            deleted=store.delete_comment(page['path'],comment['id'],True)
            self.assertRegex(deleted['deleted'],r'^\d{4}-\d\d-\d\dT')
            kept=store.get(page['path'])['comments']
            self.assertEqual([item['id'] for item in kept],[comment['id']])
            self.assertTrue(kept[0]['deleted'])
            self.assertIn('Deleted · ',store.sidecar(page['path']).read_text())
            with self.assertRaisesRegex(ValueError,'deleted'):store.comment_prompt(page['path'],comment['id'])
            self.assertIsNone(store.delete_comment(page['path'],comment['id'],False)['deleted'])
            store.comment_prompt(page['path'],comment['id'])
            sent=store.comment(page['path'],'Ship when green','Ship it');store.mark_sent(page['path'],sent['id'],'chat-1')
            with self.assertRaisesRegex(ValueError,'sent to Pi'):store.delete_comment(page['path'],sent['id'],True)
            with self.assertRaisesRegex(ValueError,'not found'):store.delete_comment(page['path'],'missing',True)
    def test_project_scoped_snapshot_and_live_code(self):
        with tempfile.TemporaryDirectory() as directory:
            store=DocumentStore(Path(directory));first=store.create_project('First');store.create_project('Second')
            code=Path(directory)/'projects'/first/'main.py';code.write_text('print("hello")\n')
            read=store.read_file('projects/First/main.py')
            store.save_file(read['path'],'print("updated")\n',read['revision'])
            self.assertIn('updated',store.read_file(read['path'])['text'])
            snapshot=store.snapshot(first)
            self.assertIn('ROADMAP.md',snapshot);self.assertIn('001-first-task.md',snapshot)
            self.assertNotIn('Second',snapshot)
    def test_existing_folders_can_be_projects_without_moving_files(self):
        with tempfile.TemporaryDirectory() as directory, tempfile.TemporaryDirectory() as external:
            root=Path(directory);outside=Path(external);(outside/'notes.md').write_text('# Existing notes\n')
            store=DocumentStore(root);project=store.register(external,'External project')
            self.assertEqual(store.register(external),project)
            self.assertEqual(store.project_path(project),outside.resolve())
            self.assertEqual(store.get(f'projects/{project}/notes.md')['title'],'Existing notes')
            page=store.create(project,'New page')
            self.assertTrue((outside/'New page.md').exists())
            self.assertEqual(DocumentStore(root).project_path(project),outside.resolve())
            with self.assertRaises(ValueError):store.get(f'projects/{project}/../outside.md')

    def test_text_comments_have_verified_anchors_and_markdown_threads(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);store=DocumentStore(root);page=store.create('Project','Plan')
            store.save(page['path'],'# Plan\n\nBuild the app carefully.\n',page['revision'])
            comment=store.comment(page['path'],'Add tests','Build the app')
            record=store.sidecar(page['path']);self.assertEqual(record.suffix,'.md')
            self.assertIn('Add tests',record.read_text());self.assertIn('Build the app',record.read_text())
            with self.assertRaisesRegex(ValueError,'anchor|Select'):store.comment(page['path'],'Invalid','not in the document')
            store.reply(page['path'],comment['id'],'Also test Japanese')
            self.assertEqual(store.get(page['path'])['comments'][0]['replies'][-1]['text'],'Also test Japanese')
            self.assertEqual(DocumentStore(root).get(page['path'])['comments'][0]['anchor'],'Build the app')

    def test_a_thread_is_one_conversation_and_follow_up_answers_are_appended(self):
        with tempfile.TemporaryDirectory() as directory:
            store=DocumentStore(Path(directory));page=store.create('Project','Plan')
            store.save(page['path'],'# Plan\n\nBuild it\n',page['revision'])
            entry=store.comment(page['path'],'hello','Build it')
            store.agent_result(page['path'],entry['id'],'Hello! How can I help?')
            store.reply(page['path'],entry['id'],'Checking if this works')
            prompt=store.comment_prompt(page['path'],entry['id'])
            self.assertLess(prompt.index('Hello! How can I help?'),prompt.index('Checking if this works'),'the prompt reads the thread in order')
            self.assertIn('Answer the latest message',prompt)
            store.agent_result(page['path'],entry['id'],'It works.',previous='Hello! How can I help?')
            thread=store.get(page['path'])['comments'][0]['replies']
            self.assertEqual([(item['author'],item['text']) for item in thread],[('pi','Hello! How can I help?'),('you','Checking if this works'),('pi','It works.')])
            self.assertEqual(store.get(page['path'])['comments'][0]['agent_reply'],'It works.','the latest answer')

    def test_an_answer_pi_writes_itself_is_kept_and_old_threads_read_in_order(self):
        import json
        with tempfile.TemporaryDirectory() as directory:
            store=DocumentStore(Path(directory));page=store.create('Project','Plan')
            store.save(page['path'],'# Plan\n\nBuild it\n',page['revision'])
            entry=store.comment(page['path'],'hello','Build it')
            # before this change: the answer in agent_reply only, replies with no author, one written after the request was sent
            comments=store.comments(page['path']);comments[0].update(agent_reply='Old answer',sent_at='2026-10-13T23:23:00+09:00',replies=[{'text':'Later note','created':'2026-10-13T23:24:00+09:00'}])
            store.write_comments(page['path'],comments)
            self.assertEqual([(item['author'],item['text']) for item in store.get(page['path'])['comments'][0]['replies']],[('pi','Old answer'),('you','Later note')])
            raw=store.comments(page['path'],raw=True);raw[0]['agent_reply']='Written by Pi itself';store.write_comments(page['path'],raw)
            store.agent_result(page['path'],entry['id'],'Final message text',previous='Old answer')
            self.assertEqual([item['text'] for item in store.get(page['path'])['comments'][0]['replies']],['Old answer','Later note','Written by Pi itself'])

    def test_legacy_comments_migrate_and_ambiguous_quotes_are_rejected(self):
        import json
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);store=DocumentStore(root);page=store.create('Project','Plan')
            record=store.sidecar(page['path']);legacy=record.with_suffix('.json')
            legacy.write_text(json.dumps([{'id':'old','anchor':'Plan','text':'Legacy note','created':'today','resolved':False,'agent_reply':''}]))
            self.assertEqual(store.get(page['path'])['comments'][0]['text'],'Legacy note');self.assertTrue(record.exists());self.assertFalse(legacy.exists())
            page=store.get(page['path']);store.save(page['path'],'# Plan\n\nBuild once. Build twice.\n',page['revision'])
            with self.assertRaisesRegex(ValueError,'more than once'):store.comment(page['path'],'Which one?','Build')
            with self.assertRaisesRegex(ValueError,'Select'):store.comment(page['path'],'No selection','')
            store.agent_result(page['path'],'old','Verified outcome')
            self.assertIn('Verified outcome',record.read_text())


class NewFileAndTaskTest(unittest.TestCase):
    """New File… takes any name (Markdown by default); New Task… numbers the task and links it in the roadmap (task 109)."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.store = DocumentStore(Path(self.temp.name) / 'data')
        parent = Path(self.temp.name) / 'code'; parent.mkdir()
        self.project = self.store.create_project('Demo', str(parent)); self.root = parent / 'Demo'

    def test_file_names_default_to_markdown_and_keep_other_extensions(self):
        self.assertEqual(self.store.create_file(self.project, 'notes')['path'], f'projects/{self.project}/notes.md')
        self.assertEqual((self.root / 'notes.md').read_text(), '# notes\n\n')
        self.assertEqual(self.store.create_file(self.project, 'script.py')['path'], f'projects/{self.project}/script.py')
        self.assertEqual((self.root / 'script.py').read_text(), '')
        self.assertEqual(self.store.create_file(self.project, 'docs/plan.md')['path'], f'projects/{self.project}/docs/plan.md')
        self.assertTrue((self.root / 'docs/plan.md').is_file())

    def test_file_names_cannot_escape_or_overwrite(self):
        for name in ['../outside.md', '/etc/x.md', 'a/../../b.md', '', '   ', '.git/config']:
            with self.assertRaises(ValueError, msg=name): self.store.create_file(self.project, name)
        self.store.create_file(self.project, 'once.md')
        with self.assertRaises(ValueError): self.store.create_file(self.project, 'once.md')
        self.assertFalse((Path(self.temp.name) / 'code' / 'outside.md').exists())

    def test_files_rename_and_move_inside_the_project_with_their_comments(self):
        path = self.store.create_file(self.project, 'notes.md')['path']
        self.store.save(path, '# notes\n\nKeep this line.\n', self.store.get(path)['revision'])
        self.store.comment(path, 'Why?', 'Keep this line.')
        moved = self.store.move(path, 'docs/ideas.md')['path']
        self.assertEqual(moved, f'projects/{self.project}/docs/ideas.md')
        self.assertFalse((self.root / 'notes.md').exists()); self.assertTrue((self.root / 'docs/ideas.md').is_file())
        self.assertEqual([c['text'] for c in self.store.comments(moved)], ['Why?'])
        self.assertEqual(self.store.comments(path), [])
        script = self.store.create_file(self.project, 'run.py')['path']
        self.assertEqual(self.store.move(script, 'tools/run')['path'], f'projects/{self.project}/tools/run.py', 'no extension keeps the old one')

    def test_moves_cannot_escape_or_overwrite(self):
        path = self.store.create_file(self.project, 'a.md')['path']; self.store.create_file(self.project, 'b.md')
        for name in ['../outside.md', '/etc/x.md', 'x/../../y.md', '', '.git/config', 'b.md']:
            with self.assertRaises(ValueError, msg=name): self.store.move(path, name)
        self.assertTrue((self.root / 'a.md').is_file())

    def test_folders_rename_move_and_trash_with_their_files_and_comments(self):
        path = self.store.create_file(self.project, 'docs/notes.md')['path']
        self.store.save(path, '# notes\n\nKeep this line.\n', self.store.get(path)['revision']); self.store.comment(path, 'Why?', 'Keep this line.')
        self.assertEqual(self.store.move(f'projects/{self.project}/docs', 'archive/old-docs')['path'], f'projects/{self.project}/archive/old-docs')
        moved = f'projects/{self.project}/archive/old-docs/notes.md'
        self.assertTrue((self.root / 'archive/old-docs/notes.md').is_file()); self.assertFalse((self.root / 'docs').exists())
        self.assertEqual([c['text'] for c in self.store.comments(moved)], ['Why?'])
        with self.assertRaises(ValueError): self.store.move(f'projects/{self.project}/archive', 'archive/inner')
        with self.assertRaises(ValueError): self.store.delete(f'projects/{self.project}')
        self.store.delete(f'projects/{self.project}/archive')
        self.assertFalse((self.root / 'archive').exists())

    def test_any_project_file_moves_to_the_trash(self):
        script = self.store.create_file(self.project, 'run.py')['path']
        self.store.delete(script)
        self.assertFalse((self.root / 'run.py').exists())
        self.assertEqual(len(list((Path(self.temp.name) / 'data/.trash').iterdir())), 1)

    def test_tasks_take_the_next_number_a_template_and_a_roadmap_line(self):
        created = self.store.create_task(self.project, 'Phone layouts')
        self.assertEqual(created['path'], f'projects/{self.project}/tasks/002-phone-layouts.md')
        self.assertEqual((self.root / 'tasks/002-phone-layouts.md').read_text(),
                         '# Phone layouts\n\nKind: code\n\n- [ ] Define the outcome\n- [ ] Implement\n- [ ] Verify\n')
        self.assertTrue((self.root / 'ROADMAP.md').read_text().endswith('- [ ] Define the first task\n- [ ] [002-Phone layouts](tasks/002-phone-layouts.md)\n'))
        (self.root / 'tasks/041-later.md').write_text('# Later\n')
        self.assertEqual(self.store.create_task(self.project, 'Ünïcode & symbols!')['path'], f'projects/{self.project}/tasks/042-ünïcode-symbols.md')


class PlanFilesTest(unittest.TestCase):
    """The Files window's Plan group needs checkbox progress and a Create Roadmap action (task 97)."""
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.store = DocumentStore(Path(self.temp.name) / 'data')
        self.root = Path(self.temp.name) / 'folder'; (self.root / 'tasks').mkdir(parents=True)
        self.project = self.store.register(str(self.root), 'Folder')

    def entry(self, name):
        return next(item for item in self.store.files(self.project) if item['name'] == name)

    def test_plan_files_carry_checkbox_progress_and_blocked(self):
        (self.root / 'ROADMAP.md').write_text('# R\n\n- [x] a\n- [ ] b\n- [~] c\n')
        (self.root / 'tasks/001-a.md').write_text('# A\n\n- [x] one\n- [x] two\n')
        (self.root / 'tasks/002-b.md').write_text('# B\n\n- [ ] one\n- [~] Blocked: waiting on Serve\n')
        (self.root / 'tasks/003-c.md').write_text('# C\n\nNo boxes.\n')
        (self.root / 'notes.md').write_text('- [x] not a plan file\n')
        self.assertEqual({k: self.entry('ROADMAP.md')[k] for k in ('done', 'total', 'blocked')}, {'done': 1, 'total': 3, 'blocked': False})
        self.assertEqual({k: self.entry('tasks/001-a.md')[k] for k in ('done', 'total', 'blocked')}, {'done': 2, 'total': 2, 'blocked': False})
        self.assertEqual(self.entry('tasks/002-b.md')['blocked'], True)
        self.assertEqual(self.entry('tasks/003-c.md')['total'], 0)
        self.assertNotIn('total', self.entry('notes.md'))

    def test_create_roadmap_scaffolds_only_what_is_missing(self):
        (self.root / 'tasks').rmdir(); (self.root / 'keep.txt').write_text('mine')
        created = self.store.create_roadmap(self.project)
        self.assertEqual(created['path'], f'projects/{self.project}/ROADMAP.md')
        self.assertTrue((self.root / 'ROADMAP.md').is_file()); self.assertTrue((self.root / 'tasks/001-first-task.md').is_file())
        self.assertEqual((self.root / 'keep.txt').read_text(), 'mine')
        (self.root / 'ROADMAP.md').write_text('# Mine\n')
        with self.assertRaises(ValueError): self.store.create_roadmap(self.project)
        self.assertEqual((self.root / 'ROADMAP.md').read_text(), '# Mine\n')
