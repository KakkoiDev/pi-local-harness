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

    def test_a_run_goes_through_a_scratch_workbench_and_records_one_line(self):
        with tempfile.TemporaryDirectory() as folder:
            bin = Path(folder) / 'bin'; bin.mkdir()
            (bin / 'pi').write_text(f'#!{sys.executable}\n' + (ROOT / 'tests/fixtures/fake-pi.py').read_text()); (bin / 'pi').chmod(0o755)
            scenario = runner.scenarios(['bug-pagination'])[0]
            result = runner.run_one(scenario, 'fake:1b', 'low', Path(folder) / 'out', extra_env={'PATH': f"{bin}:{os.environ['PATH']}", 'PI_OLLAMA_URL': 'http://127.0.0.1:9'}, poll=0.5, log=lambda text: None, level='vague')
            self.assertEqual((result['prompt_level'], result['prompt']), ('vague', 'Paging is broken.'))
            self.assertEqual((result['scenario'], result['model'], result['effort'], result['status']), ('bug-pagination', 'fake:1b', 'low', 'completed'))
            self.assertFalse(result['solved'], 'the fake Pi changes nothing'); self.assertFalse(result['verified'])
            for key in ('harness', 'pi', 'ollama', 'seconds', 'tool_calls', 'reports', 'rules', 'gate_checks', 'check'): self.assertIn(key, result)
            self.assertRegex(result['harness'], r'^[0-9a-f]{7,}')
            lines = runner.read_jsonl(Path(folder) / 'out/results.jsonl'); self.assertEqual(len(lines), 1)
            run = Path(result['folder']); self.assertTrue((run / 'project/pager.py').is_file()); self.assertTrue((run / 'answer.md').is_file())
            self.assertEqual(runner.summary(lines)[0] | {}, {'model': 'fake:1b', 'effort': 'low', 'harness': result['harness'], 'prompt_level': 'vague', 'runs': 1, 'solved': 0, 'verified': 0,
                                                            'minutes': round(result['seconds'] / 60, 1), 'wake_ups': 0.0, 'refusals': 0.0})

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
