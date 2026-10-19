# 278: System 1 checks that the app fits each target before packaging

Kind: code

Plan 253, section "What System 1 checks before packaging"; CONSTITUTION.md Articles 2 and 3: code decides, an
unresolved conflict goes to the person with a recommendation, never to the model.

Files: gate/packaging.py (rules P-001 to P-009), kit/targets.json (per-target package sets: the server's uv.lock, the
browser's Pyodide lock plus vendored wheels; size budgets), kit/capabilities.json (each capability's required
interfaces and supported targets), kit/package.py (runs the checks first), harness/judgements.py or the paperwork's
choice path (one card per conflict), tests/test_packaging_checks.py.

- [ ] Red: one failing test per rule on a scratch project: P-001 an import the target cannot provide; P-002 an I/O or
  framework import in app/logic; P-003 a secret or environment read reachable from a browser bundle; P-004 a capability
  that needs a backend (trusted auth, payments, shared state across devices) on frontend only or bundled mobile; P-005 a
  referenced file missing from the bundle or the offline cache list (task 230); P-006 an hx- URL with no route; P-007
  first load over the target's budget; P-008 a mobile package without a valid app id, icons or built webDir; P-009 a
  target in packaging.json with no adapter.
- [ ] Each rule returns `{rule, file, line, message, resolutions}`; resolutions are fixed per rule with the recommended
  first and "Something else…" last (e.g. P-004: "Add a hosted backend for sign-in", "Package as full stack only",
  "Something else…").
- [ ] A failing check stops `build`; each conflict becomes one ChoiceCard (system-owned, recorded as code); Run on its
  own takes the recommended resolution only when it removes nothing the person chose (otherwise it waits), and the run
  report lists it.
- [ ] Gate refuses Pi's writes to packaging.json, kit/targets.json and kit/capabilities.json; every check outcome goes
  to decisions.jsonl with its rule id.
- [ ] Green: all rule tests pass; the acceptance app (task 280) passes every target's checks; the full workflow passes.

Acceptance: an incompatible combination is explained before any file is produced, with options; the model never drops a
feature or changes the target.

## Scenarios

### US-new packaging a frontend-only app that needs sign-in stops first and recommends Add a Hosted Backend for Sign-in
Given a project whose packaging.json targets web only and that uses trusted sign-in
When packaging starts
Then no file is produced and a card explains the conflict with “Add a hosted backend for sign-in” (recommended), “Package as full stack only”, “Something else…”

### US-new Run on its own takes a packaging fix only when it removes nothing I chose, and the report lists it
Given Run on its own reaches a packaging conflict whose recommended resolution would drop a target I chose
When the check fails
Then Run on its own waits for me instead of choosing, and the report lists the waiting conflict
