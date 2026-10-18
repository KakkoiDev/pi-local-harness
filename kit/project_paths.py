"""Checked paths for harness-owned project operations (including linked parent folders)."""
from pathlib import Path


def project_path(root, relative):
    root = Path(root)
    base = root.resolve()
    relative = Path(relative)
    if relative.is_absolute() or '..' in relative.parts:
        raise ValueError(f'{relative} is outside the project. Nothing was changed.')
    path = root
    for part in relative.parts:
        path = path / part
        if not path.resolve().is_relative_to(base):
            raise ValueError(f'{relative} is outside the project. Nothing was changed.')
    return path
