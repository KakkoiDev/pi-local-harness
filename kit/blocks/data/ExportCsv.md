# ExportCsv

App Block card (Data). Export the rows of a list as a CSV file: choose columns and rows, a file name, a Japanese-safe option for Excel, with progress for large exports.

- Basecoat: `dialog`, `fieldset`, `label`, `input` (checkbox, radio), `input-group`, `progress`, `btn`, `alert`
- Route: A dialog on a list page (for example `/orders`)
- Needs: Web: `POST /orders/export`, `GET /exports/<id>`; no server: builds the file in the page
- Links to: DataTable, ListSearch, ProgressStatus, Notifications; used in AppAdmin and AppCrm

## Markup
Copy, never retype: `{harness}/kit/blocks/data/ExportCsv.html` (56 lines of HTML).

- A Basecoat dialog opened from the list's toolbar (DataTable, ListSearch). The form, the progress and the result share one dialog: the form hides while `#export-status` shows progress, then the result.
- **Rows** offers what the person is looking at: everything, the filtered rows (the default when a filter is on), or the selected rows (disabled with a count of 0 when nothing is selected).
- **For Excel** is checked by default when the app's language is Japanese: Excel on Windows reads a CSV without a byte-order mark (BOM) as Shift-JIS and shows Japanese as garbage. The file is always UTF-8.
- Values are written for spreadsheets: dates `2026-10-18`, times `2026-10-18T14:30:00+09:00`, money as whole yen with no symbol or comma, one header row in the app's language.

## States
- Form: As above; Export CSV is the default button.
- No column chosen: On submit the Columns fieldset gets `aria-invalid="true"` and `export.error.columns` under it; nothing is sent.
- Bad file name: The name field gets `aria-invalid="true"` and `export.error.name` (letters, numbers, - and _ only); `.csv` is added by the app, never typed.
- Preparing (small): Under 5,000 rows the file is made at once; the button shows `aria-busy="true"` for the second it takes, then Ready.
- Preparing (large): `#export-status` shows `export.preparing` with the counts and a Basecoat `progress`, the note `export.background` and **Stop**. Closing the dialog keeps the export going.
- Ready: `export.ready` (file name) and `export.ready_detail` (rows, size); the footer becomes **Done** and **Download** (a real link to the file). A large export that finished after the dialog closed sends a Notification: `export.notify_ready` → the notification row text.
- Failed: The destructive alert `export.error.failed` with the row number and **Try Again**; the form comes back as it was.
- Stopped: Stop ends the export; the form comes back; no file is kept.

## Texts
(Key | English | 日本語)
- `export.open`: Export CSV… | CSVで書き出す…
- `export.title`: Export orders as CSV | 注文をCSVで書き出す
- `export.lede`: A CSV file opens in Excel, Numbers, Google Sheets or any text editor. | CSVファイルはExcel、Numbers、Googleスプレッドシート、テキストエディタで開けます。
- `export.columns`: Columns | 項目
- `export.col.number`: Order | 注文番号
- `export.col.date`: Date | 日付
- `export.col.customer`: Customer | お客さま
- `export.col.email`: Email | メールアドレス
- `export.col.items`: Items | 商品
- `export.col.total`: Total (yen) | 合計（円）
- `export.col.status`: Status | 状態
- `export.rows`: Rows | 行
- `export.rows.all`: All orders ({count}) | すべての注文（{count}件）
- `export.rows.filtered`: The {count} that match your filters | 絞り込みに一致する{count}件
- `export.rows.selected`: The {count} you selected | 選択した{count}件
- `export.file`: File name | ファイル名
- `export.bom`: For Excel (adds a byte-order mark so Japanese shows correctly) | Excel用（日本語が正しく表示されるようBOMを付けます）
- `export.format_note`: Dates are written 2026-10-18 and money as whole yen, so a spreadsheet can sort and add them. | 日付は2026-10-18、金額は円の整数で書き出すので、表計算ソフトで並べ替えや合計ができます。
- `export.cancel`: Cancel | キャンセル
- `export.submit`: Export CSV | CSVを書き出す
- `export.preparing`: Preparing {done} of {total} rows… | {total}行中{done}行を準備しています…
- `export.stop`: Stop | 中止
- `export.background`: This is a large export. You can close this; it keeps going, and Notifications tells you when it’s ready. | 大きな書き出しです。この画面を閉じても続き、準備ができたら通知でお知らせします。
- `export.ready`: {file} is ready | {file}の準備ができました
- `export.ready_detail`: {rows} rows · {size} | {rows}行・{size}
- `export.download`: Download | ダウンロード
- `export.done`: Done | 閉じる
- `export.error.columns`: Choose at least one column. | 項目を1つ以上選んでください。
- `export.error.name`: Use letters, numbers, - and _ only. | 英数字、-、_ だけを使ってください。
- `export.error.failed`: The export stopped at row {row}. Nothing was saved. Try again; if it keeps failing, export fewer rows. | {row}行目で書き出しが止まりました。何も保存されていません。もう一度お試しください。続けて失敗する場合は、行を減らしてください。
- `export.retry`: Try Again | もう一度試す
- `export.notify_ready`: Your export {file} is ready to download. | 書き出した{file}をダウンロードできます。

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> ExportCsv` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
