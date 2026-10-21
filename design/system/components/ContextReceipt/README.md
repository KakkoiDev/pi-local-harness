# ContextReceipt

**Existing vs Proposed.** Existing (round 11): Why? on the ContextLine opens “Why Pi sees these N files”, one list in which rules, plan, task, named, changed and related files are mixed together. Proposed (round 17): the same Why? opens **What Pi uses for this message**. It shows what was searched (this project only) and keeps two groups apart: **Always with this request** and **Found for this question**. It also lists what was left out and flags anything that changed after Pi read it.

Plan 354 · scoped context retrieval. Boards: R17_ProjectScope, R17_ContextReceipt, R17_ContextStates (with 320 px and Japanese), R17_Context1024, R17_ContextExisting (today, for comparison), Ph17_ProjectScope, Ph17_ContextSheet, R17_ContextStrings, R17_ContextWalk. The card's CSS is in `scripts/round17_c.css`.

## Anatomy

```
Pi sees: README.md (rules) · ROADMAP.md (plan) · 002-subjects.md (task) ┊ [2 found] Why?     ← ContextLine (round 17)

┌ What Pi uses for this message ─────────────────────────────┐   section.pw-receipt#context-receipt role=dialog
│ Searched: Class Notes only                                 │   .pw-receipt__scope
│ Other projects are never searched from this chat.          │
│ [⚠ app/subjects.js changed after Pi read it…  Ask Again]   │   .pw-receipt__state (only when stale/missing/catching up/unavailable)
│ ┌ Always with this request · 3 ──────── (solid) ┐          │   .pw-receipt__group--always
│ │ README.md                      rules  Always: the rules │ │
│ └───────────────────────────────────────────────┘          │
│ ┌ Found for this question · 2 ─────── (dotted) ┐          │   .pw-receipt__group--found
│ │ app/subjects.js › filterBySubject      found            │ │   .pw-receipt__where + kind
│ │ lines 12–48 · read 14:31                                │ │   .pw-receipt__when
│ │ Matches “filter” and “subject”                          │ │   .pw-receipt__why
│ │ 2 more matches left out to keep it short       [Show]   │ │   .pw-receipt__left
│ └───────────────────────────────────────────────┘          │
│ Also read by Pi while answering: app/notes.js · 14:32      │   .pw-receipt__after (the existing “Also read”, unchanged)
│ Chosen again for every message. Never vendor/, … or other projects. │
└────────────────────────────────────────────────────────────┘
```

- The required context (rules, plan, task, plus the deterministic reasons *named* and *changed*) sits in a box with a solid border. Retrieved evidence sits in a box with a dotted border, and every row carries the word **found**. The two are never interleaved.
- A found row reads: file link › heading or function · lines a–b · read HH:MM, then one reason. A truncated item shows “(first 40 lines)” in place of the line range.
- At most 3 found rows are shown. The rest sit behind **Show N More**. Matches dropped by the budget show as one line with **Show**, which lists their names only; Pi did not read them.

## States

| State | Line (`.pw-context__found`) | Receipt |
| --- | --- | --- |
| Found | “2 found” | both groups, Left out if any |
| None found | “none found” | Always group; the found group reads “No matches in Class Notes.” |
| Stale | “2 found” + “!” (name: “…1 changed after Pi read it”) | solid banner “{file} changed after Pi read it at {time}. The answer may be out of date.” + **Ask Again**; the row is flagged “changed after Pi read it” |
| Missing | the same | banner “…was moved to Trash after Pi read it…” + **Ask Again**; the row has no link, is struck through and is flagged “moved to Trash after Pi read it” |
| Catching up | “search catching up” (grey dotted) | dotted note “Search is catching up after changes; Pi used the files it chose without search.”; no found group |
| Unavailable | “no search” | dotted note “Search isn’t available right now; Pi used the files it chose without search. You can still send.” |
| Long | “5 found” | 3 rows + Show 2 More; Left out “6 more matches…” |
| Before sending | the line previews the selection for the draft (debounced, as today) | read times are absent until sent (“will read on Send”) |

Search failure never disables Send, the composer, or the phase control.

