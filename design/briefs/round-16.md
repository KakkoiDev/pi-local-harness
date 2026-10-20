# Designer brief: Pi WorkStation, Skills and AI apps

Owner request 2026-10-20. Current product name: **Pi WorkStation**, exact capitalization. Existing Round 15 implementation remains in progress. Keep the established 1-bit language; do not add new product controls through this brief alone.

## Skills, powered by ICM (task 338)

Design where a person discovers, inspects and enables a reusable skill for a project. Show what it does, source/version, declared reads/writes/network, project scope and required setup. Inspecting must not execute anything. Include disabled/unavailable, untrusted source, unavailable runtime, malformed definition and offline states. Downloads need a named explicit confirmation with source and size; source changes need a diff and rollback.

A run has stages, inputs/outputs, evidence and a useful progress/status view. Distinguish waiting for actual person input from blocked preconditions that the harness handles internally. Never ask the person how to manage guardrails. Show cancellation, interrupted/resumable work, a changed contract refused, failed verification, and recovery. Phase controls and task acceptance remain the existing explicit controls; an ICM stage cannot override them. Do not equate a signed/sealed run with a correct answer.

## AI-powered app starter (task 340)

Extend Project Start for an app built with Python and HTMX that calls a model. The demonstration should have text input, response, busy/cancel, retry and error states. Propose the smallest helpful use case; do not invent a complex assistant product. Show local-model setup and optional online provider configuration with a plain explanation of where text goes. Secrets stay on the server, outside source control. Missing model/provider, offline, timeout and cancellation must remain usable. Tests run with a deterministic local fake.

Packaging needs honest support labels: full stack first; a static/Python-WASM export cannot include provider keys and may require a separately configured gateway. Do not promise local inference on every phone/browser. Reuse existing package selection rather than another wizard.

## Permanent second-brain workspace (task 339)

The owner confirmed a permanent WorkStation workspace for AI configuration and knowledge. Design configuration inheritance (person defaults and project overrides), navigation into this workspace, proposed improvements with evidence, and history/restore. Also sketch inspecting why a note was retrieved, its source/date/scope, correcting it, conflicting/stale notes and moving to Trash. Cross-project/private material is excluded unless separately chosen. Notes never grant permissions or approve actions. Do not design an automatic import of the person's home folder or chats.

## Deliverables

Desktop 1440/1024, phone390/narrow320, EN/JA strings, keyboard/focus and disabled reasons. Each new control needs a Given/When/Then walkthrough. Identify unresolved product choices clearly. Product rename is a copy change; historical design-system name is separate.


## Jikko editor foundation and shared skills (owner decision, 20 October)

Jikko is the chosen basis for the harness editor. Show revision conflicts without lost changes, linked-document rename, comments, attribution, undo/Trash and a saved-but-not-committed recovery state. Preserve the familiar WorkStation layout unless a change is needed and drawn. Distinguish document editing from System 1 task verification.

ICM supplies the skills for WorkStation and generated projects. Skills need visible ownership/scope and version lineage; a skill-management workflow cannot approve its own update. The brain holds configuration, reusable knowledge and skill references while project-sensitive content keeps its own scope. Design an experiment-to-proposed-lesson-to-verified-library-change walkthrough; no automatic home-folder/chat import or credentials in documents.

## Automatic knowledge curation (owner proposal)

Show entries saved/categorized by System 1 with evidence and a plain reason: observed, verified, uncertain candidate, stale or contradicted. Include source/project scope, correction/rejection, deduplication, and history/restore. Uncertain categorization should not interrupt each project conversation. Separate automatically recorded evidence from a proposed durable note/skill/configuration change; only the latter follows its normal approval controls. Design pause/resume and privacy/scope settings for the curator, plus unavailable/rebuilding states, without exposing internal guardrail management.
