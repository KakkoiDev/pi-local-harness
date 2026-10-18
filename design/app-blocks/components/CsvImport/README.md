# CsvImport

Bring records in from a CSV file in four steps: choose the file, match its columns to the app's fields, check a preview that marks bad rows, then import with progress and a report.

| | |
| --- | --- |
| Group | Data |
| Basecoat | `card`, `btn`, `select`, `label`, `table`, `badge`, `alert`, `progress`, `empty` |
| Route | `/contacts/import` (any list that takes imports) |
| Needs | Web: `POST /imports` (the file, returns columns and a preview), `POST /imports/{id}/run` (the mapping), `GET /imports/{id}` (progress and report). No server: parse in the page (`js/csv.mjs`, RFC 4180), `store.importRows(rows)`. |
| Links to | FileUpload (step 1), Stepper (the steps), DataTable (preview), ProgressStatus, ExportCsv (the reverse), AppCrm, AppAdmin |

## Markup

```html
<section class="card mx-auto w-full max-w-3xl" aria-labelledby="imp-title">
  <header class="grid gap-3">
    <h2 id="imp-title" class="text-lg font-semibold" data-t="import.title">Import contacts</h2>
    <ol class="flex flex-wrap gap-2 text-sm" aria-label="Steps" data-t-label="import.steps">
      <li class="flex items-center gap-1.5 text-muted-foreground"><span class="badge" data-variant="secondary">1</span><span data-t="import.step.file">File</span></li>
      <li class="flex items-center gap-1.5 font-medium" aria-current="step"><span class="badge">2</span><span data-t="import.step.columns">Columns</span></li>
      <li class="flex items-center gap-1.5 text-muted-foreground"><span class="badge" data-variant="outline">3</span><span data-t="import.step.check">Check</span></li>
      <li class="flex items-center gap-1.5 text-muted-foreground"><span class="badge" data-variant="outline">4</span><span data-t="import.step.import">Import</span></li>
    </ol>
  </header>
  <section class="grid gap-3">
    <p class="text-sm text-muted-foreground" data-t="import.file_summary">customers-oct.csv · 248 rows · 5 columns</p>
    <div class="table-container">
      <table class="table">
        <thead><tr><th data-t="import.col.file">Column in the file</th><th data-t="import.col.example">Example</th><th data-t="import.col.field">Goes into</th></tr></thead>
        <tbody>
          <tr>
            <td class="font-medium">氏名</td><td class="text-muted-foreground">佐藤 蓮</td>
            <td><select class="select" id="map-0" aria-label="Field for column 氏名" data-t-label="import.map_label">
              <option value="name" selected data-t="field.name">Name</option><option value="" data-t="import.skip">Don’t import</option></select></td>
          </tr>
          <tr>
            <td class="font-medium">Mail</td><td class="text-muted-foreground">ren@example.com</td>
            <td><select class="select" id="map-1" aria-label="Field for column Mail" data-t-label="import.map_label">
              <option value="email" selected data-t="field.email">Email</option><option value="" data-t="import.skip">Don’t import</option></select></td>
          </tr>
        </tbody>
      </table>
    </div>
    <label class="label gap-2 font-normal"><input class="input" type="checkbox" name="has_header" checked><span data-t="import.has_header">The first row holds column names</span></label>
  </section>
  <footer class="flex flex-wrap justify-between gap-2">
    <button class="btn" data-variant="outline" type="button" data-t="import.back">Back</button>
    <button class="btn" type="button" data-t="import.next">Check Rows</button>
  </footer>
</section>
```

- Step 1 is FileUpload limited to `.csv,text/csv` (one file, up to 10 MB), with **Use a Sample File** to download the expected columns.
- Columns are matched by name automatically (English and Japanese headers: `Name`/`氏名`/`名前`, `Email`/`メール`/`Mail`…); a required field with no column shows its row in `text-destructive` with `import.required`.
- Step 3 shows the first 20 rows as a DataTable; a bad row gets `bg-destructive/10` and its problem in an extra column (`import.row_error`). A summary above: `import.check_summary`.

Step 3, the import and the report:

