# Round 18 follow-up: ten product questions

Historical proposal record. Superseded on 21 October 2026 by [round 19’s owner-delegated decisions](round-19.md); pending-approval language below records the earlier state, not current instructions.

21 October 2026. Requested by the owner after merging round18 (`159299fd`). This adds a review brief to round18; it does not resolve the ten questions. The previous delegation covered round17's 20 questions only. Recommendations below are proposals awaiting owner approval. The agent may prepare explicitly labelled alternatives; it must not call a proposal an approved decision or implement runtime behavior.

Read the round18 section in `design/IMPLEMENTATION.md`, `docs/handoff/round-18-design-2026-10-20.md`, the component cards and `docs/plans/360-round-17-product-decisions.md`. Preserve the approved 20 decisions except where a new proposal is explicitly shown for owner review.

| # | Product question | Recommended proposal / design work |
|---|---|---|
| 1 | How should status represent multiple blocking services? | Use “Can’t run work · 2 services stopped”, with attention count separate and details listing each service. Include singular/plural, unavailable health data and partial recovery. Do not infer service health from model prose. |
| 2 | Do later-registered projects join an existing All projects conversation? | Preserve its starting project set. Make newly available projects explicit and offer a deliberate scope-update action. Removal/revocation takes effect immediately. An update affects future submissions, never historical receipts. |
| 3 | Where do conversation drafts live, and how do conflicting edits resolve? | Store in the local backend so authorized devices share them. Use revision checks and preserve both conflicting versions; no silent last-write-wins. Draw offline/unsaved/conflict states and avoid overwriting an existing draft during prefill. |
| 4 | What happens when revoked project data appears in answer prose? | Withhold the affected answer if it cannot be safely separated, rather than redacting citations alone. Offer regeneration within remaining authorization. Do not let the language model decide whether private text is safe to disclose. Distinguish revocation from an ordinary removed project; display authorization is host-controlled. |
| 5 | What should a full-refresh action say in a narrowed conversation? | Match its actual current scope: “Ask Again in 2 Projects” or “Ask Again in Class Notes”. Never silently widen scope. Recheck authorization and reflect changed scope before submitting. Distinguish full refresh from retrying only missing projects. |
| 6 | How should New Conversation coexist with New File's shortcut? | Preserve New File's existing shortcut. Provide a visible New Conversation action without the colliding shortcut. Show it in the relevant Ask-pane menu/context only, not as a replacement for project-file creation. |
| 7 | When does an ordinary word count as an explicit project reference? | Recognize an explicit project link/mention or wording such as “the Notes project”. Bare “notes” is insufficient. Unknown/unauthorized names never trigger a notice that confirms another project's existence. Provide examples in the specification, not an AI-judged permission rule. |
| 8 | Should resend describe the phase that will be used? | Yes: name the current phase and explain that resend does not change it. Recheck the phase at submission; never replay earlier permissions or tool effects. Show what happens if it changes between opening and submitting. |
| 9 | How long do context receipts survive clearing/compaction? | Retain receipts with their messages; compaction must preserve evidence references. Clearing moves the conversation and its associated records to Trash under applicable existing retention rules. This does not authorize indefinite retention or invent a new purge period. Design historical/redacted/missing-receipt states honestly. |
| 10 | Approve the three extra controls drawn in round18? | Propose Cancel Request for interrupted requests with confirmation defaulting to Keep Request; Check Again as a read-only health refresh, never an implicit restart; New marker until focused/opened, without the 60-second expiry. Marker state must not resolve attention. Explicitly mark all three as proposals awaiting approval. |

## Work requested from the designer agent

Prepare a round18 addendum, retaining each question's pending status until the owner answers it. If showing proposals in HTML, label them Proposed / Awaiting decision and keep them separate from approved boards. Draw alternatives only where they clarify a real tradeoff; do not reopen round17's 20 settled questions.

Update relevant component specifications/previews, canvas metadata and HTML boards through the documented design workflow. Add a clearly labelled round18 follow-up section to IMPLEMENTATION.md, listing exact EN/JA copy, focus/keyboard/phone behavior, changed text and affected boards. Add a handoff with a ten-row question-to-board map, recommendation, alternatives and approval status. Resolve conflicts between README/card/board text explicitly; do not silently treat the newest drawing as owner approval.

Extend acceptance journeys for multiple services, newly registered/revoked projects, conflicting drafts, withheld answers, scoped refresh labels, shortcut isolation, ambiguous project names, phase changes during resend, compaction/Trash receipts and the three proposed controls. These are design acceptance journeys, not claims that backend tests exist.

Validate HTML nesting, class definitions, links, board references, EN/JA string consistency, component previews and applicable design tests. Inspect responsive renders. Record screen-reader, live focus, popup and multi-window behavior as not verified if no built frontend exists.

Commit design-system, HTML design and accompanying specifications with required attribution, staging only your own files. Push a dedicated follow-up branch without force-pushing; integrate newer remote work safely. Do not merge into main without owner instruction. Never include design-tool runtime files, secrets, private data or transfer bundles. End with commit, branch, push result, changed artifacts, checks and the ten questions' approval status.

No application implementation, engine download, automatic guardrail changes, phase changes, multi-agent execution or Second Brain publication is authorized by this brief.
