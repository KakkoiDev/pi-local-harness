"""The data: SQLite, numbered migrations (migrations/NNN-*.sql), one typed function per question."""
import sqlite3
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


@dataclass(frozen=True)
class Note:
    id: int
    title: str
    created: str


def connect(path: Path) -> sqlite3.Connection:
    """Open the database and bring it up to the latest migration."""
    connection = sqlite3.connect(path, check_same_thread=False)
    connection.execute("create table if not exists migrations (name text primary key)")
    done = {row[0] for row in connection.execute("select name from migrations")}
    for migration in sorted((ROOT / "migrations").glob("*.sql")):
        if migration.name not in done:
            connection.executescript(migration.read_text(encoding="utf-8"))
            connection.execute("insert into migrations (name) values (?)", (migration.name,))
    connection.commit()
    return connection


def notes(connection: sqlite3.Connection) -> list[Note]:
    """Every note, newest first."""
    rows = connection.execute("select id, title, created from notes order by created desc, id desc").fetchall()
    return [Note(int(row[0]), str(row[1]), str(row[2])) for row in rows]


def add_note(connection: sqlite3.Connection, title: str) -> Note:
    cursor = connection.execute("insert into notes (title) values (?)", (title,))
    connection.commit()
    row = connection.execute("select id, title, created from notes where id = ?", (cursor.lastrowid,)).fetchone()
    return Note(int(row[0]), str(row[1]), str(row[2]))


def delete_note(connection: sqlite3.Connection, note_id: int) -> None:
    connection.execute("delete from notes where id = ?", (note_id,))
    connection.commit()
