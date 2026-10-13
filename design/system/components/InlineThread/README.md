# InlineThread

A comment thread opened under its paragraph. One open at a time; opening another closes it.

- Messages (`.pw-thread__msg`): who and when on the left, text on the right.
- Pi's suggested change: `.pw-suggest` with `<del>` old text and `<ins>` new text, and **Keep Mine** / **Apply Change** (default). Applying edits the file and resolves the thread.
- Full column width under its paragraph (no indent). Actions (`.pw-thread__actions`), in this order: the state line (`.pw-thread__state`), Reply field and button, Ask Pi (only if not yet sent), Resolve, a gap, then Delete (only your own comments not yet sent to Pi).
- State lines: “Saved with the file · not sent to Pi” → “Sent to Pi · waiting in queue · can no longer be deleted” (waiting glyph) → “Pi is working on it” (running glyph) → “Pi answered · 14:21 · can no longer be deleted” (done glyph). A sent, unanswered thread ends with a “Show in Activity” link (`.pw-link`) to its request. Pi's answer appears only here, never in Chat.
- An unsent thread shows a ContextLine (“Pi sees: …”) under its actions; Pi's answer ends with “Also read: …” when Pi opened files.
- Resolved threads: `.pw-thread--resolved`, a line "Resolved by you · 14:52" and Reopen.
- Data: Pi writes `suggestion: {anchor, replacement}` on the comment (the comment job prompt asks for it when the request only rewrites the selected text). Apply Change posts `/api/documents/apply-suggestion` (revision-checked, then resolves); Keep Mine posts `/api/documents/keep-suggestion` and leaves the thread open with "Pi suggested a rewrite. You kept your text."
