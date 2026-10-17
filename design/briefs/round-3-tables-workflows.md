# Brief: round 3 — table blocks, open questions, and end-to-end workflows

Date: 2026-10-13. For: the designer AI that made Pi Workbench 1-bit.
Canvas: https://claude.ai/artifact/Re2trGpSgYLrd2anCHTRyK. Design system: https://claude.ai/artifact/JrBZmw41xj2wXGSFiDxmB1.
The person asked for "a clean and clear design". Keep Pi Workbench 1-bit: 1-bit ink on paper, existing tokens and components first, no new colours. Use the names the product uses: **Gate** (never the old checker name), **New File…**, block types **Paragraph, Heading, Task, Bullet, Number, Quote, Code, Raw Markdown**.

Your last round (agent scope, what Pi sees, compaction) is in the repo and being built. This round has four parts: **A** a table block, **B** answers to open questions from your last round, **C** end-to-end workflows as board sequences, **D** small corrections.

---

## Part A: Tables in documents

### Today

- Documents are real Markdown files. A GFM table (`| a | b |`, a `| --- |` rule, rows) is kept as a **Raw Markdown** block: the person sees and edits pipe text in a mono frame. The file stays exactly as written.
- The block menu (Turn Into, Add Block Below) has no Table, and the person asked: "I don't see tables in the dropdown, is it that we should make them in pure markdown?"
- In Chat, Pi's tables already render as tables: ink rules like `.pw-table`, header cells in the chrome face, a wide table scrolls inside its own box (`.pw-msg__table`).

### Decided direction (the person may refine)

A **Table** block type: it reads as a table and edits as its Markdown, so the file stays plain Markdown.

1. **Reading**: the block shows a real table (same look as Chat tables, at document type sizes). Alignment from the rule row (`:---`, `:---:`, `---:`). Inline marks render (bold, italic, code, links).
2. **Editing**: focusing the block (click, Return on it, or Turn Into) switches it to its Markdown text in the mono frame, like Code; leaving the block shows the table again. Invalid Markdown stays as text with a note, never lost.
3. **Creating**: Turn Into › Table and Add Block Below › Table insert a starter table (2 columns, header + 1 row) with the caret in the first header cell's text.
4. **Comments**: a passage inside a table can be commented like any text.

### Decide and show

1. The table block at rest, focused (handle visible), and in its Markdown editing state. Does the editing state show a small preview, a hint ("Edit as Markdown · Esc shows the table"), or nothing?
2. Where Table sits in Turn Into / Add Block Below, and its handle menu (is there "Add Row" / "Add Column" as menu items that edit the Markdown for you? Optional; say yes or no).
3. Wide tables: horizontal scroll inside the block (as in Chat), or wrap cells?
4. Phone (PhoneEdit1/5): how a table reads at 390px, how it is edited (the Markdown text in the sheet? the bottom edit bar?), and the block sheet's 3×2 type grid with Table added (3×3 now with Code and Raw Markdown, or a "More types" row).
5. Optional, for later: direct cell editing (Tab between cells, add/remove row/column). Show it only if you think it is clearly better; it is much more work.

Deliverables: a `W_Table` board (rest, focused, editing), Turn Into in `P_Popups` and `PhoneEdit5`, a phone table board, the DocumentBlock card and CSS (`.pw-block--table`, the table look shared with `.pw-msg__table`).

---

## Part B: Open questions from your last round

The build takes the bracketed decision until you confirm or change it. Please answer each, and fix the cards so they agree with the boards.

1. **IMPLEMENTATION.md** was not updated last round (still View ⌘1–⌘4, titles Activity/Gate, Activity in the phone popup). Please add a section per part: markup, ids, ARIA, states. [The repo updates it as it builds.]
2. **SegmentedControl** card still lists four view tabs; **Popup** card lists block styles "Text … Checkbox" while DocumentBlock, P_Popups and PhoneEdit5 say Paragraph and Task. [Paragraph, Task; two view tabs.]
3. **StatusButton**:
   - card markup is a `<button>`, boards use a link [button];
   - no state for "only queued, nothing running" [show "⧖ 1 waiting"];
   - attention always reads "Stopped · 1 needs attention" [use the real state: Failed / Stopped / Interrupted];
   - A_Attention shows attention while Activity is open, the card says it clears when Activity opens [it clears when Activity opens];
   - Working and attention at the same time [attention wins until Activity is opened, then Working].
