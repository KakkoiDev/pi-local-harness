# WorkOverview

**Existing vs Proposed:** Proposed (round 17, plan 354). Nothing here is built. It reuses existing parts: Window, Toolbar, SegmentedControl, ListGroup rows, StatusGlyph, PhaseControl words, HarnessNotice, Activity's detail. Only the Overview window, its sections, AttentionItem and the project row are new.

The app-level window **Overview · All Projects**: what needs the person first, then what every registered project is doing, then the problems recorded lately. It answers "What needs me?" and "What is happening?" for all projects at once. It never answers, approves, continues or retries anything: each item opens the existing card where that is done. Boards: canvas page **Round 17**, R17_Overview, R17_Overview1024, R17_OverviewEntry, R17_OverviewFollow, R17_OverviewWindows, R17_OverviewHistory, R17_OverviewStates, R17_SeveralAgents, Ph17_Overview, Ph17_OverviewItem, Ph17_OverviewStates, Ph17_Entry, Ph17_EntryPi, R17_OverviewStrings, R17_OverviewWalk. CSS: `scripts/round17_a.css`.

## Anatomy

- `section.pw-window[aria-label="Overview · All Projects"]`, address `/overview`, h1 title "Overview · All Projects". Like Activity and Gate it is app-level: the Projects home stays in the left window (Agent section, Overview row current), and the close box returns to the last project.
- **Toolbar** `.pw-toolbar`: freshness `span.pw-fresh[role=status][data-state]`, then **Show** (`.pw-seg[role=radiogroup]`: All · Needs You · Working). At 1024 and below, **Ask Across Projects** (`aria-pressed`, `aria-controls="ov-ask"`) at the end.
- **Infobar**: `‹ <last project>` back link, then "One agent, one queue. Nothing here answers, approves or retries: each item opens the card where you do that."
- **Body** `.pw-overview`: `.pw-overview__main#ov-main` (the three sections) and, at 1100 px and wider, `aside.pw-overview__ask#ov-ask` (400 px, "Ask across projects"; its conversation is the SearchScope / SourceList cards, worker B).
- **Needs you** `section.pw-ovsec` with `h2#ov-needs-h` (tabindex −1, the focus fallback), count, note "Opening one never answers it", then `ul.pw-attnlist` of AttentionItem.
- **Projects** `section.pw-ovsec` with `h2#ov-proj-h`, count ("5 · 1 working · 2 queued"), note "One agent: Pi", then `div.pw-plist[role=grid]` of project rows.
- **Recorded problems** `section.pw-ovsec`, a `button.pw-ovsec__toggle[aria-expanded][aria-controls=ov-hist]`, collapsed by default, note "History only: nothing to do here"; open, `ul.pw-hist`.
- `#ov-live`: a visually hidden polite live region (`aria-live="polite"`). The boards draw what it says as `.pw-ovlive` "Announced: …".

## Project row

`div.pw-prow[role=row]` with two gridcells:

