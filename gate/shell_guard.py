"""Recognize obvious catastrophic shell operations, not a shell sandbox.

Sources and deliberate scope: specs/shell-safety.md. Commands are inspected, never run.
"""
import os
from pathlib import Path
import re
import shlex

ROOTS = {'/', '/Users', '/home', '/usr', '/etc', '/var', '/private', '/System', '/Library', '/Volumes', '/Applications', '/bin', '/sbin', '/dev', '/boot', '/root', '/tmp', '/private/tmp', str(Path.home())}
SEPARATORS = {';', '&&', '||', '|', '&', '(', ')'}
WRAPPERS = {'sudo', 'command', 'exec', 'nohup', 'time', 'env'}
SHELLS = {'sh', 'bash', 'zsh', 'dash', 'ksh'}

def broad_target(target):
    target = target.rstrip('/') or '/'
    if target in {'.', '..', '*', '.*', './*', '../*', '~', '~/*', '$HOME', '${HOME}', '$HOME/*', '${HOME}/*'}:
        return True
    expanded = os.path.expanduser(target)
    if expanded.endswith('/*'):
        expanded = expanded[:-2] or '/'
    normalized = os.path.normpath(expanded)
    return normalized in ROOTS or normalized in {'.', '..'} or bool(re.fullmatch(r'/(?:Users|home)/[^/]+', normalized))

def _segment(tokens, depth):
    while tokens and (Path(tokens[0]).name in WRAPPERS or re.match(r'^\w+=', tokens[0])):
        wrapper = Path(tokens.pop(0)).name
        while tokens and tokens[0].startswith('-'):
            option = tokens.pop(0)
            if wrapper == 'sudo' and option in {'-u', '-g', '--user', '--group'} and tokens:
                tokens.pop(0)
    if not tokens:
        return None
    command, args = Path(tokens[0]).name, tokens[1:]
    if command in SHELLS and depth < 4 and any(arg.startswith('-') and not arg.startswith('--') and 'c' in arg for arg in args):
        index = next(i for i,arg in enumerate(args) if arg.startswith('-') and not arg.startswith('--') and 'c' in arg) + 1
        return destructive_reason(args[index], depth + 1) if index < len(args) else None
    if command == 'rm':
        recursive = any(arg == '--recursive' or (arg.startswith('-') and not arg.startswith('--') and any(flag in arg for flag in 'rR')) for arg in args)
        if '--no-preserve-root' in args:
            return 'Removal explicitly disables root protection.'
        if recursive and any(broad_target(arg) for arg in args if not arg.startswith('-')):
            return 'Recursive deletion targets a filesystem root, home, parent, or broad current-directory glob.'
    if command in {'chmod', 'chown', 'chgrp'}:
        recursive = any(arg == '--recursive' or (arg.startswith('-') and 'R' in arg) for arg in args)
        if recursive and any(broad_target(arg) for arg in args if not arg.startswith('-')):
            return 'Recursive ownership/permission changes target a protected hierarchy.'
    if command.startswith(('mkfs', 'newfs')) and any(not arg.startswith('-') for arg in args):
        return 'Filesystem formatting destroys existing filesystem data.'
    if command == 'diskutil' and args and args[0].lower() in {'erasedisk', 'erasevolume', 'partitiondisk', 'zerodisk', 'randomdisk', 'securedisk', 'secureerase'}:
        return 'Disk erasure or repartitioning is blocked.'
    if command in {'wipefs', 'blkdiscard'} and any(arg in {'-a', '--all', '-f', '--force', '-o', '--offset'} or arg.startswith('--offset=') for arg in args):
        return 'Filesystem signature removal or block-device discard is blocked.'
    if command == 'blkdiscard' and any(arg.startswith('/dev/') for arg in args):
        return 'Block-device discard is blocked.'
    if command == 'dd' and any(arg.startswith('of=/dev/') and arg not in {'of=/dev/null', 'of=/dev/stdout', 'of=/dev/stderr'} for arg in args):
        return 'Raw writes to device files are blocked.'
    if command == 'shred' and any(arg.startswith('/dev/') or broad_target(arg) for arg in args if not arg.startswith('-')):
        return 'Irrecoverable destruction targets a device or broad hierarchy.'
    if command == 'find' and any(broad_target(arg) for arg in args[:1]) and '-delete' in args:
        return 'Broad find deletion is blocked.'
    return None

def destructive_reason(command, depth=0):
    try:
        lexer = shlex.shlex(command, posix=True, punctuation_chars=';&|()<>\n')
        lexer.whitespace = ' \t\r'
        lexer.whitespace_split = True
        tokens = list(lexer)
    except ValueError:
        return 'Malformed shell quoting prevents checking destructive scope.'
    segment = []
    for token in tokens + [';']:
        if token in SEPARATORS or token == '\n':
            reason = _segment(segment, depth)
            if reason:
                return reason
            segment = []
        else:
            segment.append(token)
    # Direct redirection to a raw disk is destructive even without dd.
    for index, token in enumerate(tokens[:-1]):
        if token in {'>', '>>'} and re.match(r'^/dev/(?:r?disk|sd|nvme|hd)', tokens[index + 1]):
            return 'Output redirection overwrites a raw disk device.'
    return None
