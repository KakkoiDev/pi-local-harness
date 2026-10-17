# Pi Workbench: review of the two test-project sessions

17 October 2026 · Prepared for the project owner and an independent AI reviewer

## Assessment

The harness did not reliably turn an approved feature into a working app change in these sessions. The most serious failure was **System 1 certifying work that had not been implemented**. Choice handling, request lifecycle, project renaming and persistence also interrupted useful work. The model compounded these defects with speculative explanations, repetitive questions and incorrect tool arguments.

The right first priority is the owner's stated goal: **make the AI able to build anything**, meaning progressively broader kinds of working applications with reliable execution, verification and recovery. **Performance and scalability of generated apps come afterward.** This does not defer correctness, secrets protection or honest verification: those are prerequisites for a working app and trustworthy learning experience. It does mean that throughput optimization, infrastructure scaling and speculative production tuning must not displace getting the end-to-end building loop working.

This is a report, not a repair. Neither project, its logs, the running services nor the repository was changed by this review. Two defects were reproduced in isolated scratch projects. No model benchmark, package download, service restart or live UI interaction was performed. This repository edition is a privacy-edited copy of the private review: home paths, private source links and full request/session/project identifiers are omitted. Raw logs and reproduction scripts are not published.

## Scope and limits

Snapshot cutoff: **2026-10-17 19:51:22 JST**. The snapshot was collected while the system was live and is not atomic. One request was still running; its final outcome is outside this report.

Sources inspected: both saved conversations, both raw Pi sessions, all 31 associated Activity records, attributable rows in shared Gate/report/decision/recovery logs, project registration, relevant task/roadmap/git evidence, source code and two user-uploaded screenshots. Other projects and benchmark sessions were excluded. Shared logs without project/request identity cannot be fully attributed; “all logs” here means all discoverable records attributable to these two projects, not a claim that missing instrumentation can be reconstructed.

| Project | Stable ID (redacted) | Requests | Completed | Failed | Stopped | Running |
|---|---|---:|---:|---:|---:|---:|
| test-harness, previously test-masuda-san | omitted | 15 | 6 | 8 | 1 | 0 |
| harness-test-2 | omitted | 16 | 8 | 6 | 1 | 1 |
| Total | | 31 | 14 | 14 | 2 | 1 |

“Completed” is a transport/job status, **not evidence that the requested feature was delivered**. Seven failures were rename/startup errors. Seven more were control pauses recorded as errors. These categories explain the 14 failed statuses; they do not explain every usability problem.

The saved conversations contain 15 user + 6 assistant messages and 16 user + 8 assistant messages respectively. Both retain their first user prompt. Gate records attributable to the projects contain 24 ALLOW, 20 SUCCESS, 5 REVISE and 4 EXECUTION_FAILED events. The 20 attributable reports comprise 13 guide, 5 rule and 2 recovery entries. Only two decision-log rows directly join to these request IDs.

**Runtime attribution, corrected by the owner:** all analyzed runs were **v2, before Laya was active**, using deterministic gates. System 2 was making the workflow decisions within those code-enforced constraints. These sessions do **not** evaluate Laya or the later code → Laya → person decision ladder.

Startup/build metadata includes 1751ab7 for earlier requests and 8184f73 for the latest two, and installed metadata/source now identify 8184f73. Those values do not establish which decision implementation was active in the running services; they must not override the owner's clarification. Both sessions used Qwen3.8:27b-mlx through Ollama, thinking low. Missing per-component runtime provenance remains an observability problem. Code inspection and scratch reproductions on the inspected source are separate evidence from the historical v2 runs.

## Findings, in repair order

| Priority | Finding | Evidence strength |
|---|---|---|
| P0 | Code task certified without code or tests | Real commit + isolated reproduction |
| P1 | Choice/plan pause becomes failed request; answer omitted from saved chat | Raw events + persistence code |
| P1 | Rename leaves the durable Pi session pointing at the old folder | Seven startup errors + session metadata |
| P1 | Choice clicks overwrite drafts and conflicting replies merge | Real replies + source + queue reproduction |
| P1 | An unrelated review question blocks an approved task | Gate rejection + task/choice history |
| P2 | Context and compaction amplify repetition; diagnostics incomplete | Twelve compactions + reports |
| P2 | Tool misunderstandings and weak search/link behavior reduce useful work | Tool events + source |
| P2 | History, selection, stop and traceability need durable state | Source + user reports; some UI causes unproven |

