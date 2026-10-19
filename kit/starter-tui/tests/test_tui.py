"""The app as a person uses it, through Textual's pilot: one test per scenario in SCENARIOS.md, named after its title
(Pi Workbench and tests/test_protocol.py check the names). Given = arrange, When = press the keys, Then = check what
the screen shows. Run: uv run --offline pytest -v tests/test_tui.py"""
from pathlib import Path

from textual.widgets import Input, ListView, Static

from app.tui import NotesApp


async def test_add_a_note_with_enter_and_see_it_in_the_list(tmp_path: Path) -> None:
    # Given the app with no notes
    app = NotesApp(tmp_path / "test.sqlite3", language="en")
    async with app.run_test() as pilot:
        # When I type "buy milk" in New note and press Enter
        await pilot.click("#title")
        await pilot.press(*"buy milk", "enter")
        # Then the list has one note
        assert len(app.query_one("#notes", ListView).children) == 1


async def test_delete_the_highlighted_note_with_ctrl_d(tmp_path: Path) -> None:
    # Given the note "buy milk" in the list
    app = NotesApp(tmp_path / "test.sqlite3", language="en")
    async with app.run_test() as pilot:
        await pilot.click("#title")
        await pilot.press(*"buy milk", "enter")
        assert len(app.query_one("#notes", ListView).children) == 1
        # When I highlight it and press Ctrl+D
        await pilot.click("#notes")
        await pilot.press("ctrl+d")
        # Then the list has no notes
        assert len(app.query_one("#notes", ListView).children) == 0


async def test_an_empty_note_is_not_added_and_says_why(tmp_path: Path) -> None:
    # Given the app with no notes
    app = NotesApp(tmp_path / "test.sqlite3", language="en")
    async with app.run_test() as pilot:
        # When I press Enter with only a space written
        await pilot.click("#title")
        await pilot.press("space", "enter")
        # Then the app says "Write something first." and the list has no notes
        assert "Write something first." in str(app.query_one("#error", Static).render())
        assert len(app.query_one("#notes", ListView).children) == 0


async def test_start_in_japanese_and_switch_to_english_with_ctrl_l(tmp_path: Path) -> None:
    # Given the app started in Japanese
    app = NotesApp(tmp_path / "test.sqlite3", language="ja")
    async with app.run_test() as pilot:
        assert app.title == "メモ"
        # When I press Ctrl+L
        await pilot.press("ctrl+l")
        # Then the title says Notes and New note asks in English
        assert app.title == "Notes"
        assert app.query_one("#title", Input).placeholder == "New note (Enter adds it)"
