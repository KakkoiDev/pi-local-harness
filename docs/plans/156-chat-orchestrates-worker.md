# Plan 156: the chat orchestrates a worker

Status: **planned, not started** (2026-10-14). Task: [tasks/156-chat-orchestrates-worker.md](../../tasks/156-chat-orchestrates-worker.md).
Read [docs/contributing-for-agents.md](../contributing-for-agents.md) first. UI: [design/briefs/chat-orchestration.md](../../design/briefs/chat-orchestration.md) (nothing is built before the designer draws it).

Request 2026-10-14: "each projects have 2 agents: a chat agent and a work agent. the chat agent is a little bit like firstmate where it knows what is in the roadmap and in the tasks and can order the worker to start working on something. the choice to start the worker should be gated by a system 1 decision. … while the worker is busy, the chat agent is still available for a chat. … So basically, we will be able to orchestrate the whole project from the chat."

## 1. Where we are

- **One agent, one queue.** `harness/work_queue.py` runs one job at a time across every project. Terminal Pi holds `<data>/.agent-lock` and a web job is refused while it is held (task 150). Chat, comment and whole-file requests are all the same kind of job.
- **The project chat is the worker.** A chat message runs Pi with tools in the project folder and resumes the chat's session (`session.jsonl`). Comment and whole-file requests run as one-off Pi requests (task 115).
- **The model runs one request at a time.** `experiments/parallel_inference/run.py` measured Ollama 0.40.3 (MLX runner) on the Mac mini: overlap 0%, **serialized**, 1.03x (task 67). Ollama queues a second request until the first one's generation ends.
- **Gate** checks every command before and after it runs (`gate/`), from the web and from terminal Pi, and records each decision in `gate-events.jsonl`.

## 2. Goal

Each project has two roles:

- **Chat** (the first mate): knows the roadmap, the tasks and the worker's summaries, talks with the person, and can propose that the worker starts on a task. Its tools are reading files and one action, `propose_work` (§ 5). It does not edit the project.
- **Worker**: does the work on one task at a time, with the tools the project chat has today, and reports back.

The person can always watch the worker, jump into Work to comment on, follow or edit the roadmap, tasks and code, or stop it.

Phase 1 (this plan, built after the boards): the chat starts and follows the worker; one model, one-at-a-time. Phase 2 (spec only, § 9): a pool of agents across projects once the model runs requests in parallel.

## 3. Decisions

| # | Decision | Status |
|---|---|---|
| D1 | **Who decides to start the worker.** Gate decides automatically, with rules (§ 6); the chat shows the proposal card with Gate's decision. | **Leaning yes, to discuss** (pros and cons in § 6) |
| D2 | **One-at-a-time model**: the chat gets priority at the worker's next step. The worker finishes its current model call, waits while Pi answers the person, then continues. | Decided 2026-10-14 |
| D3 | **One worker per project at a time**; more work for that project waits in its queue, so two workers never edit the same files. | Decided 2026-10-14 |
| D4 | **The chat agent's context**: the plan context it gets today (task 114), plus the worker's summaries, never the worker's transcript. | Recommended |
| D5 | **Comment and whole-file requests** stay one-off requests, scheduled like worker steps (they edit files). | Recommended |
| D6 | **Model capability** (`parallel`, `one at a time`, `unknown`) is measured per model and stored (§ 7); `unknown` behaves as one at a time. | Recommended |

## 4. Roles and the queue

- Jobs get a `role`: `chat`, `worker`, `comment`, `document` (the last two as today). The queue keeps one FIFO per project for the worker (D3) and one for chat.
- **Parallel model** (§ 7): the chat and one worker per project run at the same time, up to the model's slot count.
- **One-at-a-time model** (D2): one model call at a time. A chat message waits only for the worker's current call, not its whole task:
  - The extension (`harness/extension.mjs`) asks the harness before each worker model call (`POST /api/turn` on the shared port, as Gate calls work today) and waits while a chat request is running.
  - The page says so: the worker card reads "Paused while Pi answers you".
  - Cost: switching between two long contexts makes the model read its prompt again each time (slow on MLX), so the worker gets slower while you chat. The plan accepts that; § 10 lists a measurement to check it.
- The agent lock stays for terminal Pi: a terminal session counts as a worker for its project.

## 5. The chat starts the worker

1. The chat agent calls `propose_work({task: "tasks/059-stuck-detection.md", brief: "…", why: "…"})`. It has no other way to start work.
2. The harness records a **proposal** on the chat (id, task, brief, why, time) and shows a **proposal card** in the transcript.
3. Gate decides (D1, § 6) and the card shows the decision and its reason: "Started by Gate: the task is open, has a Red step and nothing else is running here", or "Waiting for you: the task is blocked" with **Start Anyway** / **Not Now**.
4. Started: a worker job is queued with the task file, the brief and the project context. The card becomes the **worker card**: phase, last step, files touched, Show in Activity, Stop.
5. Finished (completed, failed, stopped, interrupted): the card collapses into a **summary** kept in the chat history: what changed, the files, the task boxes checked, what is left. Pi writes it at the end of the job (an extension hook asks for 5 lines). The chat agent sees these summaries in its context (D4).
6. The person can still ask the chat anything while the worker runs (D2).

