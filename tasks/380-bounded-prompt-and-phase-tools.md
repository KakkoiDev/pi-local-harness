# 380: Budget the whole prompt and select tools by phase

Kind: code

Planned 2026-11-05. Not implemented. See docs/plans/377-gg-adoption-and-stock-pi-bench.md, section 3.

- [ ] Red: reproduce an 8K overflow from combined instructions, schemas, files, guides, cards and history.
- [ ] Allocate one measured budget with output headroom; retain current request, authoritative facts and live tool pairs.
- [ ] Keep legal answer/plan controls directly available; enforce optional activation and phase rules in System 1.
- [ ] Cover multilingual requests, unavailable budget, recovery and explicit experiment rollback; obtain any missing receipt UI designs.
- [ ] Run workflow, applicable browser suites and real-Pi journeys before rollout.

## Scenarios

### US-new a small-window request keeps its task and fits its budget
Given an 8K request with long history and optional context
When Pi prepares its provider request
Then the measured budget includes schemas and output headroom while phase and approvals stay authoritative

## Needs design

Review the designer handoff in plan 377 against rounds 18–19. Add board/component references for new actual-input, reference-provenance or readiness states before new frontend work. Backend work may proceed independently.
