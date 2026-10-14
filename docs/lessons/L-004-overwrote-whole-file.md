# L-004: Overwrote a whole file and lost what was in it

**Seen** 2026-10-15, task 173. To recover from L-003, Pi wrote the whole task file again (Gate event 296). The new file
dropped its own earlier root-cause analysis and the plan's detail, and kept a line with literal `'` escapes.
Nothing was ticked.

**Why it matters** A `write` replaces everything. A small model rewriting from memory loses content without noticing,
and the loss is invisible unless someone diffs it.

**Done** Enforced (plan 179, rule G-009): a `write` over an existing `ROADMAP.md` or task file in a project that drops a
ticked box or more than 5 lines is sent back: "Use edit to change only what you mean to change." Test:
`tests/test_gate_rules.py`. (The file in this case was restored from git by hand, commit dd1b6c2.)

**Open** Other files can still be overwritten wholesale; only the plan files are protected.
