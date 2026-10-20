# 322: Validate and repair roadmap and task structure

Kind: code

Owner request: detect malformed ROADMAP.md and task files and let the AI repair them. The supplied Pong example has task details mixed into the roadmap, two 004 entries pointing to different task files, and completed task rows whose embedded Red steps remain unchecked. Escaping in a pasted example is not proof that the saved file contains those escapes; inspect the actual source before diagnosing.

- [ ] Inspect existing parsers and workflow checks; define the canonical supported structure and design any new user-facing controls before implementation.
- [ ] Red: unit fixtures based on the supplied Pong structure, valid legacy documents, malformed Markdown, duplicate IDs, broken/missing task links, misplaced task sections, missing required metadata and inconsistent completion evidence.
- [ ] System 1 validates and returns precise file/line diagnostics; distinguish definite structural errors, unsupported formats and advisory evidence inconsistencies. Never infer malformed source from rendered or escaped paste alone.
- [ ] Give the AI a bounded repair path under Gate and the current phase, preserving goals, requirements, links and history. System 1 validates the result; the model cannot decide completion, forge past Red/Green evidence or approve its own repairs.
- [ ] Preserve a recoverable original, write atomically, refuse stale concurrent edits, and avoid changes to application code or unrelated files. Resolve ambiguous duplicate identities with the person rather than guessing which task to discard or renumber.
- [ ] Integration coverage: detection, permitted/refused repair, linked-file consistency, repeated repair is a no-op, failed validation preserves original, concurrent edits and rollback/recovery.
- [ ] After design: E2E discover an invalid project plan, understand the diagnosis, request repair, inspect the corrected roadmap/tasks, reload and continue the conversation/workflow without duplicate tasks or lost content.
- [ ] Run workflow and applicable browser suites; update the Claude report with evidence and remaining limitations.

## Acceptance boundaries

Use scratch copies of the owner-provided Pong example for regressions. Do not edit the person's Pong project without explicit authorization. A checked Green box and unchecked Red box may expose missing evidence; repair must report this instead of inventing a historical failing test. Existing human-readable Markdown and supported legacy layouts must not be rejected merely for differing from a new template. A valid syntax check alone does not establish that work is complete.

## Scenarios

### US-new a malformed roadmap shows each problem with its file and line
Given a project whose ROADMAP.md has task details mixed in and two 004 entries
When I open the project's plan
Then each problem is listed with its file and line, structural errors apart from evidence warnings

### US-new asking Pi to repair the roadmap fixes it, and after a reload nothing is duplicated or lost
Given a project whose roadmap was diagnosed as malformed
When I ask Pi to repair it and the repair is validated
Then the corrected roadmap and tasks are shown, and after a reload the conversation goes on with no task duplicated or lost

### US-new two tasks with the same number ask me which one keeps it
Given two roadmap entries numbered 004 that point to different task files
When the repair reaches them
Then a card asks me which task keeps 004 instead of discarding or renumbering one

## Owner decisions · 2026-10-19

Round 15 is available locally. After the person chooses identity, renumber to the next free number. A merge preserves both step/history lists. Originals go to project Trash. Apply Repair always requires the person, including Run on its own. Approve ⌃⌥. and ⌃⌥, for next/previous findings.
