# Table

The Activity and Gate lists: a header row in 13px, then rows separated by dotted rules. The selected row inverts.

- Rows are `<div class="pw-table__row" role="row" tabindex="0">` inside `role="table"` (Return opens the detail); set the column template with `--pw-cols`. The Project cell is a real link (`<a class="pw-link" href="/p/<project>/chat">`) so it takes Tab on its own; never nest a link in a button.
- Text cells that hold a request use `.pw-table__cell--text` (Source Serif, one line, ellipsis); commands use `.pw-table__cell--mono`.
- At phone width only the first two columns show; the rest move to the detail screen.
- This is the app table for lists of records. A table inside a document or a Pi message is a MarkdownTable.
