# ErrorRetry

What shows when something fails: what happened in plain words, that nothing was lost, and a Try Again button, in the place the content would have been.

| | |
| --- | --- |
| Group | Data |
| Basecoat | `alert` (`data-variant="destructive"`), `empty`, `btn` |
| Needs | The failed request to repeat; a short error reference from the server for the page version |
| Used in | Every block that loads or saves: ListSearch, DataTable, DetailView, EditForm, Dashboard, Tabs panels |
| Links to | OfflineBanner (no connection at all), LoadingState (while retrying), Toasts (a background action failed) |

## Markup

Section version (one part of a page failed):

```html
<div data-region>
<div class="alert" data-variant="destructive" role="alert">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
  <h2 data-t="error.section_title">Couldn’t load your notes</h2>
  <section>
    <p data-t="error.section_text">The connection dropped or the server didn’t answer. Your notes are safe.</p>
    <button type="button" class="btn mt-3" data-variant="outline" data-size="sm" hx-get="/notes/list" hx-target="closest [data-region]" hx-swap="innerHTML"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg><span data-t="error.retry">Try Again</span></button>
  </section>
</div>
</div>
```

Page version (the whole page failed: 500, 404):

```html
<main class="app grid min-h-dvh place-items-center p-6">
  <div class="empty">
    <header>
      <figure><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg></figure>
      <h1 class="text-lg font-medium" data-t="error.page_title">Something went wrong on our side</h1>
      <p data-t="error.page_text">This page couldn’t be shown. Try again, or go back to the start.</p>
    </header>
    <footer class="flex-row flex-wrap justify-center gap-2 @max-3xl:flex-col @max-3xl:items-stretch">
    <button type="button" class="btn" onclick="location.reload()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg><span data-t="error.retry">Try Again</span></button>
    <a href="/" class="btn" data-variant="outline" data-t="error.home">Go Home</a>
    </footer>
    <p class="font-mono text-xs text-muted-foreground" data-t="error.code">Error 500 · a7f3c2</p>
  </div>
</main>
```

- Three sizes: **section** (a list or panel: alert in its place), **inline** (a save: alert at the top of the form, the person's input kept), **page** (the route itself failed: the page version with the status code and a reference to quote).
- Every error says what happened and what to do; never just “Error”.

## States

| State | What changes |
| --- | --- |
| Failed to load (section) | The alert replaces the content inside `[data-region]`. |
| Retrying | Try Again gets `aria-busy="true"`, `disabled` and `error.retrying`; on success the region refills. |
| Failed again | Keep the alert; after the 3rd failure add the reference (`error.code`) under the text. |
| Failed to save (inline) | At the top of the form: `error.save_title`, `error.save_text`; the fields keep everything typed; Save works again. |
| 404 | Page version with `error.not_found_*`, Go Home only; status 404. |
| 500 | Page version with Try Again and Go Home, and `Error 500 · <ref>`; status 500. The reference is the server's log id. |
| Offline | Don't show this: OfflineBanner handles it and retries when back online. |
| Permission (403) | Not an error to retry: DetailView's no-access state. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `error.section_title` | Couldn’t load your notes | ノートを読み込めませんでした |
| `error.section_text` | The connection dropped or the server didn’t answer. Your notes are safe. | 接続が切れたか、サーバーが応答しませんでした。ノートは失われていません。 |
| `error.retry` | Try Again | 再試行 |
| `error.retrying` | Trying Again… | 再試行中… |
| `error.save_title` | Couldn’t save | 保存できませんでした |
| `error.save_text` | Your changes are still here. Try again in a moment. | 変更内容はそのまま残っています。少し待ってからもう一度お試しください。 |
| `error.page_title` | Something went wrong on our side | サーバー側で問題が発生しました |
| `error.page_text` | This page couldn’t be shown. Try again, or go back to the start. | このページを表示できませんでした。再試行するか、ホームに戻ってください。 |
| `error.home` | Go Home | ホームへ |
| `error.code` | Error {code} · {ref} | エラー {code} · {ref} |
| `error.not_found_title` | This page doesn’t exist | このページは存在しません |
| `error.not_found_text` | The link may be old or mistyped. | リンクが古いか、入力が間違っている可能性があります。 |

## Keyboard and focus

- Section version: focus is not moved (the alert's `role="alert"` is announced). Try Again is the next stop in the Tab order after the filters.
- Inline (save): focus moves to the alert (`tabindex="-1"`) so the person hears it, then Try Again.
- Page version: focus starts on the `<h1>`; Tab → Try Again → Go Home.

## Phone

- Same content; buttons full width in the page version (`@max-3xl:flex-col`). The reference text wraps.

## Data

```json
{"status": 500, "ref": "a7f3c2", "retry": {"method": "GET", "url": "/notes/list"}}
```

- Web: an htmx error (`htmx:responseError`, `htmx:sendError`) swaps in the section version with the same `hx-get` as the region. FastAPI exception handlers render the page version for 404 and 500 with a `ref` from the request id.
- No server: wrap store calls in `try/catch`; IndexedDB `QuotaExceededError` gets its own message (“This device is out of space for notes”).

## Don't

- Don't show stack traces, SQL or English-only server messages to the person.
- Don't retry automatically more than once; let the person press Try Again.
- Don't clear a form after a failed save.