```html
<p class="text-sm" data-t="import.check_summary">240 rows are ready, 8 have problems.</p>
<!-- the preview table: bad rows <tr class="bg-destructive/10"> with the problem in the first cell, text-destructive -->
<label class="label gap-2 font-normal"><input class="input" type="checkbox" name="skip_bad" checked><span data-t="import.skip_bad">Skip rows with problems</span></label>
<button class="btn" type="submit" data-t="import.run">Import 240 Rows</button>

<div class="progress" role="progressbar" aria-valuenow="48" aria-valuemin="0" aria-valuemax="100" aria-label="Import progress" data-t-label="import.progress_label"><span style="width: 48%"></span></div>
<p class="text-sm text-muted-foreground" aria-live="polite" data-t="import.progress">120 of 248 rows</p>
<button class="btn" data-variant="outline" type="button" data-t="import.cancel">Cancel Import</button>

<h3 class="font-semibold" data-t="import.report.title">Import finished</h3>
<ul class="grid gap-1 text-sm">
  <li class="font-medium text-success" data-t="import.report.added">231 added</li>
  <li data-t="import.report.updated">9 updated (same email)</li>
  <li class="text-muted-foreground" data-t="import.report.skipped">8 skipped</li>
</ul>

<!-- step 2, a required field with no column -->
<p class="text-destructive text-sm" data-t="import.required">Email is required. Choose the column that holds it.</p>
<p class="text-destructive text-sm" data-t="import.duplicate">Another column already goes into Email.</p>
```

## States

| State | What changes |
| --- | --- |
| 1 · No file | FileUpload's drop zone; **Check Rows** disabled. |
| File refused | InlineAlert: `import.error.type` (not CSV) or `import.error.size`; or `import.error.encoding` when it isn't UTF-8 or Shift_JIS (both are read). |
| 2 · Columns | The table above; **Check Rows** disabled while a required field is unmatched (`import.required`). Two columns into one field: the second shows `import.duplicate`. |
| 3 · Check | Summary `import.check_summary`; bad rows marked; a checkbox **Skip rows with problems** (on). **Import {n} Rows** (`import.run`) is the default. |
| 4 · Importing | A `progress` with `aria-valuenow`, `import.progress` underneath; **Cancel Import** stops after the current batch (rows already in stay, the report says so). The person can leave; a toast says `import.done_toast` when it ends. |
| Report | `import.report.title`; counts (`import.report.added`, `import.report.updated`, `import.report.skipped`); **Download Skipped Rows** (a CSV with a `problem` column) and **View Contacts**. |
| Failed | InlineAlert `import.error.run` with **Try Again**; nothing was imported. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `import.title` | Import contacts | 連絡先をインポート |
| `import.steps` | Steps | 手順 |
| `import.step.file` | File | ファイル |
| `import.step.columns` | Columns | 列 |
| `import.step.check` | Check | 確認 |
| `import.step.import` | Import | インポート |
| `import.file_summary` | {file} · {rows} rows · {columns} columns | {file}・{rows}行・{columns}列 |
| `import.col.file` | Column in the file | ファイルの列 |
| `import.col.example` | Example | 例 |
| `import.col.field` | Goes into | 取り込み先 |
| `import.map_label` | Field for column {column} | 列「{column}」の取り込み先 |
| `import.skip` | Don’t import | 取り込まない |
| `import.has_header` | The first row holds column names | 1行目は列名 |
| `import.back` | Back | 戻る |
| `import.next` | Check Rows | 行を確認 |
| `import.required` | {field} is required. Choose the column that holds it. | {field}は必須です。該当する列を選んでください。 |
| `import.duplicate` | Another column already goes into {field}. | 別の列がすでに{field}に割り当てられています。 |
| `import.check_summary` | {ok} rows are ready, {bad} have problems. | {ok}行は取り込めます。{bad}行に問題があります。 |
| `import.row_error` | Problem | 問題 |
| `import.skip_bad` | Skip rows with problems | 問題のある行を除く |
| `import.run` | Import {n} Rows | {n}行をインポート |
| `import.progress` | {done} of {total} rows | {total}行中{done}行 |
| `import.cancel` | Cancel Import | インポートを中止 |
| `import.progress_label` | Import progress | インポートの進み具合 |
| `import.done_toast` | Import finished: {added} added | インポートが完了しました：{added}件追加 |
| `import.report.title` | Import finished | インポートが完了しました |
| `import.report.added` | {n} added | {n}件追加 |
| `import.report.updated` | {n} updated (same email) | {n}件更新（同じメールアドレス） |
| `import.report.skipped` | {n} skipped | {n}件スキップ |
| `import.download_skipped` | Download Skipped Rows | スキップした行をダウンロード |
| `import.view` | View Contacts | 連絡先を表示 |
| `import.error.type` | That isn’t a CSV file. Save it as CSV and try again. | CSV ファイルではありません。CSV 形式で保存してからお試しください。 |
| `import.error.size` | The file is over 10 MB. Split it into smaller files. | 10 MB を超えています。小さなファイルに分けてください。 |
| `import.error.encoding` | The file’s text couldn’t be read. Save it as UTF-8. | ファイルの文字を読み取れませんでした。UTF-8 で保存してください。 |
| `import.error.run` | The import stopped and nothing was added. | インポートが止まり、何も追加されませんでした。 |
| `field.name` | Name | 氏名 |
| `field.email` | Email | メールアドレス |

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
