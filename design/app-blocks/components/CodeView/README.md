# CodeView

One file shown read-only with line numbers, wrap on or off, copy, and a link to any line, for code collaboration apps.

| | |
| --- | --- |
| Group | Collaboration |
| Basecoat | `btn`, `button-group`, `badge`, `breadcrumb`, `empty`, `alert`, `scrollbar` |
| Route | `/{repo}/blob/{branch}/{path}`; a line is `#L14`, a range `#L14-L18` |
| Needs | Web: `GET /{repo}/blob/{branch}/{path}` (the page), `GET …?raw=1` (the plain file). No server: `store.file(path)` returns `{text, size, binary}`. |
| Links to | CodeDiff (changes to this file), FileTree (the folder beside it), Breadcrumbs, PullReview, AppCode |

## Markup

```html
<section class="overflow-hidden rounded-lg border" aria-labelledby="code-path">
  <header class="flex flex-wrap items-center gap-2 border-b bg-muted/50 px-3 py-2 text-sm">
    <h3 id="code-path" class="font-mono text-sm">app/trips.py</h3>
    <span class="text-xs text-muted-foreground" data-t="code.meta">42 lines · 1.3 KB</span>
    <div class="ml-auto flex flex-wrap items-center gap-2">
      <div class="button-group" role="group" aria-label="Line wrap" data-t-label="code.wrap_group">
        <button class="btn" data-variant="secondary" data-size="sm" type="button" aria-pressed="false" id="code-wrap" data-t="code.wrap">Wrap Lines</button>
      </div>
      <button class="btn" data-variant="outline" data-size="sm" type="button" id="code-copy" data-t="code.copy">Copy</button>
      <a class="btn" data-variant="outline" data-size="sm" href="/kiln/ferry-app/blob/main/app/trips.py?raw=1" data-t="code.raw">Raw</a>
    </div>
  </header>
  <div id="code-body" class="scrollbar overflow-x-auto">
    <table class="w-full border-collapse font-mono text-[13px] leading-5" aria-label="Contents of app/trips.py" data-t-label="code.table_label">
      <tbody>
        <tr id="L1">
          <td class="w-12 select-none px-2 text-right align-top"><a class="text-muted-foreground hover:text-foreground" href="#L1" aria-label="Line 1" data-t-label="code.line_link">1</a></td>
          <td class="whitespace-pre px-3">from datetime import date</td>
        </tr>
        <tr id="L14" class="bg-highlight/50" aria-current="true">
          <td class="w-12 select-none px-2 text-right align-top"><a class="font-medium text-foreground" href="#L14" aria-label="Line 14" data-t-label="code.line_link">14</a></td>
          <td class="whitespace-pre px-3">    seats = trip.seats</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p id="code-live" class="sr-only" aria-live="polite"></p>
</section>
```

- Wrap on: `#code-wrap` gets `aria-pressed="true"` and loses `data-variant` (the primary look); the code cells change `whitespace-pre` to `whitespace-pre-wrap break-all`.
- A line number is a real link (`#L14`). Shift-click a second number for a range; the rows get `bg-highlight/50` and the address becomes `#L14-L18`. The first highlighted line scrolls into view on load.
- Syntax colouring is optional and comes from the app's own small token map (keywords `text-primary`, strings `text-success`, comments `text-muted-foreground`); never Tailwind palette colours.

Large, binary and missing files:

```html
<tr><td colspan="2" class="bg-muted/60 px-3 py-2 font-sans text-sm text-muted-foreground"><span data-t="code.large">This file is large. Showing the first 1,000 of 18,240 lines.</span> <a class="underline" href="?raw=1" data-t="code.show_raw">Show Raw</a></td></tr>

<div class="empty rounded-lg border">
  <header><h3 data-t="code.binary.title">This file can’t be shown</h3><p data-t="code.binary.body">It isn’t text (2.4 MB). Download it to open it.</p></header>
  <footer class="flex-row justify-center"><a class="btn" data-variant="outline" href="?raw=1" download data-t="code.download">Download</a></footer>
</div>

<p class="text-sm text-muted-foreground" data-t="code.not_found">This file doesn’t exist on main.</p>
```

## States

| State | What changes |
| --- | --- |
| File (default) | As above; no line highlighted unless the address has `#L…`. |
| Line or range linked | Those rows `bg-highlight/50` and `aria-current="true"` on the first. |
| Copied | toast: `code.copied`; Copy keeps its label. If the clipboard is refused, the text is selected and `#code-live` says `code.copy_select`. |
| Large file (over 1 MB or 5,000 lines) | The table shows the first 1,000 lines, then a row with `code.large` and **Show Raw** (the Raw link). |
| Binary file | No table; `<div class="empty">` with `code.binary.title`, `code.binary.body` (`{size}`) and **Download** (`code.download`). |
| Empty file | One row with `code.empty` in `text-muted-foreground`. |
| Loading | Ten `skeleton h-4` rows in the body. |
| Not found | ErrorRetry's page version: `code.not_found`, link back to the folder. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `code.meta` | {lines} lines · {size} | {lines}行・{size} |
| `code.wrap_group` | Line wrap | 折り返し |
| `code.wrap` | Wrap Lines | 折り返す |
| `code.copy` | Copy | コピー |
| `code.raw` | Raw | そのまま表示 |
| `code.table_label` | Contents of {path} | {path} の内容 |
| `code.line_link` | Line {n} | {n}行目 |
| `code.copied` | Copied {lines} lines | {lines}行をコピーしました |
| `code.copy_select` | Copying isn’t allowed here. The text is selected: press ⌘C or Ctrl C. | ここではコピーできません。テキストを選択したので、⌘C または Ctrl C を押してください。 |
| `code.large` | This file is large. Showing the first 1,000 of {lines} lines. | 大きなファイルのため、{lines}行のうち最初の1,000行を表示しています。 |
| `code.binary.title` | This file can’t be shown | このファイルは表示できません |
| `code.binary.body` | It isn’t text ({size}). Download it to open it. | テキストではありません（{size}）。ダウンロードして開いてください。 |
| `code.download` | Download | ダウンロード |
| `code.show_raw` | Show Raw | そのまま表示 |
| `code.empty` | This file is empty. | このファイルは空です。 |
| `code.not_found` | This file doesn’t exist on {branch}. | {branch} にこのファイルはありません。 |

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
