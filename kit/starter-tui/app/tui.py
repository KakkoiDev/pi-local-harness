"""The terminal app (Textual): screens and keys only. Rules are in app/logic, data in app/db.py, words in messages/."""
import sqlite3
from pathlib import Path

from textual.app import App, ComposeResult
from textual.widgets import Footer, Header, Input, Label, ListItem, ListView, Static

from app import db, i18n
from app.logic.notes import check_title

ROOT = Path(__file__).resolve().parent.parent


class NoteItem(ListItem):
    """A row and the note behind it."""

    def __init__(self, note_id: int, title: str) -> None:
        super().__init__(Label(title))
        self.note_id = note_id


class NotesApp(App[None]):
    CSS = "#error { color: $error; height: auto; } #empty { color: $text-muted; padding: 1 2; }"

    def __init__(self, database: Path = ROOT / "data.sqlite3", language: str | None = None) -> None:
        super().__init__()
        self.connection: sqlite3.Connection = db.connect(database)
        self.language = language or i18n.choose()

    def t(self, key: str) -> str:
        return i18n.translate(self.language, key)

    def bind_keys(self) -> None:
        """The keys, with their names in the app's language (the footer shows them)."""
        for key, action, name in (("ctrl+d", "delete", "keys.delete"), ("ctrl+l", "language", "keys.language"), ("ctrl+q", "quit", "keys.quit")):
            self.bind(key, action, description=self.t(name))
        self.refresh_bindings()

    def compose(self) -> ComposeResult:
        yield Header()
        yield Input(id="title")
        yield Static("", id="error")
        yield ListView(id="notes")
        yield Static("", id="empty")
        yield Footer()

    def on_mount(self) -> None:
        self.translate_screen()
        self.show_notes()

    def translate_screen(self) -> None:
        self.bind_keys()
        self.title = self.t("app.name")
        self.query_one("#title", Input).placeholder = self.t("notes.title")
        self.query_one("#empty", Static).update(self.t("notes.empty"))

    def show_notes(self) -> None:
        notes = db.notes(self.connection)
        view = self.query_one("#notes", ListView)
        view.clear()
        for note in notes:
            view.append(NoteItem(note.id, note.title))
        self.query_one("#empty", Static).display = not notes

    def on_input_submitted(self, event: Input.Submitted) -> None:
        clean, problems = check_title(event.value)
        error = self.query_one("#error", Static)
        error.update(" ".join(self.t(problem.key) for problem in problems))
        if problems:
            return
        db.add_note(self.connection, clean)
        event.input.value = ""
        self.show_notes()

    def action_delete(self) -> None:
        item = self.query_one("#notes", ListView).highlighted_child
        if isinstance(item, NoteItem):
            db.delete_note(self.connection, item.note_id)
            self.show_notes()

    def action_language(self) -> None:
        self.language = "ja" if self.language == "en" else "en"
        self.translate_screen()


def main() -> None:
    NotesApp().run()


if __name__ == "__main__":
    main()
