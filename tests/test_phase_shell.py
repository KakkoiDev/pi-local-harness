"""Task 247: the person's read-only shell exception is checked without running commands."""
try:
    import isolation  # noqa: F401
except ModuleNotFoundError:
    from tests import isolation  # noqa: F401
import unittest
from gate.phase_shell import read_only


class ReadOnlyShellTest(unittest.TestCase):
    def test_known_reads_and_pipelines(self):
        for command in ['pwd', 'ls -la', 'cat README.md', 'head -n 30 app.py', 'tail -20 app.py',
                        'wc -l app.py', 'rg --files', 'rg -n "score" src/', 'rg -g "*.py" TODO .',
                        'grep -rn score src/', 'diff -u old.py new.py', 'cat app.py | head -n 20',
                        'sed -n "1,30p" app.py', 'find src -type f -name "*.py" -print',
                        'git --no-pager --no-optional-locks -c core.fsmonitor=false status --short',
                        'git --no-pager --no-optional-locks -c core.fsmonitor=false diff --no-ext-diff --no-textconv']:
            self.assertTrue(read_only(command), command)

    def test_unknown_or_writing_shell_never_passes_as_read_only(self):
        for command in ['touch app.py', 'cat a > b', 'cat a >> b', 'cat a 2>/tmp/error',
                        'cat a; touch b', 'cat a && touch b', 'cat a || touch b', 'cat a\ntouch b', 'cat $(touch b)',
                        'cat `touch b`', 'ls <(touch b)', 'env cat a', 'sh -c "cat a"',
                        'python3 -c "print(1)"', 'pytest', 'npm test', 'rg --pre "touch b" a',
                        'rg --hostname-bin=./write a', 'find . -exec touch b \\;',
                        'find . -delete', 'sed -n "1w b" a', 'sed -n "e touch b" a',
                        'git status', 'git diff', 'git -c alias.read="!touch b" read',
                        'git --no-pager --no-optional-locks -c core.fsmonitor=false diff --output=b',
                        'git --no-pager --no-optional-locks -c core.fsmonitor=false diff --ext-diff',
                        'ls |', '"unterminated', '', 'cat $FILE', 'cat a &']:
            self.assertFalse(read_only(command), command)


class ReviewShellTest(unittest.TestCase):
    def test_unquoted_globs_cannot_expand_into_options(self):
        for command in ['find * -name x','rg foo *','rg foo ?','find [ab] -name x','rg foo {a,b}']:
            self.assertFalse(read_only(command),command)
        self.assertTrue(read_only('rg -g "*.py" foo .'))

    def test_ripgrep_config_is_not_a_read_only_exception(self):
        from unittest.mock import patch
        with patch.dict('os.environ',{'RIPGREP_CONFIG_PATH':'/scratch/config'}):
            self.assertFalse(read_only('rg foo .'))
            self.assertFalse(read_only('cat a | rg foo'))
            self.assertTrue(read_only('cat a'))

    def test_fetching_test_runners_need_offline_forms(self):
        from gate.phase_shell import test_run
        for command in ['npx vitest','npx jest','npx tsc','go test ./...','cargo test','uv run pytest']:
            self.assertFalse(test_run(command),command)
        for command in ['npx --no-install vitest','npx --no-install jest','npx --no-install tsc --noEmit','cargo test --offline','uv run --offline pytest','node --test tests/app.mjs','npm test']:
            self.assertTrue(test_run(command),command)
