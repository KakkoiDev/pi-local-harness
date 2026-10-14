# Table

The Activity and Gate lists: a header row in 13px, then rows separated by dotted rules. The selected row inverts.

- Rows are `<div class="pw-table__row" role="row" tabindex="0">` inside `role="table"` (Return opens the detail); set the column template with `--pw-cols`. The Project cell is a real link (`<a class="pw-link" href="/p/<project>/chat">`) so it takes Tab on its own; never nest a link in a button.
- Text cells that hold a request use `.pw-table__cell--text` (Source Serif, one line, ellipsis); commands use `.pw-table__cell--mono`.
- At phone width only the first two columns show; the rest move to the detail screen.
- This is the app table for lists of records. A table inside a document or a Pi message is a MarkdownTable.
- Activity detail (task 157): one button back, named after the origin — **Open in Chat** (chat message; scrolls to it), **Show Comment** (comment; Work, thread open), **Show in Review** (whole-file question; the box open on it), **Open in Chat** + **Show Task** (worker). A “From” line names the origin. Replaces “Open in Project”. Boards: A_FromChat, A_FromComment, A_FromFile, A_FromWorker, Ph_ActivityFromComment.

## Activity: Task record (task 172)

- Under the selected request's detail, one button **Show Task Record** (`aria-expanded`, `aria-controls="task-record"`). It opens a plain “Task record” section under a 3px double rule: an InfoBar with the heading and the record's path, then the Markdown record in mono. The same button then reads **Hide Task Record**; the Agent menu item follows the same label.
- No × button: the button that opened it closes it. Not a separate window.
- Phone: Show Task Record opens a Sheet titled “Task record” with Close.
- Boards: A_Record, Ph_ActivityDetail, Ph_ActivityRecord.
