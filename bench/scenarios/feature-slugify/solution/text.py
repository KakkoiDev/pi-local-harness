"""Text helpers."""
import re
import unicodedata


def slugify(title):
    plain = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-") or "untitled"
