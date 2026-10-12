# Spec: The Actor (The Workhorse)

## Overview
The Actor is the LLM-driven core of the system. Its primary responsibility is to parse user instructions and execute them through the available toolset.

## Core Responsability
1. **Task Decoupling**: Breaking down user instructions into logical execution steps.
2. **Tool-Use**: Calling tools provided by the MCP server or local registry.
3. **Reasoning Trace Generation**: Providing a high-quality, step-by-step provenance for every decision made (the `reasoning` field).

## Execution Protocol

### 1. The Proposal Phase
The Actor does not execute a tool directly. Instead, it prepares an `ActionProposal` which is passed to the **Laya Gatekeeper**.

### 2. The Input Format
The Actor receives a `Context` containing:
- Current instruction/goal.
- Recent conversation history.
- Relevant documentation (from `AGENT.md`).
- Current `Authorization` (as provided by the coordinator).

### 3. The Output Format
The Actor must emit a structured tool-call block. In the context of the Laya framework, this tool block is intercepted to extract the actor-supplied side-channels:
- `reason`: The "why" behind the tool call.
- `evidence`: The "what" that supports the decision.
- `authorization`: A pointer to the permission level being used.

## Failure Modes
- **Hallucination**: Proposing tools that do not exist or using incorrect arguments.
- **Drift**: Losing track of the original user goal during long-running tasks.
- **Looping**: Entering a repetitive reasoning loop (mitigated by the **Sentinel**).
