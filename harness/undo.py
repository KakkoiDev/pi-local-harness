"""Undo This Request (plan 198, design/briefs/app-preview.md): a verified request is one commit the harness made
(gate/paperwork.py, author "Pi Workbench"); undoing it is a new commit that reverses it, so history is kept. Only the
harness's own commits; never over the person's unsaved edits; a conflict leaves everything as it was and says why."""
from datetime import datetime
import re
import subprocess

AUTHOR = 'Pi Workbench'
IDENTITY = ('-c', f'user.name={AUTHOR}', '-c', 'user.email=pi-workbench@localhost', '-c', 'core.hooksPath=/dev/null')  # no hooks (task 261)


def git(root, *args, check=True):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, timeout=60, check=check)


def request_commit(root, commit):
    """(full id, title) of a commit the harness made, or ValueError."""
    if not re.fullmatch(r'[0-9a-f]{7,40}', str(commit)): raise ValueError('not a request Pi Workbench committed')
    found = git(root, 'log', '-1', '--format=%H%x00%an%x00%s%x00%b', commit, '--', check=False)
    full, author, title, body = (found.stdout.strip().split('\0') + ['', '', '', ''])[:4] if found.returncode == 0 else ('', '', '', '')
    # Task 312: a theme the person saved in the panel is their own commit, marked so the same Undo can take it back.
    theme = title.startswith('Theme: ') and re.search(r'^Workbench-Change: theme$', body, re.M)
    if author != AUTHOR and not theme: raise ValueError(f'{commit} is not a request Pi Workbench committed: only those can be undone here')
    return full, title


def undone_by(root, full):
    found = git(root, 'log', '--format=%h', f'--grep=This reverts commit {full}', '--fixed-strings').stdout.split()
    return found[0] if found else None


def name(title):
    """The request as the web names it: Activity shows the task, so "(task 002)" goes (round 7, point 12)."""
    return re.sub(r'\s*\(task \d+(, (?:not verified|plan incomplete))?\)$', '', title)


def person_lines(root, full, title):
    """The task's "For the person" lines in this commit (DoneRow): Pi writes them for someone who does not read code."""
    for path in git(root, 'show', '--name-only', '--format=', full).stdout.split():
        if re.match(r'tasks/\d+-.*\.md$', path):
            text = git(root, 'show', f'{full}:{path}', check=False).stdout
            found = re.search(r'^## For the person\n+(.*?)(?=^## |\Z)', text, re.MULTILINE | re.DOTALL)
            lines = [line.strip() for line in found.group(1).splitlines() if line.strip()] if found else []
            if lines: return lines[:3]
    return [name(re.sub(r'^(Undo|Redo): ', '', title))]


def preview(root, commit):
    """What the DoneRow shows and what undoing would change back: the request's name and plain words, its time, its
    files with lines added and removed, whether it is already undone, and the request it undid (if it is an undo)."""
    full, title = request_commit(root, commit)
    files = []
    for line in git(root, 'show', '--numstat', '--format=', full).stdout.splitlines():
        added, removed, path = line.split('\t', 2)
        files.append({'path': path, 'added': int(added) if added.isdigit() else 0, 'removed': int(removed) if removed.isdigit() else 0})
    body = git(root, 'log', '-1', '--format=%B%x00%cI', full).stdout
    reverts = re.search(r'This reverts commit ([0-9a-f]{40})', body)
    when = datetime.fromisoformat(body.rsplit('\0', 1)[-1].strip()).strftime('%H:%M')
    words = person_lines(root, original_of(root, full), title)  # an undo or a redo quotes the request in plain words
    incomplete=re.search(r'^Plan incomplete \(G-014\): .+',body,re.M)
    if incomplete:words=[incomplete[0],*words][:3]
    return {'commit': full[:12], 'title': title, 'name': name(title), 'person': words, 'time': when, 'files': files,
            'verified': not title.endswith((', not verified)', ', plan incomplete)')), **({'plan_incomplete':True} if incomplete else {}), 'undone': bool(undone_by(root, full)), **({'undone_at': undone_time(root, full)} if undone_by(root, full) else {}),
            **({'undo_of': reverts.group(1)[:12]} if reverts else {})}