## 6. D1: Gate decides automatically — pros, cons, and the middle

**What Gate can check by rule** (no model call): the task file exists and is open; not marked Blocked; no worker running or waiting in this project (D3); the task has a Red step (the repo's process); no unsaved draft or unsent comment in the files the task names; the brief is not empty; the chat proposed fewer than N starts in the last hour (no runaway loop).

**Pros**
- No interruption: orchestration from the chat just flows, including from the phone or when you are away.
- One consistent policy instead of case-by-case clicks; every decision and its reason is logged in Gate's history like command checks.
- You still see every card and can stop the worker at any time.
- Gate's commit protocol (Red → Green before a commit) still guards what the worker writes.

**Cons**
- Gate checks structure, not intent. A small local chat model can misread "what about task 59?" as "start task 59", and the rules would let it through.
- A run starts work you did not want: power, time, and edits to files you may be reading or about to edit.
- Chained starts: the chat could propose the next task as soon as one finishes; the rate rule limits it, but the feeling of control is weaker.
- Trust is built slowly; one bad automatic start costs more than many saved clicks.

**Middle ground (recommended for phase 1)**: Gate decides by rule, and an automatic start waits a short veto window first. The card reads "Starting in 10 s" with **Not Now**. Gate asks you instead of starting when a softer rule fires: the first start in a session, a task that is not the roadmap's next open item, or a file you edited in the last few minutes. A setting turns the veto window off once you trust it. To discuss before building.

## 7. Model capability: measured once, kept, re-measured when it can have changed

- **What is measured**: the two-prompt overlap of `experiments/parallel_inference/run.py`, made short (warm-up, then 64 tokens alone and 2 × 64 at once): about 20–40 s on a 26B model, mostly the warm-up.
- **When**: the first time a model is loaded and no result matches it. A result is keyed by **model digest + Ollama version + `OLLAMA_NUM_PARALLEL`**, so a new Ollama release (a fixed MLX runner) or a new parallel setting triggers a new measurement by itself. It runs only while the queue is idle, never during a request, and the result is `unknown` until then.
- **Why not at every model switch**: the measurement costs a model load with two context slots and half a minute of generation; repeating it when nothing changed only delays the first real request. The key above re-measures exactly when something did change.
- **From the terminal**: `plh model check` (the chosen model), `plh model check --all`, `plh model check --force` (ignore the stored result). Prints the overlap, tok/s and the verdict, and stores it.
- **Stored** in `<data>/model-capabilities.json`: `{digest, ollama, num_parallel, verdict, overlap, checked}` per model.
- **Shown** in the model menu next to "thinks · sees": "parallel" or "one at a time"; "checking…" while it runs. The harness reads it to pick the mode (§ 4).
- Note: the result depends on `OLLAMA_NUM_PARALLEL`, a server setting. With 1 slot every model measures as one at a time. The plan's first task reads the Ollama app's setting (as for the models folder) and says so in the menu note.

## 8. Phases and tasks

1. **Capability check** (§ 7): the short measurement, the store, `plh model check`, the menu note. Independent of the UI work.
2. **Roles in the queue** (§ 4) with one-at-a-time scheduling and the extension's turn hook; nothing new on the page yet beyond the paused line.
3. **Proposal and worker cards** (§ 5) from the boards; Gate's start rules (§ 6, after D1 is decided).
4. **Summaries** in the chat history and in the chat agent's context.
5. **Parallel mode** switched on when the capability says parallel (§ 4), with a browser test that fakes the capability.

Each phase is a task with Red tests first, as usual.

## 9. Phase 2 (spec for later): a pool of agents

- A pool of N agents, N = the model's measured slot count, shared by every project.
- The scheduler hands the next job to a free agent: chat first, then workers in FIFO order per project, at most one worker per project (D3), round robin across projects.
- Memory: each slot reserves its context (KV cache); N slots at full context may not fit. The pool size follows `OLLAMA_NUM_PARALLEL` and the memory the Ollama app reports.
- UI: Activity groups running work by agent; the Agent section shows "2 of 3 agents busy".
- Not before Ollama runs this model family in parallel (task 67, re-run the experiment after an MLX fix).

## 10. Risks and checks

- **Prompt re-reading cost** when alternating chat and worker on one slot: measure tok/s and first-token time with and without a chat interleaved (extend the experiment) before building phase 2.
- **The chat model's judgement**: test `propose_work` with recorded chats in `tests/` (does it propose only when asked?), and keep the rate rule.
- **Two writers**: the worker and the person editing the same file. The existing revision checks (`DocumentConflict`) already refuse silent overwrites; the worker card names the files it touches so the person sees them.
- **Weaker models working on this code**: each phase changes one module and its tests; § 4 names every file touched.
