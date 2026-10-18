# ExportCsv

Export the rows of a list as a CSV file: choose columns and rows, a file name, a Japanese-safe option for Excel, with progress for large exports.

| | |
| --- | --- |
| Group | Data |
| Basecoat | `dialog`, `fieldset`, `label`, `input` (checkbox, radio), `input-group`, `progress`, `btn`, `alert` |
| Route | A dialog on a list page (for example `/orders`) |
| Needs | Web: `POST /orders/export`, `GET /exports/<id>`; no server: builds the file in the page |
| Links to | DataTable, ListSearch, ProgressStatus, Notifications; used in AppAdmin and AppCrm |

## Markup

```html
<button class="btn" data-variant="outline" type="button" onclick="document.getElementById('export-dialog').showModal()" data-t="export.open">Export CSV…</button>

<dialog id="export-dialog" class="dialog" aria-labelledby="export-title" onclick="if (event.target === this) this.close()">
  <div class="sm:max-w-lg">
    <header><h2 id="export-title" data-t="export.title">Export orders as CSV</h2></header>
    <section>
      <form id="export-form" class="grid gap-4" method="post" action="/orders/export" novalidate>
      <p class="text-sm text-muted-foreground" data-t="export.lede">A CSV file opens in Excel, Numbers, Google Sheets or any text editor.</p>
      <fieldset class="fieldset grid gap-2">
        <legend class="label" data-t="export.columns">Columns</legend>
        <div class="grid grid-cols-2 gap-2"><label class="label gap-2 font-normal"><input class="input" type="checkbox" name="columns" value="number" checked><span data-t="export.col.number">Order</span></label><label class="label gap-2 font-normal"><input class="input" type="checkbox" name="columns" value="date" checked><span data-t="export.col.date">Date</span></label><label class="label gap-2 font-normal"><input class="input" type="checkbox" name="columns" value="customer" checked><span data-t="export.col.customer">Customer</span></label><label class="label gap-2 font-normal"><input class="input" type="checkbox" name="columns" value="email"><span data-t="export.col.email">Email</span></label><label class="label gap-2 font-normal"><input class="input" type="checkbox" name="columns" value="items" checked><span data-t="export.col.items">Items</span></label><label class="label gap-2 font-normal"><input class="input" type="checkbox" name="columns" value="total" checked><span data-t="export.col.total">Total (yen)</span></label><label class="label gap-2 font-normal"><input class="input" type="checkbox" name="columns" value="status" checked><span data-t="export.col.status">Status</span></label></div>
        
      </fieldset>
      <fieldset class="fieldset grid gap-2">
        <legend class="label" data-t="export.rows">Rows</legend>
        <label class="label gap-2 font-normal"><input class="input" type="radio" name="rows" value="all"><span data-t="export.rows.all">All orders (1,284)</span></label>
        <label class="label gap-2 font-normal"><input class="input" type="radio" name="rows" value="filtered" checked><span data-t="export.rows.filtered">The 312 that match your filters</span></label>
        <label class="label gap-2 font-normal"><input class="input" type="radio" name="rows" value="selected" disabled><span data-t="export.rows.selected">The 0 you selected</span></label>
      </fieldset>
      <div class="field">
        <label class="label" for="export-name" data-t="export.file">File name</label>
        <div class="input-group">
          <input id="export-name" name="filename" value="orders-2026-10-18" autocomplete="off" spellcheck="false" class="font-mono">
          <span data-align="inline-end" class="font-mono text-muted-foreground">.csv</span>
        </div>
      </div>
      <label class="label gap-2 font-normal"><input class="input" type="checkbox" name="bom" value="1"><span data-t="export.bom">For Excel (adds a byte-order mark so Japanese shows correctly)</span></label>
      <p class="text-sm text-muted-foreground" data-t="export.format_note">Dates are written 2026-10-18 and money as whole yen, so a spreadsheet can sort and add them.</p>
      </form>
      <div id="export-status" class="grid gap-3" aria-live="polite" hidden></div>
    </section>
    <footer>
      <button class="btn" data-variant="outline" type="button" data-t="export.cancel">Cancel</button>
      <button class="btn" type="submit" form="export-form" data-t="export.submit"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>Export CSV</button>
    </footer>
    <button type="button" class="btn" data-variant="ghost" data-size="icon-sm" aria-label="Close dialog" data-t-label="export.cancel" onclick="this.closest('dialog').close()"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
  </div>
</dialog>

<!-- what #export-status shows while preparing (the form is hidden) -->
<div class="grid gap-2">
  <p id="export-progress-label" class="text-sm" data-t="export.preparing">Preparing 2,400 of 12,800 rows…</p>
  <div class="progress" role="progressbar" aria-labelledby="export-progress-label" aria-valuemin="0" aria-valuemax="12800" aria-valuenow="2400"><span style="width: 19%"></span></div>
  <p class="text-sm text-muted-foreground" data-t="export.background">This is a large export. You can close this; it keeps going, and Notifications tells you when it’s ready.</p>
</div>

<!-- when ready: the footer becomes Done + Download -->
<div class="flex items-start gap-3">
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="size-5 text-muted-foreground"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
  <div class="grid gap-0.5"><p class="font-medium" data-t="export.ready">orders-2026-10-18.csv is ready</p><p class="text-sm text-muted-foreground" data-t="export.ready_detail">312 rows · 48 KB</p></div>
</div>
<a class="btn" href="/exports/381/orders-2026-10-18.csv" data-t="export.download"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>Download</a>
<button class="btn" data-variant="outline" type="button" data-t="export.done">Done</button>

<!-- if it fails -->
<div class="alert" data-variant="destructive" role="alert"><h2 data-t="export.error.failed">The export stopped at row 6,201. Nothing was saved. Try again; if it keeps failing, export fewer rows.</h2><section><div class="mt-2 flex flex-wrap gap-2"><button class="btn" data-variant="outline" data-size="sm" type="button" data-t="export.retry">Try Again</button></div></section></div>
```

