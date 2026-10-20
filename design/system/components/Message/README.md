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

## Round 18: a receipt summary under every answer; the notice only for a named project (decisions 14, 16, 19)

**Existing vs Proposed.** Existing: round 15 message. Proposed (round 18):

- Every Pi answer to a submitted message ends with one **receipt summary** button, after “Also read:”: “Searched: Class Notes only · Pi used 3 always · 4 found · 2 left out”. It opens that message’s receipt in place (see ContextReceipt). An interrupted turn keeps its summary with “· Interrupted”. A draft has none.
- **Boundary notice** only when the message **explicitly names another registered project the person can open** (whole-name match, recorded with the job). An ordinary word with no match, or a name that isn't one of the person's projects, gets no notice; the summary's “Searched: Class Notes only” already states the scope. The notice text doesn't repeat the project name: “Pi searched Class Notes only. To search every project, ask in Overview.” + **Ask in Overview** + a visible description “Opens Overview with your question in a conversation searching all projects. Nothing is sent until you press Send.”
- **Ask in Overview** opens Overview, prefills its composer with the question and the scope “Searching all projects (5)”, focuses the composer and waits for Send. It reuses the current Overview conversation only if it has no messages; otherwise it starts a new one. If that empty conversation already holds a draft, Overview shows “This conversation already has an unsent draft.” with **Keep My Draft** (default focus) and **Replace with New Question** (B’s SearchScope/ConversationList boards).
- JA: “Pi が検索したのは Class Notes だけです。すべてのプロジェクトを検索するには、概要で質問してください。” / “概要で質問” / “概要を開き、すべてのプロジェクトを検索する会話に質問を入れます。送信を押すまで送られません。”
- Phone: the summary and Ask in Overview are 44 px. Boards: R18_ProjectScope, R18_ProjectScopeStates, Ph18_ProjectScope.

Superseded (round 17 → round 18): “only when the message names another registered project or asks about something outside this one” → “only when the message explicitly names another registered project the person can open”. JA “Overview で質問” → “概要で質問”; “…Overview で質問してください。” → “…概要で質問してください。”. Description “Opens Overview with your question in Ask across projects. Nothing is sent until you press Send.” → “Opens Overview with your question in a conversation searching all projects. Nothing is sent until you press Send.”
