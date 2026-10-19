"""Database (a capability chosen in Project Start), through Textual's pilot: its scenario in SCENARIOS.md, one test
named after its title."""
import sqlite3
from pathlib import Path

from app.tui import NotesApp


async def test_the_app_opens_again_on_the_same_database_file(tmp_path: Path) -> None:
    database = tmp_path / "app.sqlite3"
    # Given the app ran once on a database file
    first = NotesApp(database, language="en")
    async with first.run_test():
        assert first.title
    first.connection.close()
    # When it starts again on that file
    again = NotesApp(database, language="en")
    async with again.run_test():
        # Then it opens as before, and no migration ran twice
        assert again.title
    again.connection.close()
    with sqlite3.connect(database) as connection:
        names = [str(row[0]) for row in connection.execute("select name from migrations")]
    assert names and len(names) == len(set(names))
