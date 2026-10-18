# DataTable

A table of many similar records with sortable columns, row selection, a row action and pages of 20.

| | |
| --- | --- |
| Group | Data |
| Basecoat | `table-container`, `table`, `btn`, `input` checkbox |
| Route | `/words?sort=added&dir=desc&page=1` (sort and page live in the address) |
| Needs | Web: `GET /words` (page or `#words` fragment), `POST /words/delete`. No server: `store.page("words", {{sort, dir, page, size: 20}})` |
| Used in | AppAdmin (users, orders), AppCrm (contacts), AppShop admin (products), AppCourse (students) |
| Links to | ListSearch (filters above it), EditForm (row edit), DeleteUndo (bulk delete), EmptyState, LoadingState |

## Markup

```html
<form id="words" class="grid gap-3" method="post" hx-target="#words" hx-select="#words" hx-swap="outerHTML">
  <div class="table-container">
    <table class="table">
      <caption class="sr-only">Your vocabulary words, 1–5 of 48</caption>
      <thead>
        <tr>
          <th scope="col" class="w-8"><input class="input" type="checkbox" aria-label="Select all on this page" data-t-label="table.select_all"></th>
          <th scope="col" aria-sort="none"><button type="button" class="btn -ms-2.5" data-variant="ghost" data-size="sm" name="sort" value="word" aria-label="Sort by Word"><span data-t="table.word">Word</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-3.5 opacity-60"><path d="m7 15 5 5 5-5M7 9l5-5 5 5"/></svg></button></th>
          <th scope="col" class="@max-3xl:hidden" data-t="table.reading">Reading</th>
          <th scope="col" data-t="table.meaning">Meaning</th>
          <th scope="col" class="@max-3xl:hidden text-end" data-t="table.lesson">Lesson</th>
          <th scope="col" class="@max-3xl:hidden" aria-sort="descending"><button type="button" class="btn -ms-2.5" data-variant="ghost" data-size="sm" name="sort" value="added" aria-label="Sort by Added"><span data-t="table.added">Added</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-3.5 opacity-60"><path d="m6 9 6 6 6-6"/></svg></button></th>
          <th scope="col" class="text-end"><span class="sr-only" data-t="table.actions">Actions</span></th>
        </tr>
      </thead>
      <tbody>
      <tr>
        <td><input class="input" type="checkbox" name="ids" value="100" aria-label="Select 駅"></td>
        <td class="font-medium" lang="ja">駅</td>
        <td class="@max-3xl:hidden" lang="ja">えき</td>
        <td>station</td>
        <td class="@max-3xl:hidden text-end tabular-nums">3</td>
        <td class="@max-3xl:hidden text-muted-foreground">12 Oct</td>
        <td class="text-end"><a href="/words/100/edit" class="btn" data-variant="ghost" data-size="icon-sm" aria-label="Actions for 駅"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></a></td>
      </tr>
      <tr>
        <td><input class="input" type="checkbox" name="ids" value="101" aria-label="Select 電車"></td>
        <td class="font-medium" lang="ja">電車</td>
        <td class="@max-3xl:hidden" lang="ja">でんしゃ</td>
        <td>train</td>
        <td class="@max-3xl:hidden text-end tabular-nums">3</td>
        <td class="@max-3xl:hidden text-muted-foreground">12 Oct</td>
        <td class="text-end"><a href="/words/101/edit" class="btn" data-variant="ghost" data-size="icon-sm" aria-label="Actions for 電車"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></a></td>
      </tr>
      </tbody>
    </table>
  </div>
  <nav class="flex items-center justify-between gap-2" aria-label="Pages" data-t-label="table.pages">
    <p class="text-sm text-muted-foreground" aria-hidden="true">1–5 / 48</p>
    <div class="flex items-center gap-1">
      <a href="?page=0" class="btn aria-disabled:pointer-events-none aria-disabled:opacity-50" data-variant="outline" data-size="sm" aria-disabled="true" tabindex="-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg><span data-t="table.prev">Previous</span></a>
      <a href="?page=1" class="btn @max-3xl:hidden" data-size="icon-sm" aria-current="page" data-variant="outline" aria-label="Page 1">1</a><a href="?page=2" class="btn @max-3xl:hidden" data-size="icon-sm" data-variant="ghost" aria-label="Page 2">2</a><a href="?page=3" class="btn @max-3xl:hidden" data-size="icon-sm" data-variant="ghost" aria-label="Page 3">3</a><span class="px-1 text-muted-foreground @max-3xl:hidden" aria-hidden="true">…</span><a href="?page=10" class="btn @max-3xl:hidden" data-size="icon-sm" data-variant="ghost" aria-label="Page 10">10</a>
      <a href="?page=2" class="btn" data-variant="outline" data-size="sm"><span data-t="table.next">Next</span><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></a>
    </div>
  </nav>
</form>
```

- Sorting: each sortable header is a button inside `th` with `aria-sort` (`ascending`, `descending`, `none`). Pressing it sorts by that column ascending; pressing again flips it. The server (or store) sorts, never only the visible page.
- The first column is selection; the last holds one row action (edit). More than one action: a `dropdown-menu` with `more` icon.
- Numbers align right with `tabular-nums`; dates are short and in the person's language.

## States

| State | What changes |
| --- | --- |
| Default | First page, sorted by Added, newest first. |
| Sorted | The pressed column's `aria-sort` changes and its icon shows the direction; page goes back to 1. |
| Row selected | The checkbox is checked and the `tr` gets `data-state="selected"`; the selection bar appears above the table with the count and Delete Selected. |
| All selected | The header checkbox selects the rows **on this page** only; its label says so. |
| Loading a page | The table keeps its rows at 60 % with `aria-busy="true"` on the form; no layout jump. |
| Empty | Replace the table with EmptyState; keep the filters if any were set. |
| Error | ErrorRetry's section version in place of the table. |
| First / last page | Previous (or Next) gets `aria-disabled="true"` and `tabindex="-1"`. |
| Many pages | 1, 2, 3, …, last; the current page has `aria-current="page"`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `table.title` | Vocabulary | 単語帳 |
| `table.caption` | Your vocabulary words, {from}–{to} of {total} | 単語 {total} 件中 {from}〜{to} 件目 |
| `table.word` | Word | 単語 |
| `table.reading` | Reading | 読み |
| `table.meaning` | Meaning | 意味 |
| `table.lesson` | Lesson | 課 |
| `table.added` | Added | 追加日 |
| `table.actions` | Actions | 操作 |
| `table.sort_by` | Sort by {column} | {column}で並べ替え |
| `table.row_menu` | Actions for {word} | 「{word}」の操作 |
| `table.edit` | Edit | 編集 |
| `table.delete` | Delete | 削除 |
| `table.select_all` | Select all on this page | このページをすべて選択 |
| `table.select_row` | Select {word} | 「{word}」を選択 |
| `table.selected` | {count} selected | {count} 件を選択中 |
| `table.delete_selected` | Delete Selected | 選択した項目を削除 |
| `table.pages` | Pages | ページ |
| `table.prev` | Previous | 前へ |
| `table.next` | Next | 次へ |
| `table.page` | Page {n} | {n} ページ |
| `table.per_page` | Rows per page | 表示件数 |

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
