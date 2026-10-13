# 103: Chat renders Markdown and hides the reply marker

Kind: code

Request 2026-10-13 (UI review of http://127.0.0.1:3000): found during review: Pi replies show raw `**bold**` and backticks; every reply starts with the internal `[CANARY]` marker.

- [ ] Red: assistant text renders headings, lists, bold, code; `[CANARY]` is not shown (still checked by the harness).
- [ ] Render with the existing Markdown block code; no HTML from the model.
