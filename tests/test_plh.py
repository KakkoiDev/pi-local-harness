try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
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
            (data/'config.json').write_text(json.dumps({'effort':'medium','gate_port':1234,'web_port':4321}))
            fake=root/'pi';fake.write_text('#!'+sys.executable+'\nimport os,json,sys\nprint(json.dumps({"cwd":os.getcwd(),"args":sys.argv[1:],"port":os.environ["PI_WEB_PORT"]}))\n');fake.chmod(0o755)
            result=subprocess.run([sys.executable,str(ROOT/'plh.py'),'--mode','rpc'],cwd=root,env={**os.environ,'PATH':str(root)+os.pathsep+os.environ['PATH'],'PI_AGENT_DATA':str(data)},capture_output=True,text=True,check=True)
            record=json.loads(result.stdout);self.assertEqual(record['cwd'],str(Path.home()))
            self.assertEqual(record['args'][record['args'].index('--model')+1],'gpt-oss:20b');self.assertIn('medium',record['args']);self.assertIn('--no-extensions',record['args'])
            self.assertEqual(record['port'],'4321');self.assertTrue((data/'AGENTS.md').exists())
    def test_model_is_pinned_and_config_cannot_override_it(self):
        from harness.model import PROVIDER,MODEL
        self.assertEqual((PROVIDER,MODEL),('ollama','gpt-oss:20b'))
        with tempfile.TemporaryDirectory() as directory:
            Path(directory,'config.json').write_text('{"model":"ollama/other-model"}')
            with self.assertRaisesRegex(ValueError,'pinned'):configuration(directory)
            Path(directory,'config.json').write_text('{"model":"ollama/gpt-oss:20b"}')
            self.assertEqual(configuration(directory)['model'],'ollama/gpt-oss:20b')
            other=Path(directory,'fresh');configuration(other)
            self.assertNotIn('model',json.loads((other/'config.json').read_text()))
    def test_web_workers_ignore_model_environment_overrides(self):
        from unittest.mock import patch
        from harness.web_chat import pi_command
        with patch.dict(os.environ,{'PI_WEB_MODEL':'other-model','PI_WEB_PROVIDER':'other'}):
            command=pi_command('session.jsonl')
        self.assertEqual(command[command.index('--model')+1],'gpt-oss:20b');self.assertEqual(command[command.index('--provider')+1],'ollama')
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
            self.assertTrue((package/'harness/web_chat.py').exists());self.assertTrue((package/'DESIGN.md').exists())
            self.assertTrue((package/'design/tokens.css').exists());self.assertTrue((package/'design/icons.mjs').exists());self.assertTrue((package/'fonts').is_dir())
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
            env={**os.environ,'HOME':str(home),'PATH':str(home)+os.pathsep+os.environ['PATH'],'PI_WEB_PORT':isolation.free_port()}  # task 320: never the person's running Workbench
            env.pop('PI_AGENT_DATA',None)
            def launch():return subprocess.run([sys.executable,str(ROOT/'plh.py')],env=env,capture_output=True,text=True,check=True)
            record=json.loads(launch().stdout);data=home/'pi-local-harness-data'
            self.assertEqual(record['data'],str(data));self.assertTrue((data/'AGENTS.md').exists())
            settings=json.loads((data/'config.json').read_text());self.assertEqual(settings['effort'],'high')
            settings['effort']='medium';(data/'config.json').write_text(json.dumps(settings));launch()
            self.assertEqual(json.loads((data/'config.json').read_text())['effort'],'medium')
            self.assertFalse((home/'pi-local-agent-data').exists())

    def test_phase_update_replaces_the_installed_paperwork_instructions(self):
        from harness.install import install, PAPERWORK_247_BEFORE
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);data=root/'data';data.mkdir()
            (data/'AGENTS.md').write_text(PAPERWORK_247_BEFORE+'\n\nUser preference: keep this.\n')
            install(root/'prefix',root/'agent',data)
            memory=(data/'AGENTS.md').read_text()
            self.assertIn('System 1 creates the task layouts',memory)
            self.assertIn('User preference: keep this.',memory)

    def test_the_paperwork_paragraph_upgrades_without_erasing_memory(self):
        """Plan 184: Pi no longer keeps tasks or commits; an installed memory with the old paragraph gets the new one."""
        from harness.install import install, PAPERWORK_BEFORE
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);data=root/'data';data.mkdir()
            template=(ROOT/'harness/AGENTS.md').read_text();current=next(line for line in template.split('\n') if line.startswith('Chats belong'))
            (data/'AGENTS.md').write_text(template.replace(current,PAPERWORK_BEFORE)+'\nUser preference: retain this lesson.\n')
            install(root/'prefix',root/'agent',data)
            upgraded=(data/'AGENTS.md').read_text();self.assertIn('The harness keeps the paperwork',upgraded);self.assertIn('retain this lesson',upgraded);self.assertNotIn('Keep ROADMAP.md and tasks/*.md current',upgraded)
            self.assertTrue(list(data.glob('AGENTS.md.before-paperwork-*')))
            from harness.install import PAPERWORK_184, PAPERWORK_192
            (data/'AGENTS.md').write_text(template.replace(current,PAPERWORK_184))
            install(root/'prefix',root/'agent',data)
            self.assertIn('before or after it', (data/'AGENTS.md').read_text(), 'task 192: the wording before this one is upgraded too')
            (data/'AGENTS.md').write_text(template.replace(current,PAPERWORK_192))
            install(root/'prefix',root/'agent',data)
            self.assertIn('## For the person', (data/'AGENTS.md').read_text(), 'task 208: Pi writes the plain words the DoneRow shows')

    def test_owned_comment_instructions_upgrade_without_erasing_memory(self):
        from harness.install import install
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory);data=root/'data';data.mkdir()
            template=(ROOT/'harness/AGENTS.md').read_text()
            legacy=template.replace('Markdown comment record','JSON sidecar').replace('agent_reply in the comments frontmatter array','agent_reply')
            (data/'AGENTS.md').write_text(legacy+'\nUser preference: retain this lesson.\n')
            install(root/'prefix',root/'agent',data)
            upgraded=(data/'AGENTS.md').read_text();self.assertIn('Markdown comment record',upgraded);self.assertIn('retain this lesson',upgraded);self.assertNotIn('JSON sidecar',upgraded)
            self.assertTrue(list(data.glob('AGENTS.md.before-markdown-*')))

class NodeRequirementTest(unittest.TestCase):
    def test_supported_and_unsupported_versions(self):
        from plh import require_node
        from unittest.mock import patch
        for version, allowed in [('v20.19.0',False),('v22.18.9',False),('v22.19.0',True),('v24.0.0',True),('v22.19.0-rc.1',False),('not a version',False)]:
            with self.subTest(version=version), patch('plh.subprocess.run',return_value=subprocess.CompletedProcess([],0,version+'\n','')) as run:
                if allowed:require_node()
                else:
                    with self.assertRaisesRegex(ValueError,r'Pi needs Node >= 22\.19\.0'):require_node()
                self.assertEqual(run.call_args.kwargs['timeout'],5)
    def test_unavailable_node_has_a_clear_error(self):
        from plh import require_node
        from unittest.mock import patch
        for error in (FileNotFoundError(),subprocess.TimeoutExpired('node',5),subprocess.CalledProcessError(1,'node')):
            with self.subTest(error=type(error).__name__),patch('plh.subprocess.run',side_effect=error):
                with self.assertRaisesRegex(ValueError,r'Pi needs Node >= 22\.19\.0'):require_node()
