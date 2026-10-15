# htmx 4 for Pi (the card)

The kit's htmx is **4.0.0** (`kit/vendor/htmx-4.0.0/htmx.min.js`). You may remember htmx 2: it changed. The full
guides are htmx's own, pinned beside it: `skills/htmx-guidance.md` (how to write it), `skills/htmx-upgrade-from-htmx2.md`
(what changed), `skills/htmx-debugging.md`.

## The lines that are almost always right

```html
<script src="/static/htmx.min.js"></script>
<button hx-post="/notes" hx-target="#notes" hx-swap="beforeend">Add</button>
<form hx-post="/notes" hx-target="this" hx-swap="outerHTML">…</form>   <!-- the form swaps itself, errors included -->
<input name="q" hx-get="/search" hx-trigger="input changed delay:300ms" hx-target="#results">
<div hx-get="/status" hx-trigger="every 5s">…</div>
```

## Rules (htmx 4)

1. The server returns **HTML fragments**, never JSON.
2. **No implicit inheritance:** an `hx-target`, `hx-swap`, `hx-confirm`… on a parent does not apply to children unless
   written with `:inherited` (`hx-target:inherited="#main"`). `hx-inherit` and `hx-disinherit` no longer exist.
3. **Errors reach the target too** (all statuses but 204 and 304). Return a 422 with the form fragment for validation
   errors; use `hx-status` to send an error code to another target.
4. Removed: `hx-vars` (use `hx-vals='js:…'`), `hx-params`, `hx-ext` (including the extension's script is enough),
   `hx-history`. `hx-disable` means what `hx-ignore` meant; `hx-request` is now `hx-config`.
5. Event names use colons: `htmx:after:swap`, `htmx:config:request`, `htmx:response:error` (not `afterSwap`).
6. Live updates: the `hx-sse` extension (`ext/hx-sse.js`), loaded by its script tag.

The harness checks every template you change with htmx's own checker (`scripts/upgrade-check.py`).
