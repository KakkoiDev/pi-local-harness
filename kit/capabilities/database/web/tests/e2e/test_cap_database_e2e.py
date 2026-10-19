# pyright: basic
"""Database (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
after its title. The app and the browser come from tests/e2e/conftest.py; with no browser set up it is skipped and
says so."""
import sqlite3
from typing import Any


def test_the_app_opens_again_on_the_same_database_file(tmp_path: Any, page: Any, serve: Any) -> None:
    database = tmp_path / "app.sqlite3"
    # Given the app ran once on a database file
    with serve(database) as base:
        assert page.goto(base).ok
    # When it starts again on that file
    with serve(database) as base:
        response = page.goto(base)
        # Then it opens as before, and no migration ran twice
        assert response.ok
        page.locator("body").wait_for()
    with sqlite3.connect(database) as connection:
        names = [row[0] for row in connection.execute("select name from migrations")]
    assert len(names) == len(set(names))