1. `a.pw-prow__main` (opens the project chat at its current or latest request): name `.pw-prow__name` (truncated, `title` = full name), phase (read-only PhaseControl glyph + Discussion / Planning / Implementation), the Needs-you badge `.pw-needs` "Needs you · 1", now ("Working: task 2 · Subjects · 2 queued" / "Queued: 2 requests" / "Idle"), agent ("Pi · gemma4:12b", or *Agent not recorded*), latest recorded activity ("Edited app/subjects.js · 14:31", "Ran uv run pytest · 12 passed · 14:29", or *No activity recorded*).
2. `button.pw-prow__act` "Open in Activity" (Activity, with this project's latest request selected).

Never a percentage, ETA, progress bar or "almost done". A missing folder adds a caution line "Folder not found at ~/code/Class Notes. Locate Folder… in Projects."; a project moved to Trash reads "Moved to Trash on 18 Oct. Its open question went with it; history stays in Activity." (Open in Activity stays enabled; the row link opens Projects.)

## States

| State | What changes |
| --- | --- |
| Live | "Live · updated 14:32" (filled dot). Updates arrive as they happen. |
| Loading | "Loading…", sections replaced by dotted placeholders with "Reading the queue and each project’s saved state…", `aria-busy=true`. The chat works meanwhile. |
| Not connected | "Not connected · showing 14:20" (dotted frame) + **Reconnect**. Rows and items `[data-stale]`, dotted; every status gets " at 14:20" ("Idle at 14:20", "Waiting for your answer at 14:20"). Never turned into Idle or done. Infobar: "Can’t reach the workbench service. Showing what was true at 14:20; the chat reconnects on its own." |
| Reconnected | "Reconnected · 2 changes since 14:20" (framed) for 10 s, then Live. Read again from saved state. One announcement, no per-change notification or toast. |
| Nothing needs you | Needs you: "Nothing needs you. When Pi asks, finishes a task or stops, it shows here first." |
| Nothing working | Projects count "3 · nothing working"; infobar "One agent, one queue. Nothing is running." |
| No projects | "No projects yet", "Projects you add appear here with what Pi is doing in each.", New Project… · Add Existing Folder…. |
| Unknown | "Agent not recorded", "No activity recorded" (italic). Terminal coverage gap: "Terminal Pi runs aren’t listed here: they have no request to open. Gate shows their commands." |
| Long names | Ellipsis; `title` and the accessible name carry the full name. |
| Show: Needs You / Working | Filters the Projects rows (Needs You: only rows with a badge; Working: only working or queued). Needs you is always shown. Saved per window. |

## Copy (EN / JA)

| English | 日本語 |
| --- | --- |
| Overview · All Projects | 概要 · すべてのプロジェクト |
| Live · updated {time} | ライブ · {time} に更新 |
| Not connected · showing {time} | 未接続 · {time} 時点の表示 |
| Reconnected · {n} changes since {time} | 再接続しました · {time} 以降の変更 {n} 件 |
| Loading… | 読み込み中… |
| Show · All · Needs You · Working | 表示 · すべて · 対応待ち · 作業中 |
| Needs you | 対応待ち |
| Projects | プロジェクト |
| Recorded problems | 記録された問題 |
| History only: nothing to do here | 履歴のみ（ここで行う操作はありません） |
| One agent, one queue. Nothing here answers, approves or retries: each item opens the card where you do that. | エージェントは 1 つ、キューも 1 つです。ここでは回答・承認・再試行はしません。各項目から、その操作を行うカードを開きます。 |
| Working: task {n} · {title} | 作業中：タスク {n} · {title} |
| Queued: {n} requests | 待機中：リクエスト {n} 件 |
| Idle | 待機なし |
| Agent not recorded | エージェントの記録なし |
| No activity recorded | 記録された作業なし |
| Needs you · {n} | 対応待ち · {n} |
| Open in Activity | アクティビティで開く |
| Recovered at {time} | {time} に復旧 |
| Ask Across Projects | プロジェクトをまたいで質問 |

The full inventory is board R17_OverviewStrings.

## Data (read-only projection; plan 354 step 1)

```json
{"as_of": "2026-10-20T14:32:05", "live": true,
 "attention": [{"id": "choice:pong:req-1410:q1", "kind": "question", "project_id": "p_pong", "request_id": "req-1410",
   "label": "Question 1 of 2", "text": "Pi asked whether the ball should speed up after each hit.", "at": "14:12",
   "target": {"view": "chat", "request_id": "req-1410", "card_id": "q1"}, "replaced_by": null}],
 "projects": [{"id": "p_class_notes", "name": "Class Notes", "folder_state": "ok", "phase": "implementation",
   "now": {"state": "working", "request_id": "req-1420", "task": {"n": 2, "title": "Subjects"}}, "queued": 2,
   "agent": {"name": "Pi", "model": "gemma4:12b", "role": null},
   "latest": {"kind": "edit", "path": "app/subjects.js", "at": "14:31"}, "attention_count": 1}],
 "history": [{"id": "fail:req-1350", "kind": "failed", "project_id": "p_class_notes", "request_id": "req-1350", "at": "13:57", "recovered_at": "14:52"}]}
```

- Exists today: the queue (requests, FIFO, state), saved phase, choice/plan/check-in cards and their state, Gate records, Activity's failure detail.
- Doesn't exist yet: one projection joining them by stable project id; `replaced_by` on a choice; `recovered_at` for failures; a per-project "latest recorded activity"; agent role. Missing fields render as unknown, never guessed.
- Model prose never decides kind, order or resolution.

## Disabled reasons

Nothing on Overview is disabled except Reconnect while reconnecting (`aria-busy`). Projects in Trash keep **Open in Activity**. Items are never disabled: a replaced item says so and opens the newer card.

## Focus order and return

Close box → toolbar (freshness Reconnect, Show, Ask Across Projects) → back link → Needs you list (one stop) → Projects grid (one stop) → Recorded problems toggle → Ask pane. Opening anything from Overview remembers the item id; "‹ Overview" (project chat) and Back (phone) return to it, or to the next item if it left.

## Keyboard

- ⌃⌥0 opens Overview from any window (⌘0 too when installed as an app). Esc does nothing (it is a window, not a dialog).
- Lists: roving tabindex. ↑/↓ move, Home/End first/last, Return opens. In Projects, → moves to Open in Activity, ← back.
- Focus is kept by item id across live updates. When the focused item leaves, focus moves to the next item, else the previous, else the section heading.

## Live announcements (polite, one per change)

"Pong: answered. 4 need you." · "Class Notes: recovered." · "Japanese study app: plan approved." · "home-server: continued." · "Reconnected. 2 changes since 14:20." · New attention: "Pong: waiting for your answer." No announcement for row text changes (agent activity) — only for attention.

## Phone (≤ 760)

View popup › "Overview · all" (first after the separator), and the π sheet's Agent section's first row "Overview › 5 need you · 1 working". The screen: freshness + **Ask** (its own screen, worker B), Show, a one-line infobar, then the same sections with 44 px rows, each item stacked (kind, project + request, sentence, then time and the Open label). Following an item opens the project chat with "‹ Overview" in the bar.

## Don't

- Don't put Answer, Approve, Start Building, Continue, Retry, Stop or a phase control on Overview.
- Don't clear an item when it is opened, hovered, or the window is viewed.
- Don't show a percentage, ETA, or "almost done"; don't infer Idle or done from silence.
- Don't list a Gate refusal Pi recovered from.
- Don't use database words (index, query, SQL, embedding) anywhere in this window.
- Don't draw more than one agent outside the "Proposed later" board.

## Walkthrough

See R17_OverviewWalk. Main: Given Class Notes runs task 2 and Pong waits for an answer, When I press ⌃⌥0, Then "Overview · All Projects" lists "Pong: Waiting for your answer…" first and the Class Notes row "Working: task 2 · Subjects · 2 queued". Second window: Given Overview is open in window 2, When I press "Answer" on Pong's card in window 1, Then the Pong item leaves window 2 with "Pong: answered. 4 need you." and focus moves to the next item. Reload: Then the same list from saved state, focus on the first item. Failure: Given "Not connected · showing 14:20", Then rows are dotted and statuses end "at 14:20"; after Reconnect, "Reconnected · 2 changes since 14:20".

## Open product choices

1. Within a kind, oldest first (waited longest) or newest first? Drawn: kinds in fixed order, oldest first within a kind.
2. Should Show be remembered per window or app-wide? Drawn: per window.
3. Recorded problems: 7 days, or the last 20? Drawn: 7 days.
4. Should a service problem (Ollama stopped) also appear in the StatusButton words ("Model server stopped")? Drawn: it counts in "need you" only.
5. At 1024, keep the Projects window open beside Overview? Drawn: hidden, as Activity at 1024.
