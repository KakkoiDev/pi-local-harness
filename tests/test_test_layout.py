"""Task 263: a test defined after unittest.main() never runs in a direct run (which Gate counts), so none may be."""
try:
    import isolation  # noqa: F401  (first: no real Ollama, tailnet or live harness in tests)
except ModuleNotFoundError:  # run as tests.<module> from the repository root
    from tests import isolation  # noqa: F401
import ast
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]


def main_block_problems(source):
    """Problems with a module's `if __name__ == '__main__':` block: it must be the last statement, and only call things."""
    tree = ast.parse(source)
    mains = [index for index, node in enumerate(tree.body) if isinstance(node, ast.If) and '__main__' in ast.unparse(node.test) and '__name__' in ast.unparse(node.test)]
    problems = []
    if mains and mains[-1] != len(tree.body) - 1:
        problems.append(f'code after the __main__ block (line {tree.body[mains[-1] + 1].lineno})')
    for index in mains:
        if any(not isinstance(node, ast.Expr) for node in tree.body[index].body + tree.body[index].orelse):
            problems.append(f'the __main__ block at line {tree.body[index].lineno} defines more than calls')
    return problems


class TestLayoutTest(unittest.TestCase):
    def test_the_check_sees_a_test_after_main(self):
        self.assertEqual(main_block_problems("import unittest\nif __name__ == '__main__':\n    unittest.main()\n"), [])
        self.assertTrue(main_block_problems("if __name__ == '__main__':\n    unittest.main()\nclass Late:\n    pass\n"))
        self.assertTrue(main_block_problems("if __name__ == '__main__':\n    unittest.main()\n    def test_hidden(self): pass\n"))

    def test_no_test_file_has_code_after_its_main_block(self):
        problems = {path.name: main_block_problems(path.read_text(encoding='utf-8')) for path in sorted((ROOT / 'tests').glob('test_*.py'))}
        self.assertEqual({name: found for name, found in problems.items() if found}, {})

    def test_music_render_tests_say_not_run_when_skipped(self):
        """The render tests skipped everywhere with a bare `true`: a skip now reads "Not run: …", and CI fails instead."""
        text = (ROOT / 'tests/harness/music.test.mjs').read_text(encoding='utf-8')
        self.assertIn('Not run:', text)
        self.assertIn('process.env.CI', text)
        self.assertNotRegex(text, r"skip:\s*!existsSync")


    def test_browser_suites_write_screenshots_under_a_per_run_folder(self):
        """Fixed /tmp paths were shared by parallel runs (a flake source): every screenshot goes through shot()."""
        for path in sorted((ROOT / 'tests/browser').glob('*.cjs')):
            text = path.read_text(encoding='utf-8')
            self.assertNotRegex(text, r"path:\s*['`\"]/(private/)?tmp/", path.name)
            if 'screenshot(' in text:
                self.assertIn("mkdtempSync(join(tmpdir(),'plh-shots-'))", text, path.name)
                self.assertNotRegex(text, r"screenshot\(\{path:(?!shot\()", path.name)

if __name__ == '__main__':
    unittest.main()
