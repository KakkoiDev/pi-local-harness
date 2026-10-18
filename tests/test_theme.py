"""Task 312, the theme panel: the block in styles/input.css, the person's Save and Undo, the request System 1 answers
itself, the Preview helper's refusals, and the fonts (every fetch mocked: no test touches the network)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import http.client
import http.server
import json
import shutil
import subprocess
import tempfile
import threading
import unittest
from pathlib import Path

from harness import theme, undo
from harness.preview import Frame, HELPER_PATH, inject
from harness.theme_fonts import Fonts, fetch, parse_catalogue
from harness.web_chat import WebChat, WebHandler

STARTER = '@import "tailwindcss";\n@import "../vendor/basecoat/css/basecoat.css";\n@source "../app/templates";\n\n/* my own rule */\n.note { color: var(--primary); }\n'


def project(root, css=STARTER):
    (root / 'styles').mkdir(parents=True, exist_ok=True); (root / 'styles' / 'input.css').write_text(css, encoding='utf-8')
    subprocess.run(['git', 'init', '-q', str(root)], check=True)
    for key, value in (('user.name', 'Ada'), ('user.email', 'ada@example.com')): subprocess.run(['git', '-C', str(root), 'config', key, value], check=True)
    subprocess.run(['git', '-C', str(root), 'add', '-A'], check=True); subprocess.run(['git', '-C', str(root), 'commit', '-q', '-m', 'Start'], check=True)
    return root


class BlockTest(unittest.TestCase):
    def test_writing_and_removing_the_block_leaves_every_other_line_as_it_was(self):
        block = theme.render({'primary': '#ff0000', 'radius': '1rem'}, {'primary': '#00ff00'})
        written = theme.write_block(STARTER, block)
        self.assertEqual(written.replace('\n' + block + '\n', '', 1), STARTER, 'only the block was added')
        self.assertLess(written.index(theme.START), written.index('@source'), 'right after the imports')
        self.assertGreater(written.index(theme.START), written.index('basecoat.css'))
        found = theme.read_block(written)
        self.assertEqual((found['light'], found['dark']), ({'primary': '#ff0000', 'radius': '1rem'}, {'primary': '#00ff00'}))
        again = theme.write_block(written, theme.render({'primary': '#123456'}, {}))
        self.assertEqual(again.split(theme.START)[0], written.split(theme.START)[0]); self.assertEqual(again.split(theme.END)[1], written.split(theme.END)[1])
        self.assertEqual(theme.write_block(written, None), STARTER, 'removing the block gives the file back exactly')
        self.assertEqual(theme.write_block(STARTER, None), STARTER)

    def test_a_file_it_cannot_follow_is_refused_with_a_plain_message(self):
        broken = {
            'unbalanced': STARTER + '.x { color: red;\n',
            'two blocks': theme.write_block(STARTER, theme.render({'radius': '1rem'}, {})) + theme.START + '\n' + theme.END + '\n',
            'foreign rule': STARTER.replace('@source', theme.START + '\nbody { color: red; }\n' + theme.END + '\n@source'),
            'url value': STARTER.replace('@source', theme.START + '\n:root {\n  --primary: url(x);\n}\n' + theme.END + '\n@source'),
            'unknown token': STARTER.replace('@source', theme.START + '\n:root {\n  --evil: red;\n}\n' + theme.END + '\n@source'),
        }
        for name, text in broken.items():
            with self.subTest(name), self.assertRaises(theme.ThemeFileError) as caught: theme.read_block(text)
            self.assertIn('styles/input.css', str(caught.exception))
        with tempfile.TemporaryDirectory() as folder:
            root = project(Path(folder), broken['unbalanced'])
            found = theme.state(root)
            self.assertFalse(found['available']); self.assertIn('braces do not balance', found['message'])
            with self.assertRaises(theme.ThemeFileError): theme.save(root, {'primary': '#ff0000'})
            self.assertEqual((root / theme.FILE).read_text(), broken['unbalanced'], 'nothing was changed')

    def test_values_are_plain_css_for_allowed_tokens_only(self):
        self.assertIsNone(theme.problem('primary', 'oklch(0.5 0.2 250)')); self.assertIsNone(theme.problem('primary', '#3b82f6'))
        self.assertIsNone(theme.problem('radius', '0.75rem')); self.assertIsNone(theme.problem('spacing', '4px'))
        for token, value in (('primary', 'red; } body { x'), ('primary', 'url(https://x)'), ('radius', '9rem'), ('spacing', 'calc(1px)'), ('nope', '#fff'), ('font-sans', 'x</style>')):
            with self.subTest(token=token, value=value): self.assertIsNotNone(theme.problem(token, value))

    def test_defaults_are_basecoats_light_and_dark_tokens(self):
        found = theme.defaults()
        self.assertEqual(found['light']['primary'], 'oklch(0.205 0 0)'); self.assertEqual(found['dark']['primary'], 'oklch(0.922 0 0)')
        self.assertEqual(found['light']['radius'], '0.625rem'); self.assertEqual(found['light']['spacing'], '0.25rem')
        self.assertTrue(set(found['light']) >= set(theme.COLOUR_TOKENS))


class SaveTest(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory(); self.addCleanup(folder.cleanup)
        self.root = project(Path(folder.name))

    def log(self, *args): return subprocess.run(['git', '-C', str(self.root), 'log', *args], capture_output=True, text=True, check=True).stdout

    def test_save_commits_only_the_changed_tokens_as_the_persons_change_and_undo_takes_it_back(self):
        result = theme.save(self.root, {'primary': '#ff0000', 'radius': '1rem', 'background': theme.defaults()['light']['background']}, {'primary': '#00ff00'})
        self.assertEqual(result['message'], 'Theme saved: primary, radius.')
        text = (self.root / theme.FILE).read_text()
        self.assertIn('--primary: #ff0000;', text); self.assertNotIn('--background', text, 'a value equal to Basecoat’s default is not written')
        self.assertEqual(self.log('-1', '--format=%an|%s').strip(), 'Ada|Theme: primary, radius', 'the person’s own commit')
        self.assertIn(theme.MARK, self.log('-1', '--format=%b'))
        found = undo.preview(self.root, result['commit'])
        self.assertEqual([item['path'] for item in found['files']], [theme.FILE])
        undone = undo.undo(self.root, result['commit'])
        self.assertEqual(undone['outcome'], 'undone'); self.assertEqual((self.root / theme.FILE).read_text(), STARTER)
        self.assertTrue(undo.preview(self.root, undone['commit'])['undo_of'])

    def test_reset_returns_a_token_to_the_default_and_an_empty_block_goes(self):
        theme.save(self.root, {'radius': '1rem'})
        result = theme.save(self.root, {'radius': None})
        self.assertEqual(result['names'], ['radius']); self.assertEqual((self.root / theme.FILE).read_text(), STARTER)
        self.assertTrue(theme.save(self.root, {'radius': None})['unchanged'])

    def test_only_the_persons_commits_marked_as_a_theme_can_be_undone(self):
        (self.root / 'notes.txt').write_text('mine'); subprocess.run(['git', '-C', str(self.root), 'add', '-A'], check=True)
        subprocess.run(['git', '-C', str(self.root), 'commit', '-q', '-m', 'Theme: primary'], check=True)  # the title alone is not the mark
        with self.assertRaises(ValueError): undo.preview(self.root, self.log('-1', '--format=%h').strip())

    def test_the_persons_unsaved_edits_of_the_file_stay_their_own_entry(self):
        (self.root / theme.FILE).write_text(STARTER + '.extra { margin: 0; }\n')
        result = theme.save(self.root, {'radius': '1rem'})
        latest = self.log('-2', '--format=%s').splitlines()
        self.assertEqual(latest[0], 'Theme: radius'); self.assertTrue(latest[1].startswith('Your edits · '), latest)
        self.assertEqual(undo.undo(self.root, result['commit'])['outcome'], 'undone')
        self.assertIn('.extra', (self.root / theme.FILE).read_text(), 'undoing the theme keeps their edit')

    def test_a_project_without_the_starters_css_has_no_theme_file(self):
        with tempfile.TemporaryDirectory() as folder:
            found = theme.state(Path(folder))
            self.assertEqual(found, {'available': False, 'message': 'This project has no theme file.', 'detail': found['detail'], 'path': theme.FILE, 'can_add': True})
            with self.assertRaises(ValueError): theme.save(Path(folder), {'radius': '1rem'})
            (Path(folder) / 'styles').mkdir(); (Path(folder) / theme.FILE).write_text('body { color: red; }\n')
            self.assertFalse(theme.state(Path(folder))['can_add'], 'the project’s own CSS is never replaced')
            with self.assertRaises(ValueError): theme.add_file(Path(folder))
            self.assertEqual((Path(folder) / theme.FILE).read_text(), 'body { color: red; }\n')

    def test_add_a_theme_file_brings_basecoats_defaults_as_one_undoable_change(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder); (root / 'README.md').write_text('mine\n')
            subprocess.run(['git', 'init', '-q', str(root)], check=True)
            for key, value in (('user.name', 'Ada'), ('user.email', 'ada@example.com')): subprocess.run(['git', '-C', str(root), 'config', key, value], check=True)
            subprocess.run(['git', '-C', str(root), 'add', '-A'], check=True); subprocess.run(['git', '-C', str(root), 'commit', '-q', '-m', 'Start'], check=True)
            result = theme.add_file(root)
            self.assertTrue(theme.state(root)['available']); self.assertEqual(theme.state(root)['saved'], {'light': {}, 'dark': {}}, 'Basecoat’s defaults, nothing changed')
            self.assertTrue((root / 'vendor/basecoat/css/basecoat.css').is_file()); self.assertTrue((root / 'vendor/basecoat/LICENSE.md').is_file())
            self.assertEqual(subprocess.run(['git', '-C', str(root), 'log', '-1', '--format=%an|%s'], capture_output=True, text=True).stdout.strip(), 'Ada|Theme: added the theme file')
            with self.assertRaises(ValueError): theme.add_file(root)
            self.assertEqual(undo.undo(root, result['commit'])['outcome'], 'undone')
            self.assertFalse((root / theme.FILE).exists()); self.assertFalse((root / 'vendor/basecoat/css/basecoat.css').exists())
            self.assertEqual((root / 'README.md').read_text(), 'mine\n')

    def test_the_groups_are_the_designers_tabs_and_rows(self):
        self.assertEqual(list(theme.GROUPS), ['colours', 'radius', 'spacing', 'charts', 'fonts'])
        self.assertEqual([theme.GROUPS[key]['title'] for key in theme.GROUPS], ['Colours', 'Radius', 'Spacing', 'Chart', 'Fonts'])
        rows = theme.GROUPS['colours']['rows']
        self.assertEqual([row['label'] for row in rows], ['Primary', 'Secondary', 'Accent', 'Muted', 'Destructive', 'Background', 'Card', 'Border · Input · Ring'])
        self.assertEqual(theme.GROUPS['colours']['shown'], 5, 'in the chat, five rows and “3 more”')
        self.assertEqual((rows[6]['also'], rows[7]['also'], rows[7]['foreground']), (['popover'], ['input'], 'ring'))
        self.assertEqual((theme.GROUPS['spacing']['min'], theme.GROUPS['spacing']['max'], theme.GROUPS['spacing']['step']), (3, 6, 0.5), 'spacing unit 3–6 px in 0.5 steps')
        self.assertIn('sidebar-primary', theme.ALLOWED, 'a block saved before round 12 stays readable')

    def test_pi_hears_about_a_saved_theme(self):
        self.assertEqual(theme.context_note(self.root), '')
        theme.save(self.root, {'primary': '#ff0000'})
        self.assertIn('bg-primary', theme.context_note(self.root)); self.assertIn('never hard-coded colours', theme.context_note(self.root))


class RecogniseTest(unittest.TestCase):
    def test_the_request_in_english_and_japanese_is_answered_by_code(self):
        for text, group in (("I want to adjust the site's colours", 'colours'), ('I want to adjust the sites colors', 'colours'), ('change the radius', 'radius'),
                            ('サイトの色を調整したい', 'colours'), ('角丸を変更したい', 'radius'), ('余白を調整したい', 'spacing'), ("I'd like to change the fonts", 'fonts'), ('/theme', 'colours')):
            with self.subTest(text): self.assertEqual(theme.recognise(text), ('yes', group))

    def test_unsure_mentions_go_to_laya_and_other_requests_to_pi(self):
        self.assertEqual(theme.recognise('Change the colour of the header to red'), ('maybe', 'colours'))
        self.assertEqual(theme.recognise('Make the buttons blue'), (None, None))
        self.assertEqual(theme.recognise('Fix the login bug'), (None, None))


class ChatTest(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory(); self.addCleanup(folder.cleanup)
        self.chat = WebChat(Path(folder.name) / 'chats', 9, 0, data_root=Path(folder.name) / 'data'); self.addCleanup(self.chat.close)
        self.chat.queue.busy = lambda: True  # held: a queued request never starts Pi here
        self.project = self.chat.documents.create_project('Site', str(Path(folder.name)), 'empty')

    def test_the_request_opens_the_panel_without_a_request_for_pi(self):
        answer = self.chat.enqueue({'project': self.project, 'message': 'サイトの色を調整したい'})
        self.assertEqual(answer['theme'], 'colours'); self.assertEqual(self.chat.queue.list(), [], 'Pi is not called')
        last = answer['conversation']['messages'][-2:]
        self.assertEqual([message['role'] for message in last], ['user', 'assistant'])
        self.assertEqual((last[1]['author'], last[1]['theme']['group']), ('workbench', 'colours'))
        decisions = [json.loads(line) for line in (self.chat.documents.root / 'decisions.jsonl').read_text().splitlines()]
        self.assertEqual((decisions[-1]['kind'], decisions[-1]['who']), ('theme_panel', 'code'))

    def test_when_laya_abstains_pi_answers_with_the_panel_offered(self):
        answer = self.chat.enqueue({'project': self.project, 'message': 'Change the colour of the header to red'})
        job = next(item for item in self.chat.queue.jobs if item['id'] == answer['id'])
        self.assertEqual(job['data']['theme_hint'], 'colours')

    def test_the_panels_routes_are_the_persons_only(self):
        self.assertTrue({'/api/theme/open', '/api/theme/save', '/api/theme/add'} <= WebHandler.PERSON_ROUTES)


class HelperTest(unittest.TestCase):
    """The Preview frame loads the app through Frame, which adds the helper; the helper obeys only the workbench."""
    def setUp(self):
        class App(http.server.BaseHTTPRequestHandler):
            def log_message(self, *args): pass
            def do_GET(self):
                body = b'<!doctype html><html><head><title>App</title></head><body>Hi</body></html>' if self.path == '/' else b'body{}'
                self.send_response(200); self.send_header('Content-Type', 'text/html' if self.path == '/' else 'text/css'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)
        self.app = http.server.ThreadingHTTPServer(('127.0.0.1', 0), App)
        threading.Thread(target=self.app.serve_forever, daemon=True).start(); self.addCleanup(self.app.server_close); self.addCleanup(self.app.shutdown)
        self.frame = Frame(self.app.server_address[1], ['http://127.0.0.1:4000']); self.addCleanup(self.frame.close)

    def get(self, path):
        connection = http.client.HTTPConnection('127.0.0.1', self.frame.port, timeout=5); self.addCleanup(connection.close)
        connection.request('GET', path); response = connection.getresponse(); return response.read().decode()

    def test_pages_get_the_helper_and_everything_else_passes_through(self):
        page = self.get('/')
        self.assertIn(f'<head><script src="{HELPER_PATH}"></script><title>', page); self.assertEqual(self.get('/app.css'), 'body{}')
        self.assertEqual(inject(b'<!doctype html><p>x'), b'<!doctype html><script src="' + HELPER_PATH.encode() + b'"></script><p>x', 'never before the doctype')

    @unittest.skipUnless(shutil.which('node'), 'node runs the helper')
    def test_the_helper_refuses_other_origins_other_windows_and_unknown_tokens(self):
        helper = self.get(HELPER_PATH)
        self.assertIn('"http://127.0.0.1:4000"', helper)
        script = helper + r'''
;const send = (origin, source, data) => listeners.forEach(listener => listener({ origin, source, data }));
send('http://evil.example', parent, { type: 'pi-theme', light: { primary: 'red' } });
send('http://127.0.0.1:4000', {}, { type: 'pi-theme', light: { primary: 'red' } });
send('http://127.0.0.1:4000', parent, { type: 'pi-theme', light: { evil: 'red', radius: 'x;}', primary: 'url(x)' } });
const refused = { ...set };
send('http://127.0.0.1:4000', parent, { type: 'pi-theme', light: { primary: '#ff0000' }, both: { radius: '1rem' } });
console.log(JSON.stringify({ refused, accepted: set, told }));'''
        stub = r'''
const set = {}, listeners = [], told = [];
const parent = { postMessage: (data, origin) => told.push(origin) };
const window = {}; globalThis.parent = parent; globalThis.window = window;
globalThis.addEventListener = (type, listener) => listeners.push(listener);
globalThis.MutationObserver = class { observe() {} };
globalThis.document = { documentElement: { classList: { contains: () => false }, style: { setProperty: (k, v) => { set[k] = v; }, removeProperty: k => { delete set[k]; } } }, head: { append() {} } };
'''
        done = subprocess.run(['node', '-e', stub + script], capture_output=True, text=True, timeout=30)
        self.assertEqual(done.returncode, 0, done.stderr)
        found = json.loads(done.stdout)
        self.assertEqual(found['refused'], {}, 'another origin, another window and unknown or unsafe tokens change nothing')
        self.assertEqual(found['accepted'], {'--primary': '#ff0000', '--radius': '1rem'})
        self.assertEqual(found['told'], ['http://127.0.0.1:4000'], 'it says it is ready to the workbench only')


GOOD = b'wOF2' + b'\0' * 60
METADATA = b")]}'\n" + json.dumps({'familyMetadataList': [{'family': 'Inter', 'category': 'Sans Serif', 'fonts': {'400': {}, '700': {}, '400i': {}}},
                                                         {'family': 'Lora', 'category': 'Serif', 'fonts': {'400': {}}}]}).encode()
CSS = b'''/* latin-ext */
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/a.woff2) format('woff2'); unicode-range: U+0100-02BA; }
/* latin */
@font-face { font-family: 'Inter'; font-style: normal; font-weight: 700; font-display: swap; src: url(https://fonts.gstatic.com/s/inter/b.woff2) format('woff2'); unicode-range: U+0000-00FF; }
'''


class FontsTest(unittest.TestCase):
    def setUp(self):
        folder = tempfile.TemporaryDirectory(); self.addCleanup(folder.cleanup)
        self.data = Path(folder.name) / 'data'; self.root = project(Path(folder.name) / 'site')
        self.now = 1_000_000; self.asked = []; self.files = {'https://fonts.gstatic.com/s/inter/a.woff2': GOOD, 'https://fonts.gstatic.com/s/inter/b.woff2': GOOD,
                                                              'https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt': b'SIL Open Font License'}
        self.offline = False

    def fetch(self, url, limit=0):
        self.asked.append(url)
        if self.offline: raise OSError('offline')
        if url.startswith('https://fonts.google.com/metadata/fonts'): return METADATA
        if url.startswith('https://fonts.googleapis.com/css2?'): return CSS
        if url in self.files: return self.files[url]
        raise OSError('404')

    def fonts(self): return Fonts(self.data, fetch=self.fetch, clock=lambda: self.now)

    def test_the_list_is_googles_metadata_cached_for_a_day_and_kept_offline(self):
        self.assertEqual(parse_catalogue(METADATA)[0], {'family': 'Inter', 'category': 'Sans Serif', 'weights': [400, 700], 'italic': True})
        self.assertEqual([item['family'] for item in self.fonts().search('int')['families']], ['Inter'])
        self.assertEqual(len(self.asked), 1); self.fonts().search('lo'); self.assertEqual(len(self.asked), 1, 'within a day the cache answers')
        self.now += 2 * 24 * 3600; self.offline = True
        found = self.fonts().search('')
        self.assertTrue(found['offline']); self.assertEqual(found['total'], 2, 'offline, the old list still answers')
        self.assertTrue((self.data / 'cache' / 'google-fonts.json').is_file())

    def test_saving_a_font_downloads_its_woff2_files_and_licence_into_the_project(self):
        result = theme.save(self.root, fonts={'sans': 'Inter'}, download=self.fonts().download)
        folder = self.root / 'static' / 'fonts' / 'Inter'
        self.assertEqual(sorted(path.name for path in folder.iterdir()), ['400-000.woff2', '700-001.woff2', 'OFL.txt', 'font-face.css'])
        css = (self.root / theme.FILE).read_text()
        self.assertIn('--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;', css)
        self.assertIn('src: url("fonts/Inter/400-000.woff2") format("woff2")', css); self.assertNotIn('gstatic', css, 'the app never points at a CDN')
        self.assertIn('wght@400;700', next(url for url in self.asked if 'css2' in url))
        committed = subprocess.run(['git', '-C', str(self.root), 'show', '--name-only', '--format=', result['commit']], capture_output=True, text=True).stdout.split()
        self.assertIn('static/fonts/Inter/OFL.txt', committed); self.assertIn(theme.FILE, committed)
        self.assertEqual(theme.state(self.root)['fonts'], {'sans': 'Inter', 'heading': None})

    def test_anything_but_woff2_from_the_font_host_is_refused_and_nothing_is_left(self):
        self.files['https://fonts.gstatic.com/s/inter/b.woff2'] = b'<html>not a font'
        with self.assertRaises(ValueError): theme.save(self.root, fonts={'sans': 'Inter'}, download=self.fonts().download)
        self.assertFalse((self.root / 'static' / 'fonts').exists() and any((self.root / 'static' / 'fonts').iterdir()), 'no half download')
        self.assertEqual((self.root / theme.FILE).read_text(), STARTER)
        with self.assertRaises(ValueError): theme.save(self.root, fonts={'sans': 'Not A Font'}, download=self.fonts().download)

    def test_only_the_three_font_hosts_are_ever_asked(self):
        for url in ('https://evil.example/font.woff2', 'http://fonts.gstatic.com/x.woff2', 'file:///etc/passwd'):
            with self.subTest(url), self.assertRaises(ValueError): fetch(url)


if __name__ == '__main__':
    unittest.main()
