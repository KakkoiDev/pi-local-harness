"""Undo This Request (plan 198, design/briefs/app-preview.md): a verified request is one commit the harness made
(gate/paperwork.py, author "Pi Workbench"); undoing it is a new commit that reverses it, so history is kept. Only the
harness's own commits; never over the person's unsaved edits; a conflict leaves everything as it was and says why."""
import re
import subprocess

AUTHOR = 'Pi Workbench'
IDENTITY = ('-c', f'user.name={AUTHOR}', '-c', 'user.email=pi-workbench@localhost')


def git(root, *args, check=True):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, timeout=60, check=check)


def request_commit(root, commit):
    """(full id, title) of a commit the harness made, or ValueError."""
    if not re.fullmatch(r'[0-9a-f]{7,40}', str(commit)): raise ValueError('not a request Pi Workbench committed')
    found = git(root, 'log', '-1', '--format=%H%x00%an%x00%s', commit, '--', check=False)
    full, author, title = (found.stdout.strip().split('\0') + ['', '', ''])[:3] if found.returncode == 0 else ('', '', '')
    if author != AUTHOR: raise ValueError(f'{commit} is not a request Pi Workbench committed: only those can be undone here')
    return full, title


def undone_by(root, full):
    found = git(root, 'log', '--format=%h', f'--grep=This reverts commit {full}', '--fixed-strings').stdout.split()
    return found[0] if found else None


def preview(root, commit):
    """What undoing would change back: the request's title, its files with lines added and removed, and whether it is
    already undone."""
    full, title = request_commit(root, commit)
    files = []
    for line in git(root, 'show', '--numstat', '--format=', full).stdout.splitlines():
        added, removed, path = line.split('\t', 2)
        files.append({'path': path, 'added': int(added) if added.isdigit() else 0, 'removed': int(removed) if removed.isdigit() else 0})
    return {'commit': full[:12], 'title': title, 'files': files, 'undone': bool(undone_by(root, full))}


def undo(root, commit):
    found = preview(root, commit); full, _ = request_commit(root, commit)
    if found['undone']: return {'outcome': 'already undone', 'commit': undone_by(root, full), 'message': f"“{found['title']}” is already undone."}
    paths = [item['path'] for item in found['files']]
    edited = [line[3:] for line in git(root, 'status', '--porcelain', '--', *paths).stdout.splitlines()]
    if edited:
        return {'outcome': 'refused', 'message': f"Not undone: {', '.join(edited)} {'has' if len(edited) == 1 else 'have'} changes that are not saved in a commit. "
                'Undoing would overwrite them. Keep or discard those changes first.'}
    title = found['title']
    done = git(root, *IDENTITY, 'revert', '--no-edit', full, check=False)
    if done.returncode:
        conflicted = git(root, 'diff', '--name-only', '--diff-filter=U', check=False).stdout.split()
        git(root, 'revert', '--abort', check=False)
        return {'outcome': 'conflict', 'files': conflicted, 'message': f"Not undone: {', '.join(conflicted) or 'some files'} changed again after “{title}”, "
                'so going back would mix the two. Nothing was changed. Ask Pi to take that change out by hand.'}
    message = f'Undo: {title}\n\nThis reverts commit {full}.'
    git(root, *IDENTITY, 'commit', '--amend', '-q', '-m', message)
    return {'outcome': 'undone', 'commit': git(root, 'rev-parse', '--short=12', 'HEAD').stdout.strip(), 'files': paths,
            'message': f"Undone: “{title}”. {len(paths)} file{'s' if len(paths) != 1 else ''} changed back, as a new commit (nothing is lost: it can be redone)."}
