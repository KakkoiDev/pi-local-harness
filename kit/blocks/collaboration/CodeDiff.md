# CodeDiff

App Block card (Collaboration). A file viewer for code with line numbers, and the same viewer showing a change: removed lines, added lines, unchanged context folded, unified or side by side.

- Basecoat: `btn`, `button-group`, `badge`, `tabs`, `scrollbar`
- Route: `/r/{repo}/blob/{ref}/{path}` (file), `/r/{repo}/compare/{base}...{head}` (diff)
- Needs: Web: `GET /r/{repo}/blob/...` (rendered lines), `GET /r/{repo}/diff?base=&head=&path=` (hunks). No server: works on files the person opens (`File` API) with a diff computed in the browser. Blocks: FileTree, PullReview, Comments, ShortcutHelp
- Used in: AppCode

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/CodeDiff.html` (25 lines of HTML).

Plain file view: the same table with one line-number column, no colours, and a header with the path (Breadcrumbs), size, Copy Path, Raw. Syntax colouring is optional; when used, colours come from a small token map in the app's CSS (keywords `text-primary`, strings `text-chart-3`, comments `text-muted-foreground`), never inline styles.

## States
- Unified (default): Old and new line numbers in two columns; `−`/`+` markers in the code column.
- Split: Two code columns (old left, new right), each with its own number column; on phone it falls back to unified.
- Folded context: Unchanged runs longer than 6 lines become a `diff.expand` row; expanding shows 20 more at a time.
- Whole file folded: The header's fold button; files with more than 400 changed lines start folded with `diff.large`.
- Binary or too big: No table: `diff.binary` / `diff.too_big` with Download.
- Renamed / deleted / new: A `badge` in the header: `diff.renamed` (old → new path), `diff.deleted`, `diff.new`.
- Selected line: Clicking a number highlights the line (`bg-primary/10`) and puts `#L15` in the address; Shift-click selects a range.
- Comment on a line: A `+` button appears on hover of a line in PullReview; comments render as a full-width row under the line.
- Loading: Header plus 8 `skeleton` lines. Error: ErrorRetry inside the body.
- Large change: `diff.large` → the folded file’s body row (`#diff-body`), replacing the table until **Show** is pressed.

## Texts
(Key | English | 日本語)
- `diff.unified`: Unified | 統合表示
- `diff.split`: Split | 分割表示
- `diff.expand`: Show {count} hidden lines | 非表示の {count} 行を表示
- `diff.fold`: Fold file | ファイルを折りたたむ
- `diff.unfold`: Show file | ファイルを表示
- `diff.added`: Added | 追加
- `diff.removed`: Removed | 削除
- `diff.stats`: {added} additions, {removed} deletions | {added} 行追加、{removed} 行削除
- `diff.large`: Large change: {count} lines. Show it. | 大きな変更（{count} 行）です。表示してください。
- `diff.binary`: This file can’t be shown as text. | このファイルはテキストとして表示できません。
- `diff.too_big`: This file is too large to show here. | このファイルは大きすぎて表示できません。
- `diff.download`: Download | ダウンロード
- `diff.renamed`: Renamed | 名前変更
- `diff.deleted`: Deleted | 削除
- `diff.new`: New file | 新規ファイル
- `diff.copy_path`: Copy Path | パスをコピー
- `diff.raw`: Raw | 生データ

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> CodeDiff` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
