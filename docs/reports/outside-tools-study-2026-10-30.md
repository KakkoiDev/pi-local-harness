# Four outside tools, and what Pi WorkStation should take from them

30 October 2026. A research study for coding agents who work on this repository. It changes no code and installs nothing.
Decisions on it were taken on 4 November 2026; see [Decisions](#decisions).
Local baseline: `a85d392` (`fix: carry authoritative execution facts on every turn (task 368)`).
The tools studied:

| Tool | What was read | Revision |
|---|---|---|
| OpenShell (NVIDIA) | Shallow clone of https://github.com/NVIDIA/OpenShell: README, `docs/about/architecture.mdx`, `docs/how-it-works/policies/*.mdx`, `docs/how-it-works/inference.mdx`, `docs/about/support-matrix.mdx`, the crate list | `3a5dfcd` (2026-10-30) |
| TokenEconomizer (Microsoft) | Local clone `~/TokenEconomizer`: README, `plugin/pi/tokeneconomizer.ts`, `tokeneconomizer/plugin/sidecall.py` | `6141bb9` (2026-10-28) |
| Elephant-Goldfish Model, EGM (Google) | Installed plugin `~/.claude/plugins/marketplaces/egm`: README, `skills/egm-drift-report/SKILL.md`, `docs/harnesses.md`, `agents/` | `5efe341` (2026-10-29) |
| OpenUI (openuidev / thesysdev) | Two earlier scout reports on OpenUI, kept outside this repository (an exploration of OpenUI, called "the OpenUI exploration" below, and an EGM review of a generative-UI design, "the EGM trial"). OpenUI source was not re-read. | as cited in those reports |

Effort scale: **S** is under a day of agent work, **M** is one to three days, **L** is more than three days.
"Verified" means a command was run and its output is quoted under [Evidence](#evidence).
"Read" means the claim comes from reading the source only.

## Summary

None of the four tools should be installed into Pi WorkStation now. Three of them have ideas worth taking, and EGM is
also useful as it is for the harness's own design work. The most valuable result of this study is a security gap that
came out of the OpenShell comparison. It does not depend on adopting OpenShell.

| Tool | Verdict | Most valuable action | Effort | Risk |
|---|---|---|---|---|
| OpenShell | **Adapt ideas. Do not install.** | Sandbox the Preview's app run like test runs already are, and hide secret files from Pi's reads (F1-F3) | S to M | Low to medium |
| TokenEconomizer | **Adapt ideas. Do not install.** | Learn a per-project normal turn length for stuck detection (task 59). Turn repeated failures into confirmed, readable facts (task 26). | M | Medium |
| EGM | **Use for the harness's own plans and docs. Adapt one idea into the product.** | Run `egm-drift-report` on the docs and `egm-review` on large `docs/plans/`. Try a fresh-context plan check before Start Building, as an experiment. | S (use), M to L (adapt) | Low (use), medium (adapt) |
| OpenUI | **Ignore as a dependency. Adapt one idea.** | Size App Block cards and context to the model's window, with a compact card index | M | Low |

**Rules every recommendation here follows.** A change that breaks one of these is not acceptable:

- `CONSTITUTION.md:24-26` (Article 1): "The language model is used for generation, never for judgement." This rules
  out TokenEconomizer's judge model. It also limits a goldfish reviewer inside the product: it may raise questions,
  and only the person may decide.
- `CONSTITUTION.md:42`: "When System 1 cannot decide with confidence, it asks the person, never the model."
- `docs/contributing-for-agents.md` § 5, rule 5: "No new dependencies (Python packages, npm packages at runtime, CDNs)."
- `docs/contributing-for-agents.md` § 5, rule 9: UI changes go through the designer.
- `docs/contributing-for-agents.md` § 4: task file, scenarios, Red, Green, and `python3 tests/verify_workflow.py`.

## Verified findings in Pi WorkStation

The findings below are facts about the repository, checked by running commands. They came out of the comparison with
OpenShell. Fixing them does not need OpenShell.

### F1. The Preview runs Pi's app code outside the sandbox, with the person's environment

- **Where:** `harness/preview.py:254` builds the app's environment by removing only `PI_*` and `VIRTUAL_ENV`:
  `env = {key: value for key, value in os.environ.items() if not key.startswith(('PI_', 'VIRTUAL_ENV'))}`.
  Then `harness/preview.py:260` starts the app with `subprocess.Popen(command, cwd=folder, env=env, ...)`. Nothing
  wraps it in `gate/sandbox.py`.
- **Comparison:** test runs of the same project code are sandboxed. `gate/ledger.py:323-326` wraps them, and
  `gate/sandbox-run.sh` keeps an allow-list of variables (`env -i PATH HOME TMPDIR` plus toolchain variables).
  `harness/project_start.py:97-98` and `harness/audit.py:127-128` sandbox the starter check and the publication audit
  as well. The Preview is the one path where the model's code runs with no confinement.
- **Effect:** code that Pi wrote runs as the person, with no limit on files or network. It inherits every secret in
  the person's shell environment (for example `OPENAI_API_KEY` or `GITHUB_TOKEN`, if those are set).
- **OpenShell's matching principle:** "Agents never see real credentials" (architecture doc), and the supervisor holds
  the only path out.
- **Status:** read, not run end to end. Starting a Preview needs a running workbench.

### F2. Sandboxed test runs can read secrets that are not on the deny list

- **Where:** `gate/sandbox.py:90` starts the profile with `(allow default)`. Reads are then denied only for
  `SECRET_FOLDERS` (`gate/sandbox.py:35`: `.ssh`, `.aws`, `.gnupg`, `.config/gh`, `.netrc`, `.git-credentials`, `.pi`,
  `.docker`, `Library/Keychains`) and for the data folder.
- **Verified:** I ran a probe through the real `gate/sandbox.py` profile and `gate/sandbox-run.sh` on this Mac
  ([Evidence E1](#e1-sandbox-read-probe)). It printed only whether each file was readable, never the contents.
  - Readable inside the sandbox: `~/.npmrc` (often holds registry tokens), `~/.zsh_history`, `~/.claude.json`, the
    Chrome profile's `Cookies` database, and `~/.tokeneconomizer`.
  - Denied as intended: `~/.ssh/config`.
- **Effect:** with network `none` (the default), a test can still copy such a file into the project folder, which is
  writable. From there it reaches Pi's context and the harness's git commit. After the person widens a project to
  `internet`, a test can send it out directly.
- **OpenShell's matching principle:** the default policy allows reads of system paths only, from a list
  (`docs/how-it-works/policies/default-policy.mdx`: read-only `/bin`, `/usr`, `/lib`, `/proc`, `/etc`, ...). It does
  not allow everything except a few known places.

### F3. Gate lets Pi read any file in every phase, including private keys

- **Where:** `gate/phases.py:134`: `if tool == 'read_file' and pi_tool != 'propose_plan': return None`. A read is
  allowed whatever the path. For shell commands, `gate/phase_shell.read_only` accepts `cat ~/<.ssh private key>`,
  `cat ~/.npmrc` and `head ~/.zsh_history` as checked reads ([Evidence E2](#e2-gate-read-classification)).
  `gate/engine.py:24-42` has no rule for protected paths.
- **Effect:** the contents go into the model's context. With a local Ollama model, they stay on the Mac, but they reach
  every path the context leaves by:
  - `web_search` in Discussion sends a query of up to 500 characters to Bing (`harness/web_search.py:13-14`).
  - The headless Chrome used by the `browser` tool loads only localhost pages (`harness/browser.mjs:144`). The project
    app it renders can still fetch outside hosts, because Chrome is started with no network limit
    (`harness/browser.mjs:64`).
  - The online providers (ChatGPT Luna in the bench, Colibri) receive the context too.
  - Activity records and chats in the data folder keep it.
- **Not proven:** I have not shown an exploit that chains these steps. The ingredients exist: untrusted text from web
  results, private files readable by the model, and ways out.
- **The project already says:** `AGENT.md` states "folder context is not a sandbox". This finding means Gate could
  close part of that gap at low cost.

### F4. The docs contradict each other on the default model

- **Verified:** `harness/model.json` is `{"provider": "ollama", "model": "gpt-oss:20b"}`.
  - `docs/reference.md:170` and `harness/README.md:46` say the default is `ollama/gemma4:26b-mlx`.
  - `docs/reference.md:353`, `harness/README.md:211` and `harness/GUIDE.md:312` say GPT-OSS 20B.
  - `AGENT.md` asks agents to "Keep README instructions aligned with actual behavior". `tests/verify_workflow.py` did
    not catch this contradiction.
- This is the kind of drift EGM's drift report is built to find (see [EGM](#3-egm-elephant-goldfish-model)).

## 1. OpenShell

### What it is

- OpenShell is a runtime that confines AI agents ("the safe, private runtime for fleets of autonomous AI agents"). It
  is written in Rust, licensed Apache-2.0, and has about 20.7k stars (`gh-axi repo view`).
- A **gateway** is the control plane. Each sandbox has a trusted **supervisor** and an untrusted **workload**.
  - On Linux, Landlock confines files, and seccomp user notification holds every TCP connect and DNS lookup.
  - The supervisor's channel is the workload's only way out. The supervisor checks each request against a YAML
    policy and adds credentials only for allowed endpoints (`docs/about/architecture.mdx`).
- Policies have five sections: `filesystem_policy`, `landlock`, `process`, `network_policies` and
  `network_middlewares`. Network rules are scoped per binary and can restrict HTTP method and path.
- **Prover:** an SMT-based check, either "candidate policy within a boundary policy" or "does this proposed rule add
  risky reach" (`policies/prover.mdx`).
- **Advisor:** when a request is denied, the agent gets instructions and an API (`http://policy.local`) for proposing
  a narrow rule. A person approves it. OpenShell can also draft proposals itself from blocked connections
  (`policies/advisor.mdx`).
- **On macOS:** it runs in Docker Desktop's Linux VM or in a libkrun MicroVM (`docs/about/support-matrix.mdx:56,134,196`).
  Anonymous telemetry is on by default and can be turned off (README, Telemetry).

### Should Pi WorkStation use it?

**Not now.** Each reason was checked against this repository:

1. **Too heavy for the audience.** The README targets "people who are learning to build things" on a Mac. OpenShell
   needs Docker Desktop or host virtualization, a gateway, and a sandbox image. Projects are ordinary folders that
   live anywhere (`docs/reference.md`, Projects). They would have to be mounted into a VM.
   - The Preview, the phone (`tailscale serve`) and the host Ollama at 127.0.0.1:11434 would each need a policy and a
     port forward.
2. **Against the dependency rule.** Rule 5 forbids new runtime dependencies. OpenShell is a separate daemon and CLI.
3. **It solves a different problem.** OpenShell confines a whole agent. Here Gate already decides every tool call
   before it runs (`docs/reference.md`, "The model proposes. Gate checks. Pi executes."). The missing parts are
   narrower (F1 to F3), and the existing Seatbelt layer can cover them.
4. **When to revisit:** if WorkStation gains a Linux or shared-server mode (README: "Linux and Windows are planned").
   OpenShell's Linux design (Landlock and seccomp, no setuid helper) is an alternative to the bubblewrap plan in the
   `gate/sandbox.py:16-19` docstring. That is a design note for the Linux port, not work for now.

### Ideas to adapt

| ID | Idea (OpenShell source) | Where it lands | Effort | Risk |
|---|---|---|---|---|
| OS-1 | One boundary for all model-written code (architecture: the supervisor is the only way out) | `harness/preview.py:254-260`: run the Preview through `gate/sandbox.argv`, like `harness/project_start.py:97-98` | S (step a), M (b, c) | Medium (step c only) |
| OS-2 | Credentials never visible to agents | Same place: the Preview's environment uses `gate/sandbox-run.sh`'s allow-list | S | Low |
| OS-3 | Reads allowed from a list, not denied from a list (default policy) | A new Gate rule for protected reads, in `gate/rules.py`, `gate/phases.py:134` and `gate/phase_shell.py`. A wider `SECRET_FOLDERS` at `gate/sandbox.py:35`. | S to M | Low |
| OS-4 | The prover's boundary check | Property tests over `gate/sandbox.profile()` in `tests/test_sandbox.py` (below) | S | Low |
| OS-5 | The advisor: a refusal turns into a narrow, reviewable proposal | `gate/sandbox.py:153-160` (`refusal`) and the Test Sandbox panel | L | Medium |

**OS-1 and OS-2: sandbox the Preview (fixes F1).** Ship this in three steps, so each one can be undone on its own:

1. **(a) Environment.** Build the Preview's environment from `sandbox-run.sh`'s allow-list, plus `APP_LANG` and the
   Tailwind variables the Preview sets (`harness/preview.py:257`). This changes nothing that a working app depends
   on, unless the app reads a secret from the person's shell, which it should not.
2. **(b) Files.** Wrap the command with `sandbox.argv(command, folder, data, 'internet')`. Writes then stay inside the
   project, TMPDIR and the caches, and never reach `.git`. Secret folders cannot be read. The network does not change.
   - Check first: `uv sync` writes `.venv` inside the project (allowed), the Tailwind binary lives in
     `<data>/toolchain` (allowed by `gate/sandbox.py:89,105`), and uvicorn's reloader spawns child processes (Seatbelt
     applies to children).
3. **(c) Network.** Use the project's own widening (`sandbox.widened`) instead of always `internet`. This could break
   apps that call outside APIs, so the Preview needs the same refusal notice that test runs have
   (`gate/sandbox.py:153-160`).

- **Red tests for each step:**
  - A fixture app that prints `os.environ` keys shows no `GITHUB_TOKEN`.
  - A fixture app that writes `../outside.txt` fails.
  - A fixture app that reads `~/.ssh` fails.
- **Scenario:** `US-new the Preview of an app cannot read my secrets` in `tests/browser/stories.cjs`.

**OS-3: hide secret files from Pi's reads (fixes F2 and F3).**

1. Make `SECRET_FOLDERS` the single list and add to it at least `.npmrc`, `.pypirc`, `.yarnrc.yml`, `.zsh_history`,
   `.bash_history`, `.claude.json`, `.claude`, `.codex`, `.kube`, `.azure`, `.config/gcloud`, `.tokeneconomizer`,
   `Library/Application Support/Google/Chrome`, `Library/Application Support/Firefox` and `Library/Cookies`.
2. Add a Gate rule (next free G-number) that refuses `read_file`, and the checked-read shell commands in
   `gate/phase_shell.py`, when the resolved path falls under one of those folders. The refusal says what to do
   instead, as every Gate rule does: "Ask the person to paste the value you need."
3. Give the rule a test that names its id (`docs/contributing-for-agents.md` § 4).

- **Limit:** a deny list is never complete. Allowing reads only from a list, as OpenShell does, is not workable for
  test runs on macOS, because toolchains read from everywhere. For `read_file` outside the project, though, a
  "project plus a small allowed list" policy is workable. It is a stricter option for later.

**OS-4: boundary property tests.** Without an SMT solver, these properties can be checked over every network setting
and both data-folder layouts:

- No profile from `profile()` allows a write under `<project>/.git` or under the data folder (except `toolchain`).
- No profile allows a read of any `SECRET_FOLDERS` entry.
- Only `internet` emits `(allow network*)`.

`tests/test_sandbox.py:49-85` covers some of these by behaviour today. A test over the profile text catches a
regression without running Seatbelt.

**OS-5: the advisor pattern, deferred.** Seatbelt filters network access by IP and port only. It cannot filter by
hostname. A rule such as "this project may reach api.example.com" would need a local egress proxy, similar to
`harness/tool_repair_proxy.py`. Today the person can choose only `none`, `local` or `internet`
(`gate/sandbox.py`, `NETWORK`). Plan this only if people find `internet` too coarse.

## 2. TokenEconomizer

### What it is

- A plugin that "makes coding agents cheaper to run in the repositories you work in often, without changing the
  agent itself." It runs on Claude Code, Codex, Copilot CLI and Pi, with opencode experimental (README). Firstmate
  loads it into the Claude workers that work on this repository (with `TE_TOOLPRUNE=off`).
- It has three mechanisms:
  - **Micro-skills:** facts about the repository. A fact is stated at session start once three sessions confirm it,
    and dropped when later sessions contradict it. Facts come from repeated failures, and also from a model that
    proposes facts every k=3 sessions. The `envfacts` mode uses repeated failures only and makes no model calls.
  - **Tool pruning:** tools that go unused are left out.
  - **Loop guard:** it first learns how long a normal turn is in this repository (e=5 turns that ended well). A
    judge model then checks turns that look stuck, with confidence at least c=0.7. A turn running past b=2.5 times
    its usual length while making the same edits and hitting the same failures is redirected without the judge. It
    redirects at most once per turn, then only tells the person. It never stops a turn itself.

### Should Pi WorkStation use it?

**No.** Four blockers, each checked:

1. **Pi version.** TokenEconomizer supports Pi 1.2.0 to 1.3.0, and 0.99.x by extension path (README, Supported
   versions). Pi WorkStation's journey test runs "the real Pi 1.1.0" (`docs/contributing-for-agents.md` § 3). On this
   Mac, `pi --version` prints `0.87.1`. Neither version is in the supported range.
2. **It breaks the local-model guarantees.** Its side calls run `pi --print --mode json` "on the person's own default
   provider and model" (`tokeneconomizer/plugin/sidecall.py:24-27`, `pi_call` at `:187-205`).
   - Pi WorkStation picks its own model (`harness/model.json`, `<data>/model.json`) and sends it through the
     tool-repair proxy (`docs/reference.md`, Tool-call repair).
   - A side call outside that path could ask Ollama for a second model, which unloads the person's model ("switching
     unloads the previous model so only one stays in memory", `docs/reference.md`). It could also reach whatever cloud
     login plain Pi has.
   - It would also skip the shared agent lock taken in `harness/extension.mjs:281`.
3. **Constitution, Article 1.** The loop guard's judge is a model deciding whether a turn is stuck. Article 1 forbids
   that (`CONSTITUTION.md:26`: the model does not decide "what comes next").
4. **No gain where it targets.**
   - Its savings are counted in billed tokens. A local model bills nothing.
   - Tool pruning does nothing on Pi (README: "Pi | nothing (Pi loads only four tools)").
   - Pi WorkStation already picks harness tools per request: `harness/tool-choice.mjs:8-10`, applied through
     `pi.setActiveTools` at `harness/extension.mjs:345-347`.

### Ideas to adapt

What a local model pays for is latency and room in its context window, not money. The ideas below are worth
adapting for that reason.

| ID | Idea (TokenEconomizer source) | Where it lands | Effort | Risk |
|---|---|---|---|---|
| TE-1 | The loop guard learns a normal turn length per repository, and redirects a churning turn without a judge | `harness/stuck.mjs:10-19` (fixed thresholds today), `harness/extension.mjs:91`, open task `tasks/59-stuck-detection.md` | M | Medium |
| TE-2 | Micro-skills `envfacts`: facts from repeated failures, confirmed three times, dropped when contradicted | `harness/learning.py:86-131` (Curator), `harness/learning.py:145-151` (`context()`), open task `tasks/26-verified-memory.md` | M | Medium; **needed decision D1 (taken: B)** |
| TE-3 | Redirect once, then tell the person; never stop a turn yourself | Already matches `harness/extension.mjs:145` (`wake_ups`, default 5) and `:433` (stop and offer Retry) | none | none |
| TE-4 | Count cost the way it is actually paid | Add prompt tokens and time to first token per turn to activity records, and to the bench table in the README | S to M | Low |

**TE-1: learn what a normal turn looks like.**

- **Today:** `harness/stuck.mjs` flags fixed patterns:
  - the same call with the same result 4 times;
  - the same call failing 3 times in a row;
  - two calls alternating 6 times.

  `harness/extension.mjs:272` catches thoughts that repeat.
- **What TokenEconomizer adds:**
  - It learns a normal length per repository, from turns that "ended well, on their own and with no failing check
    after the last edit".
  - It has a "backstop" for turns far over that length that keep editing the same files and hitting the same
    failures.
- **What to build:** all of it in code, with no judge:
  1. Take the per-project median number of tool calls in requests that the harness verified and committed. The
     activity records (`<data>/activity/`) and Gate's test-run records already hold this.
  2. Define churn as edits to the same `Files:` entries while the same failing-test signature repeats. Gate already
     sees both (`gate/test_runs.py`, `gate/ledger.py`).
- **Red tests:**
  - A synthetic step log at 3 times the median that churns triggers a wake-up with a nudge.
  - A long log that keeps making progress does not.
- **Risk:** a false trigger uses up one of the 5 wake-ups.
- **Task 59 overlap:** task 59 plans "5 consecutive Gate refusals". TE-1 is a separate signal. Keep both.

**TE-2: confirmed, readable facts for each project.**

- **Today:** `harness/learning.py` (task 343) already has most of the mechanics: occurrence counts, `verified`,
  `contradicted` and `stale` states, a 30-day TTL, and the person's reject and restore.
- **What is missing:** a fact that Pi can act on.
  - The Curator stores only SHA-256 digests (`learning.py:24-26`), by design: "no prompts, output, file bodies or
    command arguments are stored" (`learning.py:1-5`).
  - `context()` is "Deliberately not injected into every request" (`learning.py:148`).
  - So the model never sees something like "in this project, tests run with `uv run --offline pytest`". This is the
    first fact TokenEconomizer's README gives as an example.
- **A design that keeps the privacy line:**
  - Build facts only from words that System 1 already classifies, never from model text or raw arguments. The test
    runner's form comes from `gate/phase_shell.test_run`, the failing kind from `gate/ledger.py`.
  - State a fact after it has been confirmed in 3 separate requests. Mark it `contradicted` on the first opposite
    result, as `learning.py:128-130` already does.
  - The facts join the request context in `harness/context.py`, with a small budget.
- This changes the privacy stance agreed in task 343, so it is decision **D1** below.

## 3. EGM (Elephant-Goldfish Model)

### What it is

- A design-review plugin ("Design with an elephant. Review with a goldfish").
- The "elephant", which knows the project, drafts the design (`egm-brainstorm`, `egm-draft`).
- "Goldfish" reviewers, which start with no context, review the document and the sources it cites (`egm-review`, in
  five stages with nine personas in `agents/`).
- `egm-drift-report` lists where code has drifted from its design docs or READMEs
  (`skills/egm-drift-report/SKILL.md`).
- A goldfish review needs a fresh subagent context. "If a harness has no subagent tool, the review skills stop"
  (`docs/harnesses.md:75-78`).

### Should Pi WorkStation use it?

- **Inside Pi (the product): no.** Pi has no subagent tool, so the EGM skills stop.
  - The amount of feedback also suits an engineer, not a learner. One earlier EGM run on a single design (the EGM trial) produced
    5 blockers, 39 major findings and 52 nits over five stages.
  - At least one of those findings was false: "Stage 9 M5 said `.env.example` was absent. It exists" (the EGM trial).
- **For the harness's own development: yes.** The people working on this repository are coding agents in Claude Code
  or Codex, and those can run EGM.

| ID | Use or idea | Where it lands | Effort | Risk |
|---|---|---|---|---|
| EGM-1 | Run `egm-drift-report` on `docs/` and `harness/*.md` against the code. The first run would find F4. | A step in `docs/contributing-for-agents.md` § 4 for `docs` tasks, or a recurring chore task | S per run | Low; check each finding by hand |
| EGM-2 | Run `egm-review` on large plans before their first task, then `egm-resolve` with the owner | Open plans in `docs/plans/`: 151, 152, 156, 357. Add an optional step for `Kind: planning` in § 4. | S to M per plan | Low. Costly in subagents. Findings must be checked (one in the earlier run was false). |
| EGM-3 | **Adapt:** a fresh-context "goldfish" pass over Pi's own plan before Start Building | See below | M to L | Medium |

**Where EGM-1 and EGM-2 can run.** The agent workers that change this repository may not fan out subagents. So EGM
reviews need the owner's own session, or a work brief that explicitly allows a single review run. This is a process
choice, not a code change.

**EGM-3: a goldfish check of Pi's plan.**

- **What exists:**
  - A plan reaches the person through `propose_plan` (`harness/planning.mjs:8`) and the plan card.
  - The harness can already run "one-off Pi requests with their own context" (`docs/reference.md`, Projects,
    documents, and chat).
- **The experiment:**
  1. After `propose_plan`, start one fresh request that gets only `ROADMAP.md`, the new `tasks/*.md` and the
     person's quoted request.
  2. Ask it for at most three questions about what the plan assumes or leaves out.
  3. Each question becomes an ordinary choice card (`ask_choices`), with a recommendation, as Article 3 requires.
- **Constitution check:** the reviewer produces questions (generation). It never approves, blocks or changes the
  plan. The person answers. Under Run on its own, the recommended option is taken and recorded as automatic, as with
  every other card.
- **Cost:** one more full model pass on a 20B to 26B local model, which takes minutes. Measure it with the bench
  (`bench/`, open tasks 244 and 300) before it is turned on by default. Ship it behind a setting that is off by
  default.

## 4. OpenUI

### What it is

- The model writes **OpenUI Lang**, a compact DSL of `name = Component(args)` lines, limited to a component library
  that the host registers.
- The system prompt is generated from that library: signatures, examples and rules.
- A streaming parser feeds a React renderer.
- Safety rests on the component allowlist. There is no iframe.

(Source: the OpenUI exploration, § 1 and § 2.3.)

### Should Pi WorkStation use it?

**No.** Each reason is checked against this repository:

- The workbench is plain HTML, CSS and ES modules served by a standard-library Python server
  (`docs/contributing-for-agents.md` § 1). The apps Pi builds are Python, FastAPI and htmx, or apps with no server
  (README). OpenUI's runtime is React.
- Rule 5 (no new dependencies).
- Rule 9: the workbench UI is the designer's 1-bit system (`design/`). UI that the model generates inside the
  workbench would go around the designer.
- The product promise is "plain, editable code in your project" (README). Apps that need a DSL renderer to run would
  lock people in.
- Known issues in OpenUI's packages:
  - `lang-core` sends an install event to PostHog from its postinstall script.
  - `react-ui` has an `@OpenUrl` handler that passes `javascript:` URLs to `window.open`
    (the OpenUI exploration, § 2.4).

**Checked here: the workbench does not have the OpenUI URL problem.** Pi's Markdown links accept only
`https?://` (`js/message-markdown.mjs:15`, the `INLINE` regex, then `:111`). The Preview's "Open in New Window" passes
`'noopener'` (`js/preview.mjs:145`). No change is needed.

### Idea to adapt

| ID | Idea (OpenUI source) | Where it lands | Effort | Risk |
|---|---|---|---|---|
| OUI-1 | Generate a compact library prompt (signatures, then examples) from the component specs, so the model sees the whole menu cheaply | `harness/blocks.mjs:10-11` (`MAX_CARDS = 2`, `BUDGET = 14000` chars), `harness/context.py:13` (`BUDGET = 16000` chars, "about 4k tokens of a 32k window"), `kit/blocks/build.py` | M | Low |

**OUI-1: size cards and context to the model's window.**

- **The problem:** both budgets are fixed numbers of characters, set for a 32k window.
  - The parallel server serves 8K-token slots (`harness/parallel_server.py:16`, `CONTEXT = 8192`). It passes that
    window to Pi (`harness/extension.mjs:252`, `PI_HARNESS_CONTEXT_WINDOW`).
  - At about 4 characters per token, the full card budget (about 3.5k tokens) plus the full context budget (about 4k
    tokens) already exceed 8K. That is before the system prompt, the Gate-rule summary and the tool schemas count.
- **What happens today:** the harness recovers after the model runs out of room, by shortening the chosen context
  (`harness/extension.mjs:287`, task 367). It does not budget beforehand.
- **What to build:**
  1. Derive both budgets from `PI_HARNESS_CONTEXT_WINDOW`.
  2. When the window is small, send a compact index of the matching cards, in the OpenUI style: name, a signature
     line and one example line per card. `kit/blocks/build.py` can generate it from `design/app-blocks`.
  3. Let Pi load a full card on demand with the existing `app_block` tool (`harness/blocks.mjs:107`).
- **Red test:** with `PI_HARNESS_CONTEXT_WINDOW=8192`, the system prompt plus the chosen context for a request that
  matches two cards stays under a set share of the window.
- **Not verified:** that 8K serving actually overflows in practice. The token figures are estimates from character
  counts, not measured.

## Ranked list of changes worth shipping

Each change follows `docs/contributing-for-agents.md` § 4: a task file, scenarios, Red, Green, and the workflow check.

| Rank | Change | From | Effort | Why this rank |
|---|---|---|---|---|
| 1 | Preview environment allow-list (OS-2, OS-1 step a) | F1 | S | Stops secrets in the shell environment from reaching code Pi wrote. Nothing working depends on them. |
| 2 | Gate rule for protected reads, plus a wider `SECRET_FOLDERS` (OS-3) | F2, F3 | S to M | Closes the clearest gap, with one registry entry and its test |
| 3 | Fix the default-model contradiction in `docs/reference.md:170` and `harness/README.md:46` | F4 | S | A verified error in the docs |
| 4 | Preview file sandbox (OS-1 step b) | F1 | M | Makes the Preview obey the same boundary as test runs |
| 5 | Profile property tests (OS-4) | OpenShell prover | S | Cheap protection against regressions for ranks 2 and 4 |
| 6 | Context and card budgets sized to the window, with a compact card index (OUI-1) | OpenUI | M | Matters once `parallel_server` is used |
| 7 | Normal-length stuck detection (TE-1), with task 59 | TokenEconomizer | M | Saves wake-ups and time on long local runs |
| 8 | Readable facts confirmed three times (TE-2), with task 26 | TokenEconomizer | M | Waits on decision D1 |
| 9 | Preview network follows the project's widening (OS-1 step c) | F1 | M | Can break apps that call outside APIs. Ship after rank 4, with the refusal notice. |
| 10 | EGM drift report and plan reviews (EGM-1, EGM-2) | EGM | S per run | A process change. It needs a session that may fan out. |
| 11 | Goldfish plan-check experiment (EGM-3) | EGM | M to L | Off by default. Bench it before turning it on. |

## Decisions

**Taken 4 November 2026:** D1 = **B**. D2 = ranks 1 to 5, shipped as one security and docs batch (tasks 372 to
376). Ranks 6 to 11 come later, one at a time. D1 is recorded here only: rank 8 (TE-2) is not built yet.

The questions as they were asked:


- **D1. Should the learning store keep readable facts?** Task 343 chose to store digests only. TE-2 would add short
  facts built only from System 1's own words (for example "tests run with `uv run --offline pytest`"), stored in the
  data folder and shown to Pi.
  - A: keep digests only, and drop TE-2.
  - B: allow facts built from words System 1 already classifies, never model text or raw arguments. **(Recommended)**
  - C: also allow the model to propose facts, as TokenEconomizer's full mode does. Not recommended: it conflicts with
    Article 1, and it makes calls to a local model.
- **D2. Which changes in the ranked list should ship?** Recommended: ranks 1 to 5 as one security
  and docs batch, and the rest one at a time.

## What was not done

- Nothing was installed. OpenShell was not installed or run, TokenEconomizer was not loaded into Pi, and EGM was not
  run on this repository. The OpenShell clone was only read.
- F1 was found by reading the code. No Preview was started.
- The F3 exfiltration chain is a hypothesis. Its parts were checked one by one, not end to end.
- OUI-1's token figures are estimates from character counts, not measured.
- I did not run this repository's test suite. No code changed, so there was nothing to test.
- OpenUI's source was not re-read. Its section relies on the two earlier scout reports.

## Evidence

### E1. Sandbox read probe

The profile was built by the repository's own code, with a scratch project and data folder:

```sh
python3 - <proj> <data> <<'EOF'
import sys; sys.path.insert(0,'.')
from gate import sandbox
print(sandbox.wrap('<probe loop>', sys.argv[1], sys.argv[2]))
EOF
/bin/sh gate/sandbox-run.sh <data>/sandbox/72e7ccaee3102db719068d21.sb <tmp> '<probe loop>'
```

For each file, the probe printed `READABLE` if `cat` or `ls` succeeded inside the sandbox. It discarded the output, so
no contents were read into the transcript. Output:

```text
absent-or-hidden .ssh/config        # exists on the host: denied as designed
absent-or-hidden .aws/config        # absent on the host
READABLE .npmrc
READABLE .zsh_history
absent-or-hidden .kube/config       # absent on the host
absent-or-hidden .config/gcloud     # absent on the host
READABLE .claude.json
READABLE Library/Application Support/Google/Chrome/Default/Cookies
READABLE .tokeneconomizer
exit=0
```

### E2. Gate read classification

```sh
python3 -c "from gate.phase_shell import read_only; ..."   # the path strings were built in pieces
cat ~/<.npmrc>                    True
cat ~/<.ssh private key>          True
cat ~/<.zsh_history>              True
```

`gate/phases.py:134` lets `read_file` through in every phase without looking at the path.

### E3. Other commands

```sh
git rev-parse --short HEAD                                    # a85d392
cat harness/model.json                                        # {"provider": "ollama", "model": "gpt-oss:20b"}
grep -n "default model|gemma4:26b|GPT-OSS 20B" docs/reference.md harness/README.md harness/GUIDE.md
pi --version                                                  # 0.87.1
python3 -c "import json; d=json.load(open('kit/blocks/index.json')); ..."   # count 151: matches the README's "151 App Blocks"
grep -n "href" js/message-markdown.mjs                        # links limited to https?://
gh-axi repo view NVIDIA/OpenShell                             # 20712 stars, Rust
git clone --depth 1 https://github.com/NVIDIA/OpenShell.git   # into the session scratchpad; read only
```
