# 253: Record one application foundation with multiple packaging targets

Kind: docs

Request 2026-10-18: “applications are all built the same way, but exported/packaged in different ways: full stack, front only, mobile, ...”; “resume now”.

- [x] Red (manual documentation acceptance): the common-source/multiple-packages plan was missing before this change.
- [x] Record the shared Python/HTMX foundation, separate capability/packaging choices, adapter boundaries and future acceptance evidence.
- [x] Identify which historical plan-198 direction is superseded; link the new direction from the Claude handoff and docs index.
- [x] Green: links and documentation consistency checked; full Python/Node workflow passed with PYTHONDONTWRITEBYTECODE=1 before the chained commit.

Documentation only: no exporter, UI, migration, download, benchmark or runtime change. The previous authorization to commit/push the report and handoff remains applicable to this continuation. Runtime and design questions remain explicit in plan 253; app performance/scalability follows capability.
