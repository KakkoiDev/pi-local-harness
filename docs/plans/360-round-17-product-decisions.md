# Round 17 product decisions for round 18

20 October 2026. Owner instruction: “go with your recommendations for all 20 questions.” Questions 1–5 use the recommendations already presented; 6–20 are the agent-selected defaults under that delegation. This resolves the list in [round17's handoff](../handoff/round-17-design-2026-10-20.md), not implementation approval or evidence of shipped behavior. Round18 must reconcile the boards and component specifications before frontend integration.

| # | Decision | Reason and boundary |
|---|---|---|
| 1 | Needs-you items oldest first within each kind; history newest first. | Avoid starvation while making recent history easy to find. Do not reorder a keyboard-focused row underneath the person. |
| 2 | Show filters are per window. | Two windows may intentionally show different views; changing a filter does not alter server authorization. |
| 3 | Overview shows seven days of resolved problems; unresolved problems never expire from attention automatically. | This is display history, not deletion or a new log-retention policy. Keep underlying recorded evidence under its existing retention rules. |
| 4 | Work-blocking service failure changes the status button wording to a clear unavailable state; other actionable problems contribute to the attention count. | Never falsely display idle/working while the relevant service cannot establish that state. Preserve access to Overview and recovery details. Designer supplies exact EN/JA copy and mixed-state priority. |
| 5 | Hide the separate Projects window by default at 1024px. | Keep Overview useful and project navigation reachable; do not close a separately opened window or discard its state on resize. |
| 6 | Command+Return on macOS / Ctrl+Return elsewhere opens a focused Overview item in a new window. | Only in the focused item context, not in the composer. Preserve the composer's existing send shortcut and native link behavior; provide a visible alternative and popup-blocked recovery. |
| 7 | Cancelling an interrupted request leaves a history row. | Show Cancelled honestly; do not imply completion, successful rollback or absence of earlier effects. |
| 8 | A new dashboard conversation starts with all currently authorized projects, visibly stated. | Never silently inherit the previous conversation's narrowed scope. Project chats remain project-only. Existing conversations preserve their explicit scope. |
| 9 | Keep and list dashboard conversations, with New conversation. | People must be able to return to cited answers and decisions. Scope is attached to each conversation; history does not grant access to removed/revoked sources. No new permanent-storage retention policy is set here. |
| 10 | Cited Markdown opens in rendered Page view, at the cited section where possible. | Optimizes reading; Source view remains accessible for editing/inspection. Show changed-source status and never imply the current file is the historical revision. |
| 11 | A removed project's citation becomes an unavailable, disabled placeholder. | Retain the reference's place in the answer. Recheck authorization; do not reveal cached excerpts, paths or names whose display is no longer permitted. Existing prose is not silently rewritten; access revocation must be enforced by the host. |
| 12 | Retry only missing/failed projects by default. | Avoid repeating successful work. Record a new attempt with explicit coverage; preserve the original answer/receipt. A full refresh is a separate explicit action. Do not quietly widen the authorized scope. |
| 13 | Add an “Ask about this project” action on each project summary row. | Open a dashboard conversation scoped to that project and focus the composer; do not send automatically or add an action to every attention item. |
| 14 | Keep a context receipt for every submitted request/answer, not only the latest. | The historical receipt records what was actually supplied, not today's recomputed selection. Access checks can redact unavailable sources; preserve truthful partial/interrupted states. No receipt is invented for an unsubmitted draft. |
| 15 | The retry action sends immediately when the person clicks it. | It is an explicit retry of the same question for the displayed missing/failed subset. Label that subset clearly; deduplicate repeated clicks, recheck scope, preserve the draft and never retry tool effects or change phase. If no target remains authorized, explain without submitting. |
| 16 | “Ask in Overview” prefills the composer and scope, then waits for Send. | The person can review cross-project scope and wording. Preserve an existing draft instead of overwriting it silently; the designer must specify draft-conflict handling. |
| 17 | Show authorized left-out source names with reasons in the expanded receipt, plus a compact count in its summary. | Distinguish budget omissions from unavailable/unsearched material. Do not expose names or counts from unauthorized collections; do not dump all omitted text. |
| 18 | Show three found sources initially, with an accessible Show all expansion. | This is a presentation cap only, not a retrieval cap. Keep the remainder reachable, including on phone and keyboard. |
| 19 | Show the cross-project boundary notice when another project is explicitly referenced, not whenever an ordinary term has no match. | An empty search cannot establish that something belongs to another project. Always retain the compact current-project scope indicator; do not leak unauthorized project existence. |
| 20 | Use 概要 for Overview in Japanese. | Apply consistently in navigation, titles and accessibility labels; translate the rest of the copy using existing conventions. |

## Cross-cutting limits

No new permissions, automatic phase changes, multi-agent execution or Second Brain publication. Dashboard conversation is read-only with respect to project changes. Scope narrowing never rewrites an old message's receipt. Reading/opening an item never answers it. Keep resolved/replaced questions linked to their authoritative current state. Do not expose SQL, engine names, rank or query implementation details in normal UI.

The [round18 brief](../../design/briefs/round-18-overview-decisions.md) requests the design revision. Runtime implementation, record schemas and conformance remain open in task357 and the applicable feature tasks.
