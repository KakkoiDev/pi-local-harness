# Plan 152: htmx 4 and server-sent events

Status: **planned, not started** (2026-10-14). Task: [tasks/152-htmx-sse.md](../../tasks/152-htmx-sse.md).
Read [docs/contributing-for-agents.md](../contributing-for-agents.md) first. Depends on [plan 151](151-ui-component-library.md) (components render the fragments).

## 1. Where we are

- **No htmx today.** It was used early (task 08) and dropped when the UI became hand-written ES modules (task 32 onwards). Task 106 chose real paths with `history.pushState` (`js/router.mjs`) when the person expected "embracing htmx".
- **Everything is polled as JSON.** `js/workspace.mjs` polls `GET /api/workspace` every 1.8 s while the tab is visible. Each poll then also fetches the selected conversation (`/api/conversations/<id>`), and in Work the file list (`/api/project-files`) and the open document (`/api/document` or `/api/project-file`). Gate polls `GET /api/gate` every 2 s while open. That is 3–5 requests every two seconds per open tab, phone included. Live chat text appears only at poll speed, and every poll re-renders lists.
- **A dead streaming path.** `POST /api/conversations/<id>/send` streams NDJSON but no client uses it, and it runs Pi outside the one queue (the audit found the one-agent rule can be bypassed).
- **The server** is `http.server.ThreadingHTTPServer` (one thread per connection, standard library only), behind `tailscale serve` for the phone.

## 2. Goal

The server pushes what changed; the page swaps server-rendered HTML; JSON polling is gone.

1. One SSE stream per open tab: `GET /events`. It sends HTML fragments for what changed (agent status, the Agent section counts, Activity rows, Gate rows, the live chat message, thread states, file lists, "updated on disk" notices).
2. Views and lists are server-rendered with the plan 151 components and loaded or updated by htmx (`hx-get`, `hx-post`, `hx-swap`, `<hx-partial>`).
3. Islands that stay JS (plan 151 D6) listen to named SSE events instead of polling.
4. The browser suites pass at every step; a new suite checks the stream (connect, update, reconnect with `Last-Event-ID`, phone background pause).

## 3. Decisions (please confirm the ones marked **ask**)

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | htmx version (decided: 4.0.0) | **htmx 4.0.0** (released 2026-08-28 after a year of alphas and betas; npm tags it `next` only so that unversioned CDN links do not break) with its bundled **`hx-sse`** extension. Fallback: htmx **2.0.11** + `htmx-ext-sse` **2.2.4** if a blocking 4.0 bug appears. | "Latest" is 4.0. Its SSE runs on `fetch` + `ReadableStream` (custom headers, `Last-Event-ID`, backoff with jitter, pause in background tabs). Unnamed messages swap automatically; `<hx-partial>` updates several targets from one message, which is exactly what one stream for the whole page needs. |
| D2 | How htmx ships | **Vendored** into `harness/vendor/htmx/4.0.0/` (`htmx.min.js`, `ext/hx-sse.min.js`, their license; next to the existing `harness/vendor/qrcode.mjs`), with a SHA-256 list checked by a test. Served by the existing static allowlist. No CDN. | The app works offline and on a tailnet; an exact version and checksums keep updates deliberate. |
| D3 | One stream or many | **One stream per tab**, `GET /events?view=…&project=…`, carrying `<hx-partial hx-target="#…">` blocks for whatever changed. | One connection per tab (phones, `ThreadingHTTPServer` threads). The client says what it shows; the server sends only fragments for those targets. |
| D4 | Event bus | An in-process **`EventBus`** in `harness/events.py`: `publish(topic, payload)`, per-subscriber bounded queues, monotonically increasing ids, a ring buffer of the last 500 events for `Last-Event-ID` replay. Publishers: the work queue (job added, progress, done), the document store (saved, commented, moved, trashed), Gate (event recorded), the model switch. | The sources already exist; today the UI rediscovers changes by polling. |
| D5 | Rendering on the stream | The SSE handler turns each event into fragments with the plan 151 components (for example `job_changed` → the Activity row, the Agent section counts, the status button). Coalesce: at most one render per target per 100 ms; streaming chat text is sent as appended text chunks. | Keeps the wire small and the page calm. |
| D6 | Unnamed vs named | **Unnamed** messages carry HTML to swap (`<hx-partial>`). **Named** events (`event: editor-file-changed`, `event: model-ready`, …) notify the JS islands; they never carry HTML. | That is htmx 4's model; it keeps islands decoupled. |
| D7 | Errors and history | `htmx.config.noSwap = [204, 304, '4xx', '5xx']` (htmx 4 swaps errors by default); errors come back as a small alert fragment with an explicit target. History: keep `js/router.mjs` paths; set `htmx.config.history = false` until views are full htmx pages, then reconsider. | Avoid surprise swaps; do not run two routers. |
| D8 | Inheritance | htmx 4's explicit inheritance (`:inherited`) is used as designed; no `implicitInheritance`. | Easier to read for weaker models: every element says what it does. |
| D9 | Remove the dead path | Delete `POST /api/conversations/<id>/send` (NDJSON, bypasses the queue). Chat goes through `POST /api/jobs/create` only. | One way to run Pi; the one-agent rule holds. |
| D10 | Keep JSON? (decided: keep) | Keep the JSON APIs that tests, Pi tools or scripts use (`/api/workspace`, `/api/jobs/*`, `/api/documents/*`); the page stops polling them. Delete JSON endpoints nothing uses after the migration. | Tests and agents keep a stable, scriptable API. |

