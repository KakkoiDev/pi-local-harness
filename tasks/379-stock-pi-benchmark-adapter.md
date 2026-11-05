# 379: Benchmark actual upstream Pi without harness extensions

Kind: code

Planned 2026-11-05. Not implemented. See docs/plans/377-gg-adoption-and-stock-pi-bench.md, section 2.

- [ ] Red: demonstrate that the existing bare arm still loads the workbench; reject inherited harness extensions in stock mode.
- [ ] Add a direct pinned upstream Pi adapter with isolated configuration and the shared independently tested outer boundary.
- [ ] Keep the old Gate-only arm accurately labeled; define the GG adapter contract without unapproved installs.
- [ ] Use independent hidden/regression scoring and complete failure/not-run records; run isolated adapter and workflow tests.

## Scenarios

### US-new stock Pi runs without WorkStation instructions
Given a clean neutral benchmark fixture
When the upstream Pi adapter starts
Then no WorkStation extension or custom harness instruction is loaded and independent scoring owns the result
