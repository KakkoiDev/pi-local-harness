# Plan 179: Gate's rules as one always-enforced system, out of AGENT.md

Status 2026-10-15: built (task 179). Answers taken: strict (rules send back, no warning first); scope per rule. Phase 1's
destructive-shell checks stayed one rule (G-003) with one reason per kind. Added beyond the plan: G-012 (requests that
changed code without a passing run are marked "Not verified").

Request 2026-10-15: "maybe we should take the gate control base (what it will enforce) out of the AGENT.md file and make
it a separate system that we want always enforced." Follows task 178 (`docs/lessons/`).

## Today

What the harness enforces is spread over three places, and nothing lists it:

- **AGENT.md** (prompt): "Gate enforces this order before `git commit` … test red, implementation, test green, check
  task, check roadmap, commit", "do not bypass it". The model may ignore prose, the prose costs context every turn,
  and it can drift from the code.
- **Gate's code**: `gate/shell_guard.py` (destructive commands), `gate/protocol.py` (the commit order),
  `gate/ledger.py` (an edit must match once, task 176), `gate/engine.py` (known tools, permission levels).
- **`<data>/AGENTS.md`**: "Harness lesson" lines appended at runtime (`harness/memory.mjs`).

## Proposal

One registry of rules, in code, each with a test. Gate applies all of them to every proposal; the model cannot turn
one off, and no prompt is needed for any of them to hold.

A rule has:

| Field | Example |
| --- | --- |
| id and name | `G-003 Edits must match once` |
| when | before a tool runs, after it ran (audit), or before `git commit` |
| scope | every folder, or a project with `ROADMAP.md` and `tasks/` |
| check | a function of the proposal (and, after, the result) |
| outcome | block (nothing runs) or revise (Pi is asked to change it) |
| message | what to do instead, in words Pi can act on |
| lesson | the `docs/lessons/` file that motivated it, if any |
| test | the test that proves it holds |

- **Visible**: `/gate rules` lists them (and `harness` tool, so Pi can look one up); every Gate event names the rule that
  decided it; the web Gate view shows it in Event Info.
- **Told from the same source**: the system prompt gets a short list generated from the registry (one line per rule),
  so Pi knows the rules before it hits them and the list cannot drift. AGENT.md keeps only orientation and guidance
  that cannot be enforced, and points to `/gate rules`.
- **Changed only by people**: rules change through a task with a test, like any code. There is no setting to switch one
  off. (Permission levels stay as they are.)

## Phases

1. **Registry, no change in behaviour.** Move today's checks into rules: unknown tool, permission level, destructive
   shell (one rule per kind, from `shell_guard.py`), edit must match once, the commit order. Gate events carry the rule
   id. `/gate rules`. All current tests pass unchanged.
2. **Generated prompt, trimmed AGENT.md.** The rules summary is injected from the registry; AGENT.md loses the
   enforcement prose. Check that the reinjection after compaction carries it.
3. **New rules from the lessons**, one task each, linked to its lesson:
   - L-003: shell commands that write a project's Markdown in place (`sed -i`, heredoc scripts, `>`/`>>` onto
     `ROADMAP.md` or `tasks/*.md`) are sent back: "use edit or write so Gate can check the change"; `chmod` on project
     files asks first.
   - L-004: a `write` over an existing task or roadmap file that removes ticked boxes or many lines is sent back: "use
     edit".
   - L-002: when Gate itself fails (an error, not a decision), the turn stops and the person is told, instead of the
     model improvising around it.
   - L-005/L-006: a task's Red and Green boxes can be ticked only after Gate saw that test fail, then pass.

## Questions for the person

- Phase 3's rules are strict for a small model: some legitimate shell edits will be sent back. Accept that (Pi uses
  edit/write instead), or allow them with a warning first?
- Should the registry also hold rules for the person's own projects that are not about this repo (for example, the
  commit order applies only where `ROADMAP.md` and `tasks/` exist; other projects get only the safety rules)? The plan
  assumes yes, per rule scope.