### 1. False verification and false task completion

In harness-test-2, task 003 required a per-note priority field, default Normal, an editable dropdown, persistence and tests. Request `R29` ended with a verified check-in and task boxes ticked. Commit **22fa29e** changed **only ROADMAP.md and the task file**. It did not add the planned migration or priority tests, and the inspected app did not contain the priority implementation. There were no tool calls in that request. The check-in's verification was **“Documentation change”**, despite the approved task being code.

Evidence: task 003 (private evidence), request Activity (private evidence), and `git show --stat 22fa29e` in that project.

The completion path in [gate/paperwork.py](https://github.com/KakkoiDev/pi-local-harness/blob/8184f73/gate/paperwork.py#L488) derives the need for testing from the **files changed in the current request**. With no code diff, it bypasses the code-verification branch. For a planned task, it then ticks every remaining checkbox and emits a verified check-in. This makes “the model produced no implementation” look like “documentation-only work successfully completed.”

The scratch reproduction approved a code task, made no app change and ran no tests. The harness committed the roadmap and task, marked the task green, and reported “Documentation change.” The app was unchanged. This is a harness defect in shipped code; the existing passing tests did not establish the constitutional evidence requirement.

**Required improvement:** completion must follow the approved task's kind and acceptance criteria. A code task cannot become complete merely because its only diff is paperwork. Require task-relevant implementation evidence and recorded verification on the final tree. An already-satisfied task needs a separate, evidence-backed path. Check individual boxes only from their corresponding evidence; never blanket-tick remaining requirements. A discussion reply, blocked write, pause or stop must leave the code task open.

**Acceptance test:** replay this exact zero-code scenario and assert no verified check-in, no task completion and no fabricated Red/Green evidence. Then implement a real feature, prove the relevant test fails without it and passes with it, and verify the check-in identifies that test and commit.

### 2. A successful question or plan creates a failed request

Seven control-pause endings in the raw sessions have assistant stopReason `error`, errorMessage “This operation was aborted,” and empty final text. Successful ask_choices/propose_plan calls precede them. The extension deliberately aborts to wait for the person: [extension.mjs](https://github.com/KakkoiDev/pi-local-harness/blob/8184f73/harness/extension.mjs#L124). The web worker tolerates `aborted` when a choice/plan is pending, but raises on `error`: [web_chat.py](https://github.com/KakkoiDev/pi-local-harness/blob/8184f73/harness/web_chat.py#L573).

The assistant message is appended to persistent conversation history only after that processing succeeds. A streamed answer can therefore exist in Activity and on screen, then disappear on reload because the request was classified as failed before it was saved. The saved assistant-message counts match the successful-request counts. This is a strong explanation for missing answers; it is not proof that every reported visual disappearance had the same cause.

**Required improvement:** represent a deliberate control wait explicitly and correlate it with the pending control and request. Persist partial/final assistant output and its lifecycle even on failure. Persist the control and associated answer together. Do not suppress every provider error simply because a question exists.

**Acceptance test:** replay real Pi-style `error / operation aborted` events after successful choice and plan tools. Reload and reconnect; the question, preceding answer and waiting status must survive exactly once. A genuine provider error must remain an error.

### 3. Project rename preserves identity but breaks Pi's working directory

The first raw session record still names the old test-masuda-san project folder. After the registered project became test-harness, seven consecutive requests failed because that stored working directory no longer existed. The rename updates project/conversation information, while subsequent requests reuse the old session file: [web_chat.py](https://github.com/KakkoiDev/pi-local-harness/blob/8184f73/harness/web_chat.py#L303), [session reuse](https://github.com/KakkoiDev/pi-local-harness/blob/8184f73/harness/web_chat.py#L514).

Preserving phase/plan by stable project ID solved a different part of the move. It did not migrate or replace Pi's durable cwd. The busy-project rename guard apparently worked; the remedy is not to remove that guard.

**Required improvement:** validate session location before launching; migrate using a supported session operation or safely create a rebased continuation preserving history and project identity. Keep a recoverable copy. Never repeatedly launch a known-invalid session.

**Acceptance test:** rename an idle project, continue chatting, restart the workbench, then build. History, phase and approved plan remain associated with the same ID, and no stale-path startup error occurs.

### 4. Choice handling loses drafts and accepts contradictory duplicates

The first harness-test-2 request produced four ask_choices calls in one assistant batch, despite the intended one-question interaction. Later requests contain repeated identical choices. The final snapshot request contains **nine merged choice submissions: three Park replies followed by six Drop replies**. The resulting decision was recorded as free-form “other,” not one clean selected option.

The queue merges text for the same queued chat without distinguishing ordinary messages from structured control answers. An isolated three-click reproduction yielded one queued message containing Park, Park and Drop. Separately, [submitPlanReply](https://github.com/KakkoiDev/pi-local-harness/blob/8184f73/js/chat.mjs#L59) writes into the regular composer and draft before submitting. This directly risks replacing the person's unfinished message. A temporary network “sending” guard does not lock the question after acknowledgement while its queued answer is still pending.

**Required improvement:** answers need question ID, revision, option ID and an idempotency key. Resolve a pending question atomically on the server. Repeated submissions must acknowledge the existing answer; changing an answer must be an explicit operation. Do not concatenate conflicting answers. Enforce one pending question at a time. Send control replies through a separate path that leaves composer text, attachments and selection intact. Preserve useful queuing for ordinary chat messages.

**Acceptance test:** rapid clicks, double clicks, delayed responses, reload, reconnect and two tabs produce one authoritative answer. The person's draft remains byte-for-byte unchanged. A stale answer cannot resolve a new question.

### 5. An unrelated review decision obstructs the approved feature

Request `R28` lasted about **38.6 minutes**. Its attempt to write a priority test was rejected by G-017 because a choice was unresolved. The discussion concerned reviewer notes the person had said were **not for this plan**. The model nevertheless kept asking how to handle them, turning an unrelated discussion into a global write gate.

The gate was enforcing an unresolved-question policy; the policy and question scope were wrong for this situation. By the later snapshot, an answer record existed with pending false, so a **permanent deadlock is not established**.

**Required improvement:** code should track which task/action a question blocks. File out-of-scope review notes without making them prerequisites for an approved build. Only a material unresolved decision should block the dependent action. Explicit phase and acceptance controls remain authoritative; the model must not infer permission from conversational phrasing.

**Acceptance test:** an unrelated review note cannot prevent the approved task's in-scope test write. A genuinely blocking requirement still pauses the relevant action and shows a clear way forward.

### 6. Repetition and context handling overwhelm progress

The harness-test-2 session contains **12 compactions**, with summaries growing from about **990 to 26,802 characters**. Their recorded output-token totals sum to **39,972**. This is provider accounting, not a measured amount of elapsed compaction time. Finished requests had a median duration of about **10.7 minutes**. These observations identify substantial overhead and repeated context, but do not isolate model speed, queue delay or hardware as the cause.

Two loop reports were triggered by repeated boilerplate: a fenced Python invocation and repeated quoted warning lines. These are not evidence of a repeated execution loop. The model repeatedly restated problems and asked meta-questions while the actual feature stayed unimplemented. Context selection included substantial starter/initial-commit material; the active feature task had to be manually read later.

**Required improvement for capability first:** prioritize authoritative phase, active approved task, unresolved relevant decisions, current code and latest test evidence. Bound compaction summaries; avoid recursively preserving expansive conversational summaries. Detect repeated ineffective actions with lack of progress, rather than repeated Markdown fences. Record compaction failures durably with stage and size. Add queue/model/tool/compaction/persistence timing so later optimization has evidence.

The user reported a context/compaction notice, but no explicit “context too small” exception was found in the attributable records. Both first user prompts remain saved. The screenshot does not prove chat-head deletion. Do not implement a speculative context-limit fix as if the cause were established.

### 7. Search, rendering and tool feedback invite incorrect model explanations

Six web searches included weak results such as dictionary pages for “open” and “standard” and generic GitHub results. At least one Obsidian query returned something relevant. The search code URL-encodes the full query; **first-word truncation was not established**. The model supplied remembered links and explanations without sufficiently distinguishing retrieved evidence from memory.

The message renderer supports explicit `[label](https://...)` links, but not automatic bare-URL links or relative/anchor links: [message-markdown.mjs](https://github.com/KakkoiDev/pi-local-harness/blob/8184f73/js/message-markdown.mjs#L8). Several answers used bare URLs, so the model's proposed “use bare URLs” remedy was counterproductive. The claim that Markdown was entirely unsupported was also false: tables, lists and emphasis have implementations. The user's list-rendering complaint needs a replay of that exact answer before diagnosing its DOM cause.

Three shell calls were refused for constructs outside the checked read-only policy, including compound syntax and a database-mutating Python attempt. This is **not proof that all shell calls or all reads were blocked**. One read path contained a stray newline and `</check>`; its missing-file error was a model argument error. A clean retry was aborted, a separate failure. Reading a chat image as if it were a project-root file also failed, although the inline image was available later.

**Required improvement:** give typed, actionable errors: malformed argument, phase refusal, missing attachment handle, provider abort. Show supported read-only examples without weakening the shell gate. Expose attachments through stable scoped handles. Replay safe Markdown fixtures including Japanese text, lists, tables and links; preserve URL sanitization. Log search query/provider and distinguish retrieved URLs from unverified suggestions.

The model's claim that music functionality was absent was not established: music support was already merged. Whether Discussion should permit audio-artifact generation is a phase/design question, not grounds to silently bypass write restrictions.

### 8. The interface and logs do not preserve a trustworthy account of the work

Historical assistant messages do not retain the same Show in Activity link as a live answer. Saved assistant messages lack the request identity needed to rebuild it. [renderMessages](https://github.com/KakkoiDev/pi-local-harness/blob/8184f73/js/chat.mjs#L69) replaces the message tree when its signature changes, preserving some disclosure state but not the browser selection. That is a plausible cause of selection loss, not a completed browser reproduction.

Stopped requests are in Activity, but the saved chat does not tell the whole lifecycle clearly. The person repeatedly had to explain missing replies, queue warnings, lost drafts, disappeared questions and silent endings. Screenshots substantiate the displayed layout and a chat containing user prompts without earlier assistant replies; they do not establish every proposed CSS or persistence explanation.

Traceability is also incomplete. Some custom tools are represented as read_file with empty arguments in Gate records. Some report IDs do not directly join the work-queue request. A recovery row lacks timestamp/request identity, and the plain Gate audit log cannot be reliably scoped. Only two decision records directly correlate with these requests; they are insufficient to reconstruct comprehensive decision provenance. One row is labeled as a Laya abstention at confidence .5426. Given the owner’s explicit v2/pre-Laya attribution, that isolated row must not be used to claim the analyzed sessions exercised Laya; its provenance needs reconciliation. The model-directed v2 sessions are not an evaluation of the implemented classifier.

**Required improvement:** stable message and request IDs; incremental rendering; persisted wait/stop/error/check-in states; a historical Activity link. Carry one trace ID through project ID, chat, queue request, Pi session, Gate action and tool call. Record the running builds of each component. Include reason, decision authority and effect for every control transition. Keep secrets and unnecessary raw content out of telemetry.

## Product direction requested by the owner

### First make the AI capable of building broadly

The immediate objective is a dependable path from an idea to a working application across many domains. The owner explicitly places **performance and scalability of generated apps in a later stage**. Initial milestones should demonstrate breadth and correctness: the AI can assemble, change, test, run, recover and explain apps with different capability combinations. Do not make large-scale hosting architecture a prerequisite for proving that loop.

Reusable foundations serve this objective by removing solved work from the model's workload. The model spends its attention on the app's novel business needs; System 1 owns compatibility checks, project setup, evidence and gate transitions. A starter checkbox must never create the kind of false “done” state observed above.

### A more advanced Project Start modal

The owner wants a Project Start experience offering many common capabilities, including:

- Authentication and account-related features.
- Multiplayer or shared interaction.
- Collision detection for interactive/game projects.
- Dashboards.
- Offline operation.
- GitHub Pages deployment.
- Phone-app use.
- Further reusable blocks added over time.

Selecting capabilities should create a coherent base app containing those pieces, rather than merely insert instructions asking the AI to reinvent them. The desired implementation language and interaction foundation is **Python + HTMX**. The owner also proposes a **Python WebAssembly runtime within frontend-only apps**, keeping the development model consistent across targets.

This is a product requirement to take into design and planning. No new modal, option labels or runtime implementation is authorized by this report alone. The existing design files remain the source of UI specifications; the expanded modal needs its own design.

### A foundation of composable, tested blocks

Recommended next planning work: define a small capability catalog and a consistent app contract. Each block should declare what it provides, required dependencies, supported runtimes, storage needs, interactions with other blocks and observable acceptance tests. Its assembly should be reproducible and versioned. Begin with a few useful combinations, prove them, then add blocks. A long list of unchecked promises would recreate the current verification problem.

For example, “offline dashboard” needs a defined local storage and reconnect behavior; “multiplayer” needs a clear meaning and shared-state contract; “auth” needs an explicit trust boundary. Collision detection belongs to an interaction/game block rather than being forced into every notes app. This is capability correctness, not an early demand to optimize for millions of users.

Keep the conceptual stack consistent while being honest about runtime differences. HTMX normally exchanges HTTP requests and HTML fragments with a server; Pyodide runs Python in a browser through WebAssembly; GitHub Pages hosts static assets. Sources: [HTMX documentation](https://htmx.org/docs/), [Pyodide documentation](https://pyodide.org/en/stable/usage/index.html), [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

**Architecture inference to validate:** a browser Python runtime is not automatically a network-listening Python server. A frontend-only target needs a proven adapter between HTMX interactions, browser Python execution, templates and persistence. Shared Python domain logic and HTML templates may be practical while storage/transport adapters differ between browser WASM and hosted CPython. Do not promise that an unchanged conventional Python server will run on Pages. Cross-device shared state and authoritative authentication require a trusted service or a separately designed peer/trust model; a static bundle alone does not supply those properties.

A narrow feasibility prototype should prove one complete user action, HTML-fragment response, persistent state, reload and offline behavior before standardizing that runtime. This prototype is for establishing capability, not for benchmarking or choosing a scalability strategy.

### Two audiences, one honest workflow

For the owner, an experienced engineer, success is quickly building many useful demos, shareable apps and products that can progress to production. Avoid repeatedly paying the model to recreate login, storage, testing or deployment plumbing. Make failures inspectable and recovery direct.

For juniors and people without experience or money for AI subscriptions, local AI should support exploration and learning. Explain why a gate is waiting, what evidence is missing and how to proceed. The same workflow should teach rigorous practices and basic project management through real work, producing useful personal applications and a portfolio to share with other people or prospective employers. Repetitive questions, opaque blocking and green checkmarks unsupported by evidence teach the wrong lessons.

“Ready to share” and “production-ready” must remain evidence-backed states with explicit scope. At the capability stage, prove the selected features and a supported way to run/share the app. Broader performance and scalability work follows once the building foundation is dependable.

## Open questions for design and implementation planning

These do not block delivering this report. They should be settled in the normal Discussion/Planning workflow before the corresponding implementation.

1. What exact evidence satisfies each task kind, including an approved code task already satisfied without a new diff? Who can explicitly accept that outcome?
2. Which questions block which task/action, and how does the person change a previously submitted answer without racing queued work?
3. What Pi-supported session migration preserves history safely after rename or relocation?
4. How should partial replies, failure, stop, wait and recovery appear in the designed chat history?
5. What is the first small capability catalog and combination set for Project Start? How will many options remain understandable?
6. Does “phone app” initially mean a responsive installable web app or a native packaged application? Does “multiplayer” mean shared editing, real-time games, or both?
7. Which Python/browser-WASM runtime and HTMX adapter actually pass the basic functionality proof? Which packages can that target support? No download choice has been made here.
8. What trust/storage service, if any, backs authentication and cross-device shared features on an otherwise static deployment?
9. How are blocks versioned and upgraded without overwriting the person's custom app? How are incompatible selections explained before generation?
10. Which minimal end-to-end app scenarios demonstrate “can build broadly” before work shifts to generated-app performance and scalability?

## Suggested repair and validation sequence

1. **Restore evidence integrity.** Add the zero-implementation regression first; fix completion and per-box evidence. Review the erroneous task 003 completion with the person before modifying their project records. Do not silently rewrite historical evidence.
2. **Make the interaction loop durable.** Replay choice/plan pause events; fix failure classification and assistant persistence; implement atomic structured answers and draft preservation. Confirm reconnect/reload and duplicate-click behavior.
3. **Keep project identity usable.** Fix rename/session continuation and preserve phase/plan/history. Add lifecycle and trace IDs so the next failure can be explained.
4. **Prove an actual feature.** Use a disposable copy of the notes starter and the priority requirement: explicit phase transitions, failing test, implementation, passing relevant test, preview, truthful check-in and human acceptance. Repeat with interruptions and unrelated notes.
5. **Broaden what can be built.** Design the expanded Project Start experience; prove Python/HTMX on hosted and proposed frontend-only runtimes; add tested blocks and representative combinations. Measure successful capability delivery and recovery, not just generated text or green job status.
6. **Then improve app performance and scalability.** Use workloads and usage expectations from working apps. Runtime timing can be recorded earlier for diagnosis, but optimization is not the primary deliverable now.

Useful acceptance evidence includes: no false verified completions; no lost acknowledged answers or drafts; one authoritative answer per question; resume after rename/restart; correct refusal of unsafe/out-of-phase actions; and several genuinely working app combinations. Existing benchmark failures remain evidence, not boxes to tick away. This review did not run new benchmarks.

## Independent reviewer checklist

- Inspect the real task/commit pair and reproduce the no-code completion before judging it fixed.
- Replay actual provider abort shapes, not only the fake provider's preferred stopReason.
- Test queued and simultaneous choice submissions; ordinary message queuing must still work.
- Verify project cwd migration, not only stable phase IDs.
- Confirm changes enforce code → Laya → person and preserve explicit phase authority.
- Evaluate Project Start against capability breadth and working behavior first. Do not substitute a scalability roadmap for the owner's immediate objective.
- Distinguish observed facts, reproduced defects, source-supported explanations and unresolved hypotheses throughout.

## Evidence appendix

The following request list is generated from the read snapshot. Times are JST; statuses are those captured at the cutoff. Original Activity records are private and may have changed after capture. R01–R31 are report-local request aliases in chronological order. The owner can correlate them by time and project; full IDs remain in the private review. Private raw snapshot files contain conversation content and were not committed or copied into this report folder.

### test-harness: request inventory

| Created | Request | Status |
|---|---|---|
| 14:21:37 | R01 (private evidence) | completed |
| 14:23:03 | R02 (private evidence) | completed |
| 14:32:07 | R03 (private evidence) | completed |
| 14:36:06 | R04 (private evidence) | completed |
| 14:42:35 | R05 (private evidence) | failed |
| 14:46:50 | R06 (private evidence) | completed |
| 14:48:56 | R07 (private evidence) | completed |
| 14:57:21 | R08 (private evidence) | stopped |
| 14:59:56 | R09 (private evidence) | failed |
| 15:00:28 | R10 (private evidence) | failed |
| 15:00:45 | R11 (private evidence) | failed |
| 15:01:08 | R12 (private evidence) | failed |
| 15:01:13 | R13 (private evidence) | failed |
| 15:01:30 | R14 (private evidence) | failed |
| 15:01:35 | R15 (private evidence) | failed |

### harness-test-2: request inventory

| Created | Request | Status |
|---|---|---|
| 15:13:28 | R16 (private evidence) | failed |
| 15:14:26 | R17 (private evidence) | completed |
| 15:17:46 | R18 (private evidence) | completed |
| 15:27:59 | R19 (private evidence) | failed |
| 15:37:43 | R20 (private evidence) | failed |
| 15:48:48 | R21 (private evidence) | failed |
| 15:59:52 | R22 (private evidence) | completed |
| 16:22:35 | R23 (private evidence) | completed |
| 17:15:13 | R24 (private evidence) | failed |
| 17:25:52 | R25 (private evidence) | completed |
| 17:35:16 | R26 (private evidence) | completed |
| 17:44:28 | R27 (private evidence) | completed |
| 17:54:27 | R28 (private evidence) | failed |
| 19:05:32 | R29 (private evidence) | completed |
| 19:47:54 | R30 (private evidence) | stopped |
| 19:48:10 | R31 (private evidence) | running |

### Evidence availability and reproduction summary

Private sources: project registration; the two saved conversations and Pi session JSONL files; 31 Activity records; attributable Gate, report, decision and recovery records; task 003 and commit 22fa29e in harness-test-2; and two uploaded screenshots. These files are not included in the repository. Shared logs contain unrelated project records, which were excluded.

Two isolated reproductions were run against the inspected code:

1. Approve a code task in a scratch project; make no implementation changes and run no tests; settle the request. Observed: outcome committed, task marked green, verification “Documentation change,” only ROADMAP.md and the task file committed, app unchanged.
2. Submit three choice replies while the same chat is queued: Park, Park, Drop. Observed: one queued job whose text concatenates all three replies. No atomic question-answer resolution occurs at this layer.

The private review retains the scripts and captured outputs. This publication includes the procedure and result without raw project content or machine-specific paths. A reviewer can turn these procedures into permanent isolated regressions before repair.

No fixes were implemented in the review. Its proposed fixes and product direction require their own scoped tasks and evidence. The inspected runtime was 8184f73; the report-publication commit changes documentation only.