- A Basecoat dialog opened from the list's toolbar (DataTable, ListSearch). The form, the progress and the result share one dialog: the form hides while `#export-status` shows progress, then the result.
- **Rows** offers what the person is looking at: everything, the filtered rows (the default when a filter is on), or the selected rows (disabled with a count of 0 when nothing is selected).
- **For Excel** is checked by default when the app's language is Japanese: Excel on Windows reads a CSV without a byte-order mark (BOM) as Shift-JIS and shows Japanese as garbage. The file is always UTF-8.
- Values are written for spreadsheets: dates `2026-10-18`, times `2026-10-18T14:30:00+09:00`, money as whole yen with no symbol or comma, one header row in the app's language.

## States

| State | What changes |
| --- | --- |
| Form | As above; Export CSV is the default button. |
| No column chosen | On submit the Columns fieldset gets `aria-invalid="true"` and `export.error.columns` under it; nothing is sent. |
| Bad file name | The name field gets `aria-invalid="true"` and `export.error.name` (letters, numbers, - and _ only); `.csv` is added by the app, never typed. |
| Preparing (small) | Under 5,000 rows the file is made at once; the button shows `aria-busy="true"` for the second it takes, then Ready. |
| Preparing (large) | `#export-status` shows `export.preparing` with the counts and a Basecoat `progress`, the note `export.background` and **Stop**. Closing the dialog keeps the export going. |
| Ready | `export.ready` (file name) and `export.ready_detail` (rows, size); the footer becomes **Done** and **Download** (a real link to the file). A large export that finished after the dialog closed sends a Notification: `export.notify_ready` → the notification row text. |
| Failed | The destructive alert `export.error.failed` with the row number and **Try Again**; the form comes back as it was. |
| Stopped | Stop ends the export; the form comes back; no file is kept. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `export.open` | Export CSV… | CSVで書き出す… |
| `export.title` | Export orders as CSV | 注文をCSVで書き出す |
| `export.lede` | A CSV file opens in Excel, Numbers, Google Sheets or any text editor. | CSVファイルはExcel、Numbers、Googleスプレッドシート、テキストエディタで開けます。 |
| `export.columns` | Columns | 項目 |
| `export.col.number` | Order | 注文番号 |
| `export.col.date` | Date | 日付 |
| `export.col.customer` | Customer | お客さま |
| `export.col.email` | Email | メールアドレス |
| `export.col.items` | Items | 商品 |
| `export.col.total` | Total (yen) | 合計（円） |
| `export.col.status` | Status | 状態 |
| `export.rows` | Rows | 行 |
| `export.rows.all` | All orders ({count}) | すべての注文（{count}件） |
| `export.rows.filtered` | The {count} that match your filters | 絞り込みに一致する{count}件 |
| `export.rows.selected` | The {count} you selected | 選択した{count}件 |
| `export.file` | File name | ファイル名 |
| `export.bom` | For Excel (adds a byte-order mark so Japanese shows correctly) | Excel用（日本語が正しく表示されるようBOMを付けます） |
| `export.format_note` | Dates are written 2026-10-18 and money as whole yen, so a spreadsheet can sort and add them. | 日付は2026-10-18、金額は円の整数で書き出すので、表計算ソフトで並べ替えや合計ができます。 |
| `export.cancel` | Cancel | キャンセル |
| `export.submit` | Export CSV | CSVを書き出す |
| `export.preparing` | Preparing {done} of {total} rows… | {total}行中{done}行を準備しています… |
| `export.stop` | Stop | 中止 |
| `export.background` | This is a large export. You can close this; it keeps going, and Notifications tells you when it’s ready. | 大きな書き出しです。この画面を閉じても続き、準備ができたら通知でお知らせします。 |
| `export.ready` | {file} is ready | {file}の準備ができました |
| `export.ready_detail` | {rows} rows · {size} | {rows}行・{size} |
| `export.download` | Download | ダウンロード |
| `export.done` | Done | 閉じる |
| `export.error.columns` | Choose at least one column. | 項目を1つ以上選んでください。 |
| `export.error.name` | Use letters, numbers, - and _ only. | 英数字、-、_ だけを使ってください。 |
| `export.error.failed` | The export stopped at row {row}. Nothing was saved. Try again; if it keeps failing, export fewer rows. | {row}行目で書き出しが止まりました。何も保存されていません。もう一度お試しください。続けて失敗する場合は、行を減らしてください。 |
| `export.retry` | Try Again | もう一度試す |
| `export.notify_ready` | Your export {file} is ready to download. | 書き出した{file}をダウンロードできます。 |

