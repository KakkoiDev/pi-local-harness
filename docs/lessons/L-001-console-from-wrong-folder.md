# L-001: Ran the console from the wrong folder

**Seen** 2026-10-14, terminal Pi. Asked about the harness, Pi ran `python3 -m harness.admin` from the home folder, where
the module does not exist, and failed (the person pasted the session; task 167).

**Why it matters** The model guesses how to reach the harness from its own memory of the code and the guess depends on
the current folder.

**Done** Made easy: a `harness` tool runs the console from the harness's own folder (task 167, `harness/console.mjs`);
the console guide tells Pi to use it. Gate knows the tool as a read. Test: `tests/harness/console.test.mjs`.

**Open** Nothing stops Pi from still calling the module with bash; it has not been seen since.
