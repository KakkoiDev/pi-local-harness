"""Project phases persist atomically and only authorised actors can move them (task 247)."""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from gate.phases import Phases


class PhaseTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'project'; self.root.mkdir()
        self.data = Path(self.temp.name) / 'data'
        self.phases = Phases(self.data)

    def test_default_and_restart_share_the_canonical_project(self):
        self.assertEqual(self.phases.get(self.root)['phase'], 'discussion')
        saved = self.phases.choose(self.root, 'planning', actor='person', action='/plan')
        self.assertEqual(saved['phase'], 'planning')
        self.assertEqual(Phases(self.data).get(self.root / '.') , saved)
        self.assertEqual(self.phases.get(self.root.parent / 'another')['phase'], 'discussion')
        self.assertEqual(saved['history'][-1]['actor'], 'person')
        self.assertEqual(saved['history'][-1]['action'], '/plan')
        self.assertTrue(saved['history'][-1]['at'])

    def test_model_cannot_choose_and_auto_only_starts_building(self):
        for actor in ['model', 'code', '', None]:
            with self.assertRaises(ValueError):
                self.phases.choose(self.root, 'planning', actor=actor)
        with self.assertRaises(ValueError):
            self.phases.choose(self.root, 'implementation', actor='auto', planned=True)
        self.phases.choose(self.root, 'planning', actor='person')
        built = self.phases.choose(self.root, 'implementation', actor='auto', planned=True)
        self.assertEqual(built['history'][-1]['actor'], 'auto')
        for phase in ['discussion', 'planning']:
            with self.assertRaises(ValueError):
                self.phases.choose(self.root, phase, actor='auto', planned=True)
        self.assertEqual(self.phases.get(self.root), built)

    def test_build_needs_tasks_and_unknown_phase_never_saves(self):
        for phase in ['implementation', 'check', 'Planning', '']:
            with self.assertRaises(ValueError):
                self.phases.choose(self.root, phase, actor='person')
        self.assertFalse(self.data.exists())
        self.phases.choose(self.root, 'implementation', actor='person', planned=True)
        self.assertEqual(self.phases.get(self.root)['phase'], 'implementation')

    def test_failed_atomic_save_keeps_the_previous_phase_and_history(self):
        before = self.phases.choose(self.root, 'planning', actor='person')
        with patch.object(Path, 'replace', side_effect=OSError('disk full')):
            with self.assertRaises(OSError):
                self.phases.choose(self.root, 'implementation', actor='person', planned=True)
        self.assertEqual(Phases(self.data).get(self.root), before)

    def test_reselecting_current_phase_does_not_duplicate_history(self):
        before = self.phases.choose(self.root, 'planning', actor='person')
        self.assertEqual(self.phases.choose(self.root, 'planning', actor='person'), before)
