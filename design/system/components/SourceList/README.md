# SourceList

**Existing vs Proposed.** Existing: nothing. Today an answer from Pi cites files only in its prose, if at all, and never across projects. Proposed (round 17): under an answer in Overview's **Ask across projects** pane, a numbered list of what the answer used. Each item gives the project, the document and the section, the lines and how recently they changed. Each item has an **Open** button that opens the file at that line in that project's Work. Numbered marks in the answer point at the items.

Plan 354 and the scoped-context-retrieval report (20 Oct). Boards: R17_Ask, R17_AskStates, R17_AskSource, R17_AskNarrow, Ph17_Ask, Ph17_AskSources, R17_AskStrings, R17_AskWalk. CSS: `scripts/round17_b.css` (`.pw-sources`, `.pw-sources__*`, `.pw-cite`, `.pw-askro`, `.pw-handoff`, `.pw-src__l[data-cited]`). The project chat may use the same list under an answer; see Message's Round 17 section (worker C).

## Anatomy

- `section.pw-sources[aria-label="Sources"]` inside `article.pw-msg`, after Pi's words and before the coverage line (SearchScope).
- **Head:** `h4.pw-sources__head#ask-src-h`, for example “Sources · 3 in 2 projects”.
- **List:** `ol#ask-src-list[aria-labelledby]`, made of `li.pw-sources__item#src-N`. Each item holds:
  - the number `.pw-sources__n`;
  - the path `.pw-sources__path`: **Class Notes** › docs/offline.md › Sync queue, breaking anywhere;
  - the meta `.pw-sources__meta`: “lines 12–40 · changed 2 days ago”;
  - the Open button `button.pw-sources__open`, named “Open docs/offline.md in Class Notes at line 12”.
- **More:** `button.pw-sources__more[aria-expanded]`, “Show 4 more”, when there are more than 5 items. It expands in place; it never opens a dialog.
- **Cite mark:** `a.pw-cite[href="#src-N"][aria-label="Source N"]` in the answer text.
- **Read-only line:** `p.pw-askro#ask-readonly` above the Ask composer reads “Pi reads these projects to answer. To change one, open it and ask there.” The Question field's `aria-describedby` points to it. There is one per pane, never one per answer.
- **Hand-off:** `.pw-handoff`, used when the person asks for a change. Pi answers “I can only read here. Open Class Notes to change it.” and shows the default button **Open Class Notes Chat**, plus a help line.

## States

| State | What changes |
| --- | --- |
| Default | Up to 5 items, then Show N more. The head counts every item and every project. |
| Changed since this answer | The item's meta adds a bold “changed since this answer” (`data-changed`). The coverage line offers Ask Again. Open shows the file as it is now: at the same heading if it still exists, otherwise from the top, with “The cited lines changed; showing the file from the top.” |
| Project removed | The item keeps its number so the cite marks still match. Its text is greyed (`data-gone`), its meta reads “Kanji Cards was removed from Pi WorkStation”, and Open is disabled and described by that line. |
| Plans only (search unavailable) | Items cite ROADMAP.md and task files only. |
| No matches | No list at all. The coverage line says “No matches in 5 projects.” |
| Focused from Work | After ‹ Overview, the item whose Open was used is outlined (`aria-current`) and its Open button has focus. |

## Texts (EN / JA)

| English | 日本語 |
| --- | --- |
| Sources · {n} in {p} projects | 出典 · {p} 件のプロジェクトに {n} 件 |
| lines {from}–{to} | {from}–{to} 行 |
| changed {ago} | {ago}に変更 |
| changed since this answer | この回答の後に変更 |
| Show {n} more | さらに {n} 件を表示 |
| Open | 開く |
| Open {file} in {project} at line {n} | {project} の {file} を {n} 行目で開く |
| {project} was removed from Pi WorkStation | {project} は Pi WorkStation から削除されました |
| The cited lines changed; showing the file from the top. | 引用した行が変更されたため、ファイルの先頭から表示しています。 |
| Pi reads these projects to answer. To change one, open it and ask there. | Pi はプロジェクトを読んで答えるだけです。変更するときは、そのプロジェクトを開いてそこで頼んでください。 |
| I can only read here. Open {project} to change it. | ここでは読むことしかできません。変更するには {project} を開いてください。 |
| Open {project} Chat | {project} のチャットを開く |
| Your request goes with it as a draft. Nothing is sent or changed until you send it there. | 依頼は下書きとして引き継がれます。そちらで送信するまで、何も送信・変更されません。 |
| ‹ Overview | ‹ 概要 |
| Back to Overview, Ask across projects | 概要の「全プロジェクトに質問」に戻る |

## Data

