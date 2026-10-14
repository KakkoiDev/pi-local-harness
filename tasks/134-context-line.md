# 134: "Pi sees:" lines

Kind: code

Request 2026-10-13: "design updated" (re-synced in task 126); build what the agent-scope brief asked for. Inventory of design vs code: 2026-10-13 review.

- [x] Red (browser): ContextLine under the chat composer, the comment composer, an unsent thread and the whole-file box; "+N"/"Less"; names open in Work; empty "Pi sees: nothing from this project" (design.cjs).
- [x] Decided: for comments and whole-file requests the current file comes first (boards).
- [x] Built: `js/context-line.mjs` (`contextLine`, `showContext`) reads `GET /api/context-preview` (task 133), debounced 300 ms, cached 3 s (threads re-render on every poll); file names link to Work (⌘-click opens a new tab); "(plan)" and "(this file)" as kinds; overflow hidden from the end into "+N", which toggles `data-expanded` and reads "Less". Refits when its container's width changes, never on its own size (that looped).
- [x] The phone composer, "Pi sees:" included, stays within a quarter of the screen: it measures itself again when the line changes.
- [x] Phone: "+N" is drawn 28px tall (card); an invisible `::after` makes its touch area 44px. Asked in `design/briefs/round-4-notes.md` item 11.
- [x] Found on the way: the browser suites never read the test server's stderr; the request log filled the pipe and the server stalled mid-request. This caused the random failures (a document that never opened, a phone row that did not navigate, connection resets). Both suites now drain it, print its errors on failure, and SIGKILL a server that does not stop within 5 s, so a failed run exits instead of hanging.
- [x] Found on the way: a chat selection that finished late showed Chat over a view chosen meanwhile (the intermittent "second project" step in chat.cjs: Work clicked, Chat came back). It now shows Chat only when no other view was chosen since it started.
- [x] Green: verify_workflow, design.cjs and chat.cjs (both exit 0).
