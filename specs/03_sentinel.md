# Spec: The Sentinel (The Reliability Layer)

## Overview
The Sentinel is a high-integrity, continuous background monitor designed to detect failures in agentic stability, specifically focusing on **Reasoning Loops** and **Process Stalls**.

## 1. The Loop Detector
The Sentinel monitors the `session.log` in real-time to detect repetitive, non-productive cycles.

### 1.1 Detection Logic
- **Semantic Similarity**: The Sentinel calculates the similarity (using a `similarity_ratio`) between the most recent $N$ reasoning blocks.
- **Threshold**: If the cumulative similarity exceeds the `LOOP_THRESHOLD` (Default: $0.85$), a loop is identified.
- **Validation**: To avoid false positives from valid repetitive tasks, the Sentinel ignores "repetitive" tasks specifically flagged as `loop_safe` in the metadata.

---

## 2. The Stall Detector
The Sentinel monitors the "Heartbeat" of the agent to ensure constant progress.

### 2.1 Logic
- **Timestamp Drift**: The Sentinel tracks the timestamp of the last `REASONING_STEP` or `TOOL_CALL`.
- **STALL_TIMEOUT**: If the delta between the current time and the last activity exceeds the `STALL_TIMEOUT` (Default: **60 seconds**), a stall is identified.

### 2.2 Reaction (The Hang Procedure)
Upon detecting a stall, the Sentinel initiates the following sequence:
1. **Warning**: Logs a `STALL_WARNING` in the `session.log`.
2. **Wake-Up**: Sends a lightweight signal/prompt to the Actor to "Check in or report status."
3. **Escalation**: If the stall persists for $> 180$ seconds, it triggers a `SYSTEM_HANG` event and initiates the **Hang Recovery** protocol (which may involve a restart of the `agent_api`).

---

## 3. Operational Implementation
The Sentinel operates as a lightweight, non-blocking background process. It uses low-resource polling to ensure it does not interfere with the main LLM latency.

- **Process Lifecycle**: Started automatically by `start.sh`.
- **Log Interception**: Uses `tail -f` style monitoring on `session.log`.
- **Reliability**: Designed to be stateless and restart-resilient.

## 4. Implementation Details (Integration Guide)

### 4.1 Loop Detection Requirements
- **Semantic Similarity**: Compare the most recent reasoning step against a window of the last $N$ steps ($N=5$).
- **Thresholding**: Use `difflib.SequenceMatcher` with a threshold of $0.85$.

### 4.2 Stall Detection & Recovery
- **Warning Phase**: After 60 seconds of inactivity, log `STALL_WARNING` and attempt a **Wake-Up** signal (POST request to `/chat`).
- **Escalation Phase**: After 180 seconds of inactivity, log `SYSTEM_HANG` and initiate **Hang Recovery** (kill the process listening on the Agent API port).

### 4.3 Recovery Protocol
- **Identify Port**: Agent API listens on `localhost:8000`.
- **Action**: Find PID via `lsof -t -i:8000` and terminate with `SIGKILL`.
- **Assuming**: The environment's `start.sh` or supervisor will restart the process.