def undone_time(root, full):
    found = git(root, 'log', '-1', '--format=%cI', undone_by(root, full)).stdout.strip()
    return datetime.fromisoformat(found).strftime('%H:%M') if found else ''


def original_of(root, full):
    """Follow undo and redo back to the request itself (each reverts the one before)."""
    for _ in range(50):
        found = re.search(r'This reverts commit ([0-9a-f]{40})', git(root, 'log', '-1', '--format=%B', full).stdout)
        if not found: return full
        full = found.group(1)
    return full


def later_change(root, full, paths):
    """The newest request after this one that changed these files: the overlap alert names it."""
    found = git(root, 'log', '-1', '--format=%h%x00%s%x00%cI', f'{full}..HEAD', '--', *paths, check=False).stdout.strip()
    if not found: return None
    short, title, when = found.split('\0')
    return {'commit': short, 'title': title, 'name': name(title), 'time': datetime.fromisoformat(when).strftime('%H:%M')}


def save_edits(root, paths):
    """Save Them, Then Undo: the person's unsaved edits become their own entry, "Your edits · 14:38"."""
    who = git(root, 'config', 'user.name', check=False).stdout.strip() or 'You'
    mail = git(root, 'config', 'user.email', check=False).stdout.strip() or 'you@localhost'
    git(root, 'add', '--', *paths)
    git(root, '-c', f'user.name={who}', '-c', f'user.email={mail}', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', f"Your edits · {datetime.now().strftime('%H:%M')}", '--', *paths)


def undo(root, commit, save_first=False):
    """Undo (or, for an undo, Redo) a request. save_first: commit the person's unsaved edits in those files first."""
    found = preview(root, commit); full, _ = request_commit(root, commit)
    if found['undone']: return {'outcome': 'already undone', 'commit': undone_by(root, full), 'message': f"“{found['title']}” is already undone."}
    paths = [item['path'] for item in found['files']]
    edited = [line[3:] for line in git(root, 'status', '--porcelain', '--', *paths).stdout.splitlines()]
    if edited and save_first: save_edits(root, edited); edited = []
    if edited:
        return {'outcome': 'refused', 'message': f"Not undone: {', '.join(edited)} {'has' if len(edited) == 1 else 'have'} changes that are not saved in a commit. "
                'Undoing would overwrite them. Keep or discard those changes first.'}
    title = found['title']
    done = git(root, *IDENTITY, 'revert', '--no-edit', full, check=False)
    if done.returncode:
        conflicted = git(root, 'diff', '--name-only', '--diff-filter=U', check=False).stdout.split()
        git(root, 'revert', '--abort', check=False)
        later = later_change(root, full, conflicted or paths)
        where = f" in “{later['name']}” ({later['time']})" if later else ''
        return {'outcome': 'conflict', 'files': conflicted, **({'later': later} if later else {}),
                'message': f"Not undone: {', '.join(conflicted) or 'some files'} changed again after “{title}”{where}, "
                'so going back would mix the two. Nothing was changed. Ask Pi to take that change out by hand.'}
    redo = title.startswith('Undo: ')
    message = f"{'Redo: ' + title[len('Undo: '):] if redo else 'Undo: ' + title}\n\nThis reverts commit {full}."
    git(root, *IDENTITY, 'commit', '--amend', '-q', '-m', message)
    return {'outcome': 'undone', 'commit': git(root, 'rev-parse', '--short=12', 'HEAD').stdout.strip(), 'files': paths,
            'message': f"Redone: “{title[len('Undo: '):]}”. {len(paths)} file{'s' if len(paths) != 1 else ''} changed again, as a new commit." if redo else
                       f"Undone: “{title}”. {len(paths)} file{'s' if len(paths) != 1 else ''} changed back, as a new commit (nothing is lost: it can be redone)."}
