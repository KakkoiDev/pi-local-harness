# 76: Pi Workbench 1-bit, Activity

Kind: code

Request 2026-10-13: "implement this new design." Build step 9 of [design/IMPLEMENTATION.md](../design/IMPLEMENTATION.md) § 12 (§ 6.3 Activity, § 4 `renderActivity`, § 11 test selectors).

- [x] Red (`tests/browser/chat.cjs`): rows are `a.activity-task.pw-table__row` with a `.task-state.pw-glyph`; clicking a row marks it `aria-current` and fills `#activity-detail` ("<State> in <project>", Open Document); another row swaps the detail; ↑/↓ on the focused list moves the selection and focus; Show Task Record loads the record; Cancel… and Stop are found in the detail pane; states read Cancelled and Stopped.
- [x] `js/workspace.mjs`: table header, columns State, Request, Project, Source, Started, Time; selection (`selectedJob`, first row by default, focus follows selection); detail pane with request, Progress, Started, Files, error line for failed jobs, Result, Open Chat, Open Document, Stop, Cancel…, Show Task Record; empty state "All caught up" with Open Project Chat (default); summary "1 running · 1 waiting · 3 need attention" or "Nothing running or waiting"; the badge counts running + waiting.
- [x] `js/chat.mjs`: `task-record` command, enabled in Activity with a selected job.
- [x] `index.html`: `#activity-detail`. `chat.css`: `--pw-cols` moves to `#activity-panel` so the header row shares the columns.
- Test chose the § 11 option "select the row first and find the buttons in the detail pane".
- Differs from the spec: no Phase, Last command or Laya counts. Jobs do not record them; the detail shows the job's `progress` text instead. 2026-10-13: Phase, Last command and Laya counts added in task 83. Stop has no ⌘. hint, because ⌘. stops the selected chat, not the selected job.
- Not tested: the empty state, the failed-job error line, Home/End.
