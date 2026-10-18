# CodeDiff

A file viewer for code with line numbers, and the same viewer showing a change: removed lines, added lines, unchanged context folded, unified or side by side.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `btn`, `button-group`, `badge`, `tabs`, `scrollbar` |
| Route | `/r/{repo}/blob/{ref}/{path}` (file), `/r/{repo}/compare/{base}...{head}` (diff) |
| Needs | Web: `GET /r/{repo}/blob/...` (rendered lines), `GET /r/{repo}/diff?base=&head=&path=` (hunks). No server: works on files the person opens (`File` API) with a diff computed in the browser. Blocks: FileTree, PullReview, Comments, ShortcutHelp |
| Used in | AppCode |

## Markup

```html
<section class="overflow-hidden rounded-lg border" aria-labelledby="diff-file">
  <header class="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-3 py-2 text-sm">
    <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" aria-expanded="true" aria-controls="diff-body" aria-label="Fold file" data-t-label="diff.fold">▾</button>
    <h3 id="diff-file" class="font-mono text-sm">app/trips.py</h3>
    <span class="text-xs"><span class="text-green-700 dark:text-green-400">+6</span> <span class="text-red-700 dark:text-red-400">−2</span></span>
    <div class="button-group ml-auto" role="group" aria-label="View">
      <button class="btn" data-variant="secondary" data-size="sm" type="button" aria-pressed="true" data-t="diff.unified">Unified</button>
      <button class="btn" data-variant="outline" data-size="sm" type="button" aria-pressed="false" data-t="diff.split">Split</button>
    </div>
  </header>
  <div id="diff-body" class="scrollbar overflow-x-auto">
    <table class="w-full border-collapse font-mono text-[13px] leading-5" role="table" aria-label="Changes in app/trips.py">
      <tbody>
        <tr class="bg-muted/60 text-muted-foreground"><td colspan="3" class="px-3 py-1">
          <button class="btn h-6" data-variant="ghost" data-size="sm" type="button" data-t="diff.expand">Show 12 hidden lines</button> @@ def book_trip @@</td></tr>
        <tr><td class="w-12 select-none px-2 text-right text-muted-foreground">14</td><td class="w-12 select-none px-2 text-right text-muted-foreground">14</td>
            <td class="whitespace-pre px-3"><span class="select-none"> </span>    seats = trip.seats</td></tr>
        <tr class="bg-red-500/10"><td class="px-2 text-right text-muted-foreground">15</td><td></td>
            <td class="whitespace-pre px-3"><span class="select-none text-red-700 dark:text-red-400" aria-label="Removed" data-t-label="diff.removed">−</span>    if len(people) > seats:</td></tr>
        <tr class="bg-green-500/10"><td></td><td class="px-2 text-right text-muted-foreground">15</td>
            <td class="whitespace-pre px-3"><span class="select-none text-green-700 dark:text-green-400" aria-label="Added" data-t-label="diff.added">+</span>    if len(people) + len(staff) > seats:</td></tr>
      </tbody>
    </table>
  </div>
</section>
```

Plain file view: the same table with one line-number column, no colours, and a header with the path (Breadcrumbs), size, Copy Path, Raw. Syntax colouring is optional; when used, colours come from a small token map in the app's CSS (keywords `text-primary`, strings `text-chart-3`, comments `text-muted-foreground`), never inline styles.

## States

| State | What changes |
| --- | --- |
| Unified (default) | Old and new line numbers in two columns; `−`/`+` markers in the code column. |
| Split | Two code columns (old left, new right), each with its own number column; on phone it falls back to unified. |
| Folded context | Unchanged runs longer than 6 lines become a `diff.expand` row; expanding shows 20 more at a time. |
| Whole file folded | The header's fold button; files with more than 400 changed lines start folded with `diff.large`. |
| Binary or too big | No table: `diff.binary` / `diff.too_big` with Download. |
| Renamed / deleted / new | A `badge` in the header: `diff.renamed` (old → new path), `diff.deleted`, `diff.new`. |
| Selected line | Clicking a number highlights the line (`bg-primary/10`) and puts `#L15` in the address; Shift-click selects a range. |
| Comment on a line | A `+` button appears on hover of a line in PullReview; comments render as a full-width row under the line. |
| Loading | Header plus 8 `skeleton` lines. Error: ErrorRetry inside the body. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `diff.unified` | Unified | 統合表示 |
| `diff.split` | Split | 分割表示 |
| `diff.expand` | Show {count} hidden lines | 非表示の {count} 行を表示 |
| `diff.fold` | Fold file | ファイルを折りたたむ |
| `diff.unfold` | Show file | ファイルを表示 |
| `diff.added` | Added | 追加 |
| `diff.removed` | Removed | 削除 |
| `diff.stats` | {added} additions, {removed} deletions | {added} 行追加、{removed} 行削除 |
| `diff.large` | Large change: {count} lines. Show it. | 大きな変更（{count} 行）です。表示してください。 |
| `diff.binary` | This file can’t be shown as text. | このファイルはテキストとして表示できません。 |
| `diff.too_big` | This file is too large to show here. | このファイルは大きすぎて表示できません。 |
| `diff.download` | Download | ダウンロード |
| `diff.renamed` | Renamed | 名前変更 |
| `diff.deleted` | Deleted | 削除 |
| `diff.new` | New file | 新規ファイル |
| `diff.copy_path` | Copy Path | パスをコピー |
| `diff.raw` | Raw | 生データ |

## Keyboard and focus

1. Fold → 2. Unified / Split → 3. each expand row → 4. the code (one tab stop; ↑ ↓ move by line, Return selects the line).
- `n` / `p` jump to the next/previous change; `[` / `]` to the next/previous file (ShortcutHelp lists them).
- The `+`/`−` markers are `select-none` so copying code copies only the code; screen readers hear “Added” / “Removed” from `aria-label`.

## Phone

- Always unified; long lines scroll sideways inside the table container (never wrap code), the page doesn't.
- Line numbers shrink to one column showing the new number (old number for removed lines).
- Files list collapses into a `select` at the top to jump between files.

## Data

```json
{"path": "app/trips.py", "status": "modified", "added": 6, "removed": 2, "old_path": null,
 "hunks": [{"header": "@@ -14,7 +14,8 @@ def book_trip", "hidden_before": 12,
   "lines": [{"type": "context", "old": 14, "new": 14, "text": "    seats = trip.seats"},
             {"type": "removed", "old": 15, "new": null, "text": "    if len(people) > seats:"},
             {"type": "added", "old": null, "new": 15, "text": "    if len(people) + len(staff) > seats:"}]}]}
```

- Web: the server computes hunks (Python `difflib.unified_diff` or `git diff --patch`) and returns the table fragment; `GET …/diff?…&expand=14-34` returns more context rows.
- No server: compute with a line diff (Myers) in a Web Worker for files over 2,000 lines.

## Don't

- Don't use colour alone for added/removed; keep the `+`/`−` markers.
- Don't wrap code lines or reflow indentation.
- Don't render the code with `innerHTML`; escape it.
