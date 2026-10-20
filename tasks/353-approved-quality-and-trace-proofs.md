# 353: Offline Ruff checks and Agentplay compatibility proof

Kind: code
No scenarios: internal read-only checker API and opt-in synthetic compatibility proof only; no new command, route, setting or control is exposed.

Request 2026-10-20: approved Agentplay 0.2.1 and Ruff 0.17.1 downloads.

- [x] Red: correctness findings, clean source, vendor/symlink exclusion, unavailable/mismatched/crashed tools and no automatic repair/download.
- [x] Implement a pinned offline Ruff runner with explicit scope, fixed correctness rules and honest unavailable/error results.
- [x] Prove Agentplay map import, local viewer API and normalized counts against synthetic data without discovery, personal logs or outbound network.
- [x] Record approved wheel hashes, inventory and integration limits; keep tasks 349/350 open for remaining coverage and designed integration.
- [x] Green: focused tests, real Ruff seeded cases, installed-copy checks, full workflow and browser suites.

## Evidence

Red: the checker did not exist; requesting a missing Ruff incorrectly passed the workflow; the synthetic map fixture was not implemented. Green: nine checker tests (including real seeded undefined-name and syntax cases), five workflow integration tests and four real Agentplay import/API/browser proof tests pass. The approved wheels were checksum-verified; no other dependencies were downloaded. See [the report](../docs/reports/approved-tools-2026-10-20.md) for reproducible commands and scope. Final verification: the full workflow passed with real Ruff (758 Python files), Python and Node suites; installed-copy checks passed (10 tests). All browser suites exited 0, including the real-Pi golden journey and its 99 passing nested stories.

This is developer/internal integration. Ruff is explicit opt-in, rather than an automatically installed mandatory gate. Agentplay's private builder is used only by the pinned synthetic proof, not by production dispatch. No Pi log parser, complete replay adapter, project audit control or new UI is claimed. Parent tasks 349/350 and speech task 351 remain open.
