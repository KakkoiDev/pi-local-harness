"""Round 9 updates: scratch sources, cached daily checks and shared settings."""
try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock
from harness.web_updates import UpdateService


class WebUpdatesTest(unittest.TestCase):
    def test_daily_checks_are_remembered_and_manual_checks_ignore_the_switch(self):
        with tempfile.TemporaryDirectory() as folder:
            check=Mock(return_value={'state':'available','changes':['A useful fix'],'behind':1})
            service=UpdateService(Path(folder),Path(folder)/'source',check=check,apply=Mock(),clock=lambda:100000)
            service.check();service.check(daily=True)
            self.assertEqual(check.call_count,1)
            service.settings({'updates_daily':False,'language':'ja'})
            self.assertEqual(service.settings()['language'],'ja')
            service.check(daily=True);self.assertEqual(check.call_count,1)
            service.check();self.assertEqual(check.call_count,2)
            restored=UpdateService(Path(folder),Path(folder)/'source',check=check,apply=Mock(),clock=lambda:100001)
            self.assertEqual(restored.status()['state'],'available')
            self.assertFalse(restored.settings()['updates_daily'])
            with self.assertRaises(ValueError):service.settings({'updates_daily':'yes'})
            with self.assertRaises(ValueError):service.settings({'language':'unknown'})

    def test_apply_is_explicit_and_keeps_the_backend_block_reason(self):
        with tempfile.TemporaryDirectory() as folder:
            apply=Mock(return_value={'state':'blocked','why':'Some files were edited.'})
            service=UpdateService(Path(folder),Path(folder)/'source',check=Mock(),apply=apply)
            self.assertEqual(service.update()['state'],'blocked')
            apply.assert_called_once_with(Path(folder)/'source')
            self.assertEqual(service.status()['why'],'Some files were edited.')
