# 272: Commit messages, task file names and lessons are paperwork: System 1 writes them

Kind: code

Plan 267, judgements J-03, J-04, J-18, J-20. Today the model's propose_plan title becomes the task file name, the
refusal text, the check-in title and the commit subject (paperwork.py:330, 540, 587-601), and the model decides when a
failure is "confirmed" and writes lessons (AGENTS.md:11). CONSTITUTION.md Article 4: System 1 commits and writes the
reports.

Files: gate/paperwork.py (subject, commit, short_title, propose_plan slug), gate/titles.py (new: title checks),
harness/memory.mjs (lesson trigger), harness/AGENTS.md, tests/test_commit_message.py, tests/test_titles.py,
tests/test_lessons.py.

- [ ] Red: tests fail for (a) a commit subject taken verbatim from a model title ("Fixed and verified everything");
  (b) a task file name derived from a model title; (c) a lesson written with no recorded failure behind it.
- [ ] Commit message by template (rule W-001): `<task number>: <code short title>` and a body listing the task file,
  the checks that ran with their results (from the test-run log), "verified" or "not verified" with the reason, and the
  decisions taken in the task with their authors. No model text in the message.
- [ ] File names (W-002): task number plus a slug of the code short title made from the person's request words
  (short_title); the model's title is kept as the task's display title only after W-003.
- [ ] Title checks (W-003): at most 60 characters, no status or outcome words (done, fixed, verified, works), no
  claims; a failing title falls back to the code short title, logged as code.
- [ ] Lessons (W-004): only a code trigger opens a lesson draft (a Gate refusal repeated, a failing run followed by a
  passing one, a recovery); the model drafts the text, and the person, or Run on its own, accepts it; never on the
  model's own judgement that something failed.
- [ ] Green: the new tests and the existing paperwork and memory tests pass; the full workflow passes.

Acceptance: every commit, file name and lesson trigger is produced by code; the model's words appear only as content
the person can read.
