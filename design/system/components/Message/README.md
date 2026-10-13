# Message

A turn in the project chat.

- Yours: `.pw-msg.pw-msg--user`, right-aligned, framed with `radius-bubble`. Pi's: `.pw-msg`, unframed, left.
- Label row (`.pw-msg__label`): **You** or **Pi**, then the time. Body (`.pw-msg__body`) keeps line breaks.
- Pi's body is Markdown (`.pw-msg__body--md`): headings (chrome 17px), lists, **bold**, *italic*, `code` (framed mono), code blocks, quotes (dotted frame, italic), links, and task items (`.pw-msg__task` with a disabled `.pw-check`). Built as DOM nodes, never innerHTML.
- Reasoning: a `<details>` with summary Reasoning, closed by default; if the person opens it while Pi streams, it stays open. Attachments: images framed at most 420px wide, audio with native controls, other files as `.pw-file` links.
- While Pi works, the live message ends with a ToolCall in its `--live` state or a status line (Thinking…, Using bash…).
- **Also read:** a ContextLine (`.pw-context--after`) ends Pi's message when Pi opened files with its tools: “Also read: harness/work_queue.py · tests/test_work_queue.py”. Not shown when Pi read nothing beyond its context.
- Tables in Pi's Markdown render as a MarkdownTable (`.pw-msg__table`), scrolling sideways inside their own box when wide.
