# Task 247: completion review and open roadmap questions

This report accompanies the completion commit for task 247. Foundation commits: e85f983, 275f9ef and b05150f.
Read CONSTITUTION.md first; local round 11 design is the specification. No constitution changes were made.

## Delivered behavior

- One persisted phase per project, shared by web and terminal, following stable project IDs on moves and renames.
- Every model write checked against the phase. Unknown folders default to Discussion. Planning permits plan content;
  Implementation requires the unchanged approved active task. Checked shell reads remain available; approved project
  tests are allowed in Implementation. Music output paths and the publication audit have explicit project scope.
- Start Building is the sole explicit plan approval. Ordinary yes messages carry no approval or acceptance authority.
  Plan Another Task returns to Discussion and keeps the plan waiting. Waiting review can select a subset; other tasks
  remain waiting and an empty selection cannot start.
- Every task, including the last, waits for acceptance. Stop Here pauses without acceptance and survives reload.
  Accept Task settles the last task while keeping Implementation; returning to Discussion is the person's choice.
  Person acceptance of unverified work preserves the unverified evidence. Automatic runs stop on unverified work.
- System 1 creates task layouts from structured content, owns roadmap/task boxes, records test evidence and commits.
  The model's task_box calls and checkbox rewrites are refused.
- Discussion has a bounded HTTPS web-search tool. Search results are untrusted content; tests mock the network.
- Round 11 PlanCard/CheckInCard labels, waiting review, phase refusal controls, terminal footer/status and Japanese copy.
- Installation migrates the known earlier paperwork paragraph without erasing custom memory. Old build backups go
  to the Trash instead of permanent deletion.

## How to assess it

Run from the repository root:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 tests/verify_workflow.py
NODE_PATH=<installed-playwright-node_modules> PI_TEST_CHROME=<installed-chromium> python3 tests/browser/run.py all
```

Both commands passed before the completion commit. Tests use scratch projects, fake Pi, disabled Tailscale and a closed
Ollama port. No real benchmark, model download or person's project was used. Browser tests exercise the real approval,
waiting and check-in routes, with synthetic completion evidence; Python lifecycle tests cover actual harness commits.
Phone and desktop waiting-review screenshots were inspected. Existing optional test skips remain optional.

Useful review points: gate/ledger.py and gate/phases.py for permissions; gate/paperwork.py for authority, selected task
persistence and evidence; agent_api.py and harness/web_chat.py for trusted controls; harness/extension.mjs for terminal
and automatic acceptance; js/phases.mjs and js/plan-cards.mjs for the drawn interface.

## Boundary and remaining roadmap

Task 247 has no remaining design question. This is a tool-call policy, not an operating-system sandbox. Approved
project tests execute project code with account permissions. Trusted child processes inherit the Gate token;
malicious subprocess code is outside that boundary. The earlier review records this limitation too.

Keep these separate from task 247:

- 236: its benchmark passing box remains open because the saved scenarios include failures; the person accepted this.
- 243: Show lessons and the ten-second worker-wait settings remain deferred by the person.
- 250: download approval is required for Laya and its multilingual model; no downloads have been performed. Its natural
  language phase/approval classification proposals must be reconciled with Article 8 and explicit-control authority
  before integration. A classifier result alone must not silently replace the person's phase control.
- 249 follows 250, then 248 (rename only the design system). Neither is implemented in this completion.
- 244 uses the 22 saved runs for now. Luna waits for the person to configure the OpenAI key; no new runs were started.
- 245 waits for the person's instruction.

For a manual check, use a scratch project: switch to Planning, propose two tasks, choose Plan Another Task, reopen
Build the Planned Tasks, select one task, and Start Building. After its check-in, Stop Here and reload; it should still
wait. Accept Task should leave Implementation visible; Back to Discussion should reveal the unchecked waiting task.
