import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from plh import configuration
ROOT=Path(__file__).resolve().parent.parent
class LauncherTest(unittest.TestCase):
    def test_launch_anywhere_uses_home_and_config_without_changing_pi(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);data=root/'data';data.mkdir()
            (data/'config.json').write_text(json.dumps({'model':'ollama/test-model','effort':'medium','laya_port':1234,'web_port':4321}))
            fake=root/'pi';fake.write_text('#!'+sys.executable+'\nimport os,json,sys\nprint(json.dumps({"cwd":os.getcwd(),"args":sys.argv[1:],"port":os.environ["PI_WEB_PORT"]}))\n');fake.chmod(0o755)
            result=subprocess.run([sys.executable,str(ROOT/'plh.py'),'--mode','rpc'],cwd=root,env={**os.environ,'PATH':str(root)+os.pathsep+os.environ['PATH'],'PI_AGENT_DATA':str(data)},capture_output=True,text=True,check=True)
            record=json.loads(result.stdout);self.assertEqual(record['cwd'],str(Path.home()))
            self.assertIn('test-model',record['args']);self.assertIn('medium',record['args']);self.assertIn('--no-extensions',record['args'])
            self.assertEqual(record['port'],'4321');self.assertTrue((data/'AGENTS.md').exists())
    def test_invalid_settings_do_not_start_pi(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory,'config.json').write_text('{"effort":"bogus"}')
            with self.assertRaisesRegex(ValueError,'effort'):configuration(directory)
    def test_install_is_self_contained_and_preserves_unrelated_pi_settings(self):
        from harness.install import install
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);agent=root/'agent';(agent/'extensions').mkdir(parents=True)
            (agent/'settings.json').write_text(json.dumps({'defaultProvider':'ollama','defaultModel':'gemma4:26b-mlx','defaultThinkingLevel':'high','packages':['user-package']}))
            (agent/'extensions/local-harness.ts').symlink_to('/missing/checkout/.pi/extensions/local-harness.ts')
            (agent/'AGENTS.md').write_text((ROOT/'harness/legacy-AGENTS.md').read_text())
            install(root/'prefix',agent,root/'data')
            package=root/'prefix/share/pi-local-harness'
            self.assertTrue((package/'harness/web_chat.py').exists())
            self.assertEqual((root/'prefix/bin/plh').resolve(),(package/'plh.py').resolve())
            self.assertFalse((agent/'extensions/local-harness.ts').is_symlink())
            settings=json.loads((agent/'settings.json').read_text());self.assertEqual(settings,{'packages':['user-package']})
            self.assertTrue((root/'data/config.json').exists())
            self.assertFalse((agent/'AGENTS.md').exists());self.assertTrue((root/'data/legacy-global-AGENTS.md').exists())
            (root/'data/AGENTS.md').write_text('Custom persistent memory')
            install(root/'prefix',agent,root/'data')
            self.assertEqual((root/'data/AGENTS.md').read_text(),'Custom persistent memory')

    def test_unrelated_command_collision_changes_nothing(self):
        from harness.install import install
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);binary=root/'prefix/bin';binary.mkdir(parents=True);(binary/'plh').write_text('user command')
            with self.assertRaisesRegex(RuntimeError,'unrelated command'):install(root/'prefix',root/'agent',root/'data')
            self.assertEqual((binary/'plh').read_text(),'user command');self.assertFalse((root/'prefix/share').exists())

    def test_first_launch_creates_harness_data_and_preserves_config(self):
        with tempfile.TemporaryDirectory() as directory:
            home=Path(directory).resolve();fake=home/'pi'
            fake.write_text('#!'+sys.executable+'\nimport os,json\nprint(json.dumps({"data":os.environ["PI_AGENT_DATA"]}))\n');fake.chmod(0o755)
            env={**os.environ,'HOME':str(home),'PATH':str(home)+os.pathsep+os.environ['PATH']}
            env.pop('PI_AGENT_DATA',None)
            def launch():return subprocess.run([sys.executable,str(ROOT/'plh.py')],env=env,capture_output=True,text=True,check=True)
            record=json.loads(launch().stdout);data=home/'pi-local-harness-data'
            self.assertEqual(record['data'],str(data));self.assertTrue((data/'AGENTS.md').exists())
            settings=json.loads((data/'config.json').read_text());self.assertEqual(settings['effort'],'high')
            settings['effort']='medium';(data/'config.json').write_text(json.dumps(settings));launch()
            self.assertEqual(json.loads((data/'config.json').read_text())['effort'],'medium')
            self.assertFalse((home/'pi-local-agent-data').exists())
