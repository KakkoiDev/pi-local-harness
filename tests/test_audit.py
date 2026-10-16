"""Task 231: publication checks use files and command results, never Pi's claim."""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from harness import audit


class AuditTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);(self.root/'js').mkdir();(self.root/'static').mkdir();(self.root/'tasks').mkdir()
        (self.root/'index.html').write_text('<script type="module" src="js/app.mjs"></script>')
        (self.root/'js/app.mjs').write_text("import {ball} from './ball.mjs'; ball();\n")
        (self.root/'js/ball.mjs').write_text('export function ball() {}\nexport function unused() {}\n')
        (self.root/'js/leftover.mjs').write_text('export function leftover() {}\n')
        (self.root/'README.md').write_text('# Pong\nA ball game.\n')
        (self.root/'manifest.webmanifest').write_text(json.dumps({'name':'Pong','short_name':'Pong','icons':[]}))
        (self.root/'ROADMAP.md').write_text('# Pong\n## Goal\nBuild a game.\n## Tasks\n- [ ] [Ball](tasks/001-ball.md)\n')
        (self.root/'tasks/001-ball.md').write_text('# Ball\n- [ ] Bounce\nDone when: The ball bounces.\n')

    def test_unreached_file_and_unimported_export_are_named(self):
        result=audit.inspect(self.root)
        self.assertEqual(result['unreached'],['js/leftover.mjs'])
        self.assertIn('js/ball.mjs: unused',result['unused_exports'])
        self.assertNotIn('js/ball.mjs: ball',result['unused_exports'])

    def test_audit_task_is_added_once_and_stays_last_as_work_is_added(self):
        task=audit.ensure_task(self.root);self.assertTrue(task.endswith('-ready-to-publish.md'))
        self.assertEqual(audit.ensure_task(self.root),task)
        with (self.root/'ROADMAP.md').open('a') as file:file.write('- [ ] [More](tasks/003-more.md)\n')
        audit.ensure_task(self.root)
        lines=(self.root/'ROADMAP.md').read_text().splitlines()
        self.assertIn(task,lines[-1]);self.assertEqual(sum('-ready-to-publish.md)' in line for line in lines),1)
        self.assertIn('Done when:',(self.root/task).read_text())

    def test_a_failed_command_keeps_its_box_open_and_test_evidence_is_logged(self):
        (self.root/'tsconfig.json').write_text('{}')
        (self.root/'js/leftover.mjs').unlink();(self.root/'js/ball.mjs').write_text('export function ball() {}\n')
        audit.ensure_task(self.root)
        def run(argv,**options):
            from subprocess import CompletedProcess
            return CompletedProcess(argv,1 if 'tsc' in argv else 0,'ℹ pass 2\nℹ fail 0\n','')
        with patch('harness.audit.subprocess.run',side_effect=run):result=audit.run(self.root,self.root/'data')
        checks={item['key']:item for item in result['checks']}
        self.assertFalse(checks['types']['passed']);self.assertTrue(checks['tests']['passed'])
        from gate.test_runs import read
        self.assertTrue(any(row['counts'].get('pass')==2 for row in read(self.root/'data')))
        self.assertIn('- [ ] Types:',(self.root/result['task']).read_text())
        self.assertFalse(result['ready'])

    def test_new_project_roadmap_ends_with_an_audit_and_starts_clean(self):
        from harness.documents import DocumentStore
        import subprocess
        store=DocumentStore(self.root/'data');project=store.create_project('Game')
        root=store.project_path(project)
        self.assertIn('-ready-to-publish.md)',(root/'ROADMAP.md').read_text().splitlines()[-1])
        self.assertEqual(subprocess.run(['git','-C',str(root),'status','--porcelain'],capture_output=True,text=True).stdout,'')

    def test_new_work_reopens_a_completed_audit(self):
        task=audit.ensure_task(self.root)
        for file in [self.root/'ROADMAP.md',self.root/task]:file.write_text(file.read_text().replace('- [ ]','- [x]'))
        with (self.root/'ROADMAP.md').open('a') as file:file.write('- [ ] [More](tasks/003-more.md)\n')
        audit.ensure_task(self.root,reset=True)
        self.assertIn('- [ ] [Ready to publish]',(self.root/'ROADMAP.md').read_text())
        self.assertNotIn('- [x]',(self.root/task).read_text())

    def test_description_checks_names_and_starter_leftovers(self):
        self.assertEqual(audit.description(self.root),[])
        (self.root/'manifest.webmanifest').write_text('{"name":"Notes"}')
        self.assertTrue(any('starter' in line for line in audit.description(self.root)))
        (self.root/'manifest.webmanifest').write_text('{"name":"Other"}')
        self.assertTrue(any('consistent' in line for line in audit.description(self.root)))

    def test_python_entry_reaches_templates_and_static_url_for_assets(self):
        (self.root/'app/templates').mkdir(parents=True)
        (self.root/'app/__init__.py').write_text('')
        (self.root/'app/main.py').write_text("from app.routes import page\n")
        (self.root/'app/routes.py').write_text("template = 'page.html'\n")
        (self.root/'app/templates/page.html').write_text("<link href=\"{{ url_for('static', path='site.css') }}\">")
        (self.root/'static/site.css').write_text('body {color:black}')
        result=audit.inspect(self.root)
        self.assertNotIn('static/site.css',result['unreached'])
        self.assertNotIn('app/__init__.py',result['unreached'])

    def test_terminal_launcher_module_is_reached_and_license_is_a_document(self):
        (self.root/'app').mkdir();(self.root/'app/__init__.py').write_text('')
        (self.root/'serve.py').write_text('command = "python -m app.tui"')
        (self.root/'app/tui.py').write_text('')
        (self.root/'static/htmx.LICENSE').write_text('License')
        self.assertNotIn('app/tui.py',audit.inspect(self.root)['unreached'])
        self.assertNotIn('static/htmx.LICENSE',audit.inspect(self.root)['unreached'])

    def test_a_removed_roadmap_link_reuses_the_existing_audit_file(self):
        task=audit.ensure_task(self.root)
        file=self.root/'ROADMAP.md';file.write_text('\n'.join(line for line in file.read_text().splitlines() if task not in line)+'\n')
        self.assertEqual(audit.ensure_task(self.root),task)
        self.assertEqual(len(list((self.root/'tasks').glob('*-ready-to-publish.md'))),1)
