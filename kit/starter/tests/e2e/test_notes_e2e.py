# pyright: basic
"""The app in a real browser: one test per scenario in SCENARIOS.md, named after its title ("Add a note and see it in
the list" is `test_add_a_note_and_see_it_in_the_list`; Pi Workbench and tests/test_protocol.py check the names).
Given = arrange, When = act as the person does, Then = check what the person sees. The app and the browser come from
conftest.py; with no Playwright or no browser set up, these tests are skipped and say so (nothing is downloaded).
Run: uv run --offline pytest -v tests/e2e   (-v shows each test's name and result)
Find controls the way a person does: get_by_role with the name, get_by_label; data-testid only where nothing else fits.
Wait for what the person sees (wait_for), never for time.
Where an App Block's test block fits, use it: test-core's EditForm block (test-core/functional/blocks) knows a labelled
field and the error it shows (aria-invalid and its description)."""
from typing import Any

from functional import primitives as p
from functional.blocks.python.edit_form import EditForm


def add_note(page: Any, title: str) -> None:
    page.get_by_label("New note").fill(title)
    page.get_by_role("button", name="Add Note").click()


def test_add_a_note_and_see_it_in_the_list(base: str, page: Any) -> None:
    # Given the notes page with no notes
    page.goto(base)
    # When I write "buy milk" in New note and press Add Note
    add_note(page, "buy milk")
    # Then "buy milk" is in the list
    page.get_by_role("listitem").filter(has_text="buy milk").wait_for()
    assert page.get_by_role("listitem").count() == 1


def test_delete_a_note_and_it_leaves_the_list(base: str, page: Any) -> None:
    # Given the note "buy milk" in the list
    page.goto(base)
    add_note(page, "buy milk")
    row = page.get_by_role("listitem").filter(has_text="buy milk")
    row.wait_for()
    # When I press its Delete button and confirm
    page.once("dialog", lambda dialog: dialog.accept())
    row.get_by_role("button", name="Delete").click()
    # Then the list has no notes
    row.wait_for(state="detached")
    assert page.get_by_role("listitem").count() == 0


def test_an_empty_note_is_not_added_and_says_why(base: str, page: Any) -> None:
    # Given the notes page with no notes
    page.goto(base)
    # When I press Add Note with nothing written
    page.get_by_role("button", name="Add Note").click()
    # Then the page says "Write something first." and the list has no notes (EditForm: the field shows the error)
    field = EditForm(page, base).field("New note")
    p.expect_attribute(field, "aria-invalid", "true")
    p.expect_description(field, "Write something first.")
    assert page.get_by_role("listitem").count() == 0


def test_switch_the_page_to_japanese_and_back_to_english(base: str, page: Any) -> None:
    # Given the notes page in English
    page.goto(base)
    page.get_by_role("heading", name="Notes").wait_for()
    # When I press 日本語
    page.get_by_role("button", name="日本語").click()
    # Then the heading says メモ, and pressing English brings back Notes
    page.get_by_role("heading", name="メモ").wait_for()
    page.get_by_role("button", name="English").click()
    page.get_by_role("heading", name="Notes").wait_for()


def test_the_notes_page_passes_the_accessibility_smoke_check(base: str, page: Any, a11y_problems: Any) -> None:
    # Given the notes page with one note
    page.goto(base)
    add_note(page, "buy milk")
    page.get_by_role("listitem").filter(has_text="buy milk").wait_for()
    # When the accessibility smoke check reads the page; Then it finds no problem
    assert a11y_problems(page) == []
