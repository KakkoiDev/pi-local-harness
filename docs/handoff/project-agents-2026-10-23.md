# Project agents · 23 October 2026

Request: one agent per project, with concurrent processing only when supported.

Task 364 completes the project-facing admission integration on task 363's verified generation foundation. The scheduler already runs isolated Pi request processes for different projects. This change exposes a stable project-ID agent lane through `/api/workspace` and makes the existing composer use its own lane's advisory availability. It retains one conversation, phase and working directory per project; idle lanes consume no Pi process.

Availability reserves capacity for older runnable queued requests without claiming them or changing durable records. The production scheduler remains authoritative and rechecks at dispatch. Same histories, equal/overlapping resolved workspaces, global terminal ownership and the tested total slot bound remain enforced. Missing/unplugged workspaces fail the availability estimate closed without breaking the entire workspace response.

## How to try

Use the managed parallel server described in `docs/parallel-generation.md`; the default remains serial until the current exact serving instance passes its capability smoke. Open two different project chats and send work in both. With supported two-slot capacity both run; another request in either project waits. Stop one request and the other continues. With stale, absent or failed capability evidence, new work serializes. Model changes and low memory may reduce admission.

No new model downloads, live inference benchmarks, user-project edits or changes to the person's serving configuration are part of this change. The current verified serving path is managed Ollama, at most two projects. Colibri and other unverified providers remain serial. Terminal Pi still owns a global exclusion while active.

## Review and verification

New tests cover the project-agent API snapshot, same/aliased workspace exclusion, total capacity, serial fallback, FIFO reservation, terminal holds, missing folders, side-effect-free estimates and composer rendering. US-357 exercises the existing Send/Queue controls against explicit availability fixtures; it does not claim to benchmark inference. Existing real-process lane tests run isolated fake Pi requests concurrently across projects and verify independent Stop. Full release checks are recorded in task 364.

Further UI for agent overviews and independent per-project model selection is outside this request; do not infer approval for new controls from this backend contract.
