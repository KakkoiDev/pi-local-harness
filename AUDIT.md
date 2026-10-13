# Audit - pi-local-harness @ 3e9196e (2026-10-13)

## Status on branch audit-fixes (2026-10-13)

| # | Status |
|---|---|
| 1 Laya oracle | Fixed, task 45. Exploit now 403. |
| 2 `--no-mcp` | Fixed, task 46. Real Pi checks the web command. |
| 3 Gate checks nothing | Fixed, task 47. Gate runs both suites. |
| 4 Pi 0.77 renderer | Fixed, task 46. |
| 5 Runtime writes into repo | Fixed, task 48. |
| 6 Canary abort | Not changed. Waiting on your call. |
| 7 Identical profiles | Withdrawn. Task 31 made bash non-high-risk on purpose; README already says both profiles share the shell rules. |
| 8 Drift audit | Not changed. 2026-10-13: verified, see #8. Executed args are the audited args; in-place mutation after the gate is detected. |
| 9 Shell deny-list | Not changed. Waiting on your call. |
| 10 Dropped connections | Fixed, task 49. |
| 11 Stale lock | Not changed. Waiting on your call. |
| 12 Workspace reads, corrupt chat | Fixed, tasks 49 and 52. |
| 13 Tracked junk | Fixed, task 48. Screenshot left tracked; yours to decide. |
| 14 Portfolio leftovers | Not changed. Waiting on your call. |
| 15 Model id in 6 files | Fixed, task 50 (pinned in harness/model.json). |
| 16 Audio double write, WebP | Fixed, task 49. |
| 17 Test runner quirks | Documented, task 46: `pi`/`node` on PATH must match. |
| New: commit protocol | Added, tasks 51 and 52. |


Evidence column: V = reproduced this session, R = read in source only.

## Critical

1. **Laya API: cross-origin file-content oracle** (V)
   - `agent_api.py:15-18` sends `Access-Control-Allow-Origin: *`; no Host/Origin check, no auth.
   - `laya/ledger.py:49-56`: `/gatekeep` with `pi_tool=edit` reads any path and answers `ALLOW` iff `oldText` occurs exactly once.
   - Repro: services on 127.0.0.1:18731, `Origin: https://evil.example`, secret file `AWS_SECRET=hunter2`.
     Guess `AWS_SECRET=h` -> `ALLOW`; guess `AWS_SECRET=x` -> `REVISE`. Preflight returns `ACAO: *`.
   - Impact: any web page the user visits can extract any readable file byte by byte (ssh keys, tokens),
     subject to browser private-network-access rules (Chrome may prompt/block; Safari/Firefox do not, unverified here).
   - Same surface: forge `/audit` events into the Laya tab, fill the 1024-slot ledger -> every agent tool call blocked for 1 h (R), `/chat` appends arbitrary text to `session.log` (R).
   - Fix: drop CORS headers, require exact Host `127.0.0.1:<port>`, reject any `Origin`, add a per-run shared secret header from `services.py` to the extension.

2. **Web chat cannot start pi** (V for CLI, R for web path)
   - `harness/web_chat.py:180` passes `--no-mcp`. Installed pi 0.87.1 (node v24.16) and 0.77.0 (v24.15) both exit with `Error: Unknown option: --no-mcp`.
   - Every queued web job should then fail with "Pi exited unexpectedly". Web path not run end to end.
   - `tests/test_pi_startup.py` also passes `--no-mcp` and fails (see Tests).

## High

3. **"Verification" gate verifies nothing executable** (V)
   - `AGENT.md` requires `tests/verify_workflow.py` before completion. It only checks ROADMAP checkboxes vs task files. Passes while a real test fails.
