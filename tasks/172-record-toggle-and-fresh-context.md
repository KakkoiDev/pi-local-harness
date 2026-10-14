# 172: Hide Task Record; "Pi sees:" evaluated again after every exchange

Kind: code

Request 2026-10-14: "show task record should say: hide task record when the task record is opened. And I find the ui to
close the record hard to figure out." And: "what files are loaded should be re-evaluated at every new chat interaction"
(the line still read "1 open task · 001-first-task.md" after "Yes, do tasks 2 right now.").

- [x] Red (browser, chat.cjs): once the record is open the button reads "Hide Task Record", the menu item too; it hides
  the record; there is no disclosure triangle.
- [x] One button shows and hides the record, its name saying which; the record is a plain section titled "Task record"
  (was a `<details>` whose triangle was a second, hidden way to close it). Choosing another request hides it.
- [x] Red (python): "do tasks 7" and "Task #7" mention task 007 (only "task 7" did; the plural matched as a related name).
- [x] `TASKREF` accepts "tasks".
- [x] Red (browser, design.cjs): a file Pi made while answering shows in "Pi sees:" after the answer, without typing.
- [x] The chat's "Pi sees:" asks the server again whenever the conversation gets a new message (the 3-second cache is
  skipped then). The request itself was always chosen at send time.
- [x] Asked the designer whether the record should be its own window with a close box (`design/briefs/round-6-notes.md`
  item 16): the system has no × buttons; windows close with the title bar's close box, phone sheets with "Close".
