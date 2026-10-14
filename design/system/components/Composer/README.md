# Composer

The message form at the bottom of the Chat window.

- Label, textarea (`.pw-field`), then a row: Attach…, Record, the hint, Stop ⌘. (only while Pi runs), and the default button. The default button reads **Queue** while the agent is busy and **Send** when idle; both add to the one queue.
- Attachments appear above the textarea as AttachmentChips (max 8 files, 12 MiB each, 20 MiB total).
- Recording: the Record button reads Stop Recording with a filled dot; then Transcribing… in the hint; the text lands at the cursor.
- Dragging files over the composer: `.pw-composer--dragging` (3px dashed inner outline).
- Errors sit above the form in `.pw-alert-line` with the Caution glyph.
- **Recording on the phone**: the Record button keeps its 44px shape and becomes `.pw-btn--rec[aria-pressed="true"]`: inverted, a paper dot, then the elapsed time “0:12” in tabular figures; `aria-label="Stop Recording"`. One bit, not red: the inversion is the recording signal, as a pressed button is everywhere else. Board: Ph_Recording.
- **Dictate** (task 155): the same three states as Record, as an icon button beside a comment field (Review composer, thread reply, whole-file question): mic at rest (`aria-label="Dictate"`), `.pw-btn--rec[aria-pressed="true"]` with the time while recording (`aria-label="Stop dictating"`), then disabled “Transcribing…” with the hourglass; the words land at the cursor. Board: C_Dictate.
