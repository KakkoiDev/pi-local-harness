# L-004: Overwrote a whole file and lost what was in it

**Seen** 2026-10-15, task 173. To recover from L-003, Pi wrote the whole task file again (Gate event 296). The new file
dropped its own earlier root-cause analysis and the plan's detail, and kept a line with literal `'` escapes.
Nothing was ticked.

**Why it matters** A `write` replaces everything. A small model rewriting from memory loses content without noticing,
and the loss is invisible unless someone diffs it.

**Done** Nothing yet. The file was restored from git by hand (commit dd1b6c2).

**Open** Enforced: Gate could send back a `write` over an existing file in `tasks/` or `ROADMAP.md` that removes more
than a few lines or any ticked box, with "use edit for changes to an existing file". Checked: the audit after a write
could report how many lines it removed.
