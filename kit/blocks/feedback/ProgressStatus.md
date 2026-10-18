# ProgressStatus

App Block card (Feedback). Show that something takes time and how far it is: a bar when the amount is known, a spinner with a sentence when it isn't, and a way to cancel long work.

- Basecoat: `progress`, `btn`, `card`
- Needs: A progress number (0–100) or a count (done/total) from the work
- Used in: FileUpload, DeleteAccount (export), Onboarding (import), UpdateAvailable, Checkout (paying)

## Markup
Known amount (determinate):

Copy, never retype: `{harness}/kit/blocks/feedback/ProgressStatus.html` (13 lines of HTML).

Unknown amount (indeterminate), inline:

Copy, never retype: `{harness}/kit/blocks/feedback/ProgressStatus.2.html` (4 lines of HTML).

Inside a button that started the work: `disabled aria-busy="true"` and the button's own `…ing` text (see LogIn); no separate spinner.

## States
- Starting: Show nothing for the first 400 ms (fast work shouldn't flash); then the indeterminate line.
- Known progress: The bar; update `aria-valuenow`, `aria-valuetext` and the span width at most 4 times a second.
- Unknown progress: The spinner line; after 10 s add `progress.still_working` in muted text.
- Paused (offline): Bar stays; label becomes `progress.paused`; the time-left line is replaced by `progress.paused_hint`.
- Failed: The bar is removed; an InlineAlert `data-variant="destructive"` titled `progress.failed_title` with `progress.failed_body` (what finished and what didn't) and Try Again.
- Done: The bar fills, then is replaced by the result (the list, a toast `progress.done`). Focus stays where it was.
- Cancelled: Work stops; `progress.cancelled` with what was kept ("36 notes were imported").
- Reduced motion: The spinner doesn't spin (`motion-reduce:animate-none`); the text carries the meaning.

## Texts
(Key | English | 日本語)
- `progress.import`: Importing notes | ノートを読み込み中
- `progress.count`: {done} of {total} | {total} 件中 {done} 件
- `progress.time_left`: About {minutes} minute left | 残り約 {minutes} 分
- `progress.preparing`: Preparing your file… | ファイルを準備しています…
- `progress.still_working`: Still working. Large files take longer. | 処理中です。大きなファイルは時間がかかります。
- `progress.paused`: Paused: you’re offline | 一時停止中：オフラインです
- `progress.paused_hint`: It continues when you’re back online. | オンラインに戻ると再開します。
- `progress.failed_title`: Import stopped at {done} of {total} | {total} 件中 {done} 件で読み込みが止まりました
- `progress.failed_body`: The file has a row we can’t read (row {row}). {done} notes were imported. | 読み取れない行があります（{row} 行目）。{done} 件のノートは読み込まれました。
- `progress.keep_open`: Keep this page open until it finishes. | 完了するまでこのページを開いたままにしてください。
- `common.try_again`: Try Again | もう一度試す
- `progress.done`: Imported {count} notes | {count} 件のノートを読み込みました
- `progress.cancelled`: Stopped. {count} notes were imported. | 停止しました。{count} 件のノートを読み込みました。
- `common.cancel`: Cancel | キャンセル

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ProgressStatus` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
