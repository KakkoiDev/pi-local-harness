# FileTree

App Block card (Other elements). A folder tree people open, close and choose files in: a project's files, a page tree's folders, an archive.

- Basecoat: none for the tree itself (it is a WAI-ARIA `tree` with Tailwind utilities); `btn` for the toolbar, `dropdown-menu` for the row menu
- Needs: The folder structure (`GET /files` or the store) and a small keyboard script (below)
- Used in: CodeDiff, AppCode (repository files), PageTree (same pattern for pages), AppNotes

## Markup
Copy, never retype: `{harness}/kit/blocks/elements/FileTree.html` (23 lines of HTML).

Every folder `li` has `class="group/item"` so its chevron turns. A closed folder has `aria-expanded="false"` and its child `ul` gets `hidden`. Files are links (`a`) so they open in a new tab with the middle button; folders are not links. Exactly one treeitem has `tabindex="0"` (the current file, else the first item).

Copy, never retype: `{harness}/kit/blocks/elements/FileTree.js` (19 lines of JS).

## States
- Loading: Five `skeleton` rows: `<div class="skeleton h-5 rounded bg-muted" style="width: 60%"></div>` with varied widths.
- Empty folder: An item under the folder: `<li role="none" class="ps-9 text-muted-foreground" data-t="files.empty_folder">Empty folder</li>`.
- No files at all: EmptyState with `files.none` and an Add a File button.
- Current file: `aria-selected="true"` on the item, `aria-current="page"` on its link (accent fill).
- Changed / new / deleted: A trailing `badge` `M` / `A` / `D` with `title` from `files.changed` / `files.added` / `files.deleted`; deleted names `line-through text-muted-foreground`.
- Long names: `truncate` with the full path in `title`.
- Error: InlineAlert in place of the tree: `files.error` (title), `files.error_detail`, and a Try Again button (`files.retry`).
- Lazy folder: First open shows one `skeleton` row, then `hx-get="/files?dir=app/static"` swaps the group in.

## Texts
(Key | English | 日本語)
- `files.title`: Files | ファイル
- `files.empty_folder`: Empty folder | 空のフォルダ
- `files.none`: No files yet. | ファイルはまだありません。
- `files.changed`: Changed | 変更あり
- `files.added`: New | 新規
- `files.deleted`: Deleted | 削除済み
- `files.error`: Couldn’t load the files. | ファイルを読み込めませんでした。
- `files.error_detail`: Check the connection and try again. | 接続を確認して、もう一度お試しください。
- `files.retry`: Try Again | 再試行
- `files.filter`: Filter files | ファイルを絞り込む

## Keyboard and focus
1. The tree takes one Tab stop (the current item) → 2. the content.
- ↓ ↑ next / previous visible item; → opens a closed folder, or moves into an open one; ← closes an open folder, or moves to the parent; Home / End first / last; Return opens a file or toggles a folder; typing a letter jumps to the next item starting with it.
- Opening a file keeps focus in the tree; the content area updates and is announced by its heading.

## Phone
- Below 48rem the tree is a screen of its own (Files) or a sheet from the top bar, not a side column. Rows grow to 44 px (`@max-3xl:min-h-11`), indentation shrinks to 12 px per level (`@max-3xl:ms-3`).
- Choosing a file closes the sheet and shows the file; Back returns to the tree with the same folders open.

## Data
```json
{"path": "", "items": [
  {"name": "app", "type": "folder", "open": true, "items": [
    {"name": "main.py", "type": "file", "path": "app/main.py", "status": "changed"},
    {"name": "static", "type": "folder", "open": false, "lazy": true}]},
  {"name": "README.md", "type": "file", "path": "README.md"}]}
```

- Web: render the tree server-side (folders first, then files, each sorted by name, `locale="ja"` collation for Japanese names); lazy folders with `hx-get="/files?dir=…" hx-trigger="toggle once"`.
- No server: build from the store's flat paths; remember open folders per person in `localStorage` (`tree.open`).

## Don't
- Don't nest `button`s inside treeitems for opening; the item itself is the control.
- Don't make every row Tab-focusable (one Tab stop for the whole tree).
- Don't show file icons by extension colour; one file glyph and one folder glyph.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> FileTree` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
