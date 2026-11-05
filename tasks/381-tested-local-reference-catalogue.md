# 381: Retrieve tested local Python and HTMX reference blocks

Kind: code

Planned 2026-11-05. Not implemented. See docs/plans/377-gg-adoption-and-stock-pi-bench.md, section 4.

- [ ] Red: cover compatible matches, stale sources, hostile examples, secret paths and cross-project access.
- [ ] Catalogue existing tested blocks/examples with applicability, revision, fingerprint and evidence; no new corpus download.
- [ ] Return deterministic bounded excerpts under the shared input budget and scoped retrieval contracts.
- [ ] Keep examples as data, not approvals or verified project facts; fall back normally when absent.
- [ ] Obtain any missing source-evidence UI design; run unit/integration, held-out example, workflow and browser acceptance.

## Scenarios

### US-new Pi receives only compatible tested reference excerpts
Given a request matching a local tested block and an incompatible or private example
When the reference selector builds context
Then only bounded permitted compatible excerpts appear with source fingerprints

## Needs design

Review the designer handoff in plan 377 against rounds 18–19. Add board/component references for new actual-input, reference-provenance or readiness states before new frontend work. Backend work may proceed independently.
