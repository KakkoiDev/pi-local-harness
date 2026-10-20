try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from harness.quality import check, VERSION

class QualityTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name).resolve();(self.root/'app.py').write_text('print(undefined_name)\n')
        self.binary=self.root/'ruff';self.binary.write_text('fixture')
    def run_tool(self,args,**kwargs):
        if '--version' in args:return subprocess.CompletedProcess(args,0,'ruff '+VERSION+'\n','')
        self.argv=args
        return subprocess.CompletedProcess(args,1,json.dumps([{'filename':str(self.root/'app.py'),'code':'F821','message':'Undefined name','location':{'row':1,'column':7}}]),'')
    def test_findings_are_relative_and_cannot_autofix(self):
        with patch('harness.quality.subprocess.run',side_effect=self.run_tool):report=check(self.root,self.binary)
        self.assertEqual(report['status'],'findings');self.assertEqual(report['findings'][0]['path'],'app.py')
        self.assertIn('--isolated',self.argv);self.assertIn('--ignore-noqa',self.argv)
        self.assertNotIn('--fix',self.argv);self.assertNotIn('--unsafe-fixes',self.argv)
        self.assertEqual((self.root/'app.py').read_text(),'print(undefined_name)\n')
    def test_missing_tool_does_not_download_or_pass(self):
        with patch('harness.quality.subprocess.run',side_effect=AssertionError('must not run')):
            self.assertEqual(check(self.root,self.root/'missing')['status'],'unavailable')
    def test_version_mismatch_is_an_error(self):
        with patch('harness.quality.subprocess.run',return_value=subprocess.CompletedProcess([],0,'ruff wrong','')):
            self.assertEqual(check(self.root,self.binary)['status'],'error')
    def test_scanner_error_and_malformed_output_never_pass(self):
        for code,out in [(2,'[]'),(0,'not json'),(1,'[]'),(0,'{}')]:
            with patch('harness.quality.subprocess.run',side_effect=[subprocess.CompletedProcess([],0,'ruff '+VERSION,''),subprocess.CompletedProcess([],code,out,'')]):
                self.assertEqual(check(self.root,self.binary)['status'],'error')
    def test_timeout_never_passes(self):
        with patch('harness.quality.subprocess.run',side_effect=subprocess.TimeoutExpired('ruff',1)):
            self.assertEqual(check(self.root,self.binary)['status'],'error')
    def test_vendor_and_external_symlinks_are_not_scanned(self):
        (self.root/'vendor').mkdir();(self.root/'vendor/bad.py').write_text('vendor_name')
        (self.root/'linked.py').symlink_to('/etc/passwd')
        with patch('harness.quality.subprocess.run',side_effect=self.run_tool):check(self.root,self.binary)
        self.assertNotIn(str(self.root/'vendor/bad.py'),self.argv);self.assertNotIn(str(self.root/'linked.py'),self.argv)
    def test_unscoped_diagnostics_are_rejected(self):
        def call(args,**kwargs):
            result=self.run_tool(args,**kwargs)
            if '--version' not in args:result.stdout=result.stdout.replace(str(self.root/'app.py'),'/outside/private.py')
            return result
        with patch('harness.quality.subprocess.run',side_effect=call):self.assertEqual(check(self.root,self.binary)['status'],'error')
    @unittest.skipUnless(os.environ.get('PI_TEST_RUFF'),'Set PI_TEST_RUFF for approved real-tool checks')
    def test_real_seeded_bug_then_clean_and_no_import_execution(self):
        marker=self.root/'executed';source=self.root/'app.py'
        source.write_text(f'from pathlib import Path\nPath({str(marker)!r}).touch()\nprint(undefined_name)\n')
        self.assertEqual(check(self.root,Path(os.environ['PI_TEST_RUFF']))['status'],'findings')
        self.assertFalse(marker.exists())
        source.write_text('value = 1\nprint(value)\n')
        self.assertEqual(check(self.root,Path(os.environ['PI_TEST_RUFF']))['status'],'passed')
    @unittest.skipUnless(os.environ.get('PI_TEST_RUFF'),'Set PI_TEST_RUFF for approved real-tool checks')
    def test_real_syntax_error_is_a_finding(self):
        (self.root/'app.py').write_text('def broken(:\n')
        report=check(self.root,Path(os.environ['PI_TEST_RUFF']))
        self.assertEqual(report['status'],'findings',report)
