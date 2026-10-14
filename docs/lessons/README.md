# Lessons: what the local model got wrong, and what the harness does about it

The local model (Pi on Ollama) makes mistakes a stronger model would not. The aim is not to ask it to do better but to
make the harness catch the mistake, or make it impossible. Each file here is one failure we saw, with its evidence, why
it matters, and what changed.

## How strong is a fix

From strongest to weakest. Prefer the top; use the bottom only when nothing above can work.

1. **Enforced**: Gate or the commit protocol refuses the action, with a reason that says what to do instead.
2. **Checked**: a test or the harness detects the mistake after the fact and says so where the person sees it.
3. **Made easy**: a tool or command makes the right way the obvious one (the `harness` tool instead of guessing a shell
   command).
4. **Told**: a sentence in AGENTS.md or the console guide. The model may ignore it; it also costs context every turn.

What the model says about its own work is not evidence. Pi called a fix "clean" and "passing" that targeted the wrong
cause and whose test could not pass (L-006). Lessons are written from the records: Gate's history
(`<data>/gate-events.jsonl`), Activity records, the transcript and git.

The rules that answer these lessons are in Gate's registry, `gate/rules.py` (`/gate rules`); each rule names its
lesson.

## Adding one

When the model does something wrong, add `L-NNN-short-name.md` with: **Seen** (date, the request, what happened, the
evidence: Gate event ids, record, commit), **Why it matters**, **Done** (what changed, its strength, the task and the
test that proves it), **Open** (what would make it stronger). Link the task that fixes it; the lesson stays when the
task closes.

## Index

| Lesson | Strength today |
| --- | --- |
| [L-001 Ran the console from the wrong folder](L-001-console-from-wrong-folder.md) | Made easy |
| [L-002 Routed around a Gate error](L-002-routed-around-gate.md) | Enforced (G-011) |
| [L-003 An edit did not match; a script rewrote the file](L-003-edit-mismatch-script-rewrite.md) | Enforced (G-004, G-008); made easy (task_box) |
| [L-004 Overwrote a whole file and lost what was in it](L-004-overwrote-whole-file.md) | Enforced for plan files (G-009) |
| [L-005 Claimed a fix was verified without running its test](L-005-claimed-verified.md) | Checked (G-012); made easy (task 180); enforced for task boxes (G-010) |
| [L-006 A test that could not pass, and a fix for a guessed cause](L-006-unreproduced-fix.md) | Enforced in part (G-010) |
| [L-007 Reasoning loops](L-007-reasoning-loops.md) | Checked (loop watch, retry) |
