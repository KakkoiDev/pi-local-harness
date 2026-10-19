# Scenarios

What the app does, as a person uses it: one `### Scenario: <title>` per behaviour, then its Given, When and Then lines.
Each scenario has one e2e test named after its title, driving the real app through Textual's pilot (`run_test()`):
`Add a note with Enter and see it in the list` is `test_add_a_note_with_enter_and_see_it_in_the_list` in
`tests/test_tui.py` (or `tests/e2e/`). `tests/test_protocol.py` checks it, with test-core's tools in
`test-core/`. A new feature adds its scenarios here with its tests; a removed feature removes both, knowingly.

The notes scenarios are the starter's sample: replace them with the app's own on the first real request.

## Notes

### Scenario: Add a note with Enter and see it in the list
- Given the app with no notes
- When I type "buy milk" in New note and press Enter
- Then the list has one note

### Scenario: Delete the highlighted note with Ctrl+D
- Given the note "buy milk" in the list
- When I highlight it and press Ctrl+D
- Then the list has no notes

### Scenario: An empty note is not added and says why
- Given the app with no notes
- When I press Enter with only a space written
- Then the app says "Write something first."
- And the list has no notes

### Scenario: Start in Japanese and switch to English with Ctrl+L
- Given the app started in Japanese
- When I press Ctrl+L
- Then the title says Notes and New note asks in English
