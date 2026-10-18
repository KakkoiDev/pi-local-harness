# BlockEditor

App Block card (Collaboration). A page made of blocks (paragraphs, headings, lists, to-dos, quotes, code, dividers, images), each with a handle to move or change it and a slash menu to add a new one.

- Basecoat: `btn`, `dropdown-menu`, `kbd`, `badge`, `item`
- Route: `/pages/{id}`
- Needs: Web: `GET/PATCH /pages/{id}`, `POST /pages/{id}/blocks`. No server: `store.pages.get/save(id)` (autosave). Blocks: PageTree, Mentions, SavedState, Presence
- Used in: AppNotes, AppCourse, AppForum

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/BlockEditor.html` (45 lines of HTML).

Attribute texts (`aria-label`, `data-placeholder`) use the keys in Texts: set them with `t(key)` in code, or `{{ t("key") }}` in a template; the starter's `data-t` fills element text only.

The handle opens the same `dropdown-menu` with: Turn Into (the block types), Duplicate, Move Up, Move Down, Copy Link to Block, Delete.

## States
- Empty page: One empty paragraph showing the placeholder `editor.empty` (`data-placeholder`, drawn with `:empty::before`). Title placeholder `editor.untitled`.
- Typing `/`: The slash menu opens under the block (`aria-hidden="false"`), filtered by what follows the slash (`/hea` → headings). No match: `editor.no_match`. Esc closes and keeps the text.
- Markdown shortcuts: `# ` → Heading 1, `## ` → Heading 2, `- ` → bulleted, `1. ` → numbered, `[] ` → to-do, `> ` → quote, ```` ``` ```` → code, `---` → divider.
- Block selected: Esc in a block selects the whole block (`aria-selected="true"`, `bg-accent`); arrows move the selection; Delete removes it with a SavedState “Deleted · Undo”.
- Dragging: The handle drags; a 2 px `bg-primary` line shows where it will land. Keyboard: `Ctrl Shift ↑/↓` moves the block.
- Saving: `#page-saved` shows `editor.saving`, then `editor.saved`. Failed: `editor.save_failed` with Try Again (SavedState).
- Someone else editing: Their cursor colour on the block's left edge and their avatar in the header (Presence).
- Read only: No handles, no contenteditable, a `badge` `editor.read_only` beside the title.
- Long page: Blocks are rendered in full; the header stays at the top of the page, not sticky.

## Texts
(Key | English | 日本語)
- `editor.untitled`: Untitled | 無題
- `editor.empty`: Type / for blocks, or just start writing | / でブロックを追加、またはそのまま入力
- `editor.edited`: Edited | 編集
- `editor.saving`: Saving… | 保存中…
- `editor.saved`: Saved | 保存済み
- `editor.save_failed`: Couldn’t save. Your changes are kept on this device. | 保存できませんでした。変更はこのデバイスに残っています。
- `editor.blocks`: Page content | ページの内容
- `editor.handle`: Move or change block | ブロックを移動・変更
- `editor.add`: Add a block | ブロックを追加
- `editor.slash_hint`: Type / to add a block | / でブロックを追加
- `editor.no_match`: No block called “{query}” | 「{query}」というブロックはありません
- `editor.read_only`: Read only | 閲覧のみ
- `editor.group.basic`: Basic blocks | 基本ブロック
- `editor.group.more`: More | その他
- `block.paragraph`: Text | テキスト
- `block.heading1`: Heading 1 | 見出し1
- `block.heading2`: Heading 2 | 見出し2
- `block.bulleted`: Bulleted List | 箇条書き
- `block.numbered`: Numbered List | 番号付きリスト
- `block.todo`: To-do | ToDo
- `block.quote`: Quote | 引用
- `block.code`: Code | コード
- `block.divider`: Divider | 区切り線
- `block.image`: Image… | 画像…
- `block.turn_into`: Turn Into | ブロックの種類を変更
- `block.duplicate`: Duplicate | 複製
- `block.move_up`: Move Up | 上へ移動
- `block.move_down`: Move Down | 下へ移動
- `block.copy_link`: Copy Link to Block | ブロックへのリンクをコピー
- `block.delete`: Delete | 削除

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> BlockEditor` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