## Texts (EN / JA)

| English | 日本語 |
| --- | --- |
| {n} found | {n} 件見つかりました |
| none found | 見つかりません |
| search catching up | 検索を準備中 |
| no search | 検索なし |
| What Pi uses for this message | このメッセージで Pi が使うもの |
| What Pi uses (phone sheet title) | Pi が使うもの |
| Searched: / Class Notes only | 検索範囲: / Class Notes のみ |
| Other projects are never searched from this chat. | このチャットからほかのプロジェクトは検索しません。 |
| Always with this request · {n} | このリクエストで常に · {n} |
| Found for this question · {n} | この質問で見つかったもの · {n} |
| found (reason word) | 検索 |
| lines {a}–{b} · read {time} | {a}–{b} 行 · {time} に読み込み |
| (first 40 lines) | （最初の 40 行） |
| Matches “{word}” | 「{word}」に一致 |
| {n} more matches left out to keep it short / Show | 短くするため、ほかに {n} 件を省きました。/ 表示 |
| Show {n} More | さらに {n} 件表示 |
| changed after Pi read it | Pi が読んだあとに変更されました |
| moved to Trash after Pi read it | Pi が読んだあとにゴミ箱に移されました |
| {file} changed after Pi read it at {time}. The answer may be out of date. | {file} は Pi が {time} に読んだあとに変更されました。回答が古いかもしれません。 |
| Ask Again | もう一度質問 |
| Search is catching up after changes; Pi used the files it chose without search. | 変更を反映するため検索を準備中です。Pi は検索なしで選んだファイルを使いました。 |
| Search isn’t available right now; Pi used the files it chose without search. You can still send. | 現在検索を利用できません。Pi は検索なしで選んだファイルを使いました。送信はできます。 |
| Chosen again for every message. Never vendor/, licences, build output, files over 40 KB, or other projects. | メッセージごとに選び直します。vendor/、ライセンス、ビルド出力、40 KB を超えるファイル、ほかのプロジェクトは含めません。 |

## Data

This comes from the selection receipt in the scoped-context report, stored with the job (`context_receipt`). None of it exists yet.

```json
{"scope": {"projects": ["class-notes"], "label": "Class Notes"},
 "always": [{"path": "README.md", "reason": "rules"}, {"path": "app/notes.js", "reason": "named", "word": "notes.js"}],
 "found": [{"path": "app/subjects.js", "section": "filterBySubject", "lines": [12, 48], "read_at": "14:31", "revision": "c1a9…", "words": ["filter", "subject"], "truncated": false}],
 "left_out": [{"path": "docs/old-subjects.md", "section": "Notes"}],
 "search": "ready | catching_up | unavailable",
 "also_read": ["app/notes.js"]}
```

- Stale and missing are computed on open by comparing `revision` with the file now. They are never stored as resolved.
- Ordinary UI never shows a score, a rank, a query or engine words. The reason is the matched words only.

## Disabled reasons

- **Ask Again** is disabled while Pi is working on this project. Its description reads “Pi is answering. Ask Again when it’s done.”
- **Show** (left out) is never disabled.

## Focus, keyboard, live

