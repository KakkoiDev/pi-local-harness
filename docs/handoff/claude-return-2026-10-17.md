# Return report to Claude: work since the Pi Workbench handoff

17 October 2026 · GPT-Sol · Runtime inspected: **8184f73**

Read CONSTITUTION.md first. This report covers both the original tasks 227–242 handoff and the later 2026-10-17 continuation. It distinguishes implementation history from subsequent live-session evidence. It does not amend the constitution or claim that checked roadmap boxes establish runtime correctness.

## The most important update

The requested roadmap implementation was shipped, but the owner's two test-project sessions revealed serious defects. **System 1 can mark a planned code task verified when only paperwork changed and no feature or tests were implemented.** This was observed in the real project and reproduced in scratch. Choice/plan aborts can become failed requests with unsaved assistant replies; project renaming leaves a stale Pi cwd; repeated choice replies merge and can overwrite drafts.

Read the [full privacy-edited log review](../reviews/2026-10-17-test-project-log-review.md) before treating task 247 or the completion protocol as reliable. The previous [247 review](247-review.md) records what tests established at that time; it predates these findings. Its claims about evidence-based completion must be read with this correction. The defects have **not** been fixed in this reporting session.

## What was delivered, with commit references

The commit IDs below are repository commits, not claims of independently proven product outcomes. Existing task files record historical Red/Green evidence and limitations.

| Task | Work delivered | Commits |
|---|---|---|
| 227 | Recovery retains the request until Pi finishes instead of prematurely closing it | 1a8ff9b |
| 228 | Per-request test-run evidence and display | f5517cd |
| 229 | Separate starter skeleton from replaceable sample; first-code-request sample cleanup | 97f13c9 |
| 230 | Starter referenced-file existence checks | c9c4e20 |
| 231 | Ready-to-publish audit and task integration | 9775480 |
| 232 | Short task titles while retaining the full request | fe0d9d4 |
| 233 | Gate checks incomplete plan content and leaves it visibly open | 4b7b84e |
| 234 | Shared per-turn context selection, reasons, history and round-11 Why? display | d1b5f6d, 901acde |
| 235 | Pong benchmark from the current starter and recorded comparison | 7df4f2c, 5b79f1e |
| 236 | Choice protocol, human answers and assumption checks; benchmark box remains open | 3c99aab |
| 237 | Approved plan lifecycle and task check-ins, later revised by 247 | 074c378 |
| 238 | Automatic plan execution, bounded continuation and retained run reports | 4d618ca |
| 239 | Web plan/choice/check-in/run-report cards, later round-11 adaptation | 998b4aa |
| 240 | Terminal planning, choices and task review | ffcfa7f |
| 241 | No-action wake-ups, closest-match edit feedback, template-token cleanup, documentation-intent wake fix, finalized Activity answer bridge | bcbce0a, 58aed97, 3847bc1, 540ee09 |
| 242 | Designer brief completed before the continuation; no new implementation claim here | See task 242 and the supplied design history |
| 243 | Round-9 update checks, install guidance, terminal app Preview and shared settings/language; two controls deferred | 599bbce, b03c1af |
| 244 | Reproducible README tables/build metadata; preserve and publish the approved 22 historical runs | 5d7f250, 3f3cd59, 8184f73 |
| 245 | No implementation or benchmark: waits for the person's instruction | None |
| 246 | Recover Tailscale Serve sharing after it stops | e343110 |
| 247 | Persistent phases, checked shell reads, phase enforcement, stable project-ID phase/plan records, explicit approval and acceptance, System-1 paperwork, web search, round-11 UI | 4dab2e7 (brief), e85f983, 275f9ef, b05150f, 1751ab7 |
| 248 | Rename only the design system to Pi Workbench 1-bit; product stays Pi Workbench | a32c574 |
| 249 | Append-only decision authority log, benchmark counts and missing-provenance handling; typed-code answer coverage fix | c2ac6fc, 8c60928 |
| 250 | Approved/pinned local Laya toolchain, typed questions, confidence/abstention, code-first integration and evaluation | 464f183 |

