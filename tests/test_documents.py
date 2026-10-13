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
