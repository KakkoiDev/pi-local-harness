# ProgressStatus

Show that something takes time and how far it is: a bar when the amount is known, a spinner with a sentence when it isn't, and a way to cancel long work.

| | |
| --- | --- |
| Group | Feedback |
| Basecoat | `progress`, `btn`, `card` |
| Needs | A progress number (0–100) or a count (done/total) from the work |
| Used in | FileUpload, DeleteAccount (export), Onboarding (import), UpdateAvailable, Checkout (paying) |

## Markup

Known amount (determinate):

```html
<div class="grid gap-2" id="import-progress">
  <div class="flex items-baseline justify-between gap-4 text-sm">
    <span id="import-progress-label" data-t="progress.import">Importing notes</span>
    <span class="text-muted-foreground tabular-nums" data-t="progress.count">36 of 120</span>
  </div>
  <div class="progress" role="progressbar" aria-labelledby="import-progress-label" aria-valuemin="0" aria-valuemax="120" aria-valuenow="36" aria-valuetext="36 of 120">
    <span style="width: 30%"></span>
  </div>
  <div class="flex items-center justify-between gap-4">
    <span class="text-muted-foreground text-sm" data-t="progress.time_left">About 1 minute left</span>
    <button class="btn" data-variant="ghost" data-size="sm" type="button" data-t="common.cancel">Cancel</button>
  </div>
</div>
```

Unknown amount (indeterminate), inline:

```html
<p class="flex items-center gap-2 text-sm" role="status">
  <svg class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
  <span data-t="progress.preparing">Preparing your file…</span>
</p>
```

Inside a button that started the work: `disabled aria-busy="true"` and the button's own `…ing` text (see LogIn); no separate spinner.

## States

| State | What changes |
| --- | --- |
| Starting | Show nothing for the first 400 ms (fast work shouldn't flash); then the indeterminate line. |
| Known progress | The bar; update `aria-valuenow`, `aria-valuetext` and the span width at most 4 times a second. |
| Unknown progress | The spinner line; after 10 s add `progress.still_working` in muted text. |
| Paused (offline) | Bar stays; label becomes `progress.paused`; the time-left line is replaced by `progress.paused_hint`. |
| Failed | The bar is removed; an InlineAlert `data-variant="destructive"` titled `progress.failed_title` with `progress.failed_body` (what finished and what didn't) and Try Again. |
| Done | The bar fills, then is replaced by the result (the list, a toast `progress.done`). Focus stays where it was. |
| Cancelled | Work stops; `progress.cancelled` with what was kept ("36 notes were imported"). |
| Reduced motion | The spinner doesn't spin (`motion-reduce:animate-none`); the text carries the meaning. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `progress.import` | Importing notes | ノートを読み込み中 |
| `progress.count` | {done} of {total} | {total} 件中 {done} 件 |
| `progress.time_left` | About {minutes} minute left | 残り約 {minutes} 分 |
| `progress.preparing` | Preparing your file… | ファイルを準備しています… |
| `progress.still_working` | Still working. Large files take longer. | 処理中です。大きなファイルは時間がかかります。 |
| `progress.paused` | Paused: you’re offline | 一時停止中：オフラインです |
| `progress.paused_hint` | It continues when you’re back online. | オンラインに戻ると再開します。 |
| `progress.failed_title` | Import stopped at {done} of {total} | {total} 件中 {done} 件で読み込みが止まりました |
| `progress.failed_body` | The file has a row we can’t read (row {row}). {done} notes were imported. | 読み取れない行があります（{row} 行目）。{done} 件のノートは読み込まれました。 |
| `progress.keep_open` | Keep this page open until it finishes. | 完了するまでこのページを開いたままにしてください。 |
| `common.try_again` | Try Again | もう一度試す |
| `progress.done` | Imported {count} notes | {count} 件のノートを読み込みました |
| `progress.cancelled` | Stopped. {count} notes were imported. | 停止しました。{count} 件のノートを読み込みました。 |
| `common.cancel` | Cancel | キャンセル |

## Keyboard and focus

- The progress block never takes focus. Screen readers read the bar's `aria-valuetext` when focused through the list and the `role="status"` line when it changes.
- Cancel is a normal button in the Tab order; Esc does not cancel (it might close something else).

## Phone

- The bar is full width; the count sits right of the label, the time-left line under it.
- Long work keeps going when the phone locks only if it runs on the server; for no-server apps, say `progress.keep_open` ("Keep this page open until it finishes." / 「完了するまでこのページを開いたままにしてください。」).

## Data

```json
{"label": "Importing notes", "done": 36, "total": 120, "eta_seconds": 55, "state": "running | paused | failed | done | cancelled"}
```

- Web: poll `GET /jobs/{id}` every second with `hx-get … hx-trigger="every 1s"` and return the fragment; return status 286 to stop polling when done.
- No server: update from the loop that does the work; yield with `await new Promise(requestAnimationFrame)` between batches.

## Don't

- Don't show a percentage that jumps backwards, or a bar for work whose length you don't know.
- Don't block the whole page with an overlay for work that can run in the background.
- Don't show a spinner for under 400 ms.