## 4. Wire format

```
event: (none)                       ← unnamed: htmx swaps it
id: 1042
data: <hx-partial hx-target="#agent-status" hx-swap="outerHTML"><button id="agent-status" …>…</button></hx-partial>
data: <hx-partial hx-target="#agent-activity-meta" hx-swap="innerHTML">1 running · 1 waiting</hx-partial>

event: editor-file-changed          ← named: for the block editor island, no HTML
id: 1043
data: {"path":"projects/…/ROADMAP.md","revision":"…"}

: keepalive                         ← comment line every 15 s (proxies, sleeping phones)
retry: 2000
```

Server rules: `Content-Type: text/event-stream`, `Cache-Control: no-store`, `X-Accel-Buffering: no`, flush after every event, the same `trusted()` Host/login check as every other route, one thread per stream with a cap (for example 8 streams; the ninth gets 503 and the page falls back to a slow poll).

## 5. Steps

Each step is one task (`Kind: code`), red test first, browser suites green at the end. Steps 2–4 can start before plan 151 finishes; steps 5 onwards need the matching components.

| Step | What | Done when |
|---|---|---|
| 1 | Vendor htmx 4.0.0 + `hx-sse` (D2), load them in the page, config meta (`noSwap`, `sse.reconnectDelay`, allowed extensions). No behaviour change. | Checksum test; both suites pass; no console errors. |
| 2 | `harness/events.py` EventBus + `GET /events` (SSE, keepalive, replay, cap). | Unit tests: publish → subscriber gets it; replay after `Last-Event-ID`; slow subscriber dropped, not blocking publishers; Host check applies. |
| 3 | Publishers: work queue, document store, Gate ledger, model switch publish events. | Unit tests per publisher. |
| 4 | First consumer: the agent status and the Agent section (status button, counts) via `<hx-partial>`; their JSON-driven updates removed. | Browser test: queue a job (fake Pi) → status changes within 0.5 s without a poll request in the network log. |
| 5 | Activity list and detail as fragments (`hx-get` on filter change; stream updates rows). | Activity tests pass; no `/api/workspace` poll while Activity is open. |
| 6 | Gate list as fragments; remove the 2 s Gate poll. | Gate tests pass. |
| 7 | Chat: transcript rendered by the server; the live message streams appended chunks; tool cards and Gate verdicts update in place. Remove the per-poll conversation fetch. | Chat tests pass; time to first visible token < 300 ms after Pi emits it. |
| 8 | Work: Files window, Review list and threads as fragments; the block editor island gets `editor-file-changed` instead of polling the document. | Work tests pass; editing never loses the caret on a server update. |
| 9 | Projects window and dialogs as fragments. | Projects tests pass. |
| 10 | Remove `setInterval(poll)`, the JSON-to-DOM builders the components replaced, the NDJSON send path (D9), and dead JSON endpoints (D10). Update readme, IMPLEMENTATION notes and the contributing guide. | `grep -n setInterval js/` shows only timers that are not polls; docs match behaviour. |
| 11 | Offline and reconnect: the offline banner and Reconnect use the stream's `htmx:sse:error` / `after:connection` events; a phone that slept catches up via replay. | Browser test kills and restarts the server: banner shows, then clears, and missed events appear. |

## 6. Risks

| Risk | Mitigation |
|---|---|
| htmx 4 is new (7 weeks); a bug blocks us. | Vendored exact version; fallback D1 (2.0.11 + `htmx-ext-sse`) differs mainly in attribute names (`sse-connect`/`sse-swap`), isolated in the page shell and one behaviour module. |
| `tailscale serve` or Safari buffers the stream. | `X-Accel-Buffering: no`, flush per event, 15 s keepalive comments; a dedicated phone check in the browser suite (390 px, `hasTouch`); manual check on the real phone listed in the task. |
| Thread-per-stream exhausts the server. | Stream cap, `pauseOnBackground` (htmx default), streams closed on disconnect; a test opens 10 streams. |
| Two sources of truth while half-migrated (poll and stream). | Each step removes the poll for what it moves; a test asserts the removed poll no longer happens. |
| Weaker models mix JSON-built DOM with fragments. | The contributing guide's rule: new UI = component + fragment endpoint or stream partial; never `node()` builders. |

## 7. Out of scope

WebSockets, multi-user sync, changing the router to htmx history (revisit after step 10), the Table block.

## 8. Decisions (the person, 2026-10-14)

1. D1: **htmx 4.0.0** with its `hx-sse` extension.
2. D10: **keep the JSON APIs** that tests, Pi tools and scripts use; delete only endpoints nothing uses.

Sources: [htmx 4.0.0 release](https://four.htmx.org/announcements/2026-08-28-htmx-4.0.0-is-released), [What's new in htmx 4](https://four.htmx.org/docs/whats-new-in-htmx-4), [hx-sse extension](https://four.htmx.org/extensions/sse); npm `htmx.org` versions (4.0.0 on 2026-08-28, 2.0.11 latest 2.x), `htmx-ext-sse` 2.2.4.
