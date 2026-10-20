# 341: Audit ICM runtime before integration

Kind: planning

Request 2026-10-20: audit ICM and explore deeper integration, including Jikko. See [plan 337](../docs/plans/337-pi-workstation-skills-and-knowledge.md).

- [x] Source-review verifiers, transitions, adapters, privacy, cleanup and existing tests at identified file revisions.
- [x] Reproduce bounded verifier/encoding findings in isolated fixtures; distinguish source concerns from demonstrated behavior.
- [x] Prepare upstream fixes and regressions after the owner authorized repair: [ICM PR 2](https://github.com/KakkoiDev/icm-runtime/pull/2), commit e79fb98; isolated full suite passed.
- [x] Keep private implementation findings out of the public harness repository and record the owner decision to use ICM for skills.
- [ ] Record the owner-reviewed merged revision and verify the host integration before adopting it into WorkStation.

Open: source review and three isolated probes are complete; complete runtime validation/adoption and any upstream fixes are not done. No new dependency, global hook or personal-data migration is installed.
