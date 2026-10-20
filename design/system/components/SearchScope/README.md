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
