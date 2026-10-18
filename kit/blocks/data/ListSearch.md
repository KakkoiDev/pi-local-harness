# ListSearch

App Block card (Data). A list of the person's things with a search field and a few filters above it; results update as they type.

- Basecoat: `input-group`, `select` (native), `input` checkbox, `item`, `badge`, `empty`
- Route: `/notes?q=&subject=&sort=&mine=` (the filters live in the address)
- Needs: Web: `GET /notes` returns the page, or only `#notes-results` for htmx requests. No server: `store.list("notes", {{q, subject, sort, mine}})`
- Used in: AppNotes, AppForum, AppCourse, AppCrm; DataTable when the things have many columns
- Links to: DetailView (each item), EmptyState, LoadingState, ErrorRetry, InfiniteScroll (long lists)

## Markup
Copy, never retype: `{harness}/kit/blocks/data/ListSearch.html` (55 lines of HTML).

- Each item is a link to its DetailView (`item` with `data-variant="outline"`): title, one line of text, and an aside with its subject badge and when it changed.
- The filters are a `GET` form: without JavaScript it still works, and the address can be shared or bookmarked.
- Up to 4 filters in the row. More than that: put them in a "Filters" popover and show the active ones as removable badges.

## States
- Default: Newest first, all subjects; `list.count` above the list.
- Typing: After 250 ms the results are replaced (`hx-trigger`); the address updates (`hx-push-url`). The field keeps focus.
- Loading: `#notes-results` gets `aria-busy="true"` and the list fades to 60 % (`aria-busy:opacity-60`); after 1 s show LoadingState's list skeleton.
- No match: EmptyState with `list.no_match` (the query in it) and Clear Filters.
- No notes at all: EmptyState's first-run version (“No notes yet”), no filters shown.
- Error: ErrorRetry's section version in place of the list; the filters stay usable.
- Many results: 20 per page, then InfiniteScroll (or DataTable's pagination for tables).
- Long titles: One line, truncated (`truncate` on `h3`); the text clamps to one line.

## Texts
(Key | English | 日本語)
- `list.title`: Notes | ノート
- `list.search`: Search notes | ノートを検索
- `list.search_hint`: Search titles and text… | タイトルと本文を検索…
- `list.subject`: Subject | 科目
- `list.subject_all`: All subjects | すべての科目
- `list.sort`: Sort | 並べ替え
- `list.sort_recent`: Recently edited | 最近の編集順
- `list.sort_title`: Title A–Z | タイトル順
- `list.filters`: Filters | 絞り込み
- `list.only_mine`: Only mine | 自分のノートのみ
- `list.count`: {count} notes | {count} 件のノート
- `list.clear`: Clear Filters | 絞り込みを解除
- `list.no_match`: No notes match “{q}”. | 「{q}」に一致するノートはありません。
- `list.no_match_hint`: Check the spelling or clear the filters. | つづりを確認するか、絞り込みを解除してください。
- `list.updated`: Edited {when} | {when}に編集
- `subject.Vocabulary`: Vocabulary | 語彙
- `subject.Grammar`: Grammar | 文法
- `subject.Kanji`: Kanji | 漢字

Subjects are app data with keys (`subject.<id>`); note titles and text are the person's own.

## Keyboard and focus
1. Search → 2. Subject → 3. Sort → 4. Only mine → 5. each result in order.
- `/` focuses the search field from anywhere on the page (not while typing in another field). Esc in the field clears it.
- Results updating never moves focus; screen readers hear the new count (`aria-live="polite"` on the results).

## Phone
- The search field takes the full width; Subject and Sort sit side by side under it, then Only mine. All 44 px tall.
- Items keep their aside under 48 rem but the edit time is hidden if the title would wrap (`@max-3xl:hidden` on it in long lists).

## Data
```json
{"q": "vocab", "subject": "vocabulary", "sort": "recent", "mine": false, "total": 2,
 "items": [{"id": 42, "title": "Week 3 · Vocabulary", "excerpt": "駅 (eki) station…", "subject": "vocabulary", "updated_at": "2026-10-18T09:12:00+09:00"}]}
```

- Web: `GET /notes` (200). With `HX-Request`, return only the `#notes-results` fragment. Search title and text with SQLite FTS5 (`notes_fts MATCH ?`); show relative times with the person's language.
- No server: filter in memory for up to ~2,000 items; above that use IndexedDB with an index on `subject` and `updated_at`.

## Don't
- Don't search on every keystroke without the 250 ms delay.
- Don't clear the filters when the person opens an item and comes back; they live in the address.
- Don't add a Search button; the field searches as you type (Return also submits).

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ListSearch` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