## Keyboard and focus

1. Columns (each checkbox) → 2. Rows (arrows between the options) → 3. File name → 4. For Excel → 5. Cancel → 6. Export CSV.
- Opening the dialog focuses the first column checkbox. Esc closes it (an export in progress keeps going).
- When Ready, focus moves to Download.

## Phone

- The dialog fills the width; the columns stay two per row.
- On a phone the download opens the system share sheet or Files; the help text names Numbers and Google Sheets first.

## Data

```json
{"request": {"columns": ["number", "date", "customer", "items", "total", "status"], "rows": "filtered",
             "filters": {"status": "paid", "q": ""}, "filename": "orders-2026-10-18", "bom": true},
 "job": {"id": 381, "state": "running | ready | failed | stopped", "done": 2400, "total": 12800,
         "file": "orders-2026-10-18.csv", "bytes": 49152, "failed_at": null}}
```

- Web: `POST /orders/export` → small: the file at once (`Content-Disposition: attachment`); large: 202 with the job, then `GET /exports/381` polled by htmx every second (`hx-trigger="every 1s"`) until ready; `GET /exports/381/<file>` downloads. Write with Python's `csv` module, encoding `utf-8-sig` when `bom` is on.
- No server: build the CSV in the page (`Blob`, `URL.createObjectURL`, an `<a download>`), adding `\ufeff` at the start when `bom` is on.

## Don't

- Don't format numbers with commas or the yen sign in the file, or dates in the display format.
- Don't write Shift-JIS; UTF-8 with an optional BOM is the one format.
- Don't start a download the person didn't press for (a large export waits for Download).
