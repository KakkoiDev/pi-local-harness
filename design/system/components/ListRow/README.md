# ListRow

A row in the Projects or Files window: icon, name, optional meta on the right. The current row inverts.

- `<button class="pw-row" aria-current="page">` (or `<a>`); label in `.pw-row__label` so long names ellipsize; meta in `.pw-row__meta` (waiting, Today).
- Folders in the file tree have a disclosure triangle (`disclosure-open` / `disclosure-closed`) and `aria-expanded`; children use `.pw-row--nested`.
- A working project shows the `running` glyph at the end of its row.
