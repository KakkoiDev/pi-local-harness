# Round 18 designer prompt: finalize Overview and scoped context

The owner delegated answers to all 20 round17 questions. Revise the design using the authoritative decisions in `docs/plans/360-round-17-product-decisions.md`; do not reopen the same questions without a concrete conflict.

Read `CONSTITUTION.md`, `design/README.md`, the round17 section of `design/IMPLEMENTATION.md`, `docs/handoff/round-17-design-2026-10-20.md`, the decision document, `docs/reports/scoped-context-retrieval-2026-10-20.md` and existing component cards. Product: Pi WorkStation. Design system: Pi Workbench 1-bit.

This is a design-only revision. Preserve round17's coherent layouts, existing approval/phase controls and read-only Overview behavior. Several agents remains Proposed later. Do not implement runtime behavior or select a search engine.

## Required changes

Resolve all 20 questions using the decision table. In particular, draw the changes from round17: explicit work-blocking service status, persistent dashboard conversation history, Page-view citation opening, retrying only missing projects, a per-project Ask action and historical per-request context receipts. Keep all-project scope explicit on each new dashboard conversation. Keep unresolved problems visible regardless of age, with resolved history newest first over seven days.

Draw accessible desktop/1024/phone states for:
- Multiple dashboard conversations, switching/reopening, New, and retained per-conversation scope.
- Missing-project retry: target names/counts that remain authorized, in-flight deduplication, new attempt versus original answer, unavailable/revoked targets and preserved composer draft. Use clearer copy than ambiguous “Ask Again” if needed.
- Ask-about-project and Ask-in-Overview prefilling, including an existing-draft conflict. Neither sends automatically.
- Unavailable citations with authorization-safe redaction, moved/changed sources and Page-to-Source navigation.
- Historical context receipts, compact omission counts and expanded authorized names/reasons, three found rows plus Show all, and partial/interrupted/unavailable states.
- Service failure combined with queued work/attention; exact status wording and priority; no false idle/working claim while state is unavailable.
- Focused-row Command/Ctrl+Return opening a new window, visible equivalent, blocked popup recovery, and no composer shortcut conflict.
- Stable focus during live reordering/resolution, two windows with independent filters, and resize without destroying an explicitly opened Projects window.

Do not disclose inaccessible project existence through citations, counts, notices or cached source lists. Retrieval scope cannot authorize project writes. Missing matches alone do not trigger a cross-project warning.

Also repair the previously identified design-system gaps if confirmed: ContextMeter's `pw-bar` and `pw-meter--near`, and VisualResult's `pw-dialog__head`. Reuse a valid existing primitive or define/document the intended component consistently; do not introduce global style regressions.

## Deliverables and validation

Update HTML boards/canvas metadata, reusable component cards/previews, CSS bundles and design-system index through the repository's documented design-source workflow. Add a round18 implementation section with exact EN/JA strings, keyboard/focus/responsive behavior, states and explicit round17 old-to-new replacements. Add a handoff mapping each of the 20 decisions to boards/components and specifying data contracts still missing. Keep source privacy/redaction behavior explicit.

Extend the existing acceptance journeys for conversation history, selective retry, draft preservation, scope isolation, source revocation, service failure and old receipts. Check HTML/links, component class definitions, board references, design branding and applicable repository tests. Record what ran and what could not be verified. Never claim a backend feature ships because it is drawn.

Commit all your design-system, HTML-design and accompanying specification changes, staging only your own files with the repository's required attribution. Push your branch to origin without force-pushing. Preserve unrelated work; integrate remote changes safely if needed. Exclude design-tool runtime files, credentials and private data. Finish with branch, commit, push result, changed boards/components and genuinely new unresolved issues.
