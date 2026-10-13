# 103: Chat renders Markdown and hides the reply marker

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): found during review: Pi replies show raw `**bold**` and backticks; every reply starts with the internal `[CANARY]` marker.

- [x] Red: assistant text renders headings, lists, bold, code; `[CANARY]` is not shown (still checked by the harness).
- [x] Render with the existing Markdown block code; no HTML from the model.
- `js/message-markdown.mjs`: blocks from markdown-blocks.mjs, inline bold/italic/code/http links as text nodes (bold and italic nest). Lists group; task items use `pw-check`; quote and code match `.pw-doc`. `[CANARY]` is stripped for display in chat, Activity Result, document requests and Pi thread replies. Red: tests/harness/message-markdown.test.mjs (module missing); browser: design.cjs with fake Pi `TEST_MARKDOWN`.
