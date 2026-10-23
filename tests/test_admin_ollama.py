"""Task 162: the console changes Ollama's settings and manages models, after a yes; nothing is deleted (plan 158 § 4)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import os
import sqlite3
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

from harness import admin, model as models
from tests.test_capability import FakeOllama


class OllamaAdminTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        root = Path(self.temp.name).resolve()
        self.data = root / 'data'; self.data.mkdir()
        self.models = root / 'models'; self.trash = root / 'Trash'
        self.db = root / 'db.sqlite'
        with sqlite3.connect(self.db) as connection:
            connection.execute('create table settings (id integer primary key, models text not null default "", context_length integer not null default 0, expose boolean not null default 0)')
            connection.execute('insert into settings (id, models) values (1, ?)', (str(self.models),))
        self.environment = {}
        self.restarts = []
        for target, value in [('OLLAMA_SETTINGS', self.db)]:
            patcher = patch.object(admin, target, value); patcher.start(); self.addCleanup(patcher.stop)
        for name, fake in [('launchctl_get', lambda key: self.environment.get(key)), ('launchctl_set', self.environment.__setitem__),
                           ('launchctl_unset', lambda key: self.environment.pop(key, None)), ('restart_ollama_app', lambda between=None: (between() if between else None, self.restarts.append(True)))]:
            patcher = patch.object(admin, name, fake); patcher.start(); self.addCleanup(patcher.stop)
        patcher = patch.dict(os.environ, {'PI_TRASH_DIR': str(self.trash)}); patcher.start(); self.addCleanup(patcher.stop)
        os.environ.pop('OLLAMA_NUM_PARALLEL', None)
        self.console = admin.Console(self.data)

    def setting(self, column):
        with sqlite3.connect(self.db) as connection: return connection.execute(f'select {column} from settings').fetchone()[0]

    def manifest(self, name, tag, layers):
        path = self.models / 'manifests/registry.ollama.ai/library' / name / tag; path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps({'config': {'digest': layers[0]}, 'layers': [{'digest': digest} for digest in layers[1:]]}))
        for digest in layers:
            blob = self.models / 'blobs' / digest.replace(':', '-'); blob.parent.mkdir(parents=True, exist_ok=True); blob.write_text(digest)

    def test_parallel_slots_change_after_a_yes_restart_ollama_and_undo(self):
        preview, _ = admin.run(self.console, 'ollama', ['set', 'num_parallel', '2'])
        self.assertTrue(preview['confirm']); self.assertIn('default → 2', preview['detail']); self.assertIn('restarts Ollama', preview['detail'])
        self.assertEqual(self.environment, {}, 'nothing without yes')
        admin.run(self.console, 'ollama', ['set', 'num_parallel', '2'], yes=True)
        self.assertEqual(self.environment, {'OLLAMA_NUM_PARALLEL': '2'}); self.assertEqual(self.restarts, [True])
        admin.run(self.console, 'undo', [], yes=True)
        self.assertEqual(self.environment, {}, '/undo puts the variable back as it was'); self.assertEqual(len(self.restarts), 2)
        for value in ['0', 'lots', '99']:
            with self.assertRaisesRegex(ValueError, 'from 1 to 8'): admin.run(self.console, 'ollama', ['set', 'num_parallel', value], yes=True)

    def test_context_length_is_written_to_the_app_settings_with_a_backup(self):
        admin.run(self.console, 'ollama', ['set', 'context_length', '32768'], yes=True)
        self.assertEqual(self.setting('context_length'), 32768); self.assertEqual(self.restarts, [True], 'the app reads it when it starts')
        self.assertEqual(len(list((self.data / 'backups').glob('*-db.sqlite'))), 1)
        admin.run(self.console, 'undo', [], yes=True); self.assertEqual(self.setting('context_length'), 0)
        with self.assertRaisesRegex(ValueError, 'Unknown Ollama setting'): admin.run(self.console, 'ollama', ['set', 'colour', 'red'], yes=True)

    def test_nothing_changes_while_pi_works(self):
        with patch.object(admin.Console, 'queue', lambda self, state=None: [{'status': 'running'}] if state == 'running' else []):
            with self.assertRaisesRegex(ValueError, 'Pi is working'): admin.run(self.console, 'ollama', ['set', 'num_parallel', '2'], yes=True)
            with self.assertRaisesRegex(ValueError, 'Pi is working'): admin.run(self.console, 'ollama', ['restart'], yes=True)
        self.assertEqual(self.restarts, [])

    def test_removing_a_model_moves_its_own_files_to_the_trash(self):
        self.manifest('gemma4', '26b-mlx', ['sha256:config1', 'sha256:shared', 'sha256:weights1'])
        self.manifest('gemma4', '31b-mlx', ['sha256:config2', 'sha256:shared', 'sha256:weights2'])
        models.save(self.data, model='gemma4:31b-mlx')  # not the chosen one
        preview, _ = admin.run(self.console, 'models', ['remove', 'gemma4:26b-mlx'])
        self.assertIn('Trash', preview['detail']); self.assertIn('2 files', preview['detail'])
        admin.run(self.console, 'models', ['remove', 'gemma4:26b-mlx'], yes=True)
        self.assertFalse((self.models / 'manifests/registry.ollama.ai/library/gemma4/26b-mlx').exists())
        self.assertTrue((self.models / 'blobs/sha256-shared').exists(), 'a file another model uses stays')
        self.assertTrue((self.models / 'blobs/sha256-weights2').exists())
        moved = next(self.trash.iterdir())
        self.assertTrue((moved / 'manifests/registry.ollama.ai/library/gemma4/26b-mlx').exists(), 'laid out like the models folder: Put Back is a move')
        self.assertEqual(sorted(path.name for path in (moved / 'blobs').iterdir()), ['sha256-config1', 'sha256-weights1'])
        self.assertTrue((moved / 'README.txt').read_text().startswith('gemma4:26b-mlx'))
        with self.assertRaisesRegex(ValueError, 'not installed'): admin.run(self.console, 'models', ['remove', 'gemma4:26b-mlx'], yes=True)

    def test_the_chosen_model_cannot_be_removed(self):
        models.save(self.data,model='gemma4:26b-mlx')
        self.manifest('gemma4', '26b-mlx', ['sha256:config1'])
        with self.assertRaisesRegex(ValueError, 'chosen model'): admin.run(self.console, 'models', ['remove', 'gemma4:26b-mlx'], yes=True)

    def test_pulling_a_model_asks_first_and_reports_the_result(self):
        server = FakeOllama(parallel=True); threading.Thread(target=server.serve_forever, daemon=True).start(); self.addCleanup(server.shutdown)
        with patch.dict(os.environ, {'PI_OLLAMA_URL': f'http://127.0.0.1:{server.server_port}'}):
            preview, _ = admin.run(self.console, 'models', ['pull', 'qwen3:8b'])
            self.assertIn('Downloads qwen3:8b', preview['detail'])
            _, text = admin.run(self.console, 'models', ['pull', 'qwen3:8b'], yes=True)
        self.assertIn('qwen3:8b is installed', text)
        self.assertEqual(json.loads((self.data / 'admin-log.jsonl').read_text().splitlines()[-1])['command'], 'models pull qwen3:8b')


if __name__ == '__main__':
    unittest.main()
