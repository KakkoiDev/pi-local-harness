# PageTree

The nested list of pages in a workspace, in the side panel: open and close branches, add a page inside another, rename, move and favourite.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `sidebar` (nav, `details`/`summary`), `btn`, `dropdown-menu`, `input` |
| Route | none (part of the shell); links go to `/pages/{id}` |
| Needs | Web: `GET /pages/tree`, `POST /pages`, `PATCH /pages/{id}` (title, parent, position). No server: `store.pages.tree()`, `store.pages.create/move/rename`. Blocks: SidePanel, BlockEditor, ConfirmDialog, DeleteUndo |
| Used in | AppNotes, AppCourse |

## Markup

```html
<nav class="grid grid-cols-1 gap-1 text-sm" aria-label="Pages" data-t-label="tree.title">
  <div class="flex items-center justify-between px-2">
    <h3 class="text-muted-foreground text-xs font-medium" id="tree-label" data-t="tree.title">Pages</h3>
    <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-label="New page">+</button>
  </div>
  <ul role="tree" aria-labelledby="tree-label" class="grid grid-cols-1 gap-0.5">
    <li role="treeitem" aria-expanded="true" aria-level="1" aria-selected="false">
      <div class="group flex items-center gap-1 rounded-md pr-1 hover:bg-accent">
        <button class="btn" data-variant="ghost" data-size="icon-xs" type="button" tabindex="-1" aria-label="Close Class 3-B" data-t-label="tree.close">▾</button>
        <a href="/pages/pg_1" class="min-w-0 flex-1 truncate py-1.5">Class 3-B</a>
        <button class="btn opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" data-variant="ghost" data-size="icon-xs" type="button" aria-haspopup="menu" aria-label="Page options" data-t-label="tree.options">⋯</button>
      </div>
      <ul role="group" class="ml-4 grid grid-cols-1 gap-0.5 border-l pl-1">
        <li role="treeitem" aria-level="2" aria-selected="true">
          <div class="group flex items-center gap-1 rounded-md bg-accent pr-1 font-medium">
            <span class="w-6"></span>
            <a href="/pages/pg_7f2" aria-current="page" class="min-w-0 flex-1 truncate py-1.5">Field trip plan</a>
            <button class="btn opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" data-variant="ghost" data-size="icon-xs" type="button" aria-haspopup="menu" aria-label="Page options" data-t-label="tree.options">⋯</button>
          </div>
        </li>
      </ul>
    </li>
  </ul>
</nav>
```

The `⋯` menu (`dropdown-menu`): Add Page Inside, Rename, Duplicate, Add to Favourites, Move To…, Copy Link, Delete. Rename turns the link into an `input` in place (Return saves, Esc cancels).

## States

| State | What changes |
| --- | --- |
| Loading | Five `skeleton` rows of different widths (Skeletons). |
| No pages | `tree.empty` and a `btn` `tree.first` that creates “Untitled” and opens it. |
| Current page | `aria-current="page"` on its link, `aria-selected="true"`, `bg-accent font-medium`; its ancestors are open. |
| Closed branch | `aria-expanded="false"`, the child `ul` is `hidden`, the toggle shows ▸ and its label is `tree.open`: `aria-label="Open Grammar" data-t-label="tree.open"` (and back to `tree.close` when opened). |
| Renaming | The link is replaced by `<input class="input h-7" value="…" aria-label="Page name">`; empty name on Return keeps the old name. |
| Dragging | The row under the pointer gets `ring-2 ring-primary` (drop inside) or a 2 px line above/below (drop beside). |
| Deleted | The row disappears; a toast `tree.deleted` with Undo (DeleteUndo); child pages go with it and are named in the toast count. |
| Long names | `truncate`; the full name in `title`. |
| Many pages | The tree scrolls inside the side panel; Favourites stays above it. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `tree.title` | Pages | ページ |
| `tree.favourites` | Favourites | お気に入り |
| `tree.new` | New Page | 新しいページ |
| `tree.empty` | No pages yet. | まだページがありません。 |
| `tree.first` | Write the First Page | 最初のページを作成 |
| `tree.open` | Open {name} | {name} を開く |
| `tree.close` | Close {name} | {name} を閉じる |
| `tree.options` | Page options | ページのオプション |
| `tree.add_inside` | Add Page Inside | 中にページを追加 |
| `tree.rename` | Rename | 名前を変更 |
| `tree.duplicate` | Duplicate | 複製 |
| `tree.favourite` | Add to Favourites | お気に入りに追加 |
| `tree.unfavourite` | Remove from Favourites | お気に入りから外す |
| `tree.move` | Move To… | 移動… |
| `tree.copy_link` | Copy Link | リンクをコピー |
| `tree.delete` | Delete | 削除 |
| `tree.deleted` | Deleted “{name}” and {count} pages inside it. | 「{name}」と中の {count} ページを削除しました。 |
| `tree.untitled` | Untitled | 無題 |

## Keyboard and focus

1. New page (+) → 2. the tree (one tab stop: the current item, roving `tabindex`) → 3. the next part of the side panel.
- In the tree: ↑ ↓ move, → opens a branch or goes to its first child, ← closes it or goes to the parent, Home/End first/last, Return opens the page, F2 renames, Shift F10 or the context-menu key opens `⋯`.
- Typing letters jumps to the next page starting with them.
- After deleting, focus goes to the next row (or the previous at the end).

## Phone

- The tree lives in the side panel drawer (SidePanel); choosing a page closes the drawer.
- Rows are 44 px; the `⋯` button is always visible. Moving is done with Move To… (a sheet listing the tree), not by dragging.

## Data

```json
[{"id": "pg_1", "title": "Class 3-B", "parent": null, "position": 0, "favourite": false,
  "children": [{"id": "pg_7f2", "title": "Field trip plan", "parent": "pg_1", "position": 0, "children": []}]}]
```

- Web: `GET /pages/tree` returns the fragment of `<li>`s (open state from a cookie); `PATCH /pages/{id}` `{parent, position}` for a move, 409 if it would put a page inside itself.
- No server: `store.pages.tree()` builds the nesting from flat records `{id, title, parent, position}`; open branches are remembered in `localStorage` (`tree.open`).

## Don't

- Don't nest deeper than the data allows visually: indentation stops growing after 6 levels (the rest show a level number).
- Don't make every row a tab stop.
- Don't delete without the undo toast.
