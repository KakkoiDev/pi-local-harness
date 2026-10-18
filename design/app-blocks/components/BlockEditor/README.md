# BlockEditor

A page made of blocks (paragraphs, headings, lists, to-dos, quotes, code, dividers, images), each with a handle to move or change it and a slash menu to add a new one.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `btn`, `dropdown-menu`, `kbd`, `badge`, `item` |
| Route | `/pages/{id}` |
| Needs | Web: `GET/PATCH /pages/{id}`, `POST /pages/{id}/blocks`. No server: `store.pages.get/save(id)` (autosave). Blocks: PageTree, Mentions, SavedState, Presence |
| Used in | AppNotes, AppCourse, AppForum |

## Markup

```html
<article id="page" class="mx-auto grid w-full max-w-3xl gap-1 px-4 py-8 @3xl:px-12" aria-labelledby="page-title">
  <header class="mb-4 grid gap-2">
    <h1 id="page-title" class="text-3xl font-semibold outline-none" contenteditable="true" data-placeholder="Untitled">Field trip plan</h1>
    <p class="text-muted-foreground text-sm"><span data-t="editor.edited">Edited</span> <time datetime="2026-10-18T09:12">9:12</time> · <span id="page-saved" role="status" data-t="editor.saved">Saved</span></p>
  </header>
  <div id="blocks" class="grid gap-0.5" role="list" aria-label="Page content" data-t-label="editor.blocks">
    <div class="group relative flex items-start gap-1" role="listitem" data-block="b1" data-type="paragraph">
      <button class="btn opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 @max-3xl:opacity-100" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Move or change block" data-t-label="editor.handle" aria-haspopup="menu">⋮⋮</button>
      <p class="min-h-7 flex-1 py-0.5 outline-none" contenteditable="true">We leave the school at 8:30 and take the 8:52 train.</p>
    </div>
    <div class="group relative flex items-start gap-1" role="listitem" data-block="b2" data-type="todo">
      <button class="btn opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 @max-3xl:opacity-100" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Move or change block" data-t-label="editor.handle" aria-haspopup="menu">⋮⋮</button>
      <label class="flex flex-1 items-start gap-2 py-0.5"><input class="input mt-1" type="checkbox" checked><span contenteditable="true" class="flex-1 outline-none">Book the group ticket</span></label>
    </div>
    <div class="group relative flex items-start gap-1" role="listitem" data-block="b3" data-type="paragraph" data-empty="true">
      <button class="btn opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 @max-3xl:opacity-100" data-variant="ghost" data-size="icon-sm" type="button" aria-label="Move or change block" data-t-label="editor.handle" aria-haspopup="menu">⋮⋮</button>
      <p class="min-h-7 flex-1 py-0.5 outline-none" contenteditable="true" aria-describedby="slash-hint">/</p>
    </div>
  </div>
  <!-- the slash menu: opens under the block where "/" was typed -->
  <div id="slash-menu" class="dropdown-menu">
    <div data-popover aria-hidden="true" class="w-72">
      <div role="menu" aria-label="Add a block" data-t-label="editor.add">
        <div role="group" aria-labelledby="slash-basic">
          <div role="heading" id="slash-basic" data-t="editor.group.basic">Basic blocks</div>
          <div role="menuitem" data-type="paragraph"><span data-t="block.paragraph">Text</span><kbd class="kbd">Ctrl Alt 0</kbd></div>
          <div role="menuitem" data-type="heading1"><span data-t="block.heading1">Heading 1</span><kbd class="kbd">#</kbd></div>
          <div role="menuitem" data-type="heading2"><span data-t="block.heading2">Heading 2</span><kbd class="kbd">##</kbd></div>
          <div role="menuitem" data-type="bulleted"><span data-t="block.bulleted">Bulleted List</span><kbd class="kbd">-</kbd></div>
          <div role="menuitem" data-type="numbered"><span data-t="block.numbered">Numbered List</span><kbd class="kbd">1.</kbd></div>
          <div role="menuitem" data-type="todo"><span data-t="block.todo">To-do</span><kbd class="kbd">[]</kbd></div>
        </div>
        <hr role="separator">
        <div role="group" aria-labelledby="slash-more">
          <div role="heading" id="slash-more" data-t="editor.group.more">More</div>
          <div role="menuitem" data-type="quote" data-t="block.quote">Quote</div>
          <div role="menuitem" data-type="code" data-t="block.code">Code</div>
          <div role="menuitem" data-type="divider" data-t="block.divider">Divider</div>
          <div role="menuitem" data-type="image" data-t="block.image">Image…</div>
        </div>
      </div>
    </div>
  </div>
  <p id="slash-hint" class="sr-only" data-t="editor.slash_hint">Type / to add a block</p>
</article>
```

Attribute texts (`aria-label`, `data-placeholder`) use the keys in Texts: set them with `t(key)` in code, or `{{ t("key") }}` in a template; the starter's `data-t` fills element text only.

The handle opens the same `dropdown-menu` with: Turn Into (the block types), Duplicate, Move Up, Move Down, Copy Link to Block, Delete.

## States

