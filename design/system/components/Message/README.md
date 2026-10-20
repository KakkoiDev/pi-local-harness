# Message

A turn in the project chat.

- Yours: `.pw-msg.pw-msg--user`, right-aligned, framed with `radius-bubble`. Pi's: `.pw-msg`, unframed, left.
- Label row (`.pw-msg__label`): **You** or **Pi**, then the time. Body (`.pw-msg__body`) keeps line breaks.
- Pi's body is Markdown (`.pw-msg__body--md`): headings (chrome 17px), lists, **bold**, *italic*, `code` (framed mono), code blocks, quotes (dotted frame, italic), links, and task items (`.pw-msg__task` with a disabled `.pw-check`). Built as DOM nodes, never innerHTML.
- Reasoning: a `<details>` with summary Reasoning, closed by default; if the person opens it while Pi streams, it stays open. Attachments: images framed at most 420px wide, audio with native controls, other files as `.pw-file` links.
- While Pi works, the live message ends with a ToolCall in its `--live` state or a status line (Thinking…, Using bash…).
- **Also read:** a ContextLine (`.pw-context--after`) ends Pi's message when Pi opened files with its tools: “Also read: harness/work_queue.py · tests/test_work_queue.py”. Not shown when Pi read nothing beyond its context.
- Tables in Pi's Markdown render as a MarkdownTable (`.pw-msg__table`), scrolling sideways inside their own box when wide.

## Round 15: visual results

A Pi message may end with one **VisualResult** card (an icon, an image, or a set of candidates), in the place the music player takes for sound. A message holds at most one such card. A newer revision shows in a new message, and the old card becomes `.pw-visual--old` (dotted border), with a line naming the newer one.

## Round 17: the project-scope notice under an answer (plan 354)

**Existing vs Proposed.** Existing: nothing tells the person that a project chat can’t see other projects. Proposed: one HarnessNotice under Pi’s answer, only when the message names another registered project or asks about something outside this one. Ordinary answers get no notice: the boundary is stated in the ContextReceipt (“Searched: Class Notes only”).

`<p class="pw-notice" role="note">ⓘ Harness · Pi searched Class Notes only. To search every project, ask in Overview. [Ask in Overview]</p>`. The button `#ask-in-overview` opens Overview · All Projects (⌃⌥0) with the question already in **Ask across projects**. Nothing is sent until the person presses Send. Its description reads “Opens Overview with your question in Ask across projects. Nothing is sent until you press Send.” JA: “Pi が検索したのは Class Notes だけです。すべてのプロジェクトを検索するには、Overview で質問してください。” / “Overview で質問”. At most one notice per answer, and it is never repeated on reload. The “Also read:” line under an answer is unchanged. Boards: R17_ProjectScope, R17_ContextStates (320 px), Ph17_ProjectScope.
