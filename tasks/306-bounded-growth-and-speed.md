# 306: Long-lived projects stay fast

Kind: code
No scenarios: payload size, locks, inventory order, capped logs and cross-process locking are server-side speed and safety work with no new screen or command.

Source: the second bug hunt (2026-10-18) and its documentation-drift part; numbers are the hunt report's items. Items 6, 7, 8, 18.

- [ ] /api/workspace: test runs indexed once, light job summaries with details on demand, an ETag or revision; under
  1 MB and 50 ms with 2,000 jobs and 20,000 runs (test).
- [ ] The Red proof runs outside Gate's lock (with task 260's temporary copy).
- [ ] The inventory walks ROADMAP.md and tasks/ first, so a 2,000-file project keeps its plan in context.
- [ ] Context reads only what it selects (no full read of every file under 40 KB); auto-run reports append instead of
  rewriting; reports, test runs, decisions, admin log and backups are capped or rotated; gate-events truncation is atomic.
- [ ] Terminal Pi and plh run separate Gates on one data folder: lock the shared files between processes (review P3).
