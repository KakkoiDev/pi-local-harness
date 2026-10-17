"""Deterministic plan policy. All clients ask the same Gate service."""
from pathlib import PurePosixPath
import re

APPROVAL_WORDS = frozenset({'yes', 'go', 'ok', 'approve', 'approve plan', 'はい', 'お願いします', '計画を承認'})
FEATURE = re.compile(r'\b(?:add|build|create|new feature|implement|introduce)\b|追加|新機能|作って|作成', re.I)
SMALL = re.compile(r'\b(?:fix|bug|rename|typo|correct|repair)\b|修正|バグ|名前を変更', re.I)
PLAN = re.compile(r'\bplan\b|計画|プラン', re.I)
READ_ONLY = re.compile(r'^(?:explain|describe|show|read|what|why|how)\b|^(?:説明|教えて)', re.I)


def approval(text):
    return str(text or '').strip().rstrip('.!。！').strip().casefold() in APPROVAL_WORDS


def requires_plan(text, task='', *, first=False, small_fix=False):
    """Explicit planning wins; small repairs skip even in a new project; new features always plan."""
    text = str(text or '').strip()
    if PLAN.search(text): return True
    if SMALL.search(text) or small_fix: return False
    if FEATURE.search(text): return True
    if READ_ONLY.search(text): return False
    if 'Plan approved:' in task or re.search(r'[-*+] \[x\] Started', task): return False
    return first


def git_internal(path):
    """A path inside a repository's .git folder (the project's or a nested one's)."""
    return '.git' in PurePosixPath(str(path).replace('\\', '/')).parts


def file_allowed(task, path):
    """Files lists exact files and directory prefixes; no outside-project paths."""
    path = str(path).replace('\\', '/')
    if PurePosixPath(path).is_absolute() or '..' in PurePosixPath(path).parts: return False
    if git_internal(path): return False  # task 261: a hook there would run with the harness's own commit
    match = re.search(r'^Files:\s*(.+)$', task, re.M)
    if not match: return True
    entries = [entry.strip().strip('`') for entry in match[1].split(',')]
    return any(path == entry or entry.endswith('/') and path.startswith(entry) for entry in entries if entry)
