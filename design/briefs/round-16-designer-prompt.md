# Copy/paste prompt: Pi WorkStation integration design

Design Round 16 for **Pi WorkStation**, using the existing 1-bit design system and local design sources. Read `design/briefs/round-16.md` first. This brief adds concrete transitions and backend constraints; it does not replace earlier approved designs or authorize implementation of new controls.

The product helps experienced engineers ship useful apps and helps beginners learn sound development practice. Prioritize making agents build reliably before optimizing performance. Use terse language. The person decides product intent, never how to manage the harness's guardrails.

## Connected walkthrough

Draw an experiment in project A using a pinned skill, the resulting safe evidence appearing in the permanent Brain workspace, a proposed reusable lesson, and a later authorized use in project B. Keep these distinct:

1. Automatically collected metadata, scoped to A. An observed pattern is not a verified solution.
2. A proposed lesson or skill change, which is editable but not active.
3. A durable change built in an approved Brain task, with independent verification and recoverable history.
4. An explicitly shared reusable lesson, which B may retrieve with source attribution. Private A content is not copied into B automatically.

The current backend proof covers frozen contracts, stage validation, cancellation/resume and bounded project-scoped metadata retrieval. It does not yet provide cross-project publication, a full Brain workspace, provider configuration or a production ICM installer. Design their states clearly without implying they already ship.

## A. Skills and run evidence

Show built-in, user-library and project-local ownership. An inspection presents source, pinned version, content fingerprint, capabilities, stages and validator provenance. Opening inspection never runs a checker. A skill-authored checker cannot approve its own work.

Draw: available, unavailable runtime, malformed contract, untrusted source, offline; queued/running/validation failed/interrupted/completed/cancelled; changed contract refused; scope or phase changed while running. The last three must not disable normal chat. Show an actionable recovery, with technical detail behind disclosure. Do not offer to weaken a guardrail. No automatic downloads or global-hook installation.

Freeze versions during a run. Updating a library skill affects later runs; show a diff and rollback without silently rewriting the active run. A double click or repeated stage event must not skip a stage. The existing explicit phase control and Start Building remain authoritative.

## B. Permanent Brain workspace

Draw its navigation and an empty first-use state. Separate AI configuration from retrieved knowledge. Configuration shows person defaults, project overrides and the effective value; keep credentials in a secure store, showing only references. Freeze configuration at a request boundary.

Evidence states: observed, independently verified regression, uncertain, stale, contradicted, rejected. Show source, date, project scope and why a record was selected. Avoid calling a passed skill validator a verified app. Include correction, rejection, restore, expiry, missing source, paused collection, full evidence budget and unavailable index. A broken Brain never blocks chat.

Show a bounded retrieval explanation without raw private logs. Sharing/promoting knowledge requires its own explicit action and approved scope. Include a preview of exactly what is shared, with references that do not expose private project content. Design Brain Discussion/Planning/Implementation using the same existing controls.

## C. Jikko editor foundation

Keep one canonical Markdown source and one commit owner: WorkStation. Design raw/source and semantic views with comments, links, embeds and attribution. Include a revision conflict that preserves both drafts, reload/copy/merge choices, linked-document rename, access refusal, recoverable Trash/restore, and saved-but-uncommitted recovery after restart.

Distinguish saving a document, committing a request and verifying a task. Jikko metadata saying “done” is not WorkStation verification. The local engine proof has confirmed exact source round trips, conflicting stale-save refusal and invalid-identity refusal; stable identity, migrations and Trash integration remain implementation work. Do not silently migrate an existing project.

## D. Python + HTMX AI-powered starter

Extend Project Start using its existing block and packaging structure. Make the smallest useful text-in/text-out example, with local-model support and optional online provider setup. All app requests go through Python; secrets never enter a browser bundle or repository. No automatic model/package download.

Draw ready, missing provider, loading, streaming, cancel, cancelled, retry, timeout, offline and safe display of model-produced markup. After cancellation a new request works without mixed output. Explain where submitted text goes. The test provider is deterministic and requires no network or subscription.

Show packaging capabilities honestly: full-stack first; a browser/Python-WASM export needs a suitable separately configured inference endpoint. It cannot embed server secrets or assume access to the host's local model. Mobile packaging remains capability-dependent. Reuse existing selection UI.

## Deliverables and acceptance

Deliver named local canvas boards/cards and implementation notes, mapping every control to its action, keyboard behavior, disabled reason and backend requirement. Include desktop 1440/1024 and phone 390/320, EN/JA copy, focus order, accessibility labels and empty/error/loading states.

For each walkthrough provide Given/When/Then scenarios. Cover at least: inspect without execution; interrupted run with changed source; validation failure with usable chat; concurrent stage submission; rejected/expired knowledge excluded from retrieval; private A evidence absent in B; approved promotion with history; configuration changing only next request; stale editor save preserving work; rename preserving links; Trash restore; starter cancel followed by retry; safe model markup; missing provider without download.

List unresolved choices rather than inventing behavior. Produce designs first; the coding agent will integrate the frontend against those designs afterwards.
