# SearchScope

**Existing vs Proposed.** Existing: nothing. Today Pi WorkStation has no search across projects; a question only ever reaches the project whose chat it was typed in. Proposed (round 17): in Overview's **Ask across projects** pane, a popup button names which projects a question will search, for example “Searching all projects (5)”. It opens a checkbox list that narrows the search. Under each answer, a coverage line says what was actually searched.

Plan 354 and the scoped-context-retrieval report (20 Oct). Boards: R17_Ask, R17_AskScope, R17_AskStates, R17_Ask1024, R17_AskNarrow, Ph17_Ask, Ph17_AskScope, R17_AskStrings, R17_AskWalk. CSS: `scripts/round17_b.css` (`.pw-scope`, `.pw-scope__btn`, `.pw-scope__pop`, `.pw-scope__item`, `.pw-coverage`).

Inside a project, the scope is fixed to that project. The project chat says so in the Why? receipt (“Searched: Class Notes only”; see ContextReceipt). This card is only for Overview.

## Anatomy

- **Button.** `button.pw-scope__btn#ask-scope[aria-haspopup="dialog"][aria-expanded][aria-controls="ask-scope-pop"]`, made of a search glyph, the label and ▾. It sits in `.pw-ask__head` on its own row, under the pane title and New.
- **Popover.** `div.pw-scope__pop[role="dialog"]#ask-scope-pop[aria-labelledby="ask-scope-h"]`, anchored to the button's left edge, 300 px wide. It contains:
  - the heading `h3#ask-scope-h` “Search in”;
  - a `fieldset` holding **All projects**, with the count on the right and `aria-checked="mixed"` when only some projects are checked;
  - one checkbox per registered project the person can open, in Projects home order;
  - two help lines.
- **Coverage line.** `p.pw-coverage[role="note"]`, the last line of every answer. When coverage was incomplete it has a dotted border (`--partial`, `--off`).

## Label rules (exact)

| Selection | Button |
| --- | --- |
| Every project (default) | Searching all projects (5) |
| One project | Searching Class Notes only |
| 2 or more, not all | Searching 2 projects |

Nothing checked is not allowed: the last checked box can't be unchecked. Its reason, “At least one project is searched.”, is linked with `aria-describedby`.

## States (coverage lines)

| State | Line |
| --- | --- |
| Searched everything in scope | Searched 5 projects · 14:32 (or “Searched 2 projects: Class Notes, Kanji Cards · 14:35”) |
| Searching | Searching 5 projects… (role=status; Stop replaces Send) |
| Partial | Searched 4 of 5 projects · Pong is catching up after changes |
| Partial, now ready | Searched 4 of 5 projects · Pong is ready now · **Ask Again** |
| Search unavailable | Search isn't available right now. Pi answers from the project list and plans only. |
| No matches | No matches in 5 projects. |
| Source changed since | Searched 5 projects · 14:32 · 1 source changed since · **Ask Again** |
| Project removed after the answer | Searched 5 projects · 14:32 · Kanji Cards was removed after this answer |

The line never contains *index, BM25, SQL, DuckDB, query* or *embedding*.

## Texts (EN / JA)

| English | 日本語 |
| --- | --- |
| Searching all projects ({n}) | すべてのプロジェクトを検索（{n}） |
| Searching {n} projects | {n} 件のプロジェクトを検索 |
| Searching {project} only | {project} だけを検索 |
| Search in | 検索するプロジェクト |
| All projects | すべてのプロジェクト |
| For this conversation. Later questions here search the same projects. | この会話での設定です。この会話の次の質問も同じプロジェクトを検索します。 |
| Lists the projects you can open in Pi WorkStation. A project you remove leaves this list. | Pi WorkStation で開けるプロジェクトだけを表示します。削除したプロジェクトは表示されません。 |
| At least one project is searched. | 少なくとも 1 件のプロジェクトを検索します。 |
| Searching {n} projects… | {n} 件のプロジェクトを検索中… |
| Searched {n} projects · {time} | {n} 件のプロジェクトを検索 · {time} |
| Searched {n} of {m} projects · {project} is catching up after changes | {m} 件中 {n} 件を検索 · {project} は変更を反映中です |
| {project} is ready now | {project} の準備ができました |
| Ask Again | もう一度質問 |
| Search isn't available right now. Pi answers from the project list and plans only. | 今は検索できません。Pi はプロジェクト一覧と計画だけから答えます。 |
| No matches in {n} projects. | {n} 件のプロジェクトに該当なし。 |

## Data

```json
{"conversation": "ov-7", "scope": {"all": false, "projects": ["prj_classnotes", "prj_kanji"]},
 "registered": [{"id": "prj_classnotes", "name": "Class Notes", "openable": true}],
 "coverage": {"searched": ["prj_classnotes", "prj_kanji"], "catching_up": [], "unavailable": false, "at": "14:35"}}
```

