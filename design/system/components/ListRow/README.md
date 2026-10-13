# ListRow

A row in the Projects or Files window: icon, name, optional meta on the right. The current row inverts.

- `<button class="pw-row" aria-current="page">` (or `<a>`); label in `.pw-row__label` so long names ellipsize; meta in `.pw-row__meta` (tabular figures, may hold a glyph before its text).
- Folders in the file tree have a disclosure triangle (`disclosure-open` / `disclosure-closed`), the `folder` icon and `aria-expanded`; children use `.pw-row--nested`. Folders sort before files, both alphabetical. Folders start collapsed, except the ones holding the open file.
- A working project shows the `running` glyph at the end of its row.
- Keep `.file-item` on file rows and `.conversation` on project rows (the browser tests use them).

## In the Plan group

- First row `ROADMAP.md` (name kept in full: it is the file people and agents refer to).
- Then open tasks, newest first, shown flat by file stem without folder or extension: `66-tailscale-voice-input` for `tasks/66-tailscale-voice-input.md`. Newest first keeps current work at the top; finished history moves to Done.
- Meta is the task’s checkbox progress: `2/3` (done/total, counting `- [x]` against all `- [ ]`, `- [x]`, `- [~]`). A task with a `- [~] Blocked:` line shows the `caution` glyph and **Blocked**. A task with no checkboxes shows no meta. ROADMAP.md shows its own progress the same way.
- Tasks whose boxes are all checked move into one collapsed summary row at the end: `.pw-row--summary`, disclosure, label **Done**, meta `done` glyph + “56 tasks”. Expanding it lists them, newest first, as `.pw-row--nested`.

## In the Files group

The folder tree without `ROADMAP.md` and `tasks/`. No meta (the file list API has no modification time).

## Phone

44px rows, 16px side inset. Same content.
