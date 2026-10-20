# StatusButton

The agent status at the right of the menu bar, as a button that opens **Activity · All Projects** (⌘3). It reads as status first: at rest it has no frame, only the glyph and the words.

- Markup: `<button id="agent-status" class="pw-statusbtn" aria-keyshortcuts="Meta+3" aria-label="Agent status: Working, 1 waiting. Open Activity">` holding the StatusGlyph, `<span id="agent-state" role="status">Working · 1 waiting</span>` and `<span class="pw-statusbtn__more">` (the `back` icon mirrored, 10px). The live region is the inner span, so the button's name is not re-announced on every poll. It is always a `<button>` (the canvas boards use one too).
- States: **rest** (no frame; › hidden) · **hover** (1px ink frame, › shown) · **pressed** (`:active`, inverted like an open menu title) · **attention** (`.pw-statusbtn--attention`: a failed, stopped or interrupted request; caution glyph, framed with `shadow-popup`, › always shown, words "Stopped · 1 needs attention"). Attention clears when Activity is opened.
- Words and glyphs: **Ready** (no glyph) · **Working** / **Working · 1 waiting** (hourglass) · **1 waiting** (clock: queued, nothing running yet) · **Failed · 1 needs attention**, **Stopped · …**, **Interrupted · …** (caution; the real state word; with two or more of mixed kinds “2 need attention”) · **Connection interrupted** (then the button opens nothing and a Reconnect button follows it).
- Priority: attention wins over Working and Waiting until Activity is opened (by any route: this button, ⌘3, the Agent row, Window menu). Opening Activity clears attention; the button then shows Working or Ready again, and Activity's Needs Attention filter still lists the requests.
- Height 22px inside the 28px bar; 44px on phone, where it sits at the right of the PhoneBar.
- CSS: `.pw-statusbtn`, `.pw-statusbtn__more`, `.pw-statusbtn--attention`, `[data-state]` for previews only.
- Round 5: the button opens Activity **on the running request** (`/activity?job=<id>`), not just the window; so does the Agent section’s Activity row. Worker running while the chat is idle: “Working · worker in pi-local-harness”; paused: “Working · worker paused”. Later, with more agents: “2 of 3 agents busy”.

## Round 17 · Proposed: opens Overview (plan 354)

- The button opens **Overview · All Projects** (`/overview`, ⌃⌥0), not Activity. `aria-keyshortcuts="Control+Alt+0"`; `aria-label="Agent status: <words>. Open Overview"`. Supersedes round 4/5 "opens Activity · All Projects (⌘3)" and "opens Activity on the running request"; Activity stays ⌃⌥3 in the Window menu and the Agent section.
- Words: when something needs the person, "<n> need you · Working on <project>" (one agent working) or "<n> need you" / "1 needs you" (nothing running); otherwise as before (Ready, Working · 1 waiting, 1 waiting, Connection interrupted + Reconnect).
- Two encodings, never mixed: the **frame** (`.pw-statusbtn--attention`) means something needs you; the **glyph** says what Pi is doing (hourglass working, clock waiting, none ready, caution connection).
- Attention no longer clears when a window is opened. Supersedes "Attention clears when Activity is opened" and "attention wins … until Activity is opened": the frame and count follow Overview's Needs you list, which shrinks only when a card is answered, accepted, continued or retried.
- Phone: the same words, 44 px, opens the Overview screen. Boards R17_OverviewEntry, R17_Overview, Ph17_Overview.
