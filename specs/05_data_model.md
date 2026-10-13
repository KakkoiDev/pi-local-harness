# Spec: The Data Model (The Protocol Language)

## 1. Action Proposals (`ActionProposal`)
The structured object emitted by an Agent when it wants to perform a side-effectful action.

| Field | Type | Description |
|---|---|---|
| `proposal_id` | UUID | Unique identifier for the proposal. |
| `actor_id` | String | The ID of the agent making the request. |
| `intent` | String | A high-level summary of the purpose. |
| `tool_name` | String | The name of the tool being called.
| `tool_args` | Object | The arguments for the tool. |
| `reasoning` | String | The internal CoT (Chain-of-Thought) justifying the tool call. |
| `evidence` | List[Obj] | References to files, memory, or outputs that support the choice. |
| `authorization` | Object | Proof of permission (e.g., user ID or scope). |
| `classification` | Enum | `read_only` \| `reversible_write` \| `external_side_effect` \| `high_risk`. |

## 2. Judgments (`JudgmentEvent`)
The structured response from the Gate or Auditor.

| Field | Type | Description |
|---|---|---|
| `proposal_id` | UUID | Links the judgment to the original `ActionProposal`. |
| `outcome` | Enum | `ALLOW` \| `BLOCK` \| `REVISE` \| `ESCALATE`. |
| `reason` | String | The textual justification for the decision. |
| `amendment` | Object | (Optional) The modified `tool_args` or `tool_name` if outcome is `REVISE`. |
| `metadata` | Object | Contextual data (e.g., similarity scores, agent status). |

## 3. Audit Entries (`AuditEntry`)
A append-only `audit.jsonl` containing every judgment, tool result, and decision.

| Field | Type | Description |
|---|---|---|
| `timestamp` | ISO8601 | When the turn concluded. |
| `run_id` | UUID | The identifier for the active agent session/task. |
| `proposal` | ActionProposal | The original intent. |
| `judgment` | JudgmentEvent | The official verdict. |
| `execution_result` | Object | The raw output from the tool/environment. |
| `latency_ms` | Integer | Total time from intent to completion. |

## 4. Evaluation Cases (`EvaluationCase`)
The record used for automated regression testing and "Golden Dataset" training.

| Field | Type | Description |
|---|---|---|
| `case_id` | String | Unique name for the scenario. |
| `origin` | Enum | `synthetic` \| `true_event`. |
| `input_state` | Object | The prompt, file state, and memory at the start. |
| `gold_truth` | Object | The "Correct" outcome (Intent, Tool, and Result). |
| `actual_trace` | Object | The recorded audit log from a real run.
