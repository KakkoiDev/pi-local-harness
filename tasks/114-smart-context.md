# 114: Small, chosen context per request

Kind: code

Request 2026-10-13: "having a smart context with roadmap plus mentioned files only and maybe auto-selected files could be nice. a good minimalistic algorithm to keep context small and useful." Found: every web turn prepends `DocumentStore.snapshot` (ROADMAP, every task file, file list; 69,175 chars, about 17k tokens for this repo) to the user message, and it stays in the session history; Pi compacts above about 16k tokens (32,768 window minus 16,384 reserve), so one turn here already passes it.

- [x] Red (tests/test_context.py): deterministic selection within a 16,000-character budget, in order: request; plan (ROADMAP headings and open items, finished items as a count; open tasks with progress); current document (whole, or the passage section plus headings when large); mentioned files (path, file name, Markdown link, task number), 3,000 characters each; then, if room is left, files linked from the passage or document, the active task (open with some boxes checked), files changed in the last hour, file names sharing a word with the request; file names only, compressed to about 150; a footer naming what was left out.
- [x] `harness/context.py`; the worker writes it to a context file and `harness/extension.mjs` adds it to the system prompt for that turn (`PI_HARNESS_CONTEXT`), so it never enters the session history.
- [x] The job records what was included (`job.context`) for the "Pi sees" line (task 117).
- [x] Measure on this repo: context characters per turn before and after.
- Measured on this repo (2026-10-13): 69,112 characters added to every message and kept in history before; 16,062-16,116 characters in the system prompt for that turn only, after. Selection examples: "What should we do next?" picks ROADMAP (compressed), the active task (67) and the files changed in the last hour; a request naming harness/work_queue.py and task 59 picks those first and leaves harness/AGENTS.md out over budget.
- Red: tests/test_context.py (module missing), tests/test_web_chat.py (the fresh roadmap must arrive through the context, the message stays "Continue first"). The extension assertion in tests/harness/extension.test.mjs was added after the extension change, so it was never seen red on its own.
- The comment prompt no longer pastes the whole page (the context carries it, sectioned when large) and now includes Pi's earlier answer.
