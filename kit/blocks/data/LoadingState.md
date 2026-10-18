# LoadingState

App Block card (Data). What shows while something loads: nothing for the first 300 ms, then grey skeletons shaped like the content, and a plain sentence if it takes over 8 seconds.

- Basecoat: `skeleton`, `item`, `btn`
- Needs: Nothing; the htmx request or the store promise drives it
- Used in: ListSearch, DataTable, DetailView, Dashboard, Gallery, every panel that loads after the page
- Links to: ErrorRetry (when it fails), EmptyState (when it answers 0), ProgressStatus (uploads and long jobs with a known size)

## Markup
Copy, never retype: `{harness}/kit/blocks/data/LoadingState.html` (13 lines of HTML).

The detail page version:

Copy, never retype: `{harness}/kit/blocks/data/LoadingState.2.html` (9 lines of HTML).

The button version (an action that waits for the server):

Copy, never retype: `{harness}/kit/blocks/data/LoadingState.3.html` (1 line of HTML).

- Skeletons copy the **shape** of what will come (same rows, same heights, same badge pill) so nothing jumps when it arrives.
- The wrapper has `role="status"` and `aria-busy="true"`, with one hidden sentence for screen readers; the grey shapes are `aria-hidden`.

## States
- Under 300 ms: Show nothing new (htmx: `hx-indicator` on a class with `transition-delay: 300ms`; JS: `setTimeout(show, 300)`). Avoids a flash.
- 300 ms – 8 s: The skeleton in place of the content (first load) or the old content at 60 % opacity with `aria-busy="true"` (reload: filters, paging).
- Over 8 s: Add a line under the skeleton: `loading.slow` and a Cancel button that aborts the request (`htmx.trigger(el, "htmx:abort")` / `AbortController`).
- A button's action: The button: `disabled`, `aria-busy="true"`, a spinning icon and its `…ing` text; nothing else on the page changes.
- Loaded: Swap in the content; remove `aria-busy`. Don't animate the swap.
- Failed: ErrorRetry in the same place.
- Reduced motion: `animate-pulse` and `animate-spin` stop (`motion-reduce:animate-none`): add it to both.

## Texts
(Key | English | 日本語)
- `loading.label`: Loading notes… | ノートを読み込み中…
- `loading.slow`: Still loading. This is taking longer than usual. | まだ読み込み中です。いつもより時間がかかっています。
- `loading.cancel`: Cancel | キャンセル
- `loading.button`: Saving… | 保存中…

## Keyboard and focus
- Loading never moves focus. A pressed button keeps focus while disabled (use `aria-disabled="true"` instead of `disabled` if the browser drops focus).
- Cancel (after 8 s) is the only focusable thing in a loading area.

## Phone
- Same shapes at phone width; never a full-screen spinner over the whole app.
- Pull-to-refresh is the browser's; don't add your own.

## Data
```json
{"started_at": 1760745600000, "slow_after_ms": 8000, "show_after_ms": 300}
```

- Web: put the skeleton in the page where htmx will load (`<div hx-get="/notes/list" hx-trigger="load">` + skeleton inside); htmx replaces it.
- No server: render the skeleton, `await store.list()`, then render the list.

## Don't
- Don't show a spinner in the middle of an empty page when the shape is known.
- Don't show percentages you don't know; that's ProgressStatus with real numbers.
- Don't block the whole page (an overlay) for one panel loading.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> LoadingState` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
