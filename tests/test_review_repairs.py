"""Review regressions use only scratch data; no models, downloads or personal files."""
try:
 import isolation
except ModuleNotFoundError:
 from tests import isolation
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
from harness.documents import DocumentStore
from harness import project_start, theme
from harness.theme_fonts import Fonts
from gate import sandbox
import capabilities as kit

class ReviewRepairs(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
  self.base=Path(self.temp.name).resolve();self.root=self.base/'app';self.root.mkdir()
 def test_full_suite_preserves_data_and_network_policy(self):
  data=self.base/'data';data.mkdir()
  with patch('harness.audit.commands',return_value={'tests':['node','--test']}), patch('gate.sandbox.argv',return_value=['node','--test']) as wrap, patch('gate.sandbox.widened',return_value={'network':'local'}), patch('subprocess.run',return_value=type('Run',(),{'returncode':0,'stdout':'# pass 1\n# fail 0\n','stderr':''})()):
   project_start.full_suite(self.root,data=data)
  self.assertEqual(wrap.call_args.args,( ['node','--test'],self.root,data,'local'))
 @unittest.skipUnless(sandbox.available(),'macOS sandbox integration')
 def test_full_suite_cannot_read_scratch_workbench_private_data(self):
  data=self.base/'private';data.mkdir();marker=data/'marker';marker.write_text('scratch marker')
  (self.root/'tests').mkdir();(self.root/'tests/__init__.py').touch()
  (self.root/'tests/test_probe.py').write_text('import unittest\nfrom pathlib import Path\nclass Probe(unittest.TestCase):\n def test_private(self): self.assertEqual(Path('+repr(str(marker))+').read_text(), "scratch marker")\n')
  with patch('harness.audit.commands',return_value={'tests':[sys.executable,'-B','-m','unittest','tests.test_probe']}):
   self.assertFalse(project_start.full_suite(self.root,data=data)['passed'])
 def test_theme_refuses_linked_external_styles_before_writing(self):
  other=self.base/'other';other.mkdir();css=other/'input.css';css.write_text(theme.ADDED)
  (self.root/'styles').symlink_to(other,target_is_directory=True)
  with self.assertRaisesRegex(ValueError,'outside the project'):theme.save(self.root,light={'primary':'#ff0000'})
  self.assertEqual(css.read_text(),theme.ADDED)
 def test_add_theme_refuses_external_vendor_and_styles(self):
  for name in ['styles','vendor']:
   root=self.base/name;root.mkdir();other=self.base/(name+'-outside');other.mkdir()
   (root/name).symlink_to(other,target_is_directory=True)
   with self.assertRaisesRegex(ValueError,'outside the project'):theme.add_file(root)
   self.assertEqual(list(other.iterdir()),[])
 def test_font_path_is_checked_before_any_fetch(self):
  other=self.base/'font-outside';other.mkdir();(self.root/'static').symlink_to(other,target_is_directory=True)
  fonts=Fonts(self.base/'data')
  with patch.object(fonts,'entry',return_value={'weights':[400],'category':'sans-serif'}),patch.object(fonts,'fetch',side_effect=AssertionError('no network')):
   with self.assertRaisesRegex(ValueError,'outside the project'):fonts.download('Inter',self.root)
 def make_base(self):
  self.assertTrue(kit.build(self.root,['static'],[],files={'ROADMAP.md':'# Plan\n'})['passed'])
 def test_capability_refuses_external_vendor_before_copying(self):
  self.make_base();other=self.base/'outside';other.mkdir()
  import shutil
  shutil.move(str(self.root/'vendor'),str(self.base/'original-vendor'))
  (self.root/'vendor').symlink_to(other,target_is_directory=True)
  with self.assertRaisesRegex(ValueError,'outside the project'):kit.add(self.root,'qrcode')
  self.assertEqual(list(other.iterdir()),[])
 def test_red_baseline_keeps_every_file_and_head_unchanged(self):
  self.make_base();before=subprocess.check_output(['git','-C',str(self.root),'rev-parse','HEAD'])
  result=kit.add(self.root,'qrcode',full_suite=lambda folder:{'passed':False,'command':'node --test'})
  self.assertFalse(result['added']);self.assertIn('before',result['message'])
  self.assertFalse((self.root/'vendor/qrcode').exists())
  self.assertEqual(subprocess.check_output(['git','-C',str(self.root),'rev-parse','HEAD']),before)
  self.assertEqual(subprocess.check_output(['git','-C',str(self.root),'status','--porcelain']),b'')
 def test_project_sentence_is_kept_in_the_initial_goal(self):
  store=DocumentStore(self.base/'data');parent=self.base/'projects';parent.mkdir()
  start={'packages':['static'],'capabilities':[],'sentence':'Track rescued cats and their vaccinations.'}
  project=store.create_project('Cats',parent,'start',start=start)
  self.assertIn(start['sentence'],(store.project_path(project)/'ROADMAP.md').read_text())

 def test_live_assistant_finalization_preserves_the_answer(self):
  from harness.web_chat import ConversationStore
  store=ConversationStore(self.base/'chats');chat=store.create()['id']
  message={'role':'assistant','request':'live','content':'','choice':{'id':'q','pending':True}}
  store.upsert_assistant(chat,{**message,'_live_choice':True})
  value=store.get(chat);value['messages'][0]['choice'].update(answer='Yes',state='chosen');store.save(value)
  store.upsert_assistant(chat,{**message,'content':'Final answer'})
  rows=store.get(chat)['messages'];self.assertEqual(len(rows),1)
  self.assertEqual(rows[0]['choice']['answer'],'Yes')
