# 342: Base the harness editor on Jikko

Kind: planning

Request 2026-10-20: audit ICM and explore deeper integration, including Jikko. See [plan 337](../docs/plans/337-pi-workstation-skills-and-knowledge.md).

- [x] Inspect the local Jikko implementation and document its useful boundaries and gaps.
- [x] Compare read-only view, optional CLI adapter and workspace-owner approaches without migrating personal data.
- [x] Record the owner decision: Jikko is the editor foundation, not merely an optional viewer.
- [ ] Prove scratch round trips, stable identity, stale-write refusal, evidence semantics and one commit writer; settle the runtime boundary.
- [ ] Obtain any required editor designs and replace operations in tested slices without touching personal projects.

Open: initial source review is complete; complete runtime validation/adoption and any upstream fixes are not done. No new dependency, global hook or personal-data migration is installed.
