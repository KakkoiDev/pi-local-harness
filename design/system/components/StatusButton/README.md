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

## Round 18 · Proposed: one state, by priority (decision 4)

Highest first; only one is shown:
1. **Connection interrupted** (existing; the browser can't reach Pi WorkStation) + Reconnect.
2. **Work-blocking service failure**: "Can’t run work · Ollama stopped" (JA 作業を実行できません · Ollama 停止中), with attention appended "Can’t run work · Ollama stopped · 2 need you" (JA … · 対応待ち 2 件). Plug glyph, bold words, framed (`.pw-statusbtn--attention .pw-statusbtn--blocked`, `data-state="blocked"`): the service item itself is in Needs you. aria-label "Agent status: can’t run work, Ollama stopped, 2 need you. Open Overview" (JA エージェントの状態：作業を実行できません、Ollama 停止中、対応待ち 2 件。概要を開く). The count excludes the blocking service item (the words name it).
3. **Attention**: "2 need you · Working on Class Notes" (round 17); non-blocking problems only add to this count.
4. **Working / Waiting** (existing words). 5. **Ready**.

While (2) holds nothing says Working, Idle or Ready anywhere (Agent row "Can’t run work · 2 need you", Activity row "2 queued · Ollama stopped", project lists "state unknown"). When Ollama answers: "Ollama: running again" (polite), the item leaves, history "Recovered at …". Phone: the same words wrap to two lines inside the 44 px button (`.pw-statusbtn--wrap`, max 236 px). Boards R18_OverviewStatus, R18_OverviewService, Ph18_OverviewService.

Superseded (old → new): round 17 "otherwise as before (Ready, Working · 1 waiting, 1 waiting, Connection interrupted + Reconnect)" with a stopped service only counted in "need you" → the five-step priority above; a work-blocking service now changes the words.

## Round 18 addendum (settled or superseded in round 19 — see Round 19)

Revised 21 Oct after review; settled or superseded in round 19 (see Round 19 below). Boards: R18A_ServicesStopped, Ph18A_ServicesStopped.

- **Recommended (Q1): blocking is per operation.** The selected model's server (Ollama) blocks generation; Gate blocks tool execution. A stopped Preview, speech or search shows only in its own feature and never changes this button. Priority is otherwise as round 18, with these words:
  - Ollama stopped: "Can’t run work · Ollama stopped" (round 18).
  - Gate only: "Can’t run tools · Gate stopped" (JA ツールを実行できません · Gate 停止中). aria-label: "Agent status: can’t run tools, Gate stopped, 2 need you. Open Overview".
  - Superseded: Both: "Can’t run work · Ollama and Gate stopped" (JA 作業を実行できません · Ollama と Gate が停止中). aria-label: "Agent status: can’t run work, Ollama and Gate stopped, 2 need you. Open Overview". (round 19 A1: two or more failures use the aggregate “Can’t run work · 2 services stopped”)
- **The need-you count.** " · {n} need you" is appended only for requests waiting on a decision: questions, plans, check-ins, failed or interrupted requests. Stopped services are never counted.
- **Recovery.** When one service answers again, "{service}: running again" is announced once and the button shows the words for what is still stopped.
- **Phone.** The words wrap to two lines inside the 44 px button.
- **Would supersede (if approved).** Round 18's "Non-blocking problems only add to the count" and the blocking service item counted in Needs you.
- Superseded: **Alternative (not recommended).** "Can’t run work · 2 services stopped · 2 need you" (the first addendum proposal). (round 19 A1 adopts these words for several failures; services still never go into Needs you)

## Round 19 (decided, owner-delegated 21 Oct 2026)

Decided in round 19 (owner-delegated, 21 Oct 2026; brief design/briefs/round-19-final-integration.md, A1). Boards: R19_ServiceHealth, Ph19_ServiceHealth.

**Priority, highest first; one state is shown:**
1. Connection interrupted.
2. Definite failures:
   - Two or more: "Can’t run work · 2 services stopped" (JA 作業を実行できません · 2 つのサービスが停止中).
   - One generation failure: "Can’t run work · {provider} stopped", or for a remote provider "Can’t run work · {provider} not reachable" (JA 作業を実行できません · {provider} に接続できません).
   - Tools: "Can’t run tools · Gate stopped".
3. "Service status unknown" (JA サービスの状態は不明): health is unknown, checking or stale and nothing has definitely failed. It never says Working, Ready or stopped.
4. Attention.
5. Working / Waiting.
6. Ready.

**Rules**
- " · {n} need you" is appended only for decisions; services are never counted.
- The accessible name lists each failing operation, e.g. "Agent status: can’t run work, 2 services stopped: studio.local not reachable, Gate stopped, 2 need you. Open Overview".
- The selected provider is whichever provider generation uses (local Ollama or remote, e.g. studio.local), from System 1 health records.
- Partial recovery drops to the remaining words, with one "{service}: running again".
- Phone: the words wrap to two lines inside the 44 px button.

**States**
- Idle: Ready.
- Loading: N/A. The button shows the last known state; Overview freshness covers loading.
- Empty: N/A.
- Error: definite failures (above).
- Disabled: N/A (always opens Overview).
- Stale: "Service status unknown".
- Conflict: N/A.

**Who may invoke:** any signed-in person (it opens Overview).
