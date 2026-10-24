"""Task 368: authoritative execution facts survive file selection and phase changes."""
import isolation  # noqa: F401
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from types import SimpleNamespace
import unittest
from harness.web_chat import WebChat
from harness.execution_context import execution_brief

class ExecutionContextTest(unittest.TestCase):
    def test_gate_state_and_existing_packages_are_explicit_and_refresh(self):
        with TemporaryDirectory() as directory:
            base=Path(directory);chat=WebChat(base/'chats',12345,3000,data_root=base/'data');self.addCleanup(chat.close)
            project=chat.documents.create_project('App');root=chat.documents.project_path(project)
            (root/'packaging.json').write_text(json.dumps({'packages':['static','phone'],'capabilities':['multiplayer']}))
            (root/'tasks/003-map.md').write_text('# 003: Map\n\nKind: code\nFiles: js/app.mjs, tests/\nDone when: A map works.\n')
            state={'phase':'implementation','pending':False,'finished':False,'tasks':[{'path':'tasks/003-map.md','title':'Map','done_when':'A map works.'}],'progress':{'tasks':[{'path':'tasks/003-map.md','state':'in_progress'}]}}
            chat.ledger=SimpleNamespace(paperwork=SimpleNamespace(requests={},phase=lambda _:dict(state)))
            result=chat.turn_context({'cwd':str(root),'text':'Build the approved task.'})
            brief=result['execution'];self.assertIn('Current phase: implementation',brief);self.assertIn('tasks/003-map.md',brief);self.assertIn('js/app.mjs',brief);self.assertIn('static',brief);self.assertIn('multiplayer',brief);self.assertIn('React Native',brief)
            state.update(phase='discussion',progress=None)
            again=chat.turn_context({'cwd':str(root),'text':'Explain it'})['execution'];self.assertIn('Current phase: discussion',again);self.assertNotIn('Active approved task: tasks/003-map.md',again)
            self.assertEqual(state['phase'],'discussion')

    def test_check_in_and_unavailable_state_do_not_grant_a_build(self):
        with TemporaryDirectory() as directory:
            root=Path(directory);(root/'tasks').mkdir();(root/'tasks/001.md').write_text('Files: app.py\n')
            brief=execution_brief(root,{'phase':'implementation','progress':{'tasks':[{'path':'tasks/001.md','state':'check_in'}]}})
            self.assertIn('Wait for the explicit check-in',brief)
            self.assertIn('Do not infer write permission',execution_brief(root,{}))

    def test_external_task_and_manifest_are_not_read(self):
        with TemporaryDirectory() as directory, TemporaryDirectory() as outside:
            root=Path(directory);secret=Path(outside)/'secret';secret.write_text('SECRET_CONTENT')
            (root/'packaging.json').symlink_to(secret)
            brief=execution_brief(root,{'phase':'implementation','progress':{'tasks':[{'path':str(secret),'state':'in_progress'}]}})
            self.assertIn('Approved task file unavailable',brief);self.assertNotIn('SECRET_CONTENT',brief)

if __name__=='__main__': unittest.main()
