# DatabaseView

A database of pages shown as a table, a board or a list, with view tabs, filters, sort and properties, like a Notion database.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `tabs`, `table`, `table-container`, `badge`, `avatar`, `item`, `card`, `select`, `btn`, `empty` |
| Route | `/databases/<id>` (or embedded in a page) |
| Needs | Web: `GET /databases/<id>`, `PATCH …/views/<view>`, `POST …/pages`; no server: the store |
| Links to | BlockEditor, PageTree, Kanban, DataTable, ListSearch, InfiniteScroll, Skeletons; used in AppNotes |

## Markup

```html
<section id="database" class="grid gap-4" aria-labelledby="db-title">
  <h1 id="db-title" class="text-2xl font-semibold">Trip planning</h1>
  <div class="tabs" id="db-tabs">
    <nav role="tablist" aria-orientation="horizontal" aria-label="Views" data-t-label="db.views"><button type="button" role="tab" id="db-tab-table" aria-controls="db-panel-table" aria-selected="true" tabindex="0" data-t="db.view.table"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18"/></svg>Table</button><button type="button" role="tab" id="db-tab-board" aria-controls="db-panel-board" aria-selected="false" tabindex="-1" data-t="db.view.board"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18M15 3v18"/></svg>Board</button><button type="button" role="tab" id="db-tab-list" aria-controls="db-panel-list" aria-selected="false" tabindex="-1" data-t="db.view.list"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13"/></svg>List</button></nav>
    <div class="flex flex-wrap items-center gap-2">
      <button class="btn" data-variant="outline" data-size="sm" type="button" aria-haspopup="dialog" data-t="db.filter"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>Filter</button>
      <span class="badge gap-1" data-variant="secondary"><span data-t="db.filter_chip">Status: Done</span><button class="btn" data-variant="ghost" data-size="icon-xs" type="button" aria-label="Remove filter Status: Done" data-t-label="db.remove_filter"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button></span>
      <span class="flex-1"></span>
      <label class="sr-only" for="db-sort" data-t="db.sort">Sort</label>
      <select class="select" id="db-sort" name="sort"><option value="due" data-t="db.sort.due">Due date</option><option value="name" data-t="db.sort.name">Name</option><option value="edited" data-t="db.sort.edited">Last edited</option></select>
      <button class="btn" data-size="sm" type="button" data-t="db.new"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg>New Page</button>
    </div>
    <div role="tabpanel" id="db-panel-table" aria-labelledby="db-tab-table" tabindex="-1" aria-selected="true" class="grid gap-3">
      <div class="table-container">
        <table class="table">
          <thead><tr><th scope="col" data-t="db.prop.name">Name</th><th scope="col" data-t="db.prop.status">Status</th><th scope="col" data-t="db.prop.tags">Tags</th><th scope="col" data-t="db.prop.due">Due</th><th scope="col" data-t="db.prop.owner">Owner</th></tr></thead>
          <tbody>
          <tr>
            <th scope="row" class="font-medium"><a class="hover:underline" href="/pages/510">Book the hostel in Kyoto</a></th>
            <td><span class="badge" data-variant="secondary" data-t="db.status.doing">Doing</span></td>
            <td><span class="flex flex-wrap gap-1"><span class="badge" data-variant="outline">Stay</span></span></td>
            <td class="tabular-nums"><time datetime="2026-10-24">24 Oct</time></td>
            <td><span class="avatar" data-size="sm"><span>AK</span></span></td>
          </tr>
          <tr>
            <th scope="row" class="font-medium"><a class="hover:underline" href="/pages/511">Rail pass: 7 or 14 days?</a></th>
            <td><span class="badge" data-variant="outline" data-t="db.status.todo">To do</span></td>
            <td><span class="flex flex-wrap gap-1"><span class="badge" data-variant="outline">Travel</span><span class="badge" data-variant="outline">Money</span></span></td>
            <td class="tabular-nums"><time datetime="2026-10-27">27 Oct</time></td>
            <td><span class="avatar" data-size="sm"><span>RS</span></span></td>
          </tr>
          <tr>
            <th scope="row" class="font-medium"><a class="hover:underline" href="/pages/512">Temple list for day 2</a></th>
            <td><span class="badge" data-variant="outline" data-t="db.status.todo">To do</span></td>
            <td><span class="flex flex-wrap gap-1"><span class="badge" data-variant="outline">Plans</span></span></td>
            <td class="tabular-nums"><time datetime="2026-10-30">30 Oct</time></td>
            <td><span class="avatar" data-size="sm"><span>MT</span></span></td>
          </tr>
          </tbody>
        </table>
      </div>
      <p class="text-sm text-muted-foreground" data-t="db.count">3 pages</p>
    </div>
    <div role="tabpanel" id="db-panel-board" aria-labelledby="db-tab-board" tabindex="-1" aria-selected="false" class="grid gap-3" hidden>
      <div class="grid gap-3 @3xl:grid-cols-3"><section class="grid content-start gap-2 rounded-lg bg-muted/50 p-2" aria-labelledby="col-todo">
          <h3 id="col-todo" class="flex items-center gap-2 px-1 text-sm font-medium"><span class="badge" data-variant="outline" data-t="db.status.todo">To do</span></h3>
          <ul class="grid gap-2"><li><a href="#" class="card gap-2 p-3 text-sm"><span class="font-medium">Rail pass: 7 or 14 days?</span><span class="flex flex-wrap items-center gap-1 text-muted-foreground"><span class="badge" data-variant="outline">Travel</span><span class="badge" data-variant="outline">Money</span><time datetime="2026-10-27">27 Oct</time></span></a></li><li><a href="#" class="card gap-2 p-3 text-sm"><span class="font-medium">Temple list for day 2</span><span class="flex flex-wrap items-center gap-1 text-muted-foreground"><span class="badge" data-variant="outline">Plans</span><time datetime="2026-10-30">30 Oct</time></span></a></li></ul>
          <button class="btn justify-start" data-variant="ghost" data-size="sm" type="button" aria-label="Add a page to To do" data-t-label="db.add_in"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></button>
        </section><section class="grid content-start gap-2 rounded-lg bg-muted/50 p-2" aria-labelledby="col-doing">
          <h3 id="col-doing" class="flex items-center gap-2 px-1 text-sm font-medium"><span class="badge" data-variant="secondary" data-t="db.status.doing">Doing</span></h3>
          <ul class="grid gap-2"><li><a href="#" class="card gap-2 p-3 text-sm"><span class="font-medium">Book the hostel in Kyoto</span><span class="flex flex-wrap items-center gap-1 text-muted-foreground"><span class="badge" data-variant="outline">Stay</span><time datetime="2026-10-24">24 Oct</time></span></a></li></ul>
          <button class="btn justify-start" data-variant="ghost" data-size="sm" type="button" aria-label="Add a page to Doing" data-t-label="db.add_in"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></button>
        </section><section class="grid content-start gap-2 rounded-lg bg-muted/50 p-2" aria-labelledby="col-done">
          <h3 id="col-done" class="flex items-center gap-2 px-1 text-sm font-medium"><span class="badge" data-t="db.status.done">Done</span></h3>
          <ul class="grid gap-2"><li><a href="#" class="card gap-2 p-3 text-sm"><span class="font-medium">Passport photos</span><span class="flex flex-wrap items-center gap-1 text-muted-foreground"><span class="badge" data-variant="outline">Papers</span><time datetime="2026-10-15">15 Oct</time></span></a></li></ul>
          <button class="btn justify-start" data-variant="ghost" data-size="sm" type="button" aria-label="Add a page to Done" data-t-label="db.add_in"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5v14"/></svg></button>
        </section></div>
    </div>
    <div role="tabpanel" id="db-panel-list" aria-labelledby="db-tab-list" tabindex="-1" aria-selected="false" class="grid gap-3" hidden>
      <ul class="grid gap-2"><li><a href="#" class="item" data-variant="outline"><section><h3>Book the hostel in Kyoto</h3><p>Stay</p></section><aside class="flex flex-col items-end gap-1 text-xs text-muted-foreground"><span class="badge" data-variant="secondary" data-t="db.status.doing">Doing</span><time datetime="2026-10-24">24 Oct</time></aside></a></li><li><a href="#" class="item" data-variant="outline"><section><h3>Rail pass: 7 or 14 days?</h3><p>Travel · Money</p></section><aside class="flex flex-col items-end gap-1 text-xs text-muted-foreground"><span class="badge" data-variant="outline" data-t="db.status.todo">To do</span><time datetime="2026-10-27">27 Oct</time></aside></a></li><li><a href="#" class="item" data-variant="outline"><section><h3>Temple list for day 2</h3><p>Plans</p></section><aside class="flex flex-col items-end gap-1 text-xs text-muted-foreground"><span class="badge" data-variant="outline" data-t="db.status.todo">To do</span><time datetime="2026-10-30">30 Oct</time></aside></a></li><li><a href="#" class="item" data-variant="outline"><section><h3>Passport photos</h3><p>Papers</p></section><aside class="flex flex-col items-end gap-1 text-xs text-muted-foreground"><span class="badge" data-t="db.status.done">Done</span><time datetime="2026-10-15">15 Oct</time></aside></a></li></ul>
    </div>
  </div>
</section>
```

