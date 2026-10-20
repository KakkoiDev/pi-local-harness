"""Explicit scratch-only contract proof against a prebuilt, local Jikko binary.

JIKKO_PROOF_BINARY=/absolute/path/to/jikko python3 tests/proofs/jikko_roundtrip.py
No install, downloads, personal project access, tokens in arguments or auto-commit.
"""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

class JikkoProof(unittest.TestCase):
    def setUp(self):
        binary=os.environ.get('JIKKO_PROOF_BINARY','')
        if not Path(binary).is_absolute() or not Path(binary).is_file():raise RuntimeError('Set JIKKO_PROOF_BINARY to an already-built local executable.')
        self.binary=binary
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name)/'workspace';self.env={**os.environ}
        self.env.pop('JIKKO_TOKEN',None)
        initial=self.call('init','--identity','tester','--json')
        self.env['JIKKO_TOKEN']=json.loads(initial.stdout)['token']
    def call(self,*args,body=None):
        return subprocess.run([self.binary,*args,'--dir',str(self.root)],input=body,text=True,capture_output=True,env=self.env,timeout=15)
    def checked(self,*args,body=None):
        result=self.call(*args,body=body)
        self.assertEqual(result.returncode,0,'Jikko operation failed (output withheld to protect credentials).')
        return result
    def source(self):return self.checked('show','notes/first','--raw').stdout
    def create(self):self.checked('create','notes/first','--type','document','--body','# First\n\n[[welcome]]\n<!-- keep me -->\n')
    def rev(self):return json.loads(self.checked('show','notes/first','--json').stdout)['rev']
    def test_exact_source_and_saved_uncommitted_recovery(self):
        self.create();source=self.source();revision=self.rev()
        self.checked('save','notes/first','--rev',revision,'--json',body=source)
        self.assertEqual(self.source(),source)
        self.assertIn('<!-- keep me -->',source);self.assertIn('[[welcome]]',source)
        # A fresh CLI process reads the same canonical file without a Git commit.
        status=subprocess.run(['git','-C',str(self.root),'status','--porcelain'],capture_output=True,text=True,check=True).stdout
        self.assertIn('notes/',status)
        head=subprocess.run(['git','-C',str(self.root),'rev-parse','--verify','HEAD'],capture_output=True)
        self.assertNotEqual(head.returncode,0)
    def test_conflicting_stale_save_preserves_current_work(self):
        self.create();source=self.source();revision=self.rev()
        self.checked('save','notes/first','--rev',revision,'--json',body=source.replace('# First','# Current'))
        result=self.call('save','notes/first','--rev',revision,'--json',body=source.replace('# First','# Stale'))
        self.assertNotEqual(result.returncode,0)
        self.assertIn('# Current',self.source());self.assertNotIn('# Stale',self.source())
    def test_invalid_identity_cannot_write(self):
        self.create();source=self.source();revision=self.rev();self.env['JIKKO_TOKEN']='invalid'
        result=self.call('save','notes/first','--rev',revision,body=source.replace('# First','# Unauthorized'))
        self.assertNotEqual(result.returncode,0)
        self.assertNotIn('# Unauthorized',(self.root/'notes/first.md').read_text())

if __name__=='__main__':unittest.main()
