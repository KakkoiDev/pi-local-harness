"""Plan 198, the preview (design/briefs/app-preview.md): the harness runs the project's app so the person sees it beside
the chat. It knows how to start a project on the stack and a plain site, says what state it is in, and when the app
stops by itself, says why (the last lines it printed)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import sys
import tempfile
import time
import unittest
import urllib.request
from pathlib import Path

from harness.preview import Previews, run_command
from harness.web_chat import WebChat


def wait(previews, project, states, limit=15):
    deadline = time.monotonic() + limit
    while time.monotonic() < deadline:
        status = previews.status(project)
        if status['state'] in states: return status
        time.sleep(0.1)
    return previews.status(project)


class PreviewTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.previews = Previews(self.root / 'previews'); self.addCleanup(self.previews.close)

    def folder(self, name, files):
        folder = self.root / name
        for path, text in files.items(): (folder / path).parent.mkdir(parents=True, exist_ok=True); (folder / path).write_text(text)
        return folder

    def test_the_run_command_depends_on_the_kind_of_project(self):
        stack = self.folder('stack', {'pyproject.toml': '[project]\nname="app"\n', 'app/main.py': ''})
        command = run_command(stack, 4000)
        self.assertEqual((Path(command[0]).name, *command[1:4]), ('uv', 'run', 'uvicorn', 'app.main:app'))
        self.assertIn('--reload', command); self.assertEqual(command[-2:], ['--port', '4000'])
        (stack / 'styles').mkdir(); (stack / 'styles' / 'input.css').write_text('@import "tailwindcss";')
        shell = run_command(stack, 4000)[-1]
        self.assertIn('tailwindcss -i styles/input.css -o static/app.css && {', shell, 'the styles are built before the first page')
        self.assertIn('tailwindcss -i styles/input.css -o static/app.css --watch=always &', shell, 'then follow the templates')
        self.assertIn('exec ', shell); self.assertIn('app.main:app', shell)
        site = self.folder('site', {'index.html': '<h1>Hi</h1>'})
        self.assertEqual(run_command(site, 4000)[1:4], ['-m', 'http.server', '4000'])
        self.assertIsNone(run_command(self.folder('notes', {'README.md': '# Notes'}), 4000))
        styled = self.folder('styled', {'index.html': '', 'styles/input.css': '@import "tailwindcss";'})
        shell = run_command(styled, 4000)[-1]
        self.assertIn('--from pytailwindcss tailwindcss -i styles/input.css -o static/app.css && {', shell, 'a no-server app gets its styles too')
        self.assertIn('http.server 4000', shell)

    def test_a_project_with_no_app_says_so(self):
        status = self.previews.start('notes', self.folder('notes', {'README.md': '# Notes'}))
        self.assertEqual(status['state'], 'none')
        self.assertIn('no app', status['message'])

    def test_a_plain_site_starts_answers_and_stops(self):
        site = self.folder('site', {'index.html': '<h1>Hello preview</h1>'})
        self.assertEqual(self.previews.start('site', site)['state'], 'starting')
        status = wait(self.previews, 'site', ('running', 'stopped'))
        self.assertEqual(status['state'], 'running', status)
        self.assertTrue(status['url'].startswith('http://127.0.0.1:'))
        with urllib.request.urlopen(status['url'], timeout=5) as response: self.assertIn('Hello preview', response.read().decode())
        self.assertEqual(self.previews.start('site', site)['url'], status['url'], 'starting a running app keeps it')
        self.previews.stop('site')
        self.assertEqual(self.previews.status('site')['state'], 'none')

    def test_an_app_that_exits_is_stopped_with_its_last_lines(self):
        crash = self.folder('crash', {'index.html': ''})
        previews = Previews(self.root / 'previews2', command=lambda folder, port: [sys.executable, '-c', 'import sys; print("starting"); sys.exit("ImportError: no module named app")'])
        self.addCleanup(previews.close)
        previews.start('crash', crash)
        status = wait(previews, 'crash', ('stopped',))
        self.assertEqual(status['state'], 'stopped')
        self.assertIn('ImportError: no module named app', status['error'])
        self.assertTrue((self.root / 'previews2' / 'crash.log').is_file(), 'the full output is kept')

    def test_close_stops_every_app(self):
        site = self.folder('site', {'index.html': 'x'})
        self.previews.start('site', site); wait(self.previews, 'site', ('running',))
        process = self.previews.apps['site'].process
        self.previews.close()
        self.assertIsNotNone(process.poll())


class WorkbenchPreviewTest(unittest.TestCase):
    def test_the_workbench_starts_reports_and_stops_a_projects_app(self):
        temp = tempfile.TemporaryDirectory(); self.addCleanup(temp.cleanup); root = Path(temp.name)
        chat = WebChat(root / 'chats', 1, 2, data_root=root / 'data'); self.addCleanup(chat.close)
        code = root / 'code'; code.mkdir()
        project = chat.documents.create_project('Site', str(code))
        (code / 'Site' / 'index.html').write_text('<h1>Hi</h1>')
        self.assertEqual(chat.preview(project, 'status'), {'state': 'none'})
        self.assertEqual(chat.preview(project, 'start')['state'], 'starting')
        self.assertEqual(wait(chat.previews, project, ('running',))['state'], 'running')
        self.assertTrue((root / 'data' / '.previews' / f'{project}.log').is_file(), 'logs live in the data folder')
        self.assertEqual(chat.preview(project, 'stop'), {'state': 'none'})
        self.assertEqual(chat.preview(None, 'start', cwd=str(code / 'Site' / 'sub'))['state'], 'starting', "Pi's browser names the folder it works in")
        self.assertEqual(wait(chat.previews, project, ('running',))['state'], 'running')
        chat.preview(project, 'stop')
        with self.assertRaises(ValueError): chat.preview(None, 'start', cwd=str(root))
        with self.assertRaises(ValueError): chat.preview(project, 'explode')
        with self.assertRaises(ValueError): chat.preview('../etc', 'start')


if __name__ == '__main__':
    unittest.main()