- One set of pages, three **views** as Basecoat tabs: Table (properties as columns), Board (grouped by Status, Kanban's columns without drag here), List (Item rows). The view, its filters and its sort are saved per database (`views` in Data).
- Every page is a link to its own page (BlockEditor). The row header is the page's name, so a screen reader announces it first.
- Filters show as chips under the tabs, each with its own remove button; **Filter** opens a popover to add one (property, condition, value).
- Status uses the same three badges everywhere: To do (outline), Doing (secondary), Done (default).

## States

| State | What changes |
| --- | --- |
| Loading | Five skeleton rows in the active view (Skeletons). |
| No pages | The empty block (`db.empty_title`, `db.empty_text`, New Page) instead of the view. |
| No match | The view is replaced by `db.no_match` with **Clear Filters**. |
| Filtered | One chip per filter (`db.filter_chip`); its × button is labelled `db.remove_filter`. The count line `db.count` shows the visible pages. |
| Editing a cell | Not inline in this block: a page opens to edit; the row updates when you come back. A change saved elsewhere shows on the next load. |
| New page | Adds an `db.untitled` page at the top (Table, List) or in the column (Board, its + button labelled `db.add_in`) and opens it. |
| Many pages | Table and List load 50 at a time with InfiniteScroll’s button. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `db.title` | Trip planning | 旅行の計画 |
| `db.views` | Views | ビュー |
| `db.view.table` | Table | 表 |
| `db.view.board` | Board | ボード |
| `db.view.list` | List | リスト |
| `db.filter` | Filter | 絞り込み |
| `db.filter_chip` | {property}: {value} | {property}：{value} |
| `db.remove_filter` | Remove filter {property}: {value} | 絞り込み「{property}：{value}」を外す |
| `db.sort` | Sort | 並べ替え |
| `db.sort.due` | Due date | 期限 |
| `db.sort.name` | Name | 名前 |
| `db.sort.edited` | Last edited | 最終編集 |
| `db.new` | New Page | 新規ページ |
| `db.prop.name` | Name | 名前 |
| `db.prop.status` | Status | 状態 |
| `db.prop.tags` | Tags | タグ |
| `db.prop.due` | Due | 期限 |
| `db.prop.owner` | Owner | 担当 |
| `db.status.todo` | To do | 未着手 |
| `db.status.doing` | Doing | 進行中 |
| `db.status.done` | Done | 完了 |
| `db.count` | {count} pages | {count}ページ |
| `db.add_in` | Add a page to {column} | 「{column}」にページを追加 |
| `db.untitled` | Untitled | 無題 |
| `db.empty_title` | No pages yet | ページはまだありません |
| `db.empty_text` | Each page is a row here. Add the first one, or import a CSV. | ページ1つが1行になります。最初のページを追加するか、CSVを読み込んでください。 |
| `db.no_match` | No pages match these filters. | 絞り込みに一致するページはありません。 |
| `db.clear_filters` | Clear Filters | 絞り込みを解除 |
| `db.saved` | Saved | 保存しました |

## Keyboard and focus

1. The view tabs (← → move between Table, Board, List; Basecoat's tabs) → 2. Filter → 3. each filter chip's × → 4. Sort → 5. New Page → 6. the pages, in order.
- In Board: Tab goes column by column; each column's + adds a page there.

## Phone

- Table becomes the List view below 48rem (a table with five columns doesn't fit 390 px); the Table tab still exists and scrolls sideways if chosen.
- Board columns stack; each is as tall as its cards.
- Sort and New Page stay on the toolbar row; filters wrap under it.

## Data

```json
{"database": {"id": 7, "title": "Trip planning",
  "properties": [{"key": "status", "type": "select", "options": ["todo", "doing", "done"]},
                 {"key": "tags", "type": "multi_select"}, {"key": "due", "type": "date"}, {"key": "owner", "type": "person"}],
  "views": [{"id": "v1", "kind": "table", "filters": [{"property": "status", "op": "is_not", "value": "done"}], "sort": {"property": "due", "dir": "asc"}},
            {"id": "v2", "kind": "board", "group_by": "status"}]},
 "pages": [{"id": 510, "name": "Book the hostel in Kyoto", "status": "doing", "tags": ["Stay"], "due": "2026-10-24", "owner": "aiko"}]}
```

- Web: `GET /databases/7?view=v1` (the active view's fragment), `PATCH /databases/7/views/v1` (filters, sort), `POST /databases/7/pages` → the new page's URL. Needs a server for sharing; Multiplayer updates rows live.
- No server: pages and views in the store (`store.pages`, `store.views`), the same filter and sort functions in `js/logic/`.

## Don't

- Don't edit cells in place in this block; a page opens to edit (that is BlockEditor).
- Don't invent property types beyond select, multi-select, date, person, text, number, checkbox.
- Don't lose the person's view settings when they switch views.
