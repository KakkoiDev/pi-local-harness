# 187: The harness does the paperwork; Pi only writes content

Kind: code

Plan 184 part 4: "What I want is to automatize all the paperwork: Roadmap and Task format + guardrails. The model's only
job should be to produce content: documentation, bug hunt, code, etc." Decisions: a task at the first file change (or
the one the request names); commit locally when verified, never push.

- [x] Red (python, `tests/test_paperwork.py`): a request gets its task at the first change to a non-plan file (next
  number, title and words from the request, the request quoted, a progress section) and its roadmap line; a request
  that names a task ("do tasks 2") uses it; Gate's test runs become "Red: … failed at", "Green: … passed at"; verified,
  the task gets "Done", its roadmap line is ticked when no box is open, and only the files the request changed are
  committed (the person's own edit stays out); not verified stays open with the reason; Markdown only becomes Kind: docs;
  outside a project nothing happens. Through Gate: tool calls carry the request, the audit passes the task note to Pi,
  and Pi's own git commit within a request is sent back (G-013).
- [x] Red (node, extension test against the real Gate): the first write gives the request its task and Pi reads it in
  the tool result; the roadmap line appears.
- [x] Red (python, test_plh): an installed memory with the old paperwork paragraph gets the new one, keeping the
  person's lessons, with a backup.
- [x] `gate/paperwork.py`; the ledger (`start_request`, `end_request`, notes, G-013) and Gate's `/request`,
  `/request/end`; the extension starts a request on each question and ends it when the harness will not wake Pi again
  (notices "✓ Committed." or "The harness could not commit."); web workers pass `PI_HARNESS_JOB`.
- [x] Pi's instructions: `harness/AGENTS.md` (and its upgrade in `harness/install.py`) and `AGENT.md` say the harness
  keeps tasks, progress and commits; Pi writes content.
