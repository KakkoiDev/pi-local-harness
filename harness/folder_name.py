"""A new project's folder name (task 327, the coordinator's decision for finding 14): New Project “Habit Tracker” makes
the folder habit-tracker, and the project's name stays “Habit Tracker”.

The folder is a slug: lowercase, words joined by hyphens, no spaces. Latin letters lose their accents (“Café Notes” →
cafe-notes). A name in another script, such as Japanese, is not transliterated (that needs a dictionary the workbench
does not ship): its letters are kept as they are, in Unicode NFC, with hyphens for spaces and punctuation (“家計簿 アプリ”
→ 家計簿-アプリ). Such a folder works in macOS, git, Python and the shell; only spaces and punctuation are what break
commands. An existing folder is never used or overwritten: the next free name gets -2, -3 and so on."""
from pathlib import Path
import re
import unicodedata


def _unaccented(char):
    """é → e, ß stays; a kana with its voicing mark (ガ) stays whole: only an accent on a Latin letter goes."""
    parts = unicodedata.normalize('NFD', char)
    return parts[0] if parts[0].isascii() and all(unicodedata.combining(mark) for mark in parts[1:]) else char


def folder_slug(name):
    """The folder name for a project called `name`, or ValueError when nothing usable is left."""
    text = unicodedata.normalize('NFKC', str(name or '')).strip()
    latin = ''.join(_unaccented(char) for char in text)
    words = re.findall(r'[^\W_]+', latin.lower())  # letters and digits of any script; the rest separates words
    value = unicodedata.normalize('NFC', '-'.join(words))[:80].strip('-')
    if not value: raise ValueError('Give the project a name with at least one letter or digit.')
    return value


def free_folder(parent, name):
    """The path New Project creates for `name` in `parent`: the slug, or the slug with -2, -3… when that one exists."""
    parent = Path(parent); base = folder_slug(name); path = parent / base; number = 2
    while path.exists() or path.is_symlink():
        path = parent / f'{base}-{number}'; number += 1
    return path
