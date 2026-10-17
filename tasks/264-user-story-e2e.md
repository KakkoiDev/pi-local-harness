# 264: Every user story has an end-to-end test

Kind: chore

Request 2026-10-18 (the person, through Claude): every user story of Pi Workbench has an end-to-end test. Tests, a test
fixture helper and docs only; no runtime code changes (other branches fix gate/paperwork.py, the web API's auth,
rename/sessions and test isolation).

Done when: docs/user-stories.md lists every user story with its acceptance, surfaces and test; the missing journeys run
in `python3 tests/browser/run.py stories` and `node --test tests/harness/stories.test.mjs`; a story that fails because
of a known review defect is an expected failure with its item number; the coverage table is at the end of the
inventory.

- [x] Inventory: docs/user-stories.md, 108 stories in 19 groups, each with its test or why it has none.
- [x] Scratch workbench helper: tests/browser/workbench.cjs (scratch data, web data, Trash, log; Tailscale off; Ollama
      a closed port; PI_HARNESS_*/PI_WEB_REMOTE_* stripped; a guard refuses project folders outside the scratch folder).
- [x] Fake Pi: `TEST_SCRIPT=<name>` plays tests/browser/stories/<name>.json through Gate as the extension does (tool
      calls, writes, real test runs, choices, plans, check-ins, crashes, Run on its own); `PI_FAKE_SESSION_CWD=1`
      behaves like Pi 1.1's stored session folder (review P0-3). Existing triggers unchanged.
- [x] Browser journeys: tests/browser/stories.cjs, the `stories` suite of tests/browser/run.py; expected failures carry
      their review item and turn into XPASS when the fix merges.
- [x] Terminal journeys: tests/harness/stories.test.mjs (phase commands and the project picker, /auto, /config and /undo, /status, /projects, /doctor, /harness, /guide, /queue, /job, /gate, Pi’s proposals, the Japanese terminal).
- [x] Coverage table: 81 journeys, 14 expected failures, 6 partial, 6 not coverable yet, 1 without a test.
- [ ] NEW-1 (found here, not in the review): propose_plan puts the first task's “Request …” line under `## Decisions`,
      so G-017 refuses every write of the first planned task; US-030 and US-045 stay expected failures until it is fixed.
- [ ] Journeys for the 6 partial stories, and US-044 (two quick answers, item 8).
