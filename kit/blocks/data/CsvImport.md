# CsvImport

App Block card (Data). Bring records in from a CSV file in four steps: choose the file, match its columns to the app's fields, check a preview that marks bad rows, then import with progress and a report.

- Basecoat: `card`, `btn`, `select`, `label`, `table`, `badge`, `alert`, `progress`, `empty`
- Route: `/contacts/import` (any list that takes imports)
- Needs: Web: `POST /imports` (the file, returns columns and a preview), `POST /imports/{id}/run` (the mapping), `GET /imports/{id}` (progress and report). No server: parse in the page (`js/csv.mjs`, RFC 4180), `store.importRows(rows)`.
- Links to: FileUpload (step 1), Stepper (the steps), DataTable (preview), ProgressStatus, ExportCsv (the reverse), AppCrm, AppAdmin

## Markup
Copy, never retype: `{harness}/kit/blocks/data/CsvImport.html` (36 lines of HTML).

- Step 1 is FileUpload limited to `.csv,text/csv` (one file, up to 10 MB), with **Use a Sample File** to download the expected columns.
- Columns are matched by name automatically (English and Japanese headers: `Name`/`氏名`/`名前`, `Email`/`メール`/`Mail`…); a required field with no column shows its row in `text-destructive` with `import.required`.
- Step 3 shows the first 20 rows as a DataTable; a bad row gets `bg-destructive/10` and its problem in an extra column (`import.row_error`). A summary above: `import.check_summary`.

Step 3, the import and the report:

Copy, never retype: `{harness}/kit/blocks/data/CsvImport.2.html` (19 lines of HTML).

## States
- 1 · No file: FileUpload's drop zone; **Check Rows** disabled.
- File refused: InlineAlert: `import.error.type` (not CSV) or `import.error.size`; or `import.error.encoding` when it isn't UTF-8 or Shift_JIS (both are read).
- 2 · Columns: The table above; **Check Rows** disabled while a required field is unmatched (`import.required`). Two columns into one field: the second shows `import.duplicate`.
- 3 · Check: Summary `import.check_summary`; bad rows marked; a checkbox **Skip rows with problems** (on). **Import {n} Rows** (`import.run`) is the default.
- 4 · Importing: A `progress` with `aria-valuenow`, `import.progress` underneath; **Cancel Import** stops after the current batch (rows already in stay, the report says so). The person can leave; a toast says `import.done_toast` when it ends.
- Report: `import.report.title`; counts (`import.report.added`, `import.report.updated`, `import.report.skipped`); **Download Skipped Rows** (a CSV with a `problem` column) and **View Contacts**.
- Failed: InlineAlert `import.error.run` with **Try Again**; nothing was imported.

## Texts
(Key | English | 日本語)
- `import.title`: Import contacts | 連絡先をインポート
- `import.steps`: Steps | 手順
- `import.step.file`: File | ファイル
- `import.step.columns`: Columns | 列
- `import.step.check`: Check | 確認
- `import.step.import`: Import | インポート
- `import.file_summary`: {file} · {rows} rows · {columns} columns | {file}・{rows}行・{columns}列
- `import.col.file`: Column in the file | ファイルの列
- `import.col.example`: Example | 例
- `import.col.field`: Goes into | 取り込み先
- `import.map_label`: Field for column {column} | 列「{column}」の取り込み先
- `import.skip`: Don’t import | 取り込まない
- `import.has_header`: The first row holds column names | 1行目は列名
- `import.back`: Back | 戻る
- `import.next`: Check Rows | 行を確認
- `import.required`: {field} is required. Choose the column that holds it. | {field}は必須です。該当する列を選んでください。
- `import.duplicate`: Another column already goes into {field}. | 別の列がすでに{field}に割り当てられています。
- `import.check_summary`: {ok} rows are ready, {bad} have problems. | {ok}行は取り込めます。{bad}行に問題があります。
- `import.row_error`: Problem | 問題
- `import.skip_bad`: Skip rows with problems | 問題のある行を除く
- `import.run`: Import {n} Rows | {n}行をインポート
- `import.progress`: {done} of {total} rows | {total}行中{done}行
- `import.cancel`: Cancel Import | インポートを中止
- `import.progress_label`: Import progress | インポートの進み具合
- `import.done_toast`: Import finished: {added} added | インポートが完了しました：{added}件追加
- `import.report.title`: Import finished | インポートが完了しました
- `import.report.added`: {n} added | {n}件追加
- `import.report.updated`: {n} updated (same email) | {n}件更新（同じメールアドレス）
- `import.report.skipped`: {n} skipped | {n}件スキップ
- `import.download_skipped`: Download Skipped Rows | スキップした行をダウンロード
- `import.view`: View Contacts | 連絡先を表示
- `import.error.type`: That isn’t a CSV file. Save it as CSV and try again. | CSV ファイルではありません。CSV 形式で保存してからお試しください。
- `import.error.size`: The file is over 10 MB. Split it into smaller files. | 10 MB を超えています。小さなファイルに分けてください。
- `import.error.encoding`: The file’s text couldn’t be read. Save it as UTF-8. | ファイルの文字を読み取れませんでした。UTF-8 で保存してください。
- `import.error.run`: The import stopped and nothing was added. | インポートが止まり、何も追加されませんでした。
- `field.name`: Name | 氏名
- `field.email`: Email | メールアドレス

## Keyboard and focus
1. Steps are not links (you can't skip ahead) → 2. each mapping select in row order → 3. the header checkbox → 4. Back → 5. Check Rows.
- Each step moves focus to its heading. Errors move focus to the first problem.

## Phone
- The mapping table becomes a list: each column a block with its name, example and the select underneath (`@max-3xl:` turns rows into `grid` blocks).
- The preview table scrolls sideways inside `.table-container`; the problem column stays first on the phone.
- Step labels shrink to numbers with the current one named.

## Data
```json
{"import": {"id": 9, "file": "customers-oct.csv", "rows": 248, "encoding": "shift_jis",
            "columns": ["氏名", "Mail", "電話", "会社", "メモ"],
            "mapping": {"氏名": "name", "Mail": "email", "電話": "phone", "会社": "company", "メモ": null},
            "status": "running", "done": 120,
            "report": {"added": 231, "updated": 9, "skipped": 8, "problems": [{"row": 17, "problem": "Email isn’t valid"}]}}}
```

- Web: `POST /imports` (multipart) → 201 with columns and the first 20 rows; `POST /imports/9/run` (`mapping`, `skip_bad`) → 202; poll `GET /imports/9` every second (htmx `hx-trigger="every 1s"`) until `status` is `done` or `failed`.
- No server: parse and validate in the page; `store.importRows(rows)` in batches of 100, with a progress callback.
- Matching: rows with an email that exists update that record; others are added.

## Don't
- Don't import without the Check step.
- Don't fail the whole file for a few bad rows; skip and report them.
- Don't guess a field for a column with no matching name; leave it on Don't import.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> CsvImport` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
