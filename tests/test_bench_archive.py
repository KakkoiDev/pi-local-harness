try:
    import isolation
except ModuleNotFoundError:
    from tests import isolation
from pathlib import Path
import collections
import json
import re
import unittest
from bench.runner import readme_table

ROOT=Path(__file__).resolve().parents[1]
ARCHIVE=ROOT/'docs/bench/2026-10-17'

class PublishedBenchTests(unittest.TestCase):
    def test_historical_batch_is_complete_sanitized_and_reproducible(self):
        self.assertTrue((ARCHIVE/'results.jsonl').is_file(),'Publish the 22 approved historical records')
        rows=[json.loads(line) for line in (ARCHIVE/'results.jsonl').read_text().splitlines()]
        self.assertEqual(collections.Counter((r['model'],r['mode']) for r in rows),{('gemma4:e4b-mlx','harness'):9,('gemma4:e4b-mlx','bare'):9,('qwen3.8:27b-mlx','harness'):4})
        self.assertEqual({r['harness'] for r in rows},{'3847bc1'})
        self.assertEqual(sum(r['resolved'] for r in rows),7)
        for row in rows:
            folder=ARCHIVE/row['folder']
            self.assertEqual(json.loads((folder/'result.json').read_text()),row)
            for name in ('answer.md','git-log.txt'):
                self.assertTrue((folder/name).is_file(),str(folder/name))
            self.assertTrue(list(folder.glob('request-*.md')),str(folder))
            self.assertNotIn('decision_counts',row,'Do not invent historical decision provenance')
        self.assertIn(readme_table(rows),(ROOT/'README.md').read_text())
        self.assertIn('3847bc1',(ARCHIVE/'README.md').read_text())
        for file in ARCHIVE.rglob('*'):
            self.assertNotEqual(file.name,'services.log')
            self.assertNotEqual(file.name,'project')
            if file.is_file():
                self.assertIsNone(re.search(r'/Users/|/private/var/folders/|\bsk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}',file.read_text()),str(file))
