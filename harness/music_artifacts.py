"""Publish successful music-tool results through the chat's existing attachments.
Only fixed output filenames inside this project's assets/music tree are eligible.
Copies are immutable per message so later revisions cannot replace an old preview.
"""
from pathlib import Path
import shutil
import uuid


def music_attachments(event, project, uploads, conversation):
    if event.get('toolName') != 'music' or event.get('isError') or not project:
        return []
    result = event.get('result') or {}
    if result.get('isError'):
        return []
    paths = (result.get('details') or {}).get('artifacts') or []
    if not isinstance(paths, list):
        return []
    root = (Path(project) / 'assets/music').resolve()
    types = {'audio.wav': 'audio/wav', 'score.json': 'application/json',
             'pattern.strudel': 'text/plain', 'render.json': 'application/json'}
    attachments = []
    for raw in paths[:4]:
        if not isinstance(raw, str):
            continue
        path = Path(raw)
        try:
            resolved = path.resolve(strict=True)
            relative = resolved.relative_to(root)
            if len(relative.parts) != 3 or not relative.parts[1].isdigit() or path.name not in types:
                continue
            if not resolved.is_file() or resolved.stat().st_size > 12 * 1024 * 1024:
                continue
            # A symlinked music tree must never disclose an outside file.
            if not resolved.is_relative_to(Path(project).resolve()):
                continue
            uploads = Path(uploads); uploads.mkdir(parents=True, exist_ok=True)
            filename = uuid.uuid4().hex + '-' + path.name
            shutil.copyfile(resolved, uploads / filename)
            attachments.append({'name': path.name, 'mime': types[path.name],
                                'url': f'/api/files/{conversation}/{filename}'})
        except (OSError, ValueError):
            continue
    return attachments
