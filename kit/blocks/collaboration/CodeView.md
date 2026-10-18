# CodeView

App Block card (Collaboration). One file shown read-only with line numbers, wrap on or off, copy, and a link to any line, for code collaboration apps.

- Basecoat: `btn`, `button-group`, `badge`, `breadcrumb`, `empty`, `alert`, `scrollbar`
- Route: `/{repo}/blob/{branch}/{path}`; a line is `#L14`, a range `#L14-L18`
- Needs: Web: `GET /{repo}/blob/{branch}/{path}` (the page), `GET …?raw=1` (the plain file). No server: `store.file(path)` returns `{text, size, binary}`.
- Links to: CodeDiff (changes to this file), FileTree (the folder beside it), Breadcrumbs, PullReview, AppCode

## Markup
Copy, never retype: `{harness}/kit/blocks/collaboration/CodeView.html` (28 lines of HTML).

- Wrap on: `#code-wrap` gets `aria-pressed="true"` and loses `data-variant` (the primary look); the code cells change `whitespace-pre` to `whitespace-pre-wrap break-all`.
- A line number is a real link (`#L14`). Shift-click a second number for a range; the rows get `bg-highlight/50` and the address becomes `#L14-L18`. The first highlighted line scrolls into view on load.
- Syntax colouring is optional and comes from the app's own small token map (keywords `text-primary`, strings `text-success`, comments `text-muted-foreground`); never Tailwind palette colours.

Large, binary and missing files:

Copy, never retype: `{harness}/kit/blocks/collaboration/CodeView.2.html` (8 lines of HTML).

## States
- File (default): As above; no line highlighted unless the address has `#L…`.
- Line or range linked: Those rows `bg-highlight/50` and `aria-current="true"` on the first.
- Copied: toast: `code.copied`; Copy keeps its label. If the clipboard is refused, the text is selected and `#code-live` says `code.copy_select`.
- Large file (over 1 MB or 5,000 lines): The table shows the first 1,000 lines, then a row with `code.large` and **Show Raw** (the Raw link).
- Binary file: No table; `<div class="empty">` with `code.binary.title`, `code.binary.body` (`{size}`) and **Download** (`code.download`).
- Empty file: One row with `code.empty` in `text-muted-foreground`.
- Loading: Ten `skeleton h-4` rows in the body.
- Not found: ErrorRetry's page version: `code.not_found`, link back to the folder.

## Texts
(Key | English | 日本語)
- `code.meta`: {lines} lines · {size} | {lines}行・{size}
- `code.wrap_group`: Line wrap | 折り返し
- `code.wrap`: Wrap Lines | 折り返す
- `code.copy`: Copy | コピー
- `code.raw`: Raw | そのまま表示
- `code.table_label`: Contents of {path} | {path} の内容
- `code.line_link`: Line {n} | {n}行目
- `code.copied`: Copied {lines} lines | {lines}行をコピーしました
- `code.copy_select`: Copying isn’t allowed here. The text is selected: press ⌘C or Ctrl C. | ここではコピーできません。テキストを選択したので、⌘C または Ctrl C を押してください。
- `code.large`: This file is large. Showing the first 1,000 of {lines} lines. | 大きなファイルのため、{lines}行のうち最初の1,000行を表示しています。
- `code.binary.title`: This file can’t be shown | このファイルは表示できません
- `code.binary.body`: It isn’t text ({size}). Download it to open it. | テキストではありません（{size}）。ダウンロードして開いてください。
- `code.download`: Download | ダウンロード
- `code.show_raw`: Show Raw | そのまま表示
- `code.empty`: This file is empty. | このファイルは空です。
- `code.not_found`: This file doesn’t exist on {branch}. | {branch} にこのファイルはありません。

## Keyboard and focus
1. Wrap Lines → 2. Copy → 3. Raw → 4. each line number link.
- `l` (lowercase L) moves focus to the line-number column; ↑ ↓ move between lines there; Return links the focused line.
- `y` swaps the address to the commit's permanent link (shown in `#code-live`).

## Phone
- Wrap is on by default under 48rem; the table still scrolls sideways when wrap is off.
- The header's buttons wrap to a second row; line numbers stay 44 px tall targets when tapped (the whole number cell is the link).

## Data
```json
{"path": "app/trips.py", "branch": "main", "commit": "3f9c2a1", "size": 1310, "lines": 42,
 "binary": false, "text": "from datetime import date\n…"}
```

- Web: the page renders the rows server-side; `?raw=1` serves `text/plain; charset=utf-8`.
- No server: `store.file('app/trips.py')` → the object above; lines are `text.split('\n')`.

## Don't
- Don't make the code editable here; editing is DocEditor or the repository's own flow.
- Don't use colours outside the tokens for syntax.
- Don't render more than 1,000 lines at once.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> CodeView` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
