# 383: Measure GG and WorkStation against stock Pi

Kind: planning
No scenarios: research execution and reporting through the adapters from task 379; no product UI or runtime behavior is added.

Planned 2026-11-05. Not implemented. See docs/plans/377-gg-adoption-and-stock-pi-bench.md, section 6.

- [ ] Freeze model/agent/scorer/fixture pins, held-out cases, balanced order and separate clean/fault/workflow tracks before running.
- [ ] Confirm named GG/dependency downloads, provider setup and run budget; no key goes into the repository.
- [ ] Run the approved matrix: 90 runs per model/context configuration for three arms, or 60 with GG explicitly pending.
- [ ] Publish privacy-checked complete records including failures, unknown usage, retries, hidden checks and all-run cost per verified success.
- [ ] Compare prompt/tool/reference experiments by ablation; keep current defaults unless measured held-out completion and safety gates pass.
