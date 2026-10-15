from pathlib import Path

from textual.widgets import Input, ListView, Static

from app.tui import NotesApp


async def test_a_note_is_added_with_enter_and_deleted_with_ctrl_d(tmp_path: Path) -> None:
    app = NotesApp(tmp_path / "test.sqlite3", language="en")
    async with app.run_test() as pilot:
        await pilot.click("#title")
        await pilot.press(*"buy milk", "enter")
        assert len(app.query_one("#notes", ListView).children) == 1
        await pilot.click("#notes")
        await pilot.press("ctrl+d")
        assert len(app.query_one("#notes", ListView).children) == 0


async def test_an_empty_note_says_why(tmp_path: Path) -> None:
    app = NotesApp(tmp_path / "test.sqlite3", language="en")
    async with app.run_test() as pilot:
        await pilot.click("#title")
        await pilot.press("space", "enter")
        assert "Write something first." in str(app.query_one("#error", Static).render())


async def test_japanese_from_the_start_and_with_ctrl_l(tmp_path: Path) -> None:
    app = NotesApp(tmp_path / "test.sqlite3", language="ja")
    async with app.run_test() as pilot:
        assert app.title == "メモ"
        await pilot.press("ctrl+l")
        assert app.title == "Notes"
        assert app.query_one("#title", Input).placeholder == "New note (Enter adds it)"