The person's own music feature **fa98338** was merged in **540c29a**, preserving both music and harness work. It was not authored by this agent. Claude's round-11 design sync **6628b8e**, constitution and handoff updates were likewise inputs, not work to claim as mine.

## Key implementation decisions and the person's clarifications

- Context selection is shared by terminal and web. Before the current request has a commit, use the latest harness-created project commit, not an unrelated later human commit. The live review suggests selection relevance still needs work.
- Publication prose checks mean starter-leftover detection and consistent app names, not a claim that a command can judge arbitrary README accuracy. The person approved Vulture 2.16 for scratch Python audit verification.
- The person explicitly approved task 241. Wake-ups are bounded and share retry limits; they are not proof of solved scenarios.
- Explicit project phase controls and terminal commands are authoritative. Natural-language yes or a Laya interpretation cannot approve a plan, change a phase or accept a task.
- Discussion/Planning allow checked read-only shell commands; unknown or mutating commands remain blocked. The permission boundary is a tool-call gate, not an OS sandbox. Approved project tests execute project code under the account's permissions.
- Terminal phase commands outside a project use a registered-project picker. Phase and approved-plan state follow stable project identity on moves. The later stale-cwd finding concerns the Pi session layer, which this did not solve.
- Start Building approves the selected unchanged tasks. Plan Another Task returns to Discussion. Each task, including the last, waits for acceptance. Stop Here pauses; it does not mean accepted. Automatic runs stop on unverified work.
- New UI followed local round-11 boards/cards, not inaccessible online designer documents. No constitution edits were made.

## Laya installation, evaluation and authority

The person approved laya-mlx 0.4.0 (99,307 bytes), the multilingual model (about 678 MB), and up to 100 MB of required dependencies. Resolved dependency downloads totaled **79,387,414 bytes**. Wheels/model files, sizes and hashes are pinned in kit/laya-lock.json; model revision **f2b4faf51023039425946074e2cf1361d2db11d5**. Installation uses the harness toolchain outside the repository and the installed Python 3.12. Ordinary tests fake Laya and do not load the model.

Thresholds: waiting reply .98, phase intent .98, assumed value .98, guide choice .95, shell risk .995. Code runs first; uncertain classification asks the person. Shell classification is advisory and never overrides a code refusal. Exact human confirmation can settle the same stated value; automatic recommendations do not provide that confirmation.

The small handwritten English/Japanese development evaluation had **12 correct answers out of 12 answered cases, 28 abstentions out of 40 total cases**. Phase intent answered 5/8, guide choice 7/8, the other three categories abstained on all eight cases each. This is **30% coverage**, not 100% classification accuracy over the set, independent validation, or a safety guarantee. Unthresholded probes had confident errors; conservative thresholds were retained. Details and reproduction command: [task 250](../../tasks/250-laya-classifier.md).

The owner clarified that **all analyzed runs were v2, before Laya was active**: deterministic gates constrained actions while System 2 made the workflow decisions. Do not present the sessions as a test of Laya or the later decision ladder. An isolated decision row labeled Laya and later installed/build metadata require provenance reconciliation; neither establishes that the sessions used the implemented classifier.

## Benchmark work and what it actually shows

The person said the benches were done and directed use of the **22 saved runs**, not completion of the planned batch. They were frozen on **3847bc1**, before the music merge, explicit phases, Laya and decision provenance. Publication did not rerun the models.

| Model / mode | Hidden scenarios resolved | Harness verified/committed | Saved runs |
|---|---:|---:|---:|
| Gemma 4 e4b / harness | 2/9 | 3/9 | 9 |
| Gemma 4 e4b / bare | 2/9 | 0/9 | 9 |
| Qwen 3.8 27B / harness | 3/4 | 2/4 | 4 |
| Qwen / bare | Not available | Not available | 0 |
| Luna / both | Pending | Pending | 0 |

The Gemma result does not show a solve-rate gain. Qwen has no bare control and is partial. Harness verification is a different measure from hidden scenario success. Historical decision share is **Not recorded**, not zero. There are fourteen missing local runs; seventeen saved runs have no test-run JSONL, and that absence is preserved. No paid Luna request or authentication check was made. The person will configure the API key themselves; do not request a pasted key.

