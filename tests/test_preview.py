"""Plan 198, the preview (design/briefs/app-preview.md): the harness runs the project's app so the person sees it beside
the chat. It knows how to start a project on the stack and a plain site, says what state it is in, and when the app
stops by itself, says why (the last lines it printed)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.request
from pathlib import Path

from harness.preview import Previews, run_command
from harness.web_chat import WebChat, preview_lines


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

    def test_a_project_with_no_app_says_so_and_says_what_it_is(self):
        status = self.previews.start('notes', self.folder('notes', {'README.md': '# Notes'}))
        self.assertEqual(status['state'], 'none')
        self.assertIn('no app', status['message'])
        program = self.previews.start('tool', self.folder('tool', {'pyproject.toml': '[project]\nname="tool"\n', 'tool.py': ''}))
        self.assertEqual((program['state'], program['kind']), ('none', 'notweb'), 'P_NotWeb: a project that is not an app')
        self.assertIn('Python program', program['message'])
        self.assertEqual(self.previews.status('tool', self.root / 'tool')['kind'], 'notweb', 'the state says so before any start')

    def test_the_first_start_is_marked_and_shows_its_last_line(self):
        slow = self.folder('slow', {'index.html': ''})
        previews = Previews(self.root / 'previews3', command=lambda folder, port: [sys.executable, '-c', 'import time; print("Installed 29 packages", flush=True); time.sleep(30)'])
        self.addCleanup(previews.close)
        (slow / 'pyproject.toml').write_text('[project]\nname="slow"\n')
        status = previews.start('slow', slow)
        self.assertTrue(status['first'], 'no .venv yet: the first start installs (about 15 seconds)')
        deadline = time.monotonic() + 5
        while 'last' not in previews.status('slow') and time.monotonic() < deadline: time.sleep(0.1)
        self.assertEqual(previews.status('slow')['last'], 'Installed 29 packages')

    def test_a_change_leaves_a_note_with_its_time(self):
        site = self.folder('site', {'index.html': 'x'})
        self.previews.start('site', site); wait(self.previews, 'site', ('running',))
        self.previews.note('site', 'Pi changed 2 files. Reloaded.')
        note = self.previews.status('site')['note']
        self.assertEqual(note['text'], 'Pi changed 2 files. Reloaded.'); self.assertRegex(note['time'], r'^\d\d:\d\d$')
        self.previews.note('other', 'ignored: not running')
        self.assertNotIn('note', self.previews.status('other'))

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

    def test_an_app_that_holds_its_port_but_answers_nothing_is_stopped_with_its_lines(self):
        # uvicorn --reload: the reloader keeps the port while the app inside has crashed (an import error).
        hang = self.folder('hang', {'index.html': ''})
        script = ('import socket, sys, time\n'
                  'print("Traceback (most recent call last):"); print("ModuleNotFoundError: No module named \'markdown\'", flush=True)\n'
                  'server = socket.socket(); server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); server.bind(("127.0.0.1", int(sys.argv[1]))); server.listen()\n'
                  'time.sleep(60)\n')
        previews = Previews(self.root / 'previews4', command=lambda folder, port: [sys.executable, '-c', script, str(port)], limit=60)
        self.addCleanup(previews.close)
        previews.start('hang', hang)
        status = wait(previews, 'hang', ('stopped',), limit=10)
        self.assertEqual(status['state'], 'stopped', 'the port is open, no page comes back, and its last line is an error: no need to wait the 60 s')
        self.assertIn("No module named 'markdown'", status['error'])
        self.assertIsNone(previews.apps['hang'].process.poll(), 'the reloader still runs: a fix starts the app again by itself')
        old = previews.apps['hang'].process
        previews.start('hang', hang)
        self.assertIsNotNone(old.wait(timeout=10), 'Start Again ends the hanging process before starting a new one')

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
        self.assertEqual(chat.preview(project, 'status'), {'state': 'none', 'kind': 'app'}, 'an app, not started: the Preview may open by itself once')
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


class AskPiToFixTest(unittest.TestCase):
    def test_a_message_from_the_preview_carries_the_apps_last_lines(self):
        lines = [f'line {n}' for n in range(12)]
        self.assertEqual(preview_lines({'origin': 'preview', 'lines': lines}), lines[-8:])
        self.assertEqual(preview_lines({'lines': lines}), [], 'only from the Preview')
        self.assertEqual(preview_lines({'origin': 'preview', 'lines': 'nope'}), [])


if __name__ == '__main__':
    unittest.main()
