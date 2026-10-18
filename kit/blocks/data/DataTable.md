# DataTable

App Block card (Data). A table of many similar records with sortable columns, row selection, a row action and pages of 20.

- Basecoat: `table-container`, `table`, `btn`, `input` checkbox
- Route: `/words?sort=added&dir=desc&page=1` (sort and page live in the address)
- Needs: Web: `GET /words` (page or `#words` fragment), `POST /words/delete`. No server: `store.page("words", {{sort, dir, page, size: 20}})`
- Used in: AppAdmin (users, orders), AppCrm (contacts), AppShop admin (products), AppCourse (students)
- Links to: ListSearch (filters above it), EditForm (row edit), DeleteUndo (bulk delete), EmptyState, LoadingState

## Markup
Copy, never retype: `{harness}/kit/blocks/data/DataTable.html` (46 lines of HTML).

- Sorting: each sortable header is a button inside `th` with `aria-sort` (`ascending`, `descending`, `none`). Pressing it sorts by that column ascending; pressing again flips it. The server (or store) sorts, never only the visible page.
- The first column is selection; the last holds one row action (edit). More than one action: a `dropdown-menu` with `more` icon.
- Numbers align right with `tabular-nums`; dates are short and in the person's language.

## States
- Default: First page, sorted by Added, newest first.
- Sorted: The pressed column's `aria-sort` changes and its icon shows the direction; page goes back to 1.
- Row selected: The checkbox is checked and the `tr` gets `data-state="selected"`; the selection bar appears above the table with the count and Delete Selected.
- All selected: The header checkbox selects the rows **on this page** only; its label says so.
- Loading a page: The table keeps its rows at 60 % with `aria-busy="true"` on the form; no layout jump.
- Empty: Replace the table with EmptyState; keep the filters if any were set.
- Error: ErrorRetry's section version in place of the table.
- First / last page: Previous (or Next) gets `aria-disabled="true"` and `tabindex="-1"`.
- Many pages: 1, 2, 3, …, last; the current page has `aria-current="page"`.

## Texts
(Key | English | 日本語)
- `table.title`: Vocabulary | 単語帳
- `table.caption`: Your vocabulary words, {from}–{to} of {total} | 単語 {total} 件中 {from}〜{to} 件目
- `table.word`: Word | 単語
- `table.reading`: Reading | 読み
- `table.meaning`: Meaning | 意味
- `table.lesson`: Lesson | 課
- `table.added`: Added | 追加日
- `table.actions`: Actions | 操作
- `table.sort_by`: Sort by {column} | {column}で並べ替え
- `table.row_menu`: Actions for {word} | 「{word}」の操作
- `table.edit`: Edit | 編集
- `table.delete`: Delete | 削除
- `table.select_all`: Select all on this page | このページをすべて選択
- `table.select_row`: Select {word} | 「{word}」を選択
- `table.selected`: {count} selected | {count} 件を選択中
- `table.delete_selected`: Delete Selected | 選択した項目を削除
- `table.pages`: Pages | ページ
- `table.prev`: Previous | 前へ
- `table.next`: Next | 次へ
- `table.page`: Page {n} | {n} ページ
- `table.per_page`: Rows per page | 表示件数

## Keyboard and focus
1. Delete Selected (when shown) → 2. Select all → 3. each sortable header → 4. row by row: checkbox, then edit → 5. Previous, page numbers, Next.
- Space toggles a checkbox; Return or Space sorts on a header. After sorting or paging, focus stays on the pressed control.
- After Delete Selected, focus moves to the selection bar's status, then DeleteUndo's toast offers Undo.

## Phone
- Below 48 rem the less important columns hide (`@max-3xl:hidden` on Reading, Lesson, Added); Word, Meaning and the action stay.
- Page numbers hide; only Previous and Next remain, 44 px tall.
- Wider tables scroll sideways inside `.table-container`; never shrink text under 14 px.

## Data
```json
{"sort": "added", "dir": "desc", "page": 1, "size": 20, "total": 48,
 "rows": [{"id": 100, "word": "駅", "reading": "えき", "meaning": "station", "lesson": 3, "added_at": "2026-10-12"}]}
```

- Web: `GET /words?sort=&dir=&page=` (200, or only `#words` for htmx); validate `sort` against a list of columns. `POST /words/delete` with `ids=100&ids=101` → 200 with the refreshed `#words` and an `HX-Trigger: {"toast": …}` for DeleteUndo.
- No server: sort and slice in the store; keep `sort`, `dir`, `page` in the address with `history.replaceState`.

## Don't
- Don't sort or filter only the rows on screen.
- Don't make whole rows clickable when they also contain checkboxes and buttons; link the main cell instead.
- Don't add column resizing, reordering or inline editing: those are separate blocks.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DataTable` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
