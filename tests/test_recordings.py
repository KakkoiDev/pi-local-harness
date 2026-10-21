"""The recorder adapter stores only bounded, sanitized, project-owned flows."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import json
from pathlib import Path
import tempfile
import unittest
from harness.recordings import Recordings


class RecordingsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.now = 1000000
        self.store = Recordings(self.root, clock=lambda: self.now)
        self.flow = {'steps': [{'type': 'change', 'selectors': [['input:nth-of-type(1)']], 'value': 'private text'}], 'title': 'private title'}

    def test_defaults_and_redaction_survive_a_new_store(self):
        found = self.store.append('alpha', self.flow)
        self.assertEqual(found['steps'][0]['value'], {'redacted': True, 'length': 12})
        self.assertNotIn('private', json.dumps(found))
        again = Recordings(self.root, clock=lambda: self.now)
        self.assertTrue(again.status('alpha')['enabled'])
        self.assertEqual(again.recent('alpha')['steps'], found['steps'])
        self.assertIsNone(again.recent('beta'))

    def test_stopping_in_one_instance_refuses_late_delivery_in_another(self):
        other = Recordings(self.root, clock=lambda: self.now)
        other.set_enabled('alpha', False)
        self.assertIsNone(self.store.append('alpha', self.flow))
        self.assertFalse(self.store.status('alpha')['enabled'])
        self.assertIsNone(self.store.recent('alpha'))

    def test_history_has_twenty_flow_limit_and_expiry_moves_to_trash(self):
        for _ in range(23):
            self.store.append('alpha', self.flow); self.now += 1
        self.assertEqual(len(self.store.history('alpha')), 20)
        self.assertEqual(len(list((self.root/'recording-trash').rglob('*.json'))), 3)
        self.now += 7*24*60*60
        self.assertEqual(self.store.history('alpha'), [])
        self.assertEqual(len(list((self.root/'recording-trash').rglob('*.json'))), 23)

    def test_recent_excludes_old_flows_and_clear_preserves_other_projects(self):
        self.store.append('alpha', self.flow)
        self.store.append('beta', self.flow)
        self.now += 1801
        self.assertIsNone(self.store.recent('alpha'))
        self.store.clear('alpha')
        self.assertEqual(self.store.history('alpha'), [])
        self.assertEqual(len(self.store.history('beta')), 1)
        self.assertEqual(len(list((self.root/'recording-trash').rglob('*.json'))), 1)

    def test_untrusted_project_ids_and_symlink_directories_are_refused(self):
        for project in ('../escape', '/absolute', '.', '', 'a/b'):
            with self.assertRaises(ValueError): self.store.append(project, self.flow)
        outside = self.root/'outside'; outside.mkdir()
        directory = self.root/'recordings'; directory.mkdir(exist_ok=True)
        (directory/'linked').symlink_to(outside, target_is_directory=True)
        with self.assertRaises(ValueError): self.store.append('linked', self.flow)
        self.assertEqual(list(outside.iterdir()), [])

    def test_step_limit_is_enforced_and_unknown_metadata_is_discarded(self):
        found = self.store.append('alpha', {'steps': self.flow['steps']*600, 'url': 'secret'})
        self.assertEqual(len(found['steps']), 500)
        self.assertNotIn('secret', json.dumps(found))

    def test_parallel_instances_do_not_lose_or_corrupt_flows(self):
        from concurrent.futures import ThreadPoolExecutor
        def append(_): return Recordings(self.root, clock=lambda: self.now).append('alpha', self.flow)
        with ThreadPoolExecutor(max_workers=4) as pool:
            ids = [flow['id'] for flow in pool.map(append, range(20))]
        self.assertEqual(len(set(ids)), 20)
        self.assertEqual(len(self.store.history('alpha')), 20)

    def test_bad_records_and_storage_failure_are_reported_without_losing_history(self):
        from unittest.mock import patch
        self.store.append('alpha', self.flow)
        with patch('harness.recordings.os.replace', side_effect=OSError('disk full')):
            with self.assertRaises(OSError): self.store.append('alpha', self.flow)
        self.assertEqual(len(self.store.history('alpha')), 1)
        (self.root/'recordings/alpha/flow-bad.json').write_text('[]')
        with self.assertRaises(ValueError): self.store.history('alpha')

    def test_addresses_and_client_timestamps_are_not_stored(self):
        flow = {**self.flow, 'at': 0, 'project': 'beta'}
        flow['steps'] = [{'type': 'navigate', 'url': 'http://127.0.0.1:9999/private?key=secret'}, *flow['steps']]
        found = self.store.append('alpha', flow)
        self.assertEqual(found['at'], self.now)
        self.assertEqual(len(found['steps']), 1)
        self.assertNotIn('9999', json.dumps(found))

    def test_session_batches_accumulate_and_clear_or_restart_rejects_old_generation(self):
        generation = self.store.status('alpha')['generation']
        flow = self.store.append('alpha', self.flow, generation=generation)
        same = self.store.append('alpha', self.flow, flow_id=flow['id'], generation=generation)
        self.assertEqual(same['id'], flow['id'])
        self.assertEqual(len(same['steps']), 2)
        self.store.clear('alpha')
        self.assertIsNone(self.store.append('alpha', self.flow, generation=generation))
        generation = self.store.status('alpha')['generation']
        self.store.set_enabled('alpha', False)
        self.store.set_enabled('alpha', True)
        self.assertIsNone(self.store.append('alpha', self.flow, generation=generation))

    def test_batches_are_atomic_and_full_flows_do_not_evict_first_events(self):
        with self.assertRaises(ValueError):
            self.store.append('alpha', {'steps': self.flow['steps']*51}, generation=0)
        self.assertEqual(self.store.history('alpha'), [])
        flow = self.store.append('alpha', self.flow)
        for _ in range(10):
            flow = self.store.append('alpha', {'steps': self.flow['steps']*50}, flow_id=flow['id'])
        self.assertEqual(len(flow['steps']), 500)
        self.assertTrue(flow['truncated'])
        self.assertEqual(len(self.store.history('alpha')), 1)
