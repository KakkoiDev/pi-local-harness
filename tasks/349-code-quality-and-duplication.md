# 349: Add code-quality and duplication checks

Kind: code
No scenarios: initial slice adds offline internal checker/configuration integration; new person-facing diagnostics require their own designed stories before implementation.

See [plan348](../docs/plans/348-quality-traces-and-phonon.md), section1.

- [ ] Inventory existing typing, unused-code, parser and protocol checks; choose/pin Ruff, focused JS linting and one clone detector, reviewing licences and obtaining download approval.
- [ ] Red: seeded bugs, real clones, first-party versus vendor scope, clean fixtures, scanner crashes and missing offline tools fail correctly.
- [ ] Record a read-only baseline with reviewed exclusions; gate new correctness issues without wholesale formatting, silent autofix or model-approved baseline changes.
- [ ] Share the check runner/config across WorkStation, generated starters and publication audit, preserving editable project configs and existing tests/types.
- [ ] Green: unit/integration checks and scratch generated-project verification, honest unavailable states, documented rules/thresholds and workflow gate.
- [ ] Obtain designs and add user-facing stories before introducing new editor/audit controls; verify scoped fixes clear findings without weakening checks.
