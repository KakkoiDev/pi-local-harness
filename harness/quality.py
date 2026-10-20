"""Read-only, offline Python correctness checks using an explicitly supplied Ruff.

No installs, project imports, configuration execution, suppressions or repairs.
Publication/UI integration remains a separate task.
"""
import json
import os
from pathlib import Path
import subprocess

VERSION = '0.17.1'
RULES = 'F821,F822,F823,E9'
EXCLUDED = frozenset(('.git', '.venv', 'venv', 'node_modules', '__pycache__', 'vendor', 'dist', 'build', 'design'))


def check(root, binary, *, timeout=60):
    """Return passed/findings/not_applicable/unavailable/error; never mutate source.

The host selects root and its previously approved executable. Ruff's own config
and noqa suppressions are ignored so project/model text cannot weaken this check.
Only regular .py files beneath root are handed to Ruff; symlinks are excluded.
"""
    report = dict(tool='ruff', version=VERSION, rules=RULES, status='error', findings=[], files=0)
    root = Path(root).resolve(); binary = Path(binary)
    if not root.is_dir(): return {**report, 'reason': 'Select an existing project folder.'}
    if not binary.is_absolute() or not binary.is_file():
        return {**report, 'status': 'unavailable', 'reason': 'The approved Ruff binary is not installed.'}
    if type(timeout) not in (int, float) or not 0 < timeout <= 600:
        return {**report, 'reason': 'Choose a timeout between zero and 600 seconds.'}
    try:
        version = subprocess.run([str(binary), '--version'], capture_output=True, text=True, timeout=timeout)
        if version.returncode or version.stdout.strip() != 'ruff ' + VERSION:
            return {**report, 'reason': 'Ruff does not match the approved version.'}
        paths = []
        def unreadable(error): raise error
        for folder, dirs, files in os.walk(root, followlinks=False, onerror=unreadable):
            base = Path(folder)
            dirs[:] = sorted(d for d in dirs if d not in EXCLUDED and not (base/d).is_symlink() and (base/d).relative_to(root).as_posix() != 'tests/fixtures')
            for name in sorted(files):
                path = base/name
                if path.suffix == '.py' and not path.is_symlink() and path.is_file():
                    paths.append(path)
                    if len(paths) > 10000: return {**report, 'reason': 'The source inventory exceeds 10000 files; select a smaller scope.'}
        report['files'] = len(paths)
        if not paths: return {**report, 'status': 'not_applicable', 'reason': 'No Python source files in this scope.'}
        argv = [str(binary), 'check', '--isolated', '--no-cache', '--ignore-noqa', '--select', RULES, '--output-format', 'json', '--', *map(str, paths)]
        result = subprocess.run(argv, cwd=root, capture_output=True, text=True, timeout=timeout)
        if result.returncode not in (0, 1) or len(result.stdout) > 4 * 1024 * 1024:
            return {**report, 'reason': 'Ruff could not complete its scan.'}
        rows = json.loads(result.stdout)
        if not isinstance(rows, list) or bool(rows) != (result.returncode == 1):
            return {**report, 'reason': 'Ruff returned an inconsistent report.'}
        selected = set(paths); findings = []
        for row in rows:
            path = Path(row['filename'])
            if path not in selected: raise ValueError('Unscoped diagnostic')
            location = row['location']; code = row['code']; message = row['message']
            if not isinstance(code, str) or not isinstance(message, str) or any(type(location[k]) is not int or location[k] < 1 for k in ('row', 'column')):
                raise ValueError('Malformed diagnostic')
            findings.append(dict(path=path.relative_to(root).as_posix(), code=code, message=message[:1000], line=location['row'], column=location['column']))
        return {**report, 'status': 'findings' if findings else 'passed', 'findings': findings}
    except (OSError, subprocess.SubprocessError, ValueError, TypeError, KeyError, AttributeError):
        return {**report, 'reason': 'The offline correctness check failed; source files were not changed.'}
