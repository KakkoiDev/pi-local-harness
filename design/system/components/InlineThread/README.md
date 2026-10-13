# InlineThread

A comment thread opened under its paragraph. One open at a time; opening another closes it.

- Messages (`.pw-thread__msg`): who and when on the left, text on the right.
- Pi's suggested change: `.pw-suggest` with `<del>` old text and `<ins>` new text, and **Keep Mine** / **Apply Change** (default). Applying edits the file and resolves the thread.
- Actions (`.pw-thread__actions`): Reply field and button, Ask Pi (only if not yet sent), Resolve; Delete only on your own comments not yet sent to Pi. A sent comment says so: Sent to Pi · waiting in queue · can no longer be deleted.
- Resolved threads: `.pw-thread--resolved`, a line "Resolved by you · 14:52" and Reopen.
- Data: Pi writes `suggestion: {anchor, replacement}` on the comment (the comment job prompt asks for it when the request only rewrites the selected text). Apply Change posts `/api/documents/apply-suggestion` (revision-checked, then resolves); Keep Mine posts `/api/documents/keep-suggestion` and leaves the thread open with "Pi suggested a rewrite. You kept your text."
