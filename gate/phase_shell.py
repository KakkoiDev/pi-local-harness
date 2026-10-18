"""A deliberately small read-only shell grammar, not a claim that arbitrary shell is safe.

Discussion and Planning use this code rung. Unknown commands do not become reads because Pi says so.
Git reads must disable optional index writes, fsmonitor hooks, external diff and text conversion.
"""
import os
import re
import shlex

FLAGS = {
    'ls': ('alhRrtSdF1', set()), 'cat': ('nbsuvET', set()), 'wc': ('clmwL', set()),
    'head': ('nqc', set()), 'tail': ('nqc', set()), 'grep': ('rnRilLwFExcvHhs', set()),
    'diff': ('uqwbB', set()),
    'rg': ('nilLwFxcSHs', {'--files', '--hidden', '--no-ignore', '--line-number', '--ignore-case', '--fixed-strings', '--count', '--files-with-matches', '--files-without-match'}),
}
VALUES = {'head': {'-n', '-c'}, 'tail': {'-n', '-c'}, 'rg': {'-g', '--glob', '-e', '--regexp'}}


def segment(tokens):
    name, *args = tokens
    if name == 'pwd': return not args
    if name == 'sed':
        return len(args) >= 3 and args[0] == '-n' and bool(re.fullmatch(r'\d+(?:,\d+|,\$)?p', args[1])) and all(not x.startswith('-') for x in args[2:])
    if name == 'find':
        index = 0
        while index < len(args):
            arg = args[index]
            if arg in {'-name', '-iname', '-path', '-type', '-maxdepth', '-mindepth'}:
                index += 1
                if index == len(args): return False
            elif arg.startswith('-') and arg not in {'-print', '-a', '-o', '-not'}: return False
            index += 1
        return bool(args)
    if name == 'git':
        if args[:4] != ['--no-pager', '--no-optional-locks', '-c', 'core.fsmonitor=false']: return False
        args = args[4:]
        if not args: return False
        sub, *args = args
        allowed = {'status': {'--short', '--porcelain', '--branch', '-sb'},
                   'diff': {'--no-ext-diff', '--no-textconv', '--stat', '--name-only', '--cached', '--staged', '--check', '--', '-U0', '-U3'}}
        if sub not in allowed: return False
        if sub == 'diff' and not {'--no-ext-diff', '--no-textconv'} <= set(args): return False
        return all(arg in allowed[sub] or not arg.startswith('-') for arg in args)
    if name not in FLAGS: return False
    short, long = FLAGS[name]; index = 0
    while index < len(args):
        arg = args[index]
        if arg == '--': return True
        if arg in VALUES.get(name, set()):
            index += 1
            if index == len(args): return False
            if name in ('head', 'tail') and not re.fullmatch(r'\d+', args[index]): return False
        elif arg.startswith('--'):
            if arg not in long: return False
        elif arg.startswith('-') and arg != '-':
            if name in ('head', 'tail') and re.fullmatch(r'-\d+', arg): pass
            elif not arg[1:] or any(c not in short for c in arg[1:]): return False
        index += 1
    return True


def expands_glob(command):
    quote=None;escaped=False
    for char in command:
        if escaped:escaped=False;continue
        if char=='\\' and quote!="'":escaped=True;continue
        if char in "\"'":
            if quote==char:quote=None
            elif quote is None:quote=char
        elif quote is None and char in '*?[{':return True
    return False


def read_only(command):
    if not isinstance(command, str) or not command.strip(): return False
    # Reject shell expansion, redirection, control flow and assignments even inside quotes: the exception is small.
    if any(c in command for c in '\n\r$`<>;&()') or expands_glob(command): return False
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars='|'); lexer.whitespace_split = True
        lexer.commenters = ''; tokens = list(lexer)
    except ValueError: return False
    if any(token != '|' and '|' in token for token in tokens): return False
    current = []
    for token in tokens + ['|']:
        if token == '|':
            if not current or current[0]=='rg' and os.environ.get('RIPGREP_CONFIG_PATH') or not segment(current): return False
            current = []
        else: current.append(token)
    return True


def test_run(command):
    """Known project test runners in Implementation; no shell composition, injected scripts or output redirection."""
    from .protocol import TEST_COMMANDS
    if not isinstance(command, str) or any(c in command for c in '\n\r$`<>;&()|') or expands_glob(command): return False
    try: words = shlex.split(command)
    except ValueError: return False
    if not any(tuple(words[:len(prefix)]) == prefix for prefix in TEST_COMMANDS): return False
    if words[:1]==['npx'] and words[1:2]!=['--no-install']:return False
    if words[:1]==['go']:return False
    if words[:2]==['cargo','test'] and '--offline' not in words:return False
    if words[:2]==['uv','run'] and words[2:3]!=['--offline']:return False
    if any(word.startswith(('--import', '--require', '--eval', '--loader', '--config', '--rootdir', '--directory', '--output', '--junit', '--report', '--html')) or word in ('-e', '-c', '-r', '-C') for word in words): return False
    if not runner_options_allowed(words): return False
    outside = lambda value: value.startswith(('/', '../', '~')) or value == '..' or '/..' in value
    # Review P2: a value with a kind in front (--cov-report=html:/tmp/x) names a path too.
    return not any(outside(word) or outside(word.partition('=')[2]) or outside(word.partition('=')[2].partition(':')[2]) for word in words)


PYTEST = (('pytest',), ('py.test',), ('python', '-m', 'pytest'), ('python3', '-m', 'pytest'), ('uv', 'run', 'pytest'), ('uv', 'run', '--offline', 'pytest'))


def runner_options_allowed(words):
    """Task 261: options that delete a folder (pytest --basetemp), upload (--pastebin), load a plugin or a script
    (-p, -o addopts, --experimental-loader, --preload), or run another project's tests (--prefix, --cwd, make -f/-C,
    make VAR= that replaces SHELL or a compiler)."""
    short = lambda word, letters: re.fullmatch(r'-[A-Za-z0-9]+', word) is not None and any(letter in word[1:] for letter in letters)
    if any(tuple(words[:len(prefix)]) == prefix for prefix in PYTEST):
        if any(word.startswith(('--basetemp', '--pastebin', '--override-ini', '--confcutdir', '--rootdir', '--inifile', '-p')) or short(word, 'po') for word in words): return False
    if words[0] in ('npm', 'yarn', 'pnpm', 'bun'):
        if any(word.startswith(('--prefix', '--cwd', '--dir', '--preload', '--userconfig', '--globalconfig')) for word in words): return False
    if words[0] == 'make':
        if any('=' in word and not word.startswith('-') or word.startswith(('--file', '--makefile', '--include-dir', '--eval')) or short(word, 'fCIe') for word in words[1:]): return False
    if words[0] == 'node':
        if any(word.startswith(('--experimental-loader', '--test-reporter-destination', '--env-file', '--watch-path')) for word in words): return False
    return True
