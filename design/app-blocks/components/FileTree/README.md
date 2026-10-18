# FileTree

A folder tree people open, close and choose files in: a project's files, a page tree's folders, an archive.

| | |
| --- | --- |
| Group | Other elements |
| Basecoat | none for the tree itself (it is a WAI-ARIA `tree` with Tailwind utilities); `btn` for the toolbar, `dropdown-menu` for the row menu |
| Needs | The folder structure (`GET /files` or the store) and a small keyboard script (below) |
| Used in | CodeDiff, AppCode (repository files), PageTree (same pattern for pages), AppNotes |

Use native `<details>` for a short, read-only tree (no script). Use the `role="tree"` version below when people choose files with the keyboard or the tree is long.

## Markup

```html
<nav aria-labelledby="files-title" class="grid gap-1">
  <h2 id="files-title" class="px-2 text-xs font-medium text-muted-foreground" data-t="files.title">Files</h2>
  <ul role="tree" id="file-tree" aria-labelledby="files-title" class="text-sm">
    <li role="treeitem" class="group/item" aria-expanded="true" aria-level="1" aria-setsize="3" aria-posinset="1" tabindex="-1">
      <span class="flex min-h-8 items-center gap-1.5 rounded-md px-2 hover:bg-accent">
        <svg class="size-4 shrink-0 transition-transform group-aria-[expanded=false]/item:-rotate-90" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
        <svg class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        <span class="truncate">app</span>
      </span>
      <ul role="group" class="ms-4 border-s ps-1">
        <li role="treeitem" aria-level="2" aria-setsize="2" aria-posinset="1" aria-selected="true" tabindex="0" data-path="app/main.py">
          <a href="/files/app/main.py" class="flex min-h-8 items-center gap-1.5 rounded-md px-2 ps-7 aria-[current=page]:bg-accent aria-[current=page]:font-medium" aria-current="page" tabindex="-1">
            <svg class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>
            <span class="truncate">main.py</span>
            <span class="badge ms-auto" data-variant="outline" title="Changed" data-t-title="files.changed">M</span>
          </a>
        </li>
        <!-- … -->
      </ul>
    </li>
    <li role="treeitem" class="group/item" aria-expanded="false" aria-level="1" aria-setsize="3" aria-posinset="2" tabindex="-1"><!-- closed folder: its <ul role="group"> has hidden --></li>
  </ul>
</nav>
```

Every folder `li` has `class="group/item"` so its chevron turns. A closed folder has `aria-expanded="false"` and its child `ul` gets `hidden`. Files are links (`a`) so they open in a new tab with the middle button; folders are not links. Exactly one treeitem has `tabindex="0"` (the current file, else the first item).

```js
// js/tree.mjs: arrow keys for role="tree" (folders open/close, files open on Return)
export function tree(root) {
  const items = () => [...root.querySelectorAll('[role="treeitem"]')].filter(i => !i.closest('ul[hidden]'));
  const focus = el => { root.querySelector('[tabindex="0"]')?.setAttribute('tabindex', '-1'); el.setAttribute('tabindex', '0'); el.focus(); };
  const toggle = (el, open) => { if (!el.hasAttribute('aria-expanded')) return; el.setAttribute('aria-expanded', String(open)); el.querySelector(':scope > ul').hidden = !open; };
  root.addEventListener('click', e => {               // a folder's row toggles it; file links navigate as links
    const row = e.target.closest('[role="treeitem"][aria-expanded] > span');
    if (row) { const it = row.parentElement; toggle(it, it.getAttribute('aria-expanded') !== 'true'); focus(it); }
  });
  root.addEventListener('keydown', e => {
    const list = items(), it = document.activeElement, i = list.indexOf(it), open = it.getAttribute('aria-expanded');
    const k = { ArrowDown: () => list[i + 1] && focus(list[i + 1]), ArrowUp: () => list[i - 1] && focus(list[i - 1]),
      ArrowRight: () => open === 'false' ? toggle(it, true) : open === 'true' && focus(list[i + 1]),
      ArrowLeft: () => open === 'true' ? toggle(it, false) : it.parentElement.closest('[role="treeitem"]') && focus(it.parentElement.closest('[role="treeitem"]')),
      Home: () => focus(list[0]), End: () => focus(list.at(-1)),
      Enter: () => open ? toggle(it, open !== 'true') : it.querySelector('a')?.click() }[e.key];
    if (k) { e.preventDefault(); k(); }
  });
}
```

## States

| State | What changes |
| --- | --- |
| Loading | Five `skeleton` rows: `<div class="skeleton h-5 rounded bg-muted" style="width: 60%"></div>` with varied widths. |
| Empty folder | An item under the folder: `<li role="none" class="ps-9 text-muted-foreground" data-t="files.empty_folder">Empty folder</li>`. |
| No files at all | EmptyState with `files.none` and an Add a File button. |
| Current file | `aria-selected="true"` on the item, `aria-current="page"` on its link (accent fill). |
| Changed / new / deleted | A trailing `badge` `M` / `A` / `D` with `title` from `files.changed` / `files.added` / `files.deleted`; deleted names `line-through text-muted-foreground`. |
| Long names | `truncate` with the full path in `title`. |
| Error | InlineAlert in place of the tree: `files.error` (title), `files.error_detail`, and a Try Again button (`files.retry`). |
| Lazy folder | First open shows one `skeleton` row, then `hx-get="/files?dir=app/static"` swaps the group in. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `files.title` | Files | ファイル |
| `files.empty_folder` | Empty folder | 空のフォルダ |
| `files.none` | No files yet. | ファイルはまだありません。 |
| `files.changed` | Changed | 変更あり |
| `files.added` | New | 新規 |
| `files.deleted` | Deleted | 削除済み |
| `files.error` | Couldn’t load the files. | ファイルを読み込めませんでした。 |
| `files.error_detail` | Check the connection and try again. | 接続を確認して、もう一度お試しください。 |
| `files.retry` | Try Again | 再試行 |
| `files.filter` | Filter files | ファイルを絞り込む |

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