4. **pi 0.77 incompatible** (V): `pi.registerEntryRenderer is not a function` (`harness/startup-display.mjs:23`, unguarded; `timestamps.mjs:13` is guarded). Which pi runs depends on the active nvm node. Shell default node here is v20.11, where `pi` crashes outright.
5. **Runtime writes into tracked repo files** (R): `harness/extension.mjs:46-47` appends to `<repo>/incident_log.md` and `<repo>/session.log` on every loop/hang/canary trip; `services.py:21` defaults the Laya log to `<repo>/session.log`. Repo dirties itself in normal use.
6. **Canary trip aborts correct answers** (R): `extension.mjs:121` aborts + compacts + re-asks when a reply lacks `[CANARY]`. A formatting slip by the model throws away a valid answer. Cost unmeasured.

## Medium

7. **Laya profiles are identical** (R): no tool maps to `HIGH_RISK` (`laya/engine.py:12-21`), so `standard` == `admin`. Auth level is chosen by the client (`extension.mjs:144`). The "restricted standard profile" in `incident_log.md` does not exist.
8. **Drift audit cannot detect drift** (R): proposal and execution args both come from the same `event.input` (`extension.mjs:144,155`). 2026-10-13, verified in pi-agent-core `dist/agent-loop.js` 370-450 and pi-coding-agent `dist/core/agent-session.js` 177-211: one `validatedArgs` object goes to `tool_call`, to `tool.execute` and to `tool_result`, so the executed args are the audited args. `/gatekeep` serializes the args when it is called, so the only drift path, a later `tool_call` handler or the tool mutating `event.input` in place, does show as DRIFT_DETECTED. Downgraded to Low: kept as is.
9. **Shell guard is a string deny-list** (R): `python3 -c "shutil.rmtree(...)"`, `git clean -fdx ~`, `rm -rf ~/Code` all pass. Documented as "not a sandbox"; fine only if nobody relies on it.
10. **Unhandled exceptions drop connections** (R): `web_chat.py:334` catches ValueError/KeyError/FileNotFound/FileExists only. TypeError (non-string `path`), PermissionError, StopIteration (`project_chat` `next()` line 119, `mark_sent` line 464) -> no HTTP response.
11. **Stale agent lock** (R): `.agent-lock` liveness via `kill(pid,0)`; PID reuse or EPERM -> queue blocked until manual delete (`web_chat.py:106-111`, `agent-lock.mjs:5`).
12. **O(projects x chats) disk reads per poll** (R): `workspace()` -> `project_chat()` re-reads every conversation.json for each project (`web_chat.py:113-120,133-137`). One corrupt file 404s the whole workspace.

## Low / hygiene

13. Tracked despite `.gitignore`: 7 `__pycache__/*.pyc`, `.ideas.md.swp` (vim swap, may hold unsaved text), `session.log`, `Screenshot 2026-10-11 at 15.05.36.png`.
14. Portfolio leftovers with tests still guarding them: `get_news.py`, `get_news_rss.py`, `utils.py`, `project-ai.html`, `project-db.html`, `js/components.js`, `/chat` + `/tool_call` simulated endpoints in `agent_api.py`.
15. Model id `gemma4:26b-mlx` hard-coded in 6 source files plus tests (`plh.py:9`, `web_chat.py:181,266`, `install.py:54,62`, `provider.mjs:3`, `media.mjs:25`).
16. `prepare_prompt` writes audio twice (`web_chat.py:84,93`); WebP signature check is `RIFF` only (accepts WAV).
17. Test runner undocumented quirks: `python3 -m unittest discover -s tests -t .` fails (no `tests/__init__.py`); only `-s tests` works. `pytest` not installed.

## Tests (this session)

- `node --test tests/harness/`: 21/21 pass.
- `python3 -m unittest discover -s tests`: 60 run, 1 fail (`test_pi_startup`, cause #2/#4). Failure message is empty because stderr is read only in `finally`.
- `tests/verify_workflow.py`: pass (meaningless, see #3).
- Browser test `tests/browser/chat.cjs`: not run (needs NODE_PATH + Chromium).

## Not covered

- Frontend XSS: no `innerHTML` outside legacy `js/components.js`; Markdown renderer not read in depth.
- `harness/install.py`, `media.mjs`, `memory.mjs`, `watch.mjs`, `transcribe.py`, `sentinel.py`: skimmed or unread.
