# ContextLine

One line that says which files Pi gets with a request, before you send it (**Pi sees:**), and which files Pi opened itself while answering (**Also read:**).

- Where: under the Chat composer row; under the comment composer (Review window, phone comment sheet) and under an unsent thread's actions; under the “Ask Pi about this whole file” box. **Also read** sits at the end of Pi's message in Chat and of Pi's answer in a comment thread or whole-file answer (`.pw-context--after`, dotted rule above).
- Order: in **Chat**, the plan first — `ROADMAP.md (plan)`, “11 open tasks”, the current document, mentioned files, related files. For **comments and whole-file requests**, the current file first — `DESIGN.md (this file)`, then the plan, mentioned and related files. The order is the harness's priority for that kind of request. File names only: the full path is the link's `title`.
- Each file name is a link that opens the file in Work (a new tab on ⌘-click). “11 open tasks” is text.
- One line, always: items that do not fit are hidden and counted in `.pw-context__more` (“+2”). Pressing it sets `aria-expanded="true"` and `data-expanded` on the line, which wraps to show every item; it then reads “Less”. At 380px the line keeps the label, two names and the counter.
- It updates as you type (debounced 300 ms) from the same function the harness uses, so it never promises a file Pi will not get. Empty context: “Pi sees: nothing from this project”.
- Markup: `<p class="pw-context" id="chat-context"><span class="pw-context__label">Pi sees:</span><span class="pw-context__list" role="list"><span class="pw-context__item" role="listitem"><a href>ROADMAP.md</a><span class="pw-context__kind">(plan)</span></span>…</span><button class="pw-context__more" aria-expanded="false" aria-label="Show 2 more">+2</button></p>`.
- Phone: `.pw-context__more` is drawn 28px tall; an invisible 8px above and below makes its touch area 44px (confirmed).

## Round 11: why each file (task 234)

- The word after each name is now the **reason**, one word: `rules` (README.md, always), `plan` (ROADMAP.md, always), `task` (the task in progress, always), `named` (in the person's message), `changed` (changed in this request's commit), `related` (matched the request's words). Comment and whole-file requests keep `this file` for the file they are about. The line stays one line, with +N as before; link titles keep the full path.
- A **Why?** text button after +N (`.pw-context__why`, `aria-expanded`, `aria-controls="ctx-why"`) opens `section.pw-reasons#ctx-why role="dialog"`: “Why Pi sees these N files”, then per file the link, the reason word at the right, the reason sentence (“Always: the project’s rules”, “You named it: “notes.js” in your message”, “Changed in this request’s commit”, “Related: its name matches “subject””) and the full path (mono, dim); last line “Chosen again for every message. Never vendor/, licences, build output or files over 40 KB.” Desk: a popover above the line, Esc or Why? closes it, focus returns to Why?. Phone: a sheet “Pi sees these N files” with Done; Why? is 44 px tall.
- **Also read:** keeps its own items (files Pi opened); their reason is “Pi opened it”.

## Round 15: Preview actions (task 333)

When a FlowAttachment is on a message, Pi sees: lists it as one more item, `Preview actions (flow)` with its range, after the files; its title attribute is the range and step count. Removing the attachment removes the item. Pi's reasons popover says “flow: you reported a problem; the workbench attached this project's recent Preview actions”. See FlowAttachment.

## Round 17: found sources and the context receipt (plan 354)

**Existing vs Proposed.** Today the line is `Pi sees: README.md (rules) · ROADMAP.md (plan) · 002-subjects.md (task) +N Why?`: the +N counter mixes the deterministic files with *related* ones, and Why? opens one mixed list. Proposed: the deterministic items stay as they are (rules · plan · task · named · changed · flow). After a dotted separator (`.pw-context__sep`) comes one text item `.pw-context__found`: “2 found”, “none found”, “search catching up” or “no search”. **Why?** stays the only control, and it opens the new **ContextReceipt** (see that card). Searching needs nothing extra to click. Boards: R17_ProjectScope, R17_ContextReceipt, R17_ContextStates, R17_Context1024, R17_ContextExisting, Ph17_ProjectScope, Ph17_ContextSheet.

- Overflow: file names hide from the end, as today. “N found” and Why? never hide, and +N counts deterministic files only.
- Stale: “2 found” gets a trailing “!”, and its accessible name adds “1 changed after Pi read it”.
- The reason word **related** is retired. Retrieved files are “found” and live only in the receipt’s Found group.
- Why? now has `aria-haspopup="dialog"` and `aria-controls="context-receipt"`, replacing `ctx-why`.

Superseded: “Why Pi sees these N files” → “What Pi uses for this message”. “Related: its name matches “subject”” → (Found group) “Matches “subject””. Footer “Never vendor/, licences, build output or files over 40 KB.” → “…files over 40 KB, or other projects.” The +N counter no longer counts related files.

## Round 18: the line before sending (decisions 14, 19)

**Existing vs Proposed.** Existing: round 11 line. Proposed (round 18): the line stays “Pi sees:” and stays a preview of what is **always** sent. After the dotted separator it now ends with the scope, **“Searched: Class Notes only”** (`span.pw-context__scope#context-scope[data-search=ready|catching|unavailable]`), with the live search state appended: “· search catching up” / “· no search” (JA “検索範囲: Class Notes のみ”, “· 検索を準備中”, “· 検索なし”). Then Why?. Boards: R18_ProjectScope, R18_ProjectScopeStates, R18_Context1024, Ph18_ProjectScope.

- **Why?** (`aria-haspopup=dialog`, `aria-controls="context-before-send"`) opens **What Pi will use when you send** (JA “送信時に Pi が使うもの”): Searched: Class Notes only, the Always group, and “Found files are chosen when you send. Each message then keeps its own record under Pi’s answer, starting “Searched: Class Notes only · Pi used…”. Nothing is recorded for a draft.” Esc returns focus to Why?.
- Overflow: file names hide from the end; the scope and Why? never hide.
- The receipt of each sent message is reached from the summary under its answer (see ContextReceipt, Message).

Superseded (round 17 → round 18): `.pw-context__found` (“2 found”, “none found”, “search catching up”, “no search”) on the composer line → `.pw-context__scope` “Searched: Class Notes only” (+ “· search catching up” / “· no search”); the found count now lives in each answer's summary. Why? `aria-controls="context-receipt"` → `"context-before-send"`; it opens “What Pi will use when you send” instead of the latest receipt.

## Round 18 addendum (settled or superseded in round 19 — see Round 19)

Revised 21 Oct after review.

No change for Q7–Q9: the line before sending still ends “Searched: Class Notes only”. An @-mention chip in the draft doesn't widen what Pi sees or searches. It only marks the message as naming another project, so the boundary notice can follow the answer (see Message, Composer).

## Round 19 (decided, owner-delegated 21 Oct 2026)

No change: the line before sending still ends “Searched: Class Notes only”. An @ chip, including a disambiguated one, never widens what Pi sees or searches (A7).