| State | What changes |
| --- | --- |
| Empty page | One empty paragraph showing the placeholder `editor.empty` (`data-placeholder`, drawn with `:empty::before`). Title placeholder `editor.untitled`. |
| Typing `/` | The slash menu opens under the block (`aria-hidden="false"`), filtered by what follows the slash (`/hea` → headings). No match: `editor.no_match`. Esc closes and keeps the text. |
| Markdown shortcuts | `# ` → Heading 1, `## ` → Heading 2, `- ` → bulleted, `1. ` → numbered, `[] ` → to-do, `> ` → quote, ```` ``` ```` → code, `---` → divider. |
| Block selected | Esc in a block selects the whole block (`aria-selected="true"`, `bg-accent`); arrows move the selection; Delete removes it with a SavedState “Deleted · Undo”. |
| Dragging | The handle drags; a 2 px `bg-primary` line shows where it will land. Keyboard: `Ctrl Shift ↑/↓` moves the block. |
| Saving | `#page-saved` shows `editor.saving`, then `editor.saved`. Failed: `editor.save_failed` with Try Again (SavedState). |
| Someone else editing | Their cursor colour on the block's left edge and their avatar in the header (Presence). |
| Read only | No handles, no contenteditable, a `badge` `editor.read_only` beside the title. |
| Long page | Blocks are rendered in full; the header stays at the top of the page, not sticky. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `editor.untitled` | Untitled | 無題 |
| `editor.empty` | Type / for blocks, or just start writing | / でブロックを追加、またはそのまま入力 |
| `editor.edited` | Edited | 編集 |
| `editor.saving` | Saving… | 保存中… |
| `editor.saved` | Saved | 保存済み |
| `editor.save_failed` | Couldn’t save. Your changes are kept on this device. | 保存できませんでした。変更はこのデバイスに残っています。 |
| `editor.blocks` | Page content | ページの内容 |
| `editor.handle` | Move or change block | ブロックを移動・変更 |
| `editor.add` | Add a block | ブロックを追加 |
| `editor.slash_hint` | Type / to add a block | / でブロックを追加 |
| `editor.no_match` | No block called “{query}” | 「{query}」というブロックはありません |
| `editor.read_only` | Read only | 閲覧のみ |
| `editor.group.basic` | Basic blocks | 基本ブロック |
| `editor.group.more` | More | その他 |
| `block.paragraph` | Text | テキスト |
| `block.heading1` | Heading 1 | 見出し1 |
| `block.heading2` | Heading 2 | 見出し2 |
| `block.bulleted` | Bulleted List | 箇条書き |
| `block.numbered` | Numbered List | 番号付きリスト |
| `block.todo` | To-do | ToDo |
| `block.quote` | Quote | 引用 |
| `block.code` | Code | コード |
| `block.divider` | Divider | 区切り線 |
| `block.image` | Image… | 画像… |
| `block.turn_into` | Turn Into | ブロックの種類を変更 |
| `block.duplicate` | Duplicate | 複製 |
| `block.move_up` | Move Up | 上へ移動 |
| `block.move_down` | Move Down | 下へ移動 |
| `block.copy_link` | Copy Link to Block | ブロックへのリンクをコピー |
| `block.delete` | Delete | 削除 |

## Keyboard and focus

1. Title → 2. each block's handle, then its text, in page order.
- Return: new paragraph below (in a list: a new item; on an empty item: leave the list). Shift Return: line break inside the block.
- Backspace at the start of a block: merge with the one above; on an empty block: delete it and move up.
- ↑ ↓ at the first/last line move to the block above/below. `/` opens the slash menu; ↑ ↓ choose, Return inserts, Esc closes.
- Handle: Return or Space opens its menu; focus returns to the handle when it closes.
- Ctrl/⌘ B, I, U, E (code), K (link) format the selection. Ctrl/⌘ Z undoes, Shift Ctrl/⌘ Z redoes.

## Phone

- Handles are always visible (44 px, `@max-3xl:opacity-100`); drag needs a long press, and Move Up / Move Down in the handle menu do the same without dragging.
- The slash menu opens as a sheet from the bottom (a `dialog` with the same menu inside) so the keyboard doesn't cover it.
- A `+` button above the keyboard (the editor's toolbar row) opens the same menu for people who don't know `/`.

## Data

```json
{"id": "pg_7f2", "title": "Field trip plan", "updated_at": "2026-10-18T09:12:00+09:00", "version": 14,
 "blocks": [
  {"id": "b1", "type": "paragraph", "text": "We leave the school at 8:30 and take the 8:52 train.", "marks": [{"type": "bold", "from": 23, "to": 27}]},
  {"id": "b2", "type": "todo", "text": "Book the group ticket", "checked": true},
  {"id": "b3", "type": "heading2", "text": "What to bring"},
  {"id": "b4", "type": "image", "src": "/files/f_19.jpg", "alt": "Map of the museum"}]}
```

- Web: `PATCH /pages/{id}` with `{version, ops: [{op: "update"|"insert"|"move"|"delete", block}]}` every 1 s of quiet typing; 409 if `version` is stale (reload the page's blocks, keep local text in a SavedState conflict note).
- No server: `store.pages.save(page)` on every change (debounced 500 ms), whole page.

## Don't

- Don't store HTML from `contenteditable`; store `text` plus `marks`.
- Don't invent block types beyond the list; tables and embeds are separate blocks when needed.
- Don't use `document.execCommand` for formatting.
