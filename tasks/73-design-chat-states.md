# 73: Pi Workbench System 1, chat states

Kind: code

Request 2026-10-13: "implement this new design." Build step 6 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 6.1 Chat).

- [x] Red (`tests/browser/chat.cjs`): messages carry `pw-msg` / `pw-msg--user`, label **Pi** in `<b>`; idle button reads `Send`; chips are `pw-chip` and the hint reads "3 files · 0.0 MiB of 20 MiB"; a 13 MiB file gives "“site-video.mov” is 13 MiB. Limit: 12 MiB per file and 20 MiB in total." with the caution icon; dragging 2 files shows `pw-composer--dragging` and "Drop to attach 2 files", leaving restores the hint; while TEST_WAIT runs a `.pw-tool--live` card says "Using bash…" and the button reads `Queue`; a second request shows "Next: 1 request waiting in Second project"; offline shows `#offline-banner` and disables Send, its Reconnect recovers.
- [x] `tests/fixtures/fake-pi.py`: TEST_WAIT emits `tool_execution_start` (bash) before sleeping, so the live card has something to show.
- [x] `js/chat.mjs`: `messageView`, `liveStatus`, queue note, `hint()` (attachments, dragging, recording, transcribing), error line with icon and the limit, Send/Queue label (any running job), recording button "Stop Recording" with `.pw-recording` dot, `aria-pressed`, "Recording · m:ss".
- [x] `js/workspace.mjs` calls `host.connection(online)` after each poll; `index.html` has `#offline-banner` with its own Reconnect (default).
- [x] `index.html`: Attach, Record, Send and the prompt start `disabled`. The new step made a startup race visible: the composer was enabled until the first poll finished.
- [x] Open Reasoning sections stay open when the transcript re-renders (the job finishing re-rendered it and closed them). Found because the existing "reasoning stays open across polls" check failed once timing shifted.
- Not tested: recording labels (the browser test has no microphone). Seen once in a debug run, not fixed: for one poll the live message and the finished message can both show the same reply.
