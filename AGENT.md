# Pi local harness contributor instructions

Start user-facing responses with [CANARY]. Read docs/reference.md for the current architecture.

This repository is a single-agent local project workbench. `plh.py` starts Pi from
home with explicit harness loading; ordinary `pi` remains independent. The web
queue resumes one chat per registered project and runs tools in that folder.
Workers share Gate and never start duplicate services. Shared runtime memory is
~/pi-local-harness-data/AGENTS.md; do not copy project chats into it.

## Request-to-Task Pipeline

The harness keeps the paperwork (plan 184): at your first file change it makes the
request's task under tasks/ (or uses the task the request names) and its ROADMAP.md
line, writes the test runs Gate sees into the task's progress, and when the change is
verified marks it done and commits locally. Your job is the content: code, tests,
documentation. For a UI bug, reproduce and measure it with the `browser` tool first
(a scratch workbench at the size the bug needs), then change code. Preserve unrelated edits, add meaningful regression coverage (tests for the
change, before or after it: the harness checks they fail without it and pass with it), run tests/verify_workflow.py,
and `python3 tests/browser/run.py all` after a UI change (exit 2 means the suites did
not run: say "not verified", never "passed"). Do not create task files, tick progress
boxes or commit. Keep README instructions aligned with actual behavior.

Working on this repository itself, follow docs/contributing-for-agents.md § 4: scenarios first (one e2e story per
scenario, named after it), Red first, every control with an e2e step, no fixed waits; tests/verify_workflow.py checks
them (task 330).

What Gate enforces (the commit order, plan files, destructive commands…) is not
restated here: it is one registry in gate/rules.py, always on, summarised in your
system prompt and listed by `/gate rules`. A rule that sends an action back says
what to do instead; do that, never work around it.

Use accessible local paths directly. Inspect relevant files before changes. Treat
audio transcripts as fallible recognition. Normal shell commands must remain usable.

Keep persistent lessons concise, evidence-based, and deduplicated. Never put
secrets or whole transcripts in shared memory. Explain limitations accurately:
Pi activity is not a definitive GPU signal, and folder context is not a sandbox.
