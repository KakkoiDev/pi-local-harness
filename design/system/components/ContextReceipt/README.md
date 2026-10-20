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
