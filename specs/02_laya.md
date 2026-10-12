# Spec: Laya (The Compliance Layer)

## Overview
Laya is a dual-phase interceptor that ensures the Actor's actions align with the system's policy and risk model. It operates in two distinct phases: **The Gatekeeper** (Pre-Action) and **The Auditor** (Post-Turn).

## Phase 1: The Gatekeeper (Pre-Action)
The Gatekeeper intercepts tool-use requests *before* they are dispatched to the runtime.

### 1.1 Input: The Action Proposal
The Gatekeeper receives an `ActionProposal` derived from:
- The Actor's `tool_use` block.
- The Actor's side-channel fields (`reason`, `evidence`, `authorization`).

### 1.2 Decision Logic
The Gatekeeper compares the proposal against the `judges.md` policy. It uses a hierarchical check:
1. **Existence Check**: Is the tool registered in `tools.md` or `mcp.md`?
2. **Class Check**: What is the tool's risk category (`read_only`, `reversible_write`, `external_side_effect`, `high_risk`)?
3. **Policy Check**: Does the current `Authorization` permit this class/tool?

### 1.3 Outcomes
The Gatekeeper can return one of four outcomes:
- `ALLOW`: The tool call proceeds to the runtime.
- `BLOCK`: The tool call is aborted; an error is returned to the Actor.
- `REVISE`: Returns an `amendment` (e.g., "Change `edit` to `write` for large files").
- `ESCALATE`: The tool call is paused; a PENDING escalation is created in the vault.

## Phase 2: The Auditor (Post-Turn)
The Auditor analyzes the *consequences* of a completed turn.

### 2.1 Input: The Execution Result
The Auditor examines:
- The input `ActionProposal`.
- The resulting `ExecutionResult` (diffs, output, exit codes).
- The Actor's reasoning trace.

### 2.2 Reasoning & Verification
The Auditor verifies:
- **Implementation Integrity**: Did the tool actually do what the actor said it would?
- **Drift Detection**: Did the outcome deviate from the agent's stated intent?
- **Compliance Audit**: Does the agent's reasoning justify the action taken?

### 2.3 Output
The Auditor produces a `JudgmentEvent` which is the definitive record for the audit log.
