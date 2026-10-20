"""Updates (the person, 2026-10-15: "make it easy for the user to update the app when a new version comes out").

Pi WorkStation is installed from a clone of its GitHub repository (install.json names it: the source). A check fetches
the clone's remote and says whether a new version is there and what changed, in plain words. An update is only ever a
fast-forward of that clone: never over changes that are not saved, never over the clone's own commits. plh then
installs the new build the next time it starts (plh.py update(), auto_update), or at once from /update.
"""
from pathlib import Path
import re
import subprocess

FETCH_SECONDS = 30


def git(root, *args, timeout=FETCH_SECONDS):
    return subprocess.run(['git', '-C', str(root), *args], capture_output=True, text=True, timeout=timeout)


def plain(subject):
    """A commit subject in plain words: no "feat:" or "fix:", no "(task 210)"."""
    subject = re.sub(r'^\w+(\([^)]*\))?!?:\s*', '', subject.strip())
    subject = re.sub(r'\s*\((tasks?|plan) [\d, -]+\)$', '', subject)
    return subject


def check(source, fetch=True):
    """{'state': 'current' | 'available' | 'blocked' | 'unknown', 'behind', 'changes', 'why'}."""
    source = Path(source)
    if git(source, 'rev-parse', '--is-inside-work-tree').returncode != 0:
        return {'state': 'unknown', 'why': f'{source} is not a git clone, so there is nothing to compare with.'}
    upstream = git(source, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}').stdout.strip()
    if not upstream:
        return {'state': 'unknown', 'why': 'This clone does not follow a branch on GitHub.'}
    if fetch:
        fetched = git(source, 'fetch', '--quiet', upstream.split('/', 1)[0])
        if fetched.returncode != 0:
            return {'state': 'unknown', 'why': 'Could not reach GitHub: ' + (fetched.stderr.strip().splitlines() or ['no answer'])[-1]}
    behind = int(git(source, 'rev-list', '--count', f'HEAD..{upstream}').stdout.strip() or 0)
    ahead = int(git(source, 'rev-list', '--count', f'{upstream}..HEAD').stdout.strip() or 0)
    changes = [plain(line) for line in git(source, 'log', '--format=%s', f'HEAD..{upstream}').stdout.splitlines()][:20]
    found = {'behind': behind, 'changes': changes, 'upstream': upstream}
    if ahead:
        return {**found, 'state': 'blocked', 'why': f'This copy has its own changes ({ahead} commit{"s" if ahead != 1 else ""} not on GitHub), so it is not updated automatically.'}
    if git(source, 'status', '--porcelain', '--untracked-files=no').stdout.strip():
        return {**found, 'state': 'blocked' if behind else 'current', 'why': 'Some files of Pi WorkStation were edited and not saved in a commit; updating would overwrite them.'}
    return {**found, 'state': 'available' if behind else 'current'}


def apply(source):
    """Fast-forward the clone to its GitHub branch; {'state': 'updated' | 'current' | 'blocked' | 'unknown', …}."""
    found = check(source)
    if found['state'] != 'available': return found
    merged = git(source, 'merge', '--ff-only', '--quiet', found['upstream'])
    if merged.returncode != 0:
        return {**found, 'state': 'blocked', 'why': 'The update could not be applied as is: ' + (merged.stderr.strip().splitlines() or [''])[-1]}
    commit = git(source, 'rev-parse', '--short', 'HEAD').stdout.strip()
    return {**found, 'state': 'updated', 'commit': commit}