Published evidence and caveats: [dated bench README](../bench/2026-10-17/README.md). Earlier interrupted/pre-fix local runs remain excluded from the comparison. This is not a benchmark of 8184f73 or a reliable model ranking.

## Verification and shipping history

Task records and the prior review report targeted failing regressions, focused Python/Node checks and full workflow checks. UI changes additionally ran isolated design/chat browser suites and inspected desktop/phone states. Laya evaluation was explicitly run separately; normal tests remain isolated from real Ollama, tailnet and personal projects. These passing checks were narrower than the live failures now documented.

The owner authorized commits and pushes and requested a tryable build. The branch was merged/fast-forwarded and shipped through **8184f73**, with installed metadata identifying that build at review time. A running service can retain older code until restart; startup records show 1751ab7 for older requests and 8184f73 for the last two. Gate build identity is insufficiently recorded. The owner explicitly identifies the analyzed sessions as **pre-Laya v2**. Installed/source build identifiers do not prove the running decision architecture, and must not be used to contradict that clarification. The live findings and later-source reproductions are separate evidence.

This report-publication change is documentation only. It does not require reinstalling the runtime or restarting the person's services. Its final commit is discoverable by the task-251 subject in git history.

## Current open work and honest status

- **236:** keep the “bench still passes its scenarios” box open; the saved batch includes failures. The person explicitly accepted leaving it open.
- **243:** Show lessons and the ten-second worker-wait settings remain deferred. They did not exist where the design assumed; the person said to build the other parts and leave these pending. Installer-owned Dock/tray work is documented separately, not claimed implemented here.
- **244:** full same-build local comparison and Luna API setup/runs remain open. Do not start the missing runs without new direction; use the 22 saved records.
- **245:** DeepSeek waits for the person.
- **247 and related runtime:** the roadmap is ticked, but subsequent evidence requires repairs. Do not silently erase that history or present the old completion as proof. Prioritize zero-code false verification, intentional-pause persistence, atomic choice answers/drafts, stale session cwd, and question-to-task scope. Detailed acceptance tests are in the log review.
- **249:** instrumentation exists but live correlation is incomplete. Record component builds and a common trace ID before claiming a comprehensive decision-share metric.
- The proposed repairs have no implementation commits yet. The private test projects were inspected read-only; no corrective edits to their code, task records, logs or data were made.

## New owner direction: Project Start and capability first

The owner wants an expanded Project Start modal selecting reusable capabilities such as auth, multiplayer, collision detection, dashboards, offline operation, GitHub Pages deployment and phone-app support. Selection should assemble a tested base, allowing the AI to focus on novel business needs. The preferred app stack is **HTMX and Python**, including a proposed browser Python/WASM runtime for frontend-only deployments, with more blocks added over time.

The immediate priority is **make the AI able to build anything**: broaden working capability and dependable end-to-end delivery first. **Performance and scalability of generated apps come later.** Correctness, honest verification and safe data handling remain part of the foundation.

The experienced-engineer audience needs many shareable demos and products that can progress to production. Beginners and people without AI subscription budgets need local experimentation, clear gated steps teaching rigorous practices/project management, and useful projects for life and portfolios. Repetitive blocking questions and unsupported green checkmarks undermine both goals.

Design and architecture questions are documented, not decided: catalog composition, phone PWA versus native meaning, multiplayer semantics, versioned block upgrades, Python/WASM–HTMX routing/storage, and trusted auth/shared state for otherwise static hosting. Browser Python is not automatically a hosted network server. The expanded modal needs a local design specification; no UI or dependency download was added for it.

## Suggested next action for Claude

Review the P0 reproduction and gate/paperwork.py completion logic first. Then design the minimal task-bound verification and durable interaction repairs, with failing replay tests based on the observed provider events and queue races. Preserve the person's explicit approval authority. Only after a complete feature can reliably proceed through test, implementation, check-in and recovery should the Project Start blocks expand that capability.

Do not optimize generated-app scalability ahead of this. Do not run new benchmarks, download anything, change personal project data or restart services as an implicit consequence of reading the report. Any such work needs its own applicable authorization.
