# 82: Pi Workbench 1-bit, Apply Change

Kind: code

Request 2026-10-13: "finish now" (after task 80 left Phase 2 open). Build step 13 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12, the "Pi's suggested change (Keep Mine / Apply Change)" row of § 9.

- [x] Red (`tests/test_documents.py`): the comment prompt asks for `suggestion` with `replacement`; Apply Change needs a suggestion, checks the revision (stale raises `DocumentConflict` and leaves the file), replaces the anchor once and resolves; a handled suggestion cannot be applied again; Keep Mine marks it kept and leaves the comment open; an anchor no longer in the page or a non-text replacement is refused.
- [x] Red (`tests/browser/chat.cjs`): fake Pi answers a `TEST_SUGGEST` comment by writing a suggestion into the comment record; the thread shows `.pw-suggest` with the old text struck and the new text underlined, Keep Mine and Apply Change; Apply Change rewrites the block and resolves the comment.
- [x] `harness/documents.py`: `apply_suggestion`, `keep_suggestion`, the prompt sentence, and the suggestion in the readable record body. `harness/web_chat.py`: the two routes.
- [x] `js/workspace.mjs`: the suggestion box in the inline thread; Apply Change saves any local edit first, then reloads the page.
- [x] Test fixes forced by one more project-chat job: fake Pi reply numbers moved by one (line 109 had been matching an older reply, a false pass), activity record count 3, and the Activity arrow-key check walks the real distance between rows.
- `harness/AGENTS.md` is unchanged: `harness/install.py` migrates old installs by matching its last paragraph exactly. The per-job prompt carries the new instruction.
- Not tested: Keep Mine in the browser; Apply Change with unsaved local edits; a real model following the suggestion instruction.
