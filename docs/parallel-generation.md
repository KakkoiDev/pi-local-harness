# Verified simultaneous generation

GPT-OSS 20B (`gpt-oss:20b`) is the repository default. Existing saved selections are respected. To enable the managed
production configuration, set `parallel_server` to true in the harness config (or `PI_PARALLEL_SERVER=1`) and restart
plh. The default is false so an upgrade does not silently start another model server.

The managed child uses a fresh loopback port, two slots, 8192 context tokens per slot, one loaded model, flash
attention and q8_0 KV cache. Its serving settings are explicit; inherited runner/GPU options are fingerprinted without storing credential values. It inherits the existing
model store, never changes global Ollama settings, never stops the owner's server, and stops its own process group
on shutdown. Startup refuses a resident model on owner Ollama, unavailable memory telemetry, or less than 16 GiB available. If it cannot start, plh reports the failure. It never silently redirects work elsewhere.

The tool repair proxy and both web and terminal providers route to this managed instance. The provider reports an
8K window and 2048 maximum output tokens, including for a saved models.json with a larger window. That lets Pi
compact long histories before the serving context is exceeded. Custom unrelated provider endpoints are preserved.

## Capability evidence

The idle startup check (or `/models check [name] --force`) loads a model, measures one 64-chunk response, then sends
two distinct prompts together. Raw monotonic token/chunk arrival timestamps are stored in
`<data>/model-capabilities.json`. A request being open is never evidence. The classifier requires at least four
separate arrival bursts per stream, six changes between stream owners, and at least 25% generation overlap.
Events within 2 ms count as one burst. Clearly disjoint generated-token intervals mean `not_supported`; insufficient
or ambiguous data means `unknown`; a failed or truncated stream means `error`. Only `supported` enables admission.
These are observed streamed progress, not a claim about simultaneous GPU kernels. Network buffering can obscure
progress, so uncertainty serializes. Display uses “parallel tested”, “serial in tested setup”, “parallel unknown” and
“parallel check failed”. A negative result applies to the tested configuration, not the model intrinsically.

Records include the exact model digest and model details, backend and version, endpoint, machine/OS, declared
serving environment, context and output limits, executable hash and instance identity. Legacy overlap-only records
are invalid. Each new managed process needs a fresh check. The caller's or launchctl's environment alone cannot
attest a running server's configuration: unmanaged endpoints can be measured, but never authorize concurrent
production scheduling. Errors are persisted and do not trigger repeated automatic load attempts; force a retry.

## Scheduling and safeguards

The queue counts chats and actions together. It admits at most two requests only with current matching evidence,
with a total context reservation of 16384 tokens. A larger configured context reduces admission accordingly; a
context beyond what was checked serializes. Less than 2 GiB available physical memory, or unavailable telemetry,
reduces new admission to one. Existing work drains; pressure does not kill it. This is conservative admission,
not a promise against all system memory pressure or swap. Stop cancels one request's process group; other histories
and requests remain isolated. Queue shutdown and restart keep the existing interrupted-work behavior.

Every request can call tools, including a chat, so requests using the same resolved workspace or chat session
serialize. Separate projects can run together. Gate's authorization, sandbox, task scope, publication checks,
resource controls, per-request approval tokens and terminal/workbench exclusion remain in force. Parallel support
never grants permission. GPT-OSS's bounded task self-review uses correctness, validation and scope prompts before
Gate finishes a verified changed task; it is advisory self-review, not an independent reviewer or correctness proof.

## Validation on 2026-10-23

On the busy everyday 32 GiB Mac, the new managed 2 × 8192 configuration passed native and production-proxy smokes for
GPT-OSS 20B, digest `a0b38d0b19f7c5dd3589e5e6598edfed41c81969d73f9e4774011c1328e9dad8`, Ollama 0.40.7.
The native smoke observed 98.6% overlap and about 1.6× combined progress relative to one stream (individual runs vary).
The proxy offered tools and observed repeated interleaving of content/reasoning chunks. The matching evidence admitted
two slots. The temporary process was stopped afterward; its instance-bound result cannot authorize a later server.
Local raw results: `/private/tmp/plh-production-parallel-20261023/` (not shipped or reused as production evidence).

The older lab result used sixteen 2K slots and short prompts; it is not imported as production evidence. No quality,
sustained workload, full 8K history, maximum-capacity or no-swap guarantee is claimed. Gemma/Qwen serial results from
other configurations do not rule out other engines. The lab queue stayed paused and the shared lab GPU lock was
held during this smoke.

To repeat explicitly (never run by the offline tests):

```
python3 experiments/parallel_inference/production_smoke.py --gpu-lock /path/to/existing/.bench.lock --out /tmp/pi-parallel-smoke
```

The smoke refuses a held lock, a resident model on owner Ollama, or less than 16 GiB available memory. It starts and
stops only its own server, offers no download path, and does not resume a lab campaign.

## Project agents

Each registered project owns one agent lane, identified by its stable project ID, with its own chat history and phase. An idle lane does not keep a Pi process alive. The workspace API exposes `agents` keyed by project ID, with running and queued job IDs and advisory `available` admission. Older runnable queued requests reserve capacity before this estimate. Dispatch checks the current capability again; the estimate never authorizes execution. Existing Send/Queue controls follow the selected project's availability. When capability is unknown, stale, or under memory pressure, new requests serialize.
