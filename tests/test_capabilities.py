"""Round 12, Project Start (plan 253, plan 266 item 9): capabilities and packages are separate choices; the kit
assembles a base from them, runs its tests offline (Python or Node alone) and creates nothing if one fails; Add a
Capability… keeps a capability only as one undoable commit, only when every test still passes."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from harness.documents import DocumentStore
from harness import undo
import capabilities as kit  # kit/ is on the path once harness.documents is imported

ROOT = Path(__file__).resolve().parent.parent
EXTRA = ROOT / 'tests/fixtures/capabilities/extra.json'


def git(folder, *args):
    return subprocess.run(['git', '-C', str(folder), *args], capture_output=True, text=True, check=True).stdout


class CatalogueTest(unittest.TestCase):
    def setUp(self):
        self.data = kit.catalogue()

    def test_groups_packages_and_every_capability_are_complete(self):
        self.assertEqual([group['id'] for group in self.data['groups']], ['accounts', 'data', 'screens', 'together', 'games', 'publish'])
        self.assertEqual([package['id'] for package in self.data['packages']], ['web', 'static', 'phone', 'tui'])
        groups = {group['id'] for group in self.data['groups']}; ids = [item['id'] for item in self.data['capabilities']]
        self.assertEqual(len(ids), len(set(ids)))
        for item in self.data['capabilities']:
            self.assertIn(item['group'], groups, item['id'])
            for key in ('name', 'small', 'supports', 'keywords'): self.assertTrue(item.get(key), f"{item['id']}: {key}")
            for need in item.get('needs', []): self.assertIn(need, ids)
            if not item['available']:
                self.assertTrue(item['reason'].startswith('Not available yet: '), item['id']); continue
            self.assertTrue((kit.KIT / item['card']).is_file(), f"{item['id']}: its card, for Pi")
            self.assertEqual(set(item['install']), set(item['supports']), f"{item['id']}: installs into every package it supports")
            for base in item['install']:
                self.assertGreater(kit.tests_added(item, base), 0, f"{item['id']} in {base}: brings tests of its own")

    def test_every_vendored_file_is_pinned_licensed_and_its_licence_is_copied(self):
        libraries = json.loads((kit.KIT / 'libraries.json').read_text())['libraries']
        folders = {library['folder']: library for library in libraries}
        for item in self.data['capabilities']:
            for base, spec in item.get('install', {}).items():
                sources = [source for source, _ in spec.get('copy', [])]
                for source in sources:
                    self.assertTrue((kit.KIT / source).exists(), source)
                    folder = next((name for name in folders if source == name or source.startswith(name + '/')), None)
                    self.assertIsNotNone(folder, f'{source}: a pinned library in kit/libraries.json')
                    self.assertTrue(folders[folder]['license'], folder)
                if sources:
                    copied = [target for source, target in spec['copy'] if 'LICENSE' in source] + [target for source, target in spec['copy'] if (kit.KIT / source).is_dir()]
                    self.assertTrue(copied, f"{item['id']} in {base}: the licence goes with the library")

    def test_suggestions_come_from_the_sentence_in_english_and_japanese(self):
        self.assertEqual(kit.suggest('A notes app for my class that works offline on a phone, with charts'), ['offline', 'charts', 'install'])
        self.assertEqual(kit.suggest('オフラインで使えるスマホのゲーム'), ['offline', 'game', 'install'])
        self.assertEqual(kit.suggest(''), [])
        self.assertNotIn('game', kit.suggest('a page about gamelan music'), 'whole words only')


class ResolveTest(unittest.TestCase):
    def test_what_stops_create_says_what_to_change(self):
        self.assertIn('together are not available yet', kit.resolve(['web', 'static'], [])['problems'][0])
        self.assertEqual(kit.resolve(['tui'], ['charts'])['problems'], ["Dashboard and charts: the Terminal app can't carry it."])
        self.assertTrue(kit.resolve(['web'], ['accounts'])['problems'][0].startswith('Log in and accounts: Not available yet'))
        self.assertEqual(kit.resolve([], [])['problems'], ['Choose at least one package.'])
        self.assertIn('Phone app needs', kit.resolve(['tui', 'phone'], [])['problems'][0])

    def test_the_phone_app_brings_the_install_capability_and_warnings_do_not_block(self):
        plan = kit.resolve(['static', 'phone'], ['multiplayer', 'offline'])
        self.assertEqual(plan['problems'], [])
        self.assertEqual(plan['capabilities'], ['multiplayer', 'offline', 'install']); self.assertEqual(plan['included'], {'install': 'phone'})
        self.assertEqual(plan['warnings'], ['Multiplayer, real time and Works offline: changes from others wait until you are back online.'])
        self.assertEqual(kit.resolve(['phone'], [])['base'], 'static', 'a phone app alone is the app with no server, installed')


class BuildTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def test_each_package_with_every_capability_it_carries_assembles_and_passes_its_tests(self):
        for base in ('web', 'static', 'tui'):
            chosen = [item['id'] for item in kit.catalogue()['capabilities'] if item['available'] and base in item['supports']]
            with self.subTest(base=base):
                folder = self.root / base
                plan = kit.initial_plan(base)
                facts = kit.summary([base], chosen, plan)
                check = kit.build(folder, [base], chosen, files=plan, data=self.root / 'data')
                self.assertTrue(check['passed'], check['output'][-1500:])
                self.assertEqual(check['tests'], facts['tests'], 'step 4 counted the tests Create ran')
                self.assertEqual(sum(1 for path in folder.rglob('*') if path.is_file() and '.git' not in path.relative_to(folder).parts), facts['files'])
                self.assertEqual(json.loads((folder / 'packaging.json').read_text()), {'packages': [base], 'capabilities': chosen})
                self.assertIn('## Capabilities', (folder / 'README.md').read_text())
                self.assertEqual(git(folder, 'log', '--format=%an|%s').split('\n')[0], 'Pi Workbench|Start from the Pi Workbench starter')
                self.assertEqual(git(folder, 'status', '--porcelain'), '', 'everything is committed, nothing generated is left')
        runs = [json.loads(line) for line in (self.root / 'data/test-runs.jsonl').read_text().splitlines()]
        self.assertEqual({run['exit_code'] for run in runs}, {0}, 'each run is Gate test evidence')

    def test_a_failing_capability_test_creates_nothing_and_names_the_test(self):
        store = DocumentStore(self.root / 'data'); code = self.root / 'code'; code.mkdir()
        with mock.patch.dict(os.environ, {'PI_KIT_CAPABILITIES_EXTRA': str(EXTRA), 'PI_TRASH_DIR': str(self.root / 'Trash')}):
            for base in ('web', 'static'):
                with self.subTest(base=base), self.assertRaises(kit.BaseFailed) as raised:
                    store.create_project('Broken ' + base, str(code), 'start', start={'packages': [base], 'capabilities': ['broken']})
                failing = raised.exception.check['failing']
                self.assertEqual(failing[0]['capability'], 'Always fails (test)')
                self.assertIn('always fails', failing[0]['test'].replace('_', ' '))
                self.assertIn('Nothing was created', str(raised.exception))
                self.assertFalse((code / ('Broken ' + base)).exists(), 'no folder')
                self.assertTrue((self.root / 'Trash' / ('Broken ' + base)).is_dir(), 'the partial folder is in the Trash')
        self.assertEqual(store.list_projects(), [], 'and no project')

    def test_create_through_the_store_registers_the_project_with_its_check(self):
        store = DocumentStore(self.root / 'data'); code = self.root / 'code'; code.mkdir()
        start = {'packages': ['tui'], 'capabilities': ['database']}
        project = store.create_project('Quiz', str(code), 'start', start=start)
        self.assertTrue(start['check']['passed']); self.assertEqual(store.project_path(project), (code / 'Quiz').resolve())
        self.assertTrue((code / 'Quiz/tests/test_cap_database.py').is_file() and (code / 'Quiz/ROADMAP.md').is_file())


class AddTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name) / 'app'
        self.assertTrue(kit.build(self.folder, ['static'], ['offline'], files={'ROADMAP.md': '# Roadmap\n'})['passed'])

    def test_what_changes_is_shown_before(self):
        shown = kit.preview(self.folder, 'qrcode')
        self.assertEqual(sorted(shown['added']), ['tests/cap-qrcode.test.mjs', 'vendor/qrcode/LICENSE', 'vendor/qrcode/qrcode.mjs'])
        self.assertEqual(shown['changed'], ['README.md', 'packaging.json', 'sw.js'])
        self.assertEqual(shown['tests_added'], 2); self.assertEqual(shown['present'], ['offline'])

    def test_it_is_one_commit_by_the_harness_that_undo_takes_back(self):
        result = kit.add(self.folder, 'qrcode')
        self.assertTrue(result['added'], result.get('message'))
        self.assertEqual(git(self.folder, 'log', '-1', '--format=%an|%s'), 'Pi Workbench|Capability: Share by QR code\n')
        self.assertEqual(git(self.folder, 'status', '--porcelain'), '')
        self.assertEqual(json.loads((self.folder / 'packaging.json').read_text())['capabilities'], ['offline', 'qrcode'])
        self.assertIn("'vendor/qrcode/qrcode.mjs'", (self.folder / 'sw.js').read_text())
        self.assertRegex(result['message'], r'^Added Share by QR code: .* Tried it: all \d+ tests of the base pass, 2 of them new\.$')
        undone = undo.undo(self.folder, result['commit'])
        self.assertEqual(undone['outcome'], 'undone')
        self.assertFalse((self.folder / 'vendor/qrcode').exists())
        self.assertEqual(json.loads((self.folder / 'packaging.json').read_text())['capabilities'], ['offline'])
        with self.assertRaisesRegex(ValueError, 'already in this project'): kit.add(self.folder, 'offline')

    def test_a_failing_test_keeps_nothing(self):
        before = git(self.folder, 'rev-parse', 'HEAD')
        with mock.patch.dict(os.environ, {'PI_KIT_CAPABILITIES_EXTRA': str(EXTRA)}):
            result = kit.add(self.folder, 'broken')
        self.assertFalse(result['added'])
        self.assertEqual(result['message'], 'Not added: a test failed (Always fails (test): this capability always fails). Nothing was changed.')
        self.assertEqual(git(self.folder, 'rev-parse', 'HEAD'), before)
        self.assertEqual(git(self.folder, 'status', '--porcelain', '--untracked-files=all'), '', 'every file as it was')

    def test_the_whole_suite_must_still_pass_when_it_passed_before(self):
        calls = iter([{'passed': True, 'command': 'npm test'}, {'passed': False, 'command': 'npm test'}])
        result = kit.add(self.folder, 'charts', full_suite=lambda folder: next(calls))
        self.assertFalse(result['added'])
        self.assertIn("the project's tests passed before and fail with it", result['message'])
        self.assertEqual(git(self.folder, 'status', '--porcelain', '--untracked-files=all'), '')

    def test_unsaved_edits_in_a_file_it_changes_are_never_overwritten(self):
        (self.folder / 'README.md').write_text('# Mine\n')
        with self.assertRaisesRegex(ValueError, 'README.md has changes that are not saved'):
            kit.add(self.folder, 'qrcode')
        self.assertEqual((self.folder / 'README.md').read_text(), '# Mine\n')
        self.assertFalse((self.folder / 'vendor/qrcode').exists())

    def test_a_capability_the_package_cannot_carry_is_refused(self):
        with self.assertRaisesRegex(ValueError, "the App with no server can't carry it"):
            kit.add(self.folder, 'database')


if __name__ == '__main__':
    unittest.main()
