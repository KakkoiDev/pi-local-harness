# 125: Reasoning renders Markdown and wraps

Kind: code

Request 2026-10-13 (screenshot, phone): "on mobile, the markdown for the thinking is not formatted and it overflows the think box." Cause: js/chat.mjs puts the reasoning in a `<pre>` (mono, no wrapping).

- [x] Red (tests/browser/design.cjs, fake Pi `TEST_THINK` with Markdown and a long line): the Reasoning panel shows bold as bold and nothing overflows its box at 390px.
- [x] Render reasoning with js/message-markdown.mjs, in the text face, wrapped.
- Reasoning uses the reply renderer in the text face at 15px; long words and code wrap (`overflow-wrap:anywhere`). LaTeX such as `$i$` stays as typed (no maths rendering).
