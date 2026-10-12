# Pi local harness contributor instructions

Start user-facing responses with [CANARY]. Read readme.md for the current architecture.

This repository is a single-agent local project workbench. `plh.py` starts Pi from
home with explicit harness loading; ordinary `pi` remains independent. The web
queue resumes one chat per registered project and runs tools in that folder.
Workers share Laya and never start duplicate services. Shared runtime memory is
~/pi-local-agent-data/AGENTS.md; do not copy project chats into it.

## Request-to-Task Pipeline

Create numbered tasks under tasks/ and link them in ROADMAP.md. Implement authorized
work, preserve unrelated edits, add meaningful regression coverage, and commit at
the end of each task. Mark only verified work complete. Run tests/verify_workflow.py
before completion. Keep README instructions aligned with actual behavior.

Use accessible local paths directly. Inspect relevant files before changes. Treat
audio transcripts as fallible recognition. Laya blocks dangerous proposals before
execution and returns corrective feedback; do not bypass it or misdiagnose it as a
broken shell. Normal shell commands must remain usable.

Keep persistent lessons concise, evidence-based, and deduplicated. Never put
secrets or whole transcripts in shared memory. Explain limitations accurately:
Pi activity is not a definitive GPU signal, and folder context is not a sandbox.