4. **InlineThread**: the card says Ask Pi only before sending; Final and C_WorkDesk show it on answered threads [keep it: follow-up questions work and replace Pi's earlier answer].
5. **ContextLine order**: card says plan first; comment and whole-file boards put the current file first [file first for comments and whole-file requests, plan first in Chat].
6. **ContextMeter**: the card says the per-request context is not counted; the usage Pi reports includes it [show Pi's reported usage; say so in the card].
7. **New Conversation alert** makes the non-safe action the default button, unlike every other alert [as drawn; confirm].
8. **Earlier conversations**: no board for the read-only view or the Agent › Earlier Conversations ▸ submenu, and no address [read-only view built from your CompactionMarker card text; address proposal welcome, e.g. `/p/<project>/chat/earlier/<id>`].
9. **Gate fence icon** exists only inline in C_ProjectsWin [copied into icons.mjs; please add it to the Icons group].
10. **Returning from Activity/Gate**: View ⌘1/⌘2 are disabled there; which view a project row opens is unspecified [the close box returns to the last project page; a project name or row opens that project's Chat].
11. **Activity empty copy** says terminal Pi waits in the queue; terminal Pi runs directly, not through the queue [copy kept; reword if you prefer accuracy, e.g. "Requests from every project and comment wait here in one queue."].
12. **G_Tablet** keeps Project and hides Check/From in Gate; Projects window 220px [as drawn].

---

## Part C: End-to-end workflows

Draw each as a short left-to-right sequence of boards (desktop, and phone where marked), each step labelled with the person's action and what they see. Reuse existing boards where they fit; only draw what changes. The goal is to check that every flow is clear and has no dead end.

1. **First run** (desktop and phone): no projects → Create Your First Project… or Use an Existing Folder… → the new project's Chat with the Plan (ROADMAP, tasks/001) → Create Roadmap for a folder without one (W_NoPlan).
2. **Ask in Chat and follow the work**: type, Send → live reply with reasoning and tool cards (Gate verdicts) → status button "Working · 1 waiting" → open Activity → back to the project with the close box.
3. **Comment and ask Pi** (desktop and phone): select a passage → Comment (desktop floating bar / phone long press) → write → Add & Ask Pi → thread "Sent to Pi · waiting in queue" → "Pi is working on it" → "Pi answered · 14:21" with Also read → follow-up question in the same thread → Resolve. Include the suggested-change path (Keep Mine / Apply Change).
4. **Ask about the whole file**: open "Ask Pi about this whole file" → Pi sees line → Send Request → the answer card under Review (never in Chat).
5. **Plan work**: New Task… (Plan +) → task opens → check boxes → progress "2/3" in the Plan group → all checked → it moves to Done.
6. **Edit a document** (desktop and phone): add blocks (handle › Add Block Below, Return, click below the last block), turn into another type, move, delete with Undo, add a table (Part A).
7. **Long conversation**: meter rises → near ("earlier turns are summarised after this answer") → compaction marker appears → Show Summary → New Conversation… → "‹ Earlier conversation" → read-only earlier conversation → Back to Current.
8. **Something went wrong**: a blocked command (Gate verdict on the tool card → Show in Gate → Event Info → Show in Activity); a failed request (status button attention → Activity → Ask Pi to Retry…); connection lost (offline banner → Reconnect).
9. **Phone access**: Open on Phone… with phone access on (address, QR, copy) and off ("Phone access is off." with the enable link). Note: the terminal now prints a QR code of the phone address at startup; the dialog could show the same QR.
10. **Switching projects** (desktop and phone): from inside a project → ‹ Projects / π sheet → another project, keeping the view; ⌘K Find Project.

For each flow, list any step where the person could get lost, and fix it in the boards.

---

## Part D: Small corrections

- Chat boards (S_Near and others): the composer shows "[object Object]" (a draft binding).
- The meter reads "Context 20 k of 32k" with a space before "k".
- Phone (Phone, Ph_Pi): the built app now follows your phone boards; please check Ph_Pi against the Agent section (it replaced the status card) and Ph_Views against "Activity · all" / "Gate · all".

---

## Deliverables

- Part A boards and card/CSS as listed.
- Part B: corrected cards (SegmentedControl, Popup, StatusButton, InlineThread, ContextLine, ContextMeter, Menu) and answers in a short note.
- Part C: one sequence per flow (`F1_FirstRun`, `F2_ChatWork`, … `F10_SwitchProject`), phone sequences where marked.
- `IMPLEMENTATION.md` sections for this round and the last.

When you are done, the repo re-syncs the canvas and the system into `design/` and builds from them.
