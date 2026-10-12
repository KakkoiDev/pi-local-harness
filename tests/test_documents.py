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
