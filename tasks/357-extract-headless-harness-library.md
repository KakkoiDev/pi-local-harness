# 357: Extract the headless harness library and conformance suite

Kind: code
No scenarios: backend library extraction and headless contracts; existing frontend behavior must remain unchanged and its existing browser journeys remain required.

See docs/plans/357-headless-harness-library-and-conformance.md.

- [ ] Finish case-level Pi Durable specification triage with source versions, local test mappings and explicit scope exclusions.
- [ ] Red: reproduce in-scope crash/duplicate/state failures using isolated stores and fresh subprocesses.
- [ ] Implement recoverable answer/admission transitions and execution receipts without repeating uncertain writes.
- [ ] Extract versioned core commands, snapshots/events, storage/execution/policy ports and explicit lifecycle from web handlers.
- [ ] Exercise web/terminal plus a non-HTTP client against the same backend without frontend imports or hidden service startup.
- [ ] Run mandatory offline crash/conformance cases, migrations/backup/restore, installed-library checks, workflow and all existing browser journeys.
- [ ] Evaluate scoped rebuildable lexical search and record measured limits before engine selection; preserve Markdown and project privacy.
