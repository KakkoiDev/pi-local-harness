# Table

The Activity and Laya lists: a header row in 13px, then rows separated by dotted rules. The selected row inverts.

- Rows are `<button class="pw-table__row">` (or `<a>`) inside `role="list"`; set the column template with `--pw-cols` on the table.
- Text cells that hold a request use `.pw-table__cell--text` (Source Serif, one line, ellipsis); commands use `.pw-table__cell--mono`.
- At phone width only the first two columns show; the rest move to the detail screen.
