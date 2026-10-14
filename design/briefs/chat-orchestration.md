# Brief: the chat orchestrates a worker; from "working" to the activity and back

Date: 2026-10-14. Plan: [docs/plans/156-chat-orchestrates-worker.md](../../docs/plans/156-chat-orchestrates-worker.md). Nothing here is built yet. Two parts: A can be built as soon as it is drawn (task 157); B waits for the plan's decisions (task 156).

## A. Every "working" leads to its activity, and every activity leads back (task 157)

The person: "when we see in the ui that the agent is working, we can always inspect the ongoing agent activity and from that agent activity, always have a 1 click button way to go back to the comments or chat."

Rule to draw:

- **Every place that says Pi is working links to that request's Activity entry** (selected, detail open): the menu bar status, the Agent section's Activity row, a thread's state line ("Pi is working on it"), the Review head, the whole-file request card, the chat's live message, and later the worker card (B).
- **Every Activity entry has one button back to where the request came from**, named after it:
  - chat message: **Open in Chat** (the transcript scrolled to that message);
  - comment: **Show Comment** (Work, that file, the thread open and focused, Review on that comment);
  - whole-file question: **Show in Review** (Work, that file, the whole-file box open on that request);
  - worker task (B): **Open in Chat** (its card) and **Show Task** (the task file in Work).
- Today: the Activity detail has "Open in Project" for everything, and some states (the Review head, the chat's live message) have no link. Please draw the detail bar with these buttons (desk and phone, Ph_ActivityDetail) and the link on each "working" place. Is it a link, or the whole state line as a button?

## B. The chat and the worker (task 156)

1. **Proposal card** in the chat transcript, when the chat agent proposes work: the task name (a link), the brief in Pi's words, and Gate's decision with its reason. States: started by Gate; starting in 10 s with **Not Now** (a veto window); waiting for you with **Start Anyway** / **Not Now** (for example the task is blocked); declined.
2. **Worker card**, which replaces the proposal once started: phase, last step, files touched (links), Show in Activity, Stop. It stays live. Also: **"Paused while Pi answers you"** when the model runs one request at a time and the person is chatting.
3. **Summary**, which the worker card collapses into when it ends: 3 to 5 lines (what changed, files, task boxes checked, what is left), the end state with its glyph, Show in Activity. It stays in the chat history.
4. **Model menu**: a capability note next to "thinks · sees": "parallel", "one at a time", "checking…". The footnote might explain what it changes ("One at a time: the worker pauses while Pi answers you").
5. **Agent section and status**: the worker running in a project while its chat is idle. Is it "Working · <project>"? Later (phase 2): "2 of 3 agents busy".
6. **Phone**: the cards in the phone chat; Stop and Not Now as 44px buttons.

Questions:
- Does the proposal card need Gate's reason in full, or one line with "Why?" disclosure?
- Where does the person turn the veto window off (Settings, or on the card: "Don't wait next time")?