- **Why?** (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls="context-receipt"`) opens the receipt. Focus goes to its heading (`tabindex=-1`). Esc or Why? closes it, and focus returns to Why?
- Tab order: file links in order → Show N More → Show → Ask Again (when present; it comes first after the heading when there is a banner) → Also read link.
- “2 found” is text, not a control. Its accessible name says what it means (“2 found for this question, 1 changed after Pi read it”).
- When a source goes stale while the receipt is open, the polite live region says “app/subjects.js changed after Pi read it.” Nothing is announced otherwise.

## Phone

Why? opens a sheet titled **What Pi uses** (top 150 px). Rows are 44 px. Close is in the sheet head, and focus returns to Why? The line keeps “2 found” and Why? and hides file names from the end, as today.

## Don't

- Don't put found files in the same list as the rules, plan and task, and don't give them a required-looking word such as “Always”.
- Don't show a score, rank, query, index, BM25, SQL or engine settings.
- Don't offer to search other projects from here. The only way out is **Ask in Overview** in the boundary notice (see Message).
- Don't disable Send, or grey the composer, because search is unavailable.
- Don't remove a stale flag on reload. Don't save anything from search into the Second Brain.

## Walkthrough (Given / When / Then)

1. **Ordinary message.** Given Class Notes is open in Chat and search is ready, when the person sends “Where do we filter notes by subject?”, then the line ends “2 found” and **Why?** opens “What Pi uses for this message” with “Searched: Class Notes only”, “Always with this request · 3” and “Found for this question · 2”. Esc returns focus to Why?
2. **Boundary.** Given Pong is another project, when the person asks about Pong in Class Notes, then one note “Pi searched Class Notes only. To search every project, ask in Overview.” follows the answer. **Ask in Overview** opens Overview · All Projects with the question in its Ask field, not sent.
3. **Stale.** Given the answer used app/subjects.js read at 14:31, when the person saves a change to it, then the receipt flags the row and shows **Ask Again**. Pressing it resends the same message with fresh files, and the earlier answer stays.
4. **Search unavailable.** Given search isn’t available, when the person sends, then the message is answered, the line ends “no search” and the receipt says why.
5. **Reload.** Given an answered message, when the person reloads, then Why? on that message opens the same rows with the same read times.
6. **Second window.** Given two windows on Class Notes, when one sends, then the other shows the same line and receipt after its live update. Opening the receipt in one window doesn’t open it in the other.

## Open product choices

- Whether the receipt should hold per-message history (Why? on any earlier message, as drawn), or only the latest message.
- Whether **Ask Again** should resend automatically (as drawn) or put the message back in the composer.
- Whether **Ask in Overview** should only prefill (as drawn) or send at once.
- Whether left-out names should be shown at all, or only their count.
- The cap of 3 visible found rows.

## Round 18: a receipt for every message (decisions 14, 17, 18, 19)

**Existing vs Proposed.** Existing: nothing (the round 17 receipt is Proposed and was reached only from Why? on the composer line, for the latest message). Proposed (round 18): every **submitted** message keeps its own receipt, recorded at send time. Each Pi answer ends with a compact summary button; pressing it opens that message's receipt **in place** under the answer (desk) or as a sheet (phone). The composer's Why? no longer opens a receipt: before sending there is nothing recorded. Boards: R18_ProjectScope, R18_ContextReceipt, R18_ContextStates, R18_ProjectScopeStates, R18_Context1024, Ph18_ProjectScope, Ph18_ContextSheet, R18_ContextStrings, R18_ContextWalk. CSS: `scripts/round18_c.css`.

### Anatomy

```
Pi 14:32  …answer…  Also read: app/notes.js
[▸ Searched: Class Notes only · Pi used 3 always · 4 found · 2 left out]     button.pw-rcpt-sum[aria-expanded][aria-controls=receipt-<msg>]
┌ What Pi used for this message ─────────────────────────────┐              section.pw-receipt.pw-receipt--inline#receipt-<msg> role=region
│ Recorded when you sent this at 14:31. Later changes are flagged, never rewritten.   .pw-receipt__recorded
│ Searched: Class Notes only / Other projects are never searched from this chat.      .pw-receipt__scope + .pw-receipt__never
│ [state banner: changed / interrupted / unavailable / no longer available]           .pw-receipt__state
│ ┌ Always with this request · 3 (solid) ┐                                            .pw-receipt__group--always
│ ┌ Found for this question · 4 (dotted) ┐  3 rows, then [Show All 4]                .pw-receipt__group--found + p.pw-receipt__more
│ ┌ Left out · 2 (dotted) ┐  name › section + reason                                 .pw-receipt__group--out
│ Also read by Pi while answering: app/notes.js · 14:32                              .pw-receipt__after
│ Chosen again for every message. Never vendor/, … or other projects.                .pw-receipt__foot
└─────────────────────────────────────────────────────────────┘
```

- **Summary** (compact counts, decision 17): “Searched: Class Notes only · Pi used {a} always · {f} found · {l} left out” (JA “検索範囲: Class Notes のみ · 常に {a} · 検索 {f} · 除外 {l}”). Zero parts are dropped (“· 2 found”, no “0 left out”); nothing found reads “none found”. Flags are appended in bold: “· Interrupted”, “· 1 changed”, “· 1 file no longer available”; search unavailable replaces the found part with “· search unavailable”. “Searched: Class Notes only” is always first (decision 19's compact indicator). Its accessible name is its visible text.
- **Found** (decision 18): three rows, then **Show All {n}** (`aria-expanded=false`, `aria-controls=receipt-<msg>-found`). Pressing it inserts the remaining rows above the button, which becomes **Show Fewer**, keeps focus and announces nothing. This is a display cap only; the heading always gives the full count.
- **Left out** (decision 17): each authorized name with a reason: “Left out to keep it short” (budget) or “Not searched: search was catching up”. Names are plain text (Pi didn’t read them), never an excerpt. Only files in this project the person can open appear; anything else is neither named nor counted.

### States (historical: recorded, not recomputed)

| State | Summary | Receipt |
| --- | --- | --- |
| Found | “… · 4 found · 2 left out” | both groups, Left out |
| Changed | “… · 1 changed” | solid banner “{file} changed after Pi read it at {time}. The answer may be out of date.” + **Ask Again with Current Files** (description “Sends this message again with the files as they are now. This answer stays.”); row flag “changed after Pi read it” |
| Changed, Pi answering | same | the button is disabled with “Pi is answering. Ask again when it’s done.” |
| Interrupted | “… · 2 found · Interrupted” | dashed banner “Interrupted: Pi stopped before reading the rest” / “The list shows what Pi had read when it stopped.”; only the rows read before the stop; no Left out or Also read group is invented |
| Search unavailable | “… · Pi used 4 always · search unavailable” | “Search unavailable for this message” / “Pi used the files it always gets and the ones you named.”; no Found group |
| No longer available | “… · 1 file no longer available” | note “1 file no longer available” / “It was deleted, or you can no longer open it, so its name is hidden.”; the row keeps its place and the count and reads “File no longer available” (no link, path, section, lines, read time or reason) |
| Catching up at send | “… · 2 left out” | Left out rows with “Not searched: search was catching up” |
| Draft | none | no receipt exists; Why? on the composer opens “What Pi will use when you send” (see ContextLine) |

Changed and no-longer-available are computed when the receipt opens (revision vs the current file; current authorization) and are never stored as resolved. Everything else is the record made at send.

### Texts (EN / JA): see R18_ContextStrings; the key ones

| English | 日本語 |
| --- | --- |
| What Pi used for this message | このメッセージで Pi が使ったもの |
| What Pi used (phone sheet) | Pi が使ったもの |
| Recorded when you sent this at {time}. Later changes are flagged, never rewritten. | {time} の送信時に記録しました。あとの変更は印で示し、書き換えません。 |
| Pi used {a} always · {f} found · {l} left out | 常に {a} · 検索 {f} · 除外 {l} |
| Left out · {n} | 除外 · {n} |
| Left out to keep it short | 短くするため除外 |
| Not searched: search was catching up | 未検索: 検索を準備中でした |
| Show All {n} / Show Fewer | {n} 件すべて表示 / 表示を減らす |
| Interrupted: Pi stopped before reading the rest | 中断: Pi は残りを読む前に停止しました |
| Search unavailable for this message | このメッセージでは検索を利用できませんでした |
| 1 file no longer available / File no longer available | 1 件のファイルは利用できなくなりました / 利用できなくなったファイル |
| Ask Again with Current Files | 現在のファイルでもう一度質問 |

### Data (✱ none of this exists yet)

`context_receipt` is written once per submitted job and never rewritten: `{recorded_at, scope: {project_id}, search: ready|catching_up|unavailable, interrupted_at?, always[{path, reason, word?}], found[{doc_id, path, section, lines|truncated, read_at, revision, words[]}], left_out[{doc_id, path, section?, reason: budget|not_searched}], also_read[]}`. On read, the host returns, per item, `availability: current|changed|gone`; for `gone` it returns no path, section, lines, read time or words. No score, rank, query text or engine field.

### Focus, keyboard, live

- The summary is a disclosure button (`aria-expanded`, `aria-controls`); Space/Return toggles it; focus stays on it. Several receipts may be open at once; each is a `role=region` labelled by its heading.
- Tab order inside: file links → Show All → (when present) Ask Again with Current Files comes first after the banner text.
- A live update (a new message, a file going stale) never moves focus and never closes an open receipt. A row that turns “changed” while open is announced once, politely: “app/subjects.js changed after Pi read it.”
- Phone: the summary is 44 px; it opens a sheet **What Pi used** (Close returns focus to the summary). Show All is 44 px.
- 1024 and 320: in place, at most 560 wide; the summary wraps at each “·”, “Searched: Class Notes only” stays whole.

### Don't

- Don't recompute an old receipt from today's selection; don't remove a flag on reload.
- Don't show a receipt, a “found” count or read times for an unsent draft.
- Don't name or count files from projects the person can't open, or a removed file's path.
- Don't add a Show button for Left out: in the expanded receipt the names are always shown.

### Walkthrough

See R18_ContextWalk (11 stories): every message keeps its receipt · Show All · Left out names/reasons · changed + Ask Again with Current Files · interrupted · search unavailable then · no longer available · boundary only for a named project · Ask in Overview · no receipt for a draft · two windows, reload, phone.

### Superseded (round 17 → round 18)

- “What Pi uses for this message” → “What Pi used for this message”; phone “What Pi uses” → “What Pi used”.
- Opened from the composer’s Why? (popover, `role=dialog`, `#context-receipt`) → opened from each answer’s summary button, in place (`role=region`, `#receipt-<message id>`).
- “2 more found” + “Show 2 More” → “Show All 4” / “Show Fewer”.
- “{n} more matches left out to keep it short” + Show → the group “Left out · {n}” with names and reasons.
- “Ask Again” (JA “もう一度質問”) → “Ask Again with Current Files” (JA “現在のファイルでもう一度質問”).
- Missing: “moved to Trash after Pi read it” with the name struck through → the redacted row “File no longer available” and “1 file no longer available”.
- “Search is catching up after changes; Pi used the files it chose without search.” (receipt) → Left out reason “Not searched: search was catching up”. “Search isn’t available right now; … You can still send.” (receipt) → “Search unavailable for this message”. The live states stay on the composer line.
- States row “Before sending: the line previews the selection for the draft … read times are absent until sent” → “Draft: no receipt”.
- Open product choices of round 17 are all resolved (decisions 14–19); none remain for this card.

## Round 18 addendum (proposed, awaiting approval)

**Q8 · phase changes before resending.** Proposed: **Ask Again with Current Files** always resends in the project's phase now, and never changes phase. When that phase differs from the message's, a bold line follows the round 18 description and is also in the button's `aria-describedby`: “Pi will answer in Planning, the project’s phase now (this message was in Discussion).” (JA “Pi はいまのフェーズ「計画」で答えます（このメッセージは「議論」でした）。”). There is no extra confirmation. While a phase change or approval card is waiting, the button is disabled and described by “Answer the waiting plan first.” (JA “待っている計画に先に答えてください。”). Round 18's “Pi is answering…” disabled state is unchanged. At 320 px and on the phone the button wraps to its own row (`.pw-receipt__state--wrap`). Boards: R18A_AskAgainPhase, Ph18A_AskAgainPhase. Alternative (not recommended): an alert “Ask again in Planning?” / “This message was in Discussion.” / Cancel · Ask Again.

**Q9 · lifetime.** Proposed: a receipt lives exactly as long as its message. It is kept through compaction, moves with the conversation to Earlier Conversations on New Conversation, and is deleted only with the conversation. No separate retention policy. See CompactionMarker. Boards: R18A_ReceiptLifetime, Ph18A_ReceiptLifetime.

Would supersede (round 18): “Pressing it sends at once, in the same conversation” → “…in the project's phase now, saying so when it differs”. The round 18 open issues “phase for Ask Again with Current Files” and “receipt lifetime” would be closed.
