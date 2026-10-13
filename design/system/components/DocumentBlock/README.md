# DocumentBlock

A block in the Markdown editor, in `.pw-doc` (700px column, Source Serif 18/1.6). Types, in menu order: Paragraph (the plain type), Heading, Task, Bullet, Number, Quote, Table, Code, Raw Markdown.

- Markup: `<div class="pw-block pw-block--{type}" data-type>` with an optional marker, then `<div class="pw-block__content" contenteditable>`. Types look like themselves:
  - **Bullet**: `.pw-block__marker` “•”. **Number**: “1.”, “2.”, counting within a run of numbered blocks (a different block restarts at 1). **Task**: a `.pw-check` instead of a marker.
  - **Quote** (`.pw-block--quote`): italic, in a 1px dotted frame, as `.pw-doc blockquote`. **Code** and **Raw** (`--code`, `--raw`): mono 14/1.5 in a 1px ink frame.
  - **Empty** (`.pw-block--empty`): the content shows its `data-placeholder` (“Write, or choose a style in the ruler”; “List item” in lists) in `ink-disabled`.
- Handle: `.pw-block__handle` (the `handle` icon) shows when the pointer is anywhere in the 48px gutter or on the block (`.pw-block::before` covers the gutter), and on the focused block. Its menu: **Turn Into ▸**, **Add Block Below ▸** (same type list; Paragraph first), Move Up ⌥⌘↑, Move Down ⌥⌘↓, Comment on *Type*, Ask Pi About *Type*…, Delete *Type*. Items name the block's type (“Comment on Task”, “Delete Heading”); “Paragraph” is only the plain type.
- Adding blocks: Return at the end of a block starts a new Paragraph; in the middle it splits. Lists continue (bullet, number, task); Return on an empty list item turns it into a Paragraph. Backspace in an empty block removes it and puts the caret at the end of the block above. A click on the empty page below the last block (`.pw-doc__tail`) adds a Paragraph. The Enter that confirms Japanese input never splits a block.
- Deleting a block from the menu shows a Toast: “Task deleted.” with Undo ⌘Z.
- The ruler's Block style popup and the bullet and task tools act on the focused block. On phone the handle is always visible for the focused block and 44px tall; its menu opens as a sheet.
- Markdown source mode replaces blocks with one `.pw-source` textarea (mono).
## Table (`.pw-block--table`)

A GFM table that reads as a table and edits as its Markdown, so the file stays plain Markdown. Board: W_Table, Ph_Table, Ph_TableEdit.

- **At rest**: a MarkdownTable (`.pw-mdtable`) in the column at document sizes (Source Serif 16/1.45, header cells in the chrome face over a double rule). Alignment from the rule row (`:---` left, `:---:` centre, `---:` right, tabular figures). Inline marks render. Comments anchor to text inside cells like anywhere else.
- **Focused**: outline and handle, like every block. The handle menu adds, for tables only: **Add Row** (appends an empty row), **Add Column** (adds an empty column to the right of every row), **Edit as Markdown ↩**. They edit the Markdown for you; there is no cell-by-cell editing for now.
- **Editing**: click, Return or Edit as Markdown switches the block to its Markdown in the mono ink frame (`.pw-block__source`), with one hint line under it (`.pw-block__hint`): “Table as Markdown · Esc or click outside shows the table”. No live preview: the table returns as soon as you leave.
- **Not a table yet**: if the text no longer parses, it stays as text in the frame with a caution hint: “Not a table yet: add a rule row like | --- | --- | under the header. Saved as written.” Nothing is lost or rewritten.
- **Creating**: Turn Into › Table or Add Block Below › Table inserts `| Column | Column |` / `| ------ | ------ |` / `|  |  |` in editing state with the first header word selected.
- **Wide**: cells wrap at 280px (200px on phone); wider tables scroll sideways inside the block with the 1-bit scroll bar. The page never scrolls sideways.
- **Phone**: reads the same, scrolling inside its frame. Tapping it opens the Markdown in place; the bottom bar becomes Block style · **Add Row** · **Add Column** · **Done**. The block sheet's type grid is 3×3.
