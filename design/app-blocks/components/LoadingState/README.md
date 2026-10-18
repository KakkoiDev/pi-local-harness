# LoadingState

What shows while something loads: nothing for the first 300 ms, then grey skeletons shaped like the content, and a plain sentence if it takes over 8 seconds.

| | |
| --- | --- |
| Group | Data |
| Basecoat | `skeleton`, `item`, `btn` |
| Needs | Nothing; the htmx request or the store promise drives it |
| Used in | ListSearch, DataTable, DetailView, Dashboard, Gallery, every panel that loads after the page |
| Links to | ErrorRetry (when it fails), EmptyState (when it answers 0), ProgressStatus (uploads and long jobs with a known size) |

## Markup

```html
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only" data-t="loading.label">Loading notes…</span>
  <ul class="grid gap-2" aria-hidden="true">
    <li class="item" data-variant="outline">
      <section class="gap-2"><div class="skeleton motion-reduce:animate-none h-4 w-2/5"></div><div class="skeleton motion-reduce:animate-none h-3 w-4/5"></div></section>
      <aside class="grid justify-items-end gap-2"><div class="skeleton motion-reduce:animate-none h-5 w-20 rounded-full"></div><div class="skeleton motion-reduce:animate-none h-3 w-24"></div></aside>
    </li>
    <li class="item" data-variant="outline">
      <section class="gap-2"><div class="skeleton motion-reduce:animate-none h-4 w-2/5"></div><div class="skeleton motion-reduce:animate-none h-3 w-4/5"></div></section>
      <aside class="grid justify-items-end gap-2"><div class="skeleton motion-reduce:animate-none h-5 w-20 rounded-full"></div><div class="skeleton motion-reduce:animate-none h-3 w-24"></div></aside>
    </li>
  </ul>
</div>
```

The detail page version:

```html
<div role="status" aria-busy="true" class="grid gap-6">
  <span class="sr-only" data-t="loading.label">Loading notes…</span>
  <div aria-hidden="true" class="grid gap-3">
    <div class="skeleton motion-reduce:animate-none h-3 w-48"></div>
    <div class="skeleton motion-reduce:animate-none h-8 w-2/3"></div>
    <div class="flex gap-2"><div class="skeleton motion-reduce:animate-none h-5 w-20 rounded-full"></div><div class="skeleton motion-reduce:animate-none h-5 w-28"></div></div>
  </div>
  <div aria-hidden="true" class="grid gap-2"><div class="skeleton motion-reduce:animate-none h-3 w-full"></div><div class="skeleton motion-reduce:animate-none h-3 w-11/12"></div><div class="skeleton motion-reduce:animate-none h-3 w-4/5"></div><div class="skeleton motion-reduce:animate-none h-3 w-3/5"></div></div>
</div>
```

The button version (an action that waits for the server):

```html
<button type="submit" class="btn" disabled aria-busy="true"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="animate-spin motion-reduce:animate-none"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span data-t="loading.button">Saving…</span></button>
```

- Skeletons copy the **shape** of what will come (same rows, same heights, same badge pill) so nothing jumps when it arrives.
- The wrapper has `role="status"` and `aria-busy="true"`, with one hidden sentence for screen readers; the grey shapes are `aria-hidden`.

## States

| State | What changes |
| --- | --- |
| Under 300 ms | Show nothing new (htmx: `hx-indicator` on a class with `transition-delay: 300ms`; JS: `setTimeout(show, 300)`). Avoids a flash. |
| 300 ms – 8 s | The skeleton in place of the content (first load) or the old content at 60 % opacity with `aria-busy="true"` (reload: filters, paging). |
| Over 8 s | Add a line under the skeleton: `loading.slow` and a Cancel button that aborts the request (`htmx.trigger(el, "htmx:abort")` / `AbortController`). |
| A button's action | The button: `disabled`, `aria-busy="true"`, a spinning icon and its `…ing` text; nothing else on the page changes. |
| Loaded | Swap in the content; remove `aria-busy`. Don't animate the swap. |
| Failed | ErrorRetry in the same place. |
| Reduced motion | `animate-pulse` and `animate-spin` stop (`motion-reduce:animate-none`): add it to both. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `loading.label` | Loading notes… | ノートを読み込み中… |
| `loading.slow` | Still loading. This is taking longer than usual. | まだ読み込み中です。いつもより時間がかかっています。 |
| `loading.cancel` | Cancel | キャンセル |
| `loading.button` | Saving… | 保存中… |

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
