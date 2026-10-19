# 323: Resolve guardrail uncertainty without asking the person to manage policy

Kind: code

Owner reports Pi asking “How should Pi proceed with this unclassified command?” with “Keep the command blocked” / “Use a checked read-only command”. The owner explicitly wants the guardrail and this behavior fixed, and included in Claude's handoff.

- [x] Reproduce and trace shell_risk in harness/judgements.py through classification, Gate refusal, question creation and retry behavior. Inspect the refused command in privacy-preserving diagnostics before changing policy.
- [x] Red: unit regressions for classifier abstention/unclassified commands producing policy questions; preserve refusals of unsafe commands and explicit approval requirements for concrete restricted actions.
- [x] System 1 handles unknown command safety internally: retain the refusal, supply a specific checked alternative when available, and let the agent continue through permitted tools. Never ask the person to classify safety, select a guardrail policy or override an unknown command. Never interpret “do it” or an automatic recommendation as a policy override.
- [x] If no permitted path exists, give a short actionable explanation; ask only for necessary product intent or an explicitly required approval for a concrete action, with its actual scope. Do not replace one policy question with another.
- [x] Integration tests cover abstention, safe alternative, repeated refusals without question/retry loops, and continued conversation. Safety decisions remain with System 1; the model proposes operations only.
- [x] E2E: a request needing code inspection hits an unclassified shell command, recovers using allowed inspection tools, emits no policy choice card, and continues without blocking the person's conversation; a truly prohibited write remains prohibited.
- [x] Keep machine markers such as [CANARY] out of user-facing chat while preserving internal protocol requirements; verify live and persisted rendering if the supplied example reproduces this leak. (Already done by task 324: stripped server-side; the shell_risk example did not reproduce a leak.)
- [x] Run required suites, report evidence and residual limitations to Claude, then commit through the workflow gate.

No UI is invented by this task. New controls, if found necessary, require design first. Do not broaden the shell allowlist blindly or grant policy exceptions through Laya, the model or Run on its own.

## What was built (2026-10-19)

- Trace: `gate/ledger.py` refused a command in any phase (neither a checked read nor a checked test run) and called
  `Judgements.decide(request,'shell_risk',…)`; when Laya abstained (always, without Laya), `harness/judgements.py`
  stored a system choice ("How should Pi proceed with this unclassified command?") with `choice_pending`. The extension
  asked it, and the pending choice then refused every later write of the request (G-017).
- `shell_risk` has no person rung: Laya's reading is advice for the record; an abstention is recorded as the code decision
  `refused` (rule `judgement.keep_refusal`). No card, no pending choice; an older pending shell_risk
  question no longer blocks writes.
- `gate/alternatives.py`: each refused command says what to use instead, in one short sentence ending "Continue with
  allowed tools.": the project's own checked test command (npm test, node --test, uv run --offline pytest -q,
  python3 -m pytest -q, python3 -m unittest discover -s tests, detected from its files) or the read form (`rg --files`
  instead of `find -exec`, the read tool, `ls`, `cat`, `rg`).
- The same refused command again in a request says "Refused again: the same command." and the extension nudges Pi
  once (the no-action wake-up) with the alternative. Never a question.
- Runner shapes: a trailing `2>&1` and `| tail -n N` / `| head -n N` after a checked test run are dropped (like the
  no-op `cd <project> &&`); nothing else is widened (`uv run pytest` without `--offline` stays refused, with the
  alternative).
- Tests: tests/test_guardrail_questions.py, tests/harness/guardrail-nudge.test.mjs, stories.cjs US-300.
- Live root cause of the latest card (the owner's Habit Tracker, web starter): the starter READMEs said
  `uv run pytest && uv run pyright`, which Gate always refuses; they and kit/cards/e2e-scenarios.md now say
  `uv run --offline pytest`. The project had no .venv (never `uv sync`ed), so pytest could not run at all: without a
  .venv the alternative is `python3 -m unittest discover -s tests` with unittest.TestCase tests, and it says pytest
  isn't installed. Open: where a project's environment is created once (`uv sync` is a download needing the person's
  yes) is the coordinator's decision.
