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

    def test_test_runners_cannot_delete_upload_or_load_code_from_elsewhere(self):
        # Task 261: options that delete a folder, upload output, load a plugin or script, or run from another folder.
        from gate.phase_shell import test_run
        for command in ['pytest --basetemp=/Users/me', 'pytest --basetemp ..', 'python3 -m pytest --basetemp=build',
                        'pytest --pastebin=all', 'pytest -p evil', 'pytest -pevil', 'python3 -m pytest -p no:cacheprovider',
                        'pytest -o addopts=-pevil', 'pytest --override-ini=cache_dir=/tmp', 'pytest --rootdir=/', 'pytest --confcutdir=..',
                        'npm test --prefix=..', 'npm test --prefix ..', 'npm run test --cwd=/tmp', 'pnpm test --dir ../other', 'yarn test --cwd ..',
                        'make test SHELL=/bin/sh', 'make test CC=evil', 'make -f Other.mk test', 'make test -f ../Makefile', 'make test --file=x', 'make -C .. test', 'make test --directory=..',
                        'node --test --experimental-loader ./x.mjs', 'node --test --experimental-loader=./x.mjs', 'node --test --import ./x.mjs', 'node --test --test-reporter-destination=/tmp/x',
                        'bun test --preload ./x.ts', 'bun test --preload=./x.ts', 'bun test --cwd ..',
                        'npm test --x=/etc/passwd', 'python3 -m unittest discover -s ..',
                        'pytest --cov-report=html:/tmp/x', 'pytest --cov-report=xml:../x.xml', 'npm --prefix .. test', 'pytest --basetemp', 'node --test --loader=./x.mjs']:  # review P2 runner list
            self.assertFalse(test_run(command), command)
        for command in ['pytest', 'pytest -q tests/test_app.py', 'pytest -x -vv -k counter', 'python3 -m pytest tests', 'uv run --offline pytest -q',
                        'python3 -m unittest discover -s tests -p "test_*.py"', 'python3 -m unittest -v', 'npm test', 'npm test -- --watch=false',
                        'npm run test', 'yarn test', 'pnpm test', 'make test', 'make test -j4', 'node --test tests/app.test.mjs',
                        'node --test --test-name-pattern=counter tests/', 'bun test', 'bun test tests/app.test.ts', 'pytest --cov-report=term-missing']:
            self.assertTrue(test_run(command), command)