```json
{"sources": [{"n": 1, "project_id": "prj_classnotes", "project": "Class Notes", "path": "docs/offline.md",
  "heading": "Sync queue", "lines": [12, 40], "source_hash": "sha256:…", "changed_at": "2026-10-18T09:12:00",
  "changed_since_answer": false, "available": true}], "total": 9}
```

- `source_hash` and `changed_since_answer` don't exist yet. They come from the retrieval report's step 5, “verify identity, permission and revision”. Until they exist, “changed since this answer” is not shown, and Open always opens the current file at the stored line.
- The heading is the nearest Markdown heading, or the function or test name for code. If there is none, the path ends at the file: “Class Notes › app/sync.js”.
- Lines are 1-based and inclusive, from the version Pi read.
- The section and line text are never copied into another project's chat or model context; the answer only quotes what it needs.

## Disabled reasons

Open is disabled only when the project was removed or can't be opened. The reason is that item's meta line, linked with `aria-describedby`.

## Focus, keyboard, live

- The list is one tab stop. ↑↓ moves between items, with focus on each item's Open button, and Return opens. Show N more is the last stop; pressing it moves focus to the first new item.
- Open → Work. **‹ Overview**, ⌃⌥0 or the Window menu returns to the same conversation, scroll position and item, with focus on its Open button.
- Arrival is announced politely: “Answered · 3 sources in 2 projects”.

## Phone

- Items have 44 px Open buttons and 15 px text.
- Show N more expands in place.
- Open goes to that project's Work view, and the bar's back button reads ‹ Overview.

## Don't

- Don't show more than 5 items before Show N more.
- Don't cite a project outside the conversation's scope, or one the person can't open.
- Don't say a found solution is compatible, licensed for reuse or verified in another app. Pi can only say where it is.
- Don't put Edit, Apply or Copy into Project on an item. Discovery is not permission; changes happen in the project's own chat.
- Don't send anything to the project's chat when Open is used.
- Don't add “search doesn't save to the Second Brain” to every answer: it is said once, in the pane's first-open help.

## Walkthrough (Given / When / Then)

1. **Cite two projects.**
   - Given I asked “Where did we already solve offline support?”.
   - When the answer arrives.
   - Then “Sources · 3 in 2 projects” lists “Class Notes › docs/offline.md › Sync queue”, with “lines 12–40 · changed 2 days ago”, first, and the answer's marks 1–3 link to the items.
2. **Open and return.**
   - When I press “Open docs/offline.md in Class Notes at line 12”.
   - Then Work shows the file in Source view with line 12 current and lines 12–40 marked.
   - When I then press “Back to Overview, Ask across projects”.
   - Then I'm back on the same item with focus on its Open button.
3. **Many sources.**
   - Given 9 sources.
   - Then 5 show, and “Show 4 more” reveals the rest in place.
4. **Changed after.**
   - Given docs/offline.md changed after the answer.
   - Then item 1 says “changed since this answer”, and the coverage line offers Ask Again.
5. **Removed project.**
   - Given Kanji Cards is removed while the answer is shown.
   - Then item 3 is greyed and its Open is disabled with “Kanji Cards was removed from Pi WorkStation”.
6. **Asking for a change.**
   - When I send “Rename the “Sync queue” section in Class Notes to “Offline queue”.”.
   - Then Pi answers “I can only read here. Open Class Notes to change it.”.
   - When I press “Open Class Notes Chat”.
   - Then Class Notes' chat opens with my request as an unsent draft, and no file has changed.
7. **Reload and second window.**
   - After a reload, the same sources show.
   - A second window on the same conversation shows the same list.

## Open product choices

- Should Open land in Page view (the rendered heading) instead of Source view for Markdown? Source is drawn because only Source can mark lines.
- When a cited project is removed, should its item stay (as drawn) or disappear, leaving a note of how many sources were hidden?
- Should Open Class Notes Chat also switch that chat to Planning when the request clearly needs a change? As drawn it doesn't: only the person changes the phase.

## Round 18

Decisions 10 and 11 (docs/plans/360-round-17-product-decisions.md); boards R18_AskCitePage, R18_AskCiteStates, Ph18_AskCite, R18_AskWalk. CSS: `scripts/round18_b.css` (`.pw-sources__item[data-unavailable]`, `[data-deleted]`, `.pw-cite--off`, `.pw-pagebanner`, `.pw-cited`).

**Open lands in Page view (decided).** Open on a Markdown source opens it in Work's **Page view**, scrolled to the cited heading; the cited section is wrapped in `section.pw-cited` (a 3 px rule on the left), with “Cited as source 1 · lines 12–40” under the heading, and focus on the heading (`tabindex="-1"`). The infobar reads “‹ Overview · Source 1 of 3 · Sync queue”; its Page/Source tabs reach the raw lines (Source view, lines marked, the first current, as round 17 drew). Code files have no page and open in Source view at their lines. The Open button is named “Open {file} in {project} at {section}” (“at line {n}” for code).

