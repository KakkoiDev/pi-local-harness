# Scenarios

What the app does, as a person uses it: one `### Scenario: <title>` per behaviour, then its Given, When and Then lines.
Each scenario has one e2e test in `tests/e2e/` named after its title (`Add a note and see it in the list` is
`test_add_a_note_and_see_it_in_the_list`). `tests/test_protocol.py` checks it, with test-core's tools in
`test-core/`. A new feature adds its scenarios here with its tests; a removed feature removes both, knowingly.

The notes scenarios are the starter's sample: replace them with the app's own on the first real request.

## Notes

### Scenario: Add a note and see it in the list
- Given the notes page with no notes
- When I write "buy milk" in New note and press Add Note
- Then "buy milk" is in the list

### Scenario: Delete a note and it leaves the list
- Given the note "buy milk" in the list
- When I press its Delete button and confirm
- Then the list has no notes

### Scenario: An empty note is not added and says why
- Given the notes page with no notes
- When I press Add Note with nothing written
- Then the page says "Write something first."
- And the list has no notes

### Scenario: Switch the page to Japanese and back to English
- Given the notes page in English
- When I press 日本語
- Then the heading says メモ
- And pressing English brings back Notes

### Scenario: The notes page passes the accessibility smoke check
- Given the notes page with one note
- When the accessibility smoke check reads the page
- Then it finds no problem (names, labels, one heading, language, tab order, ids)
