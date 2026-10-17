"""Generated media writes (task 291, the person's option A, 2026-10-18).

A media tool (music now, visual later) may write in every phase, but only a NEW numbered revision folder under its kind's
assets folder inside the project: `<folder>/<safe-name>/NNNN/`. Nothing existing is overwritten. Every media tool keeps the
same layout, so one check serves them all:

    <project>/<folder>/<name>/current.json   {"revision": n}, the current revision
    <project>/<folder>/<name>/NNNN/          one folder per revision, never rewritten

`create` writes revision 0001 of a name that does not exist yet; any other write action writes revision base+1, where
base must equal the current revision and the folder base+1 must not exist. Anything else follows the phase rules.
"""
from dataclasses import dataclass
import json
from pathlib import Path
import re


@dataclass(frozen=True)
class Kind:
    folder: str      # the kind's assets folder, relative to the project
    writes: tuple    # the tool's actions that write a revision
    create: str = 'create'  # the action that starts a new name at revision 0001


# The Pi tool name → its kind. A new media tool is one row here, and its writes use the layout above.
KINDS = {
    'music': Kind('assets/music', ('create', 'revise', 'render')),
    'visual': Kind('assets/visual', ('create', 'revise', 'render')),
}

NAME = re.compile(r'[a-z0-9][a-z0-9_-]{0,63}')


def handles(pi_tool, args):
    """True when this call is a media tool's revision write, which media_refusal alone decides."""
    kind = KINDS.get(pi_tool)
    return bool(kind) and isinstance(args, dict) and args.get('action') in kind.writes


def media_refusal(pi_tool, args, root, cwd):
    """None when the call writes only a new revision folder under the kind's assets folder; else why not, for the person."""
    kind = KINDS[pi_tool]
    label = pi_tool.capitalize()
    root = Path(root).resolve()
    name = args.get('name')
    if not isinstance(name, str) or not NAME.fullmatch(name):
        return f'Not written: {label} names are lowercase letters, digits, - and _ (up to 64), e.g. robot.'
    if Path(cwd).resolve() != root:
        return f'Not written: {label} is written only from the project folder, into {kind.folder}/{name}/.'
    # Each step on the way must be a real folder inside the project: a symlink could send the write anywhere.
    path = root
    for part in (*kind.folder.split('/'), name):
        path = path / part
        if path.is_symlink():
            return f'Not written: {path.relative_to(root).as_posix()} is a symlink; {label} writes only real folders inside the project.'
        if path.exists() and not path.is_dir():
            return f'Not written: {path.relative_to(root).as_posix()} is not a folder.'
    folder, shown = path, f'{kind.folder}/{name}'
    if args.get('action') == kind.create:
        if folder.exists():
            return f'Not written: {shown} already exists. Read it, then revise it as a new revision.'
        return None
    pointer = folder / 'current.json'
    if pointer.is_symlink():
        return f'Not written: {shown}/current.json is a symlink.'
    try:
        current = json.loads(pointer.read_text(encoding='utf-8')).get('revision')
    except (OSError, ValueError, AttributeError):
        return f'Not written: {shown} has no readable current revision. Create it first.'
    if not isinstance(current, int) or isinstance(current, bool) or current < 1:
        return f'Not written: {shown} has no readable current revision.'
    base = args.get('base')
    if not isinstance(base, int) or isinstance(base, bool) or base != current:
        return f'Not written: {shown} is at revision {current}. Read it, then pass base {current}.'
    revision = f'{current + 1:04d}'
    target = folder / revision
    if target.exists() or target.is_symlink():
        return f'Not written: {shown}/{revision} already exists; a revision is never overwritten.'
    return None