**Item states.**

| State | Item | When opened |
| --- | --- | --- |
| Changed after the answer | meta “lines 12–40 · **changed after this answer**” | banner `p.pw-pagebanner` “Changed after this answer (2 days ago). You're reading the current file.” + **Show Source** (Source view at the section). Never shows the old revision. |
| Section gone | — | under the banner: “The cited section isn't in the current file; showing the file from the top.” |
| Moved in the same project | meta “**Moved to docs/sync.md after this answer**” | opens the new path; banner “Moved to docs/sync.md after this answer” |
| Deleted | meta “No longer in Class Notes”; path struck (`data-deleted`); Open disabled, described by the meta | — |
| Unavailable (project removed, or access lost) | number kept; text only “Source unavailable” (`data-unavailable`); no project, path, section, lines or excerpt; Open disabled (“Open, source 3 unavailable”) | — |

With an unavailable item the head drops the project count: “Sources · 3 · 1 unavailable”. The cite mark keeps its number as `span.pw-cite.pw-cite--off[aria-label="Source 3, unavailable"]` (dotted, not a link). Authorization is rechecked every time the answer is drawn; cached excerpts are never shown. The answer's own prose is not rewritten (decision 11); see the notes' open issue.

**Superseded (old → new).**
- Open → “the file at that line in that project's Work … in Source view” → Page view at the cited section for Markdown; Source view via the bar's toggle; code files unchanged.
- “Open {file} in {project} at line {n}” → “Open {file} in {project} at {section}” (Markdown).
- “changed since this answer” → “changed after this answer”; the coverage line's Ask Again is gone (see SearchScope Round 18).
- “The cited lines changed; showing the file from the top.” → banner “Changed after this answer ({ago}). You're reading the current file.” + Show Source; and only when the section is gone, “The cited section isn't in the current file; showing the file from the top.”
- Removed project: “{project} was removed from Pi WorkStation” (greyed, named) → “Source unavailable” (no name), head “Sources · 3 · 1 unavailable”.
- Open product choices 1–2 are decided (Page view; numbered placeholder).

| English | 日本語 |
| --- | --- |
| Source {n} of {m} · {section} | 出典 {n}/{m} · {section} |
| Cited as source {n} · lines {from}–{to} | 出典 {n} として引用 · {from}–{to} 行 |
| Page · Source | ページ · ソース |
| Changed after this answer ({ago}). You're reading the current file. | この回答の後に変更されました（{ago}）。現在のファイルを表示しています。 |
| Show Source | ソースを表示 |
| changed after this answer | この回答の後に変更 |
| Moved to {path} after this answer | この回答の後に {path} へ移動 |
| No longer in {project} | {project} にはもうありません |
| Source unavailable | ソースは利用できません |
| Source {n}, unavailable | 出典 {n}、利用できません |
| Sources · {n} · {k} unavailable | 出典 · {n} 件 · {k} 件は利用できません |
| Open {file} in {project} at {section} | {project} の {file} を「{section}」で開く |
| The cited section isn't in the current file; showing the file from the top. | 引用した節は現在のファイルにないため、先頭から表示しています。 |

## Round 18 addendum (proposed, awaiting approval)

Nothing here is decided. Boards: R18A_AskRevoked, Ph18A_AskRevoked. CSS: `scripts/round18add_b.css` (`.pw-withheld`).

**Q4 · Revoked project information in answer prose (Recommended).** When the person can no longer open a project an answer cited (access ended — not a project the person removed themselves), the host withholds that whole answer and keeps the question: `div.pw-withheld[role=note]` “This answer used a project you can no longer open, so it's hidden.” (この回答には開けなくなったプロジェクトが使われていたため、非表示にしています。) + **Ask Again in {scope}** (the Q5 label, e.g. “Ask Again in All Projects (4)”, “Ask Again in Class Notes”; disabled with “None of this conversation's projects can be searched now.” when nothing remains). No project name, count, Sources, coverage, Retry or excerpt remains for that answer. Later answers that did not use the project are unchanged. If the person removed the project from Pi WorkStation themselves, decision 11 applies unchanged (prose stays, the item becomes “Source unavailable”).
- Would supersede (round 18): “The answer's own prose is not rewritten (decision 11)” applied to every case → only to projects the person removed; access ending withholds the answer.
- Alternative (not recommended · privacy risk): keep the prose and redact the sources only (the round 18 drawing); the prose still names the project and describes its contents.

Data still missing (✱): per-answer `used_project_ids[]` and a per-project reason for loss of access (`removed_by_person` vs `access_ended`), evaluated at display time.
