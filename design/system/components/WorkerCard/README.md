# WorkerCard

The chat's card for the project's worker (task 156): Gate proposes it, it runs, it ends with a summary. One card per proposal; it changes state in place. Boards: B_Worker, S_Worker*, Ph_Worker.

- Markup: `<section class="pw-worker" aria-labelledby>` inside Pi's message: `.pw-worker__head` (glyph, `h3.pw-worker__title`, a `.pw-link` “Show in Activity” at the right while it runs), `.pw-worker__body` (the task in quotes `.pw-worker__task`, or `dl.pw-worker__facts`), `.pw-worker__foot` (time and buttons).
- **Proposed** (Gate starts it): “Start the worker on 059-stuck-detection.md?”, the task line, Gate's one-line yes (“Gate: the task is open, has a Red step, and nothing else runs in this project.”), a countdown `.pw-countdown` (“Starting in 7 s” + a 64px bar draining, `role="timer"`, not live-announced each second) and **Not Now**. No default button: the card acts by itself.
- **Gate asks you** (`.pw-worker--waiting`, 2px frame): title the same, “Waiting for you” at the right, one line “Gate asks you: <reason>. Why?” as a `<details class="pw-worker__why">` with the full list; **Start Anyway** · **Not Now** (default).
- **Declined** (`--declined`, dotted, no shadow): one line, “Not started: <task> · you chose Not Now at 14:07. Ask in Chat to start it later.”
- **Running**: hourglass, “Worker · <task>”, Show in Activity; facts Task (link, “1 of 3 steps”), Phase, Last step (mono), Files (links); foot “Started by Gate · 14:06 · 3:12” and **Stop ⌘.**.
- **Paused** (the model answers one request at a time and Pi is answering you): clock, “Worker paused while Pi answers you”; foot “… resumes after this answer”.
- **Summary** (`--done`, no shadow): the end glyph and word (Completed check, Failed octagon, Stopped square) in the title with the duration; 1–2 sentences of what changed (text face); Files, Boxes “2 of 3 checked”, Left; **Show Task**. It stays in the history; Pi reads the summary, not the steps.
- The 10-second wait is a Setting (“Wait 10 seconds before Gate starts the worker”, on), never a control on the card.
- Phone: same card, buttons 44px, facts stack.