- The scope is stored with the Overview conversation, so it survives reload and is shared by windows showing that conversation. **New** starts a conversation scoped to all projects.
- The server derives the authorized set before it searches. The popup only shows that set: ids the person can open, by stable project id, with names resolved at display time. A rename changes the label but not the scope.
- `catching_up` and `unavailable` don't exist yet. They are the retrieval service's per-project freshness and availability, and the report's “label partial coverage honestly”. Until they exist, the line can only say “Searched N projects”.

## Disabled reasons

- Last checked project: “At least one project is searched.”
- While Pi is answering, the button stays enabled, and a change applies to the next question. Nothing re-runs by itself.

## Focus, keyboard, live

- Space or Return opens the popup, and focus moves to the first checked box. ↑↓ moves between the boxes, Space toggles one, and Escape or a click outside closes the popup. Focus returns to the button.
- Changing the scope announces the new label politely (“Searching 2 projects”).
- Each coverage line is a note, not a live region. The answer's arrival announces “Answered · 3 sources in 2 projects”.

## Phone

The button fills the row under the bar, 44 px tall, with New beside it. Pressing it opens a sheet, **Search in**, with 44 px checkbox rows and **Done** in the head.

## Don't

- Don't use database words: index, BM25, SQL, DuckDB, query, embedding.
- Don't list a project the person can't open, or one that was removed or deleted. Don't show a count that includes one either.
- Don't add a per-answer scope picker. The scope belongs to the conversation, and each answer records its own coverage.
- Don't re-ask automatically when a project catches up. Offer Ask Again.
- Don't let the scope grant anything: discovery is not permission to change a project.

## Walkthrough (Given / When / Then)

1. **Narrow the scope.**
   - Given Overview with “Searching all projects (5)”.
   - When I press it, uncheck Pong, Notes app and home-server, and press Escape.
   - Then focus is on the button, which reads “Searching 2 projects”, and the next answer ends with “Searched 2 projects: Class Notes, Kanji Cards · 14:35”.
2. **A removed project.**
   - Given Notes app was removed.
   - When I open “Searching all projects (4)”.
   - Then Notes app is not listed.
3. **Partial coverage.**
   - Given Pong is catching up.
   - When I ask a question.
   - Then the answer ends with “Searched 4 of 5 projects · Pong is catching up after changes”.
   - Later the line reads “Pong is ready now”, and “Ask Again” asks the same question once.
4. **Unavailable.**
   - Given search is down.
   - When I ask.
   - Then an answer still arrives, with “Search isn't available right now. Pi answers from the project list and plans only.”, and Send stays enabled.
5. **Reload.**
   - Given a conversation scoped to 2 projects.
   - When I reload.
   - Then the button still reads “Searching 2 projects”.
6. **Second window.**
   - Given Overview open in two windows.
   - When I change the scope in one.
   - Then the other's button shows the new label.

## Open product choices

- Should a new conversation start from the last scope used, instead of all projects?
- Should Overview offer a scope per project row (“Ask about Pong”), which would open Ask already narrowed?
- When a project catches up, should Ask Again re-ask only the missing project and merge the result, or ask everything again (as drawn)?

## Round 18

Decisions 8, 12, 13, 15 and 16 (docs/plans/360-round-17-product-decisions.md); boards R18_AskConversations, R18_AskAbout, R18_AskPrefill, R18_AskRetry, R18_AskRetryStates, R18_Ask1024, Ph18_AskRetry. CSS: `scripts/round18_b.css`. Conversation history and the draft notice: see the new card **ConversationList**.

**Scope per conversation (decided).** A new conversation always starts “Searching all projects (5)”, said on the button; it never inherits a narrowed scope. Each existing conversation keeps its own scope. Ask About {project} (Overview row button or row ⋯) sets “Searching {project} only” on a reused empty conversation or a new one. Ask in Overview sets “Searching all projects (5)”.

**New labels.** “Searching {n} of {m} projects” when a project was registered after the conversation started (it is not added silently; the popup lists it unchecked with “added {time}” and “Added after this conversation started. Check it to search it here too.”). “Choose projects to search” when none of the conversation's projects can be searched any more (Send disabled with the reason).

**Retry replaces Ask Again for missing projects (decisions 12, 15).**

