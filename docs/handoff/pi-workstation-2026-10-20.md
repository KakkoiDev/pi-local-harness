# Pi WorkStation direction and handback · 20 October 2026

Read [plan 337](../plans/337-pi-workstation-skills-and-knowledge.md) and [designer brief round 16](../../design/briefs/round-16.md). The owner requests the product name Pi WorkStation, ICM-based skill management, a second-brain investigation inspired by RinDig, an AI-powered app starter (an app that uses AI), and an ICM audit plus Jikko integration review. Tasks 337–342 track these independently.

## Delivered checkpoint

Recorder storage foundation: **5be5849**, after a complete workflow gate passed. Nine storage tests plus the installed-copy test passed. It provides private, bounded, per-project persistence with the approved defaults and recoverable Trash. It is **not connected to Preview**. Transport, recording/report controls, chat attachment and their E2E journeys remain task 333 work. Do not claim recording is shipped.

## Product rename

US-351 failed on the old browser title before implementation, then passed with Pi WorkStation, terminal startup, Japanese About copy and unchanged project ID/path. Thirty focused compatibility/startup tests passed. Full browser/workflow verification is still in progress; do not call this a published build yet. The browser run exposed generated Python cache files interfering with existing task-verification stories, requiring investigation before release.

Preserve data locations, project IDs, old harness-author undo recognition, launch commands and repository URLs. The separate design system remains Pi Workbench 1-bit. Only the person edits the Constitution. New controls need design first.

## Research and audit

A private local audit artifact contains source revisions, prioritized ICM findings, three isolated reproductions, review limitations and deeper architecture. The connected API currently reports ICM private; do not copy implementation findings into this public handback automatically. No upstream suite, installer, hook, model download or personal-data import was run; no upstream repository was changed. Jikko was inspected read-only at c280ec1ea4da4315489f7e65088f55d3787baf1f; its Go suite was not run.

Recommended responsibility split: WorkStation owns permissions, phases and verification; ICM owns approved workflow mechanics; a Markdown/Jikko adapter provides semantic records; the brain supplies bounded cited knowledge; the AI starter consumes a provider-neutral model interface. One task authority, one approval ledger and one commit writer. Skills cannot approve themselves or widen a project's permissions. Knowledge is untrusted context, never authority. Start with project-scoped knowledge and read-only Jikko interoperability before any migration.

## Next work and review requests

Review the private ICM audit, then create separate upstream regression fixes. Prove a two-stage offline adapter with typed failure/recovery, immutable inputs and validator receipts. Compare Jikko view/backend/ownership options and prove stale-write refusal before choosing a writer. Evaluate forgotten decisions, citations, stale/conflicting notes and cross-project isolation against today's context baseline. Design skill/knowledge/starter surfaces in round 16 before implementing them. Build the AI starter independently in Python + HTMX with offline fake-provider tests and explicit packaging capabilities.

Claude should inspect this work for defects and simplification opportunities, run the documented checks, and inspect privacy-filtered harness logs from the owner's test projects under their existing authorization. Do not treat old pre-Laya benchmark/log behavior as evidence of current Laya behavior. Earlier critical chat, roadmap validation and Round 15 tasks remain open unless their own task evidence proves completion.


## Owner architecture decision after the review

WorkStation is the integrating product. Jikko must become the editor foundation; ICM is how all WorkStation and generated-project skills are made; the second brain is a permanent built-in workspace for AI configuration and knowledge that improves from verified experiments. The latest decision section of plan 337 supersedes earlier optional-adoption wording. Deliver these as tested incremental replacements, keeping WorkStation System 1 authoritative and one canonical editor writer. No personal-data migration has run.

The owner authorized fixing ICM runtime. An isolated private source copy is used for regressions and reviewable upstream changes; it is not installed in WorkStation. Record the resulting PR and exact verification before declaring the upstream audit work complete.


ICM repair is available for owner review in [private ICM PR 2](https://github.com/KakkoiDev/icm-runtime/pull/2), commit e79fb98. Isolated full-suite validation: 185 passed, zero failed, with 18 CLI audit checks and six adapter tests. It has not been merged or installed into WorkStation. Keep implementation findings and source in that private review. Runtime lifecycle/concurrency and WorkStation validator-receipt integration remain separate follow-ups; task 341 remains open for adoption.

ICM PR 2 CI subsequently passed on both Linux and macOS. This confirms the upstream regression entry point; it does not verify the still-unimplemented WorkStation integration.

The owner also proposes an automatic System 1 knowledge curator: code selects evidence-backed learning events from project logs and Laya handles typed categorization/abstention. The new plan section specifies selection, deduplication, provenance, lifecycle, privacy and evaluation. This is an intended brain capability, not a shipped log-ingestion service; no personal logs have been imported. System 2 may draft notes but never decides promotion or changes configuration from log content.
