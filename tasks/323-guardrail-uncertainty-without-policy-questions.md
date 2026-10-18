# 323: Resolve guardrail uncertainty without asking the person to manage policy

Kind: code

Owner reports Pi asking “How should Pi proceed with this unclassified command?” with “Keep the command blocked” / “Use a checked read-only command”. The owner explicitly wants the guardrail and this behavior fixed, and included in Claude's handoff.

- [ ] Reproduce and trace shell_risk in harness/judgements.py through classification, Gate refusal, question creation and retry behavior. Inspect the refused command in privacy-preserving diagnostics before changing policy.
- [ ] Red: unit regressions for classifier abstention/unclassified commands producing policy questions; preserve refusals of unsafe commands and explicit approval requirements for concrete restricted actions.
- [ ] System 1 handles unknown command safety internally: retain the refusal, supply a specific checked alternative when available, and let the agent continue through permitted tools. Never ask the person to classify safety, select a guardrail policy or override an unknown command. Never interpret “do it” or an automatic recommendation as a policy override.
- [ ] If no permitted path exists, give a short actionable explanation; ask only for necessary product intent or an explicitly required approval for a concrete action, with its actual scope. Do not replace one policy question with another.
- [ ] Integration tests cover abstention, safe alternative, repeated refusals without question/retry loops, and continued conversation. Safety decisions remain with System 1; the model proposes operations only.
- [ ] E2E: a request needing code inspection hits an unclassified shell command, recovers using allowed inspection tools, emits no policy choice card, and continues without blocking the person's conversation; a truly prohibited write remains prohibited.
- [ ] Keep machine markers such as [CANARY] out of user-facing chat while preserving internal protocol requirements; verify live and persisted rendering if the supplied example reproduces this leak.
- [ ] Run required suites, report evidence and residual limitations to Claude, then commit through the workflow gate.

No UI is invented by this task. New controls, if found necessary, require design first. Do not broaden the shell allowlist blindly or grant policy exceptions through Laya, the model or Run on its own.