| State | Coverage line |
| --- | --- |
| One missing | Searched 4 of 5 projects · Pong was catching up · **Retry Pong** |
| Several missing | Searched 3 of 5 projects · Pong and Notes app were catching up · **Retry 2 Projects** |
| In flight | … · **Retrying Pong…** (`aria-disabled="true"`, keeps focus; repeat clicks and other windows' clicks ignored; one attempt) |
| Done | … · link “Retried at 14:41 · below”; the result is a new reply `article.pw-msg.pw-msg--retry` labelled **Retry · Pong** with its own Sources and line “Searched 1 project: Pong · 14:41” |
| Still missing after a retry | the retry reply: “Searched 0 of 1 project · Pong is still catching up” · **Retry Pong** |
| A target no longer authorized | it leaves the line, the button and the count: “Searched 3 of 4 projects · Pong was catching up” · **Retry Pong** |
| No target left | “Searched 4 projects · 14:32” + “Nothing to retry.” (role=status); no request is sent |

Retry sends at once, rechecks authorization at the click, leaves the composer's draft alone, never retries tool effects and never changes a phase. The original answer, its Sources and its line stay as they were (only its button becomes the “Retried …” link). The full refresh is separate: the answer's ⋯ (“More for this answer”) › **Ask All Projects Again** asks the same question again as a new question “· asked again” in the conversation's scope; in a narrowed conversation the item reads **Ask Again in 2 Projects** / **Ask Again in Class Notes**.

**Superseded (old → new).**
- “Searched 4 of 5 projects · Pong is ready now · Ask Again” → “Searched 4 of 5 projects · Pong was catching up · Retry Pong” (offered at once, not only when Pong is ready; JA “Pong で再試行”).
- “Searched 5 projects · 14:32 · 1 source changed since · Ask Again” → “Searched 5 projects · 14:32”; the changed source is marked on its SourceList item, and the full refresh is ⋯ › Ask All Projects Again.
- “Searched 5 projects · 14:32 · Kanji Cards was removed after this answer” → “Searched 4 projects · 14:32” (the removed project is neither named nor counted).
- Walkthrough 3's “Later the line reads “Pong is ready now”, and “Ask Again” asks the same question once.” → “Retry Pong” sends at once; the result is a new reply “Retry · Pong”.
- Open product choices 1–3 are decided (all projects; Ask About per row; retry only the missing projects).

| English | 日本語 |
| --- | --- |
| Searching {n} of {m} projects | {m} 件中 {n} 件のプロジェクトを検索 |
| Searched {n} of {m} projects · {project} was catching up | {m} 件中 {n} 件を検索 · {project} は変更を反映中でした |
| {a} and {b} were catching up | {a} と {b} は変更を反映中でした |
| Retry {project} / Retry {n} Projects | {project} で再試行 / {n} 件のプロジェクトで再試行 |
| Retrying {project}… / Retrying {n} projects… | {project} で再試行中… / {n} 件のプロジェクトで再試行中… |
| Retry · {project} | 再試行 · {project} |
| Retried at {time} · below | {time} に再試行 · 下に表示 |
| Nothing to retry. | 再試行するものはありません。 |
| Ask All Projects Again | すべてのプロジェクトでもう一度質問 |
| Ask About {project} | {project} について質問 |
| Choose projects to search | 検索するプロジェクトを選択 |

## Round 18 addendum (proposed, awaiting approval)

Nothing here is decided. Revised 21 Oct after review (no change to Q2 or Q5 content). Boards: R18A_AskAdded, R18A_AskRefresh, Ph18A_AskRefresh. CSS: `scripts/round18add_b.css`.

**Q2 · Projects registered after an All Projects conversation began (Recommended = round 18 drawing kept).** The conversation keeps its starting set: “Searching 5 of 6 projects”; the popup lists the new project unchecked with “added 15:10” and “Added after this conversation started. Check it to search it here too.” Checking it is the only way the set widens (“Searching all projects (6)”; earlier answers keep their lines). New conversations start with all current projects. No transcript notice.
- Alternative (not recommended): live “all” with `p.pw-askdivider[role=note]` “Pong Extra was added at 15:10 · later questions search it too” (15:10 に Pong Extra が追加されました · 以降の質問では検索します).

**Q5 · Scope-correct refresh labels (Recommended).** The answer's ⋯ item `button.pw-menu__item.pw-refresh` names the current authorized scope — “Ask Again in All Projects (5)” / “Ask Again in 2 Projects” / “Ask Again in Class Notes” / “Ask Again in 5 Projects” (kept set) — described by “Searches the projects this conversation searches now.”; none left: `aria-disabled`, “None of this conversation's projects can be searched now.” The result is a new question “· asked again”; Retry unchanged. JA: すべてのプロジェクト（5）でもう一度質問 / 2 件のプロジェクトでもう一度質問 / Class Notes でもう一度質問 / この会話がいま検索するプロジェクトを検索します。 Phone: a sheet “This answer”.
- Would supersede (round 18): “⋯ › Ask All Projects Again” and its narrowed variants.
