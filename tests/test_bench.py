"""Plan 189: the bench. Scenarios are fair (the hidden check fails at the start and passes with the reference solution),
and a run goes through a scratch workbench and records one result line (here with the fake Pi: never the real model)."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import json
import os
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

from bench import runner

ROOT = Path(__file__).resolve().parent.parent


class BenchTest(unittest.TestCase):
    def test_every_scenario_has_a_prompt_and_is_fair(self):
        for item in runner.scenarios():
            self.assertTrue(runner.prompt(item, 'everyday') and item['kind'] and item['id'] == Path(item['folder']).name, item['id'])
            if item.get('source'):  # history: the person's words; the old commit exists and its real fix applies (the fairness run is slow: python3 -m bench check)
                self.assertEqual(set(item['prompts']), {'everyday'}, 'only the words the person really used')
                runner.git(ROOT, 'cat-file', '-e', item['source']['commit']); self.assertTrue((Path(item['folder']) / 'solution.patch').stat().st_size > 0)
                continue
            verdict = runner.fair(item)
            if 'No Chromium' in verdict['said']: continue  # the UI scenario's check needs a browser
            self.assertTrue(verdict['fails_at_start'], f"{item['id']} is already solved at the start")
            self.assertTrue(verdict['passes_with_solution'], f"{item['id']}: {verdict['said']}")

    def test_runtime_static_starter_and_request_commit_boundary(self):
        scenario = {'id': 'scratch-pong', 'starter': 'static', 'folder': '/not-a-copy'}
        with tempfile.TemporaryDirectory() as folder:
            project = runner.prepare(scenario, folder)
            self.assertTrue((project / 'js/logic/notes.mjs').is_file())
            self.assertIn('Plan this app', (project / 'ROADMAP.md').read_text())
            baseline = runner.git(project, 'rev-parse', 'HEAD').strip()
            self.assertEqual(runner.request_commits(project, baseline), [])
            (project / 'game.txt').write_text('game')
            runner.git(project, 'add', 'game.txt')
            runner.git(project, '-c', 'user.name=Pi Workbench', '-c', 'user.email=bench@localhost', 'commit', '-qm', 'Build Pong')
            self.assertEqual(runner.request_commits(project, baseline), ['Pi Workbench\tBuild Pong'])

    def test_a_run_goes_through_a_scratch_workbench_and_records_one_line(self):
        with tempfile.TemporaryDirectory() as folder:
            bin = Path(folder) / 'bin'; bin.mkdir()
            (bin / 'pi').write_text(f'#!{sys.executable}\n' + (ROOT / 'tests/fixtures/fake-pi.py').read_text()); (bin / 'pi').chmod(0o755)
            scenario = runner.scenarios(['bug-pagination'])[0] | {'prompts': {'vague': 'Paging is broken. TEST_RUN_LOG'}}
            order=[];versions,start=runner.versions,runner.start_workbench
            def started(*args):
                # The audit fixture replays a person-approved test task; no model chooses the phase.
                from gate.paperwork import Paperwork
                from gate.protocol import Protocol
                data,work,*_=args;project=(work/'bug-pagination').resolve();task='tasks/999-test-audit.md'
                (project/task).write_text('# Audit\nPlan approved: chosen fixture\nFiles: tests/\n')
                paper=Paperwork(Protocol(),data=data)
                paper.plan_state(project,{'tasks':[task],'approved':True,'digest':paper.plan_digest(project,[task])})
                paper.phases.choose(project,'implementation',actor='person',planned=True,action='test fixture')
                order.append('start');return start(*args)
            with patch.object(runner,'versions',side_effect=lambda *args:(order.append('versions'),versions(*args))[1]),patch.object(runner,'start_workbench',side_effect=started):
                result = runner.run_one(scenario, 'fake:1b', 'low', Path(folder) / 'out', extra_env={'PATH': f"{bin}:{os.environ['PATH']}", 'PI_OLLAMA_URL': 'http://127.0.0.1:9'}, poll=0.5, log=lambda text: None, level='vague')
            self.assertEqual(order,['versions','start'],'record the build before the request runs')
            self.assertEqual((result['prompt_level'], result['prompt']), ('vague', 'Paging is broken. TEST_RUN_LOG'))
            self.assertEqual((result['scenario'], result['model'], result['effort'], result['status']), ('bug-pagination', 'fake:1b', 'low', 'completed'))
            self.assertIsInstance(result['decision_counts'],dict);self.assertGreater(result['decision_counts']['code'],0)
            self.assertTrue((Path(result['folder'])/'decisions.jsonl').is_file())
            self.assertEqual(len(result['test_runs']),1)
            test_run=result['test_runs'][0]; self.assertEqual(test_run['counts'],{'pass':3,'fail':1,'skipped':0})
            self.assertTrue((Path(result['folder'])/test_run['output_file']).is_file())
            self.assertFalse(result['solved'], 'the fake Pi changes nothing'); self.assertFalse(result['verified'])
            for key in ('harness', 'pi', 'ollama', 'seconds', 'tool_calls', 'reports', 'rules', 'gate_checks', 'check'): self.assertIn(key, result)
            self.assertRegex(result['harness'], r'^[0-9a-f]{7,}')
            lines = runner.read_jsonl(Path(folder) / 'out/results.jsonl'); self.assertEqual(len(lines), 1)
            run = Path(result['folder']); self.assertTrue((run / 'project/pager.py').is_file()); self.assertTrue((run / 'answer.md').is_file()); self.assertTrue((run / 'check.txt').is_file()); self.assertTrue((run / 'regressions.txt').is_file())
            self.assertEqual(runner.summary(lines)[0], {'model': 'fake:1b', 'effort': 'low', 'harness': result['harness'], 'prompt_level': 'vague', 'mode': 'harness', 'runs': 1, 'solved': 0,
                                                       'first_try': 0, 'verified': 0, 'pass_k': '0/1 (k=1)', 'minutes': round(result['seconds'] / 60, 1), 'wake_ups': 0.0, 'refusals': 0.0})
            self.assertEqual((result['regressions'], result['resolved'], result['user_turns']), (True, False, 0), 'its own tests still pass; the fake Pi asked nothing')

    def test_when_pi_asks_the_scripted_user_answers(self):
        with tempfile.TemporaryDirectory() as folder:
            bin = Path(folder) / 'bin'; bin.mkdir()
            (bin / 'pi').write_text(f'#!{sys.executable}\n' + (ROOT / 'tests/fixtures/fake-pi.py').read_text()); (bin / 'pi').chmod(0o755)
            scenario = runner.scenarios(['refactor-rename'])[0] | {'prompts': {'everyday': 'Rename it TEST_ASK'}, 'replies': ['Yes, keep it.', 'Never sent']}
            result = runner.run_one(scenario, 'fake:1b', 'low', Path(folder) / 'out', extra_env={'PATH': f"{bin}:{os.environ['PATH']}", 'PI_OLLAMA_URL': 'http://127.0.0.1:9'}, poll=0.5, log=lambda text: None)
            self.assertEqual(result['user_turns'], 1, 'one answer; the reply was not a question, so the run ended')

    def test_no_harness_against_harness_side_by_side(self):
        line = lambda scenario, mode, build, resolved, solved, seconds, first: {'scenario': scenario, 'model': 'qwen', 'prompt_level': 'everyday', 'mode': mode, 'harness': build,
                                                                                'resolved': resolved, 'solved': solved, 'seconds': seconds, 'first_try': first}
        table = runner.compare([line('a', 'bare', 'abc', False, False, 120, False), line('a', 'harness', 'abc', True, True, 300, True), line('b', 'bare', 'abc', False, True, 60, False), line('b', 'harness', 'abc', True, True, 240, False)])
        self.assertEqual(table['columns'], ['bare abc', 'harness abc'], 'bare first')
        self.assertEqual(table['rows'][0]['cells'], {'bare abc': '✗ 2 min', 'harness abc': '✓ 5 min (1 first try)'})
        self.assertEqual(table['rows'][1]['cells']['bare abc'], '~ 1 min', 'solved but broke its regression tests')
        self.assertEqual(table['totals'], {'bare abc': '0/2', 'harness abc': '2/2'})

    def test_readme_table_uses_resolved_median_and_keeps_pending_models(self):
        from bench.__main__ import main
        with tempfile.TemporaryDirectory() as folder:
            out=Path(folder);readme=out/'README.md';readme.write_text('Intro\n\n## How well it works\n\n<!-- bench:start -->old<!-- bench:end -->\nKeep this.\n')
            line={'model':'gemma4:e4b-mlx','harness':'abc1234','time':'2026-10-17T01:00:00+09:00','prompt_level':'everyday','verified':True,'solved':True,'resolved':False,'seconds':60,'mode':'harness'}
            lines=[line,line|{'resolved':True,'seconds':600},line|{'mode':'bare','verified':False,'resolved':True,'seconds':120}]
            (out/'results.jsonl').write_text(''.join(json.dumps(item)+'\n' for item in lines))
            self.assertEqual(main(['readme','--out',str(out),'--readme',str(readme)]),0)
            text=readme.read_text();self.assertIn('| Gemma 4 e4b (4B) | This Mac (Ollama) | 1/2 | 1/1 | 2/2 | 5.5 | abc1234 | 2026-10-17 |',text)
            self.assertIn('ChatGPT Luna | OpenAI API | Pending',text);self.assertIn('Keep this.',text);self.assertNotIn('-->old',text)
            self.assertEqual(main(['readme','--out',str(out),'--readme',str(readme)]),0);self.assertEqual(readme.read_text(),text)

    def test_the_console_shows_the_bench(self):
        from harness import admin
        with tempfile.TemporaryDirectory() as data:
            (Path(data) / 'bench').mkdir()
            line = {'time': '2026-10-15T12:00:00+09:00', 'scenario': 'bug-pagination', 'model': 'qwen3:8b', 'effort': 'low', 'harness': 'abc1234', 'solved': True, 'verified': True,
                    'seconds': 300, 'reports': {'wake-up': 1}, 'rules': {'G-008': 2}, 'status': 'completed', 'tool_calls': 9}
            (Path(data) / 'bench/results.jsonl').write_text(json.dumps(line) + '\n')
            value, text = admin.run(admin.Console(data), 'bench', [])
            self.assertEqual(value['summary'][0]['solved'], 1); self.assertIn('── Bench', text); self.assertIn('qwen3:8b', text); self.assertIn('bug-pagination', text)
            self.assertIn('bench', admin.COMMANDS)


if __name__ == '__main__':
    unittest.main()
