# DatabaseView

App Block card (Collaboration). A database of pages shown as a table, a board or a list, with view tabs, filters, sort and properties, like a Notion database.

- Basecoat: `tabs`, `table`, `table-container`, `badge`, `avatar`, `item`, `card`, `select`, `btn`, `empty`
- Route: `/databases/<id>` (or embedded in a page)
- Needs: Web: `GET /databases/<id>`, `PATCH …/views/<view>`, `POST …/pages`; no server: the store
- Links to: BlockEditor, PageTree, Kanban, DataTable, ListSearch, InfiniteScroll, Skeletons; used in AppNotes

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/DatabaseView.html` (63 lines of HTML).

- One set of pages, three **views** as Basecoat tabs: Table (properties as columns), Board (grouped by Status, Kanban's columns without drag here), List (Item rows). The view, its filters and its sort are saved per database (`views` in Data).
- Every page is a link to its own page (BlockEditor). The row header is the page's name, so a screen reader announces it first.
- Filters show as chips under the tabs, each with its own remove button; **Filter** opens a popover to add one (property, condition, value).
- Status uses the same three badges everywhere: To do (outline), Doing (secondary), Done (default).

## States
- Loading: Five skeleton rows in the active view (Skeletons).
- No pages: The empty block (`db.empty_title`, `db.empty_text`, New Page) instead of the view.
- No match: The view is replaced by `db.no_match` with **Clear Filters**.
- Filtered: One chip per filter (`db.filter_chip`); its × button is labelled `db.remove_filter`. The count line `db.count` shows the visible pages.
- Editing a cell: Not inline in this block: a page opens to edit; the row updates when you come back. A change saved elsewhere shows on the next load.
- New page: Adds an `db.untitled` page at the top (Table, List) or in the column (Board, its + button labelled `db.add_in`) and opens it.
- Many pages: Table and List load 50 at a time with InfiniteScroll’s button.

## Texts
(Key | English | 日本語)
- `db.title`: Trip planning | 旅行の計画
- `db.views`: Views | ビュー
- `db.view.table`: Table | 表
- `db.view.board`: Board | ボード
- `db.view.list`: List | リスト
- `db.filter`: Filter | 絞り込み
- `db.filter_chip`: {property}: {value} | {property}：{value}
- `db.remove_filter`: Remove filter {property}: {value} | 絞り込み「{property}：{value}」を外す
- `db.sort`: Sort | 並べ替え
- `db.sort.due`: Due date | 期限
- `db.sort.name`: Name | 名前
- `db.sort.edited`: Last edited | 最終編集
- `db.new`: New Page | 新規ページ
- `db.prop.name`: Name | 名前
- `db.prop.status`: Status | 状態
- `db.prop.tags`: Tags | タグ
- `db.prop.due`: Due | 期限
- `db.prop.owner`: Owner | 担当
- `db.status.todo`: To do | 未着手
- `db.status.doing`: Doing | 進行中
- `db.status.done`: Done | 完了
- `db.count`: {count} pages | {count}ページ
- `db.add_in`: Add a page to {column} | 「{column}」にページを追加
- `db.untitled`: Untitled | 無題
- `db.empty_title`: No pages yet | ページはまだありません
- `db.empty_text`: Each page is a row here. Add the first one, or import a CSV. | ページ1つが1行になります。最初のページを追加するか、CSVを読み込んでください。
- `db.no_match`: No pages match these filters. | 絞り込みに一致するページはありません。
- `db.clear_filters`: Clear Filters | 絞り込みを解除
- `db.saved`: Saved | 保存しました

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> DatabaseView` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
