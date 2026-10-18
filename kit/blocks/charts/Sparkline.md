# Sparkline

App Block card (Charts). A word-sized line with no axes, beside a number, to show its recent direction at a glance; the number and the table carry the values.

- Basecoat: `item`, `chart` (a Chart.js line with axes, points, legend and tooltip off), `table`, `skeleton`
- Needs: 6–30 recent values in order
- Used in: KpiTile, Dashboard, DataTable (a column), AppAdmin

## Markup
Copy, never retype: `{harness}/kit/blocks/charts/Sparkline.html` (9 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/charts/Sparkline.2.html` (9 lines of HTML).

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States
- Loaded (default): Number, its change in words with ▲ or ▼, and the line. The canvas container gets `aspect-auto h-10 w-32` (the wrapper moves the canvas’s extra classes to its container).
- Loading: `skeleton` blocks for the label, the number and the line.
- Not enough data: Fewer than 3 points: no line, `chart.signups.not_enough` instead.
- Inline: In running text: `inline-block h-5 w-20 align-middle`, followed by the latest value as text.
- No tooltip: `data-chart-tooltip="false"`: a sparkline is too small to point at; the table has the values.
- Theme change: The wrapper redraws by itself.

## Texts
(Key | English | 日本語)
- `chart.signups.title`: Sign-ups this week | 今週の新規登録
- `chart.signups.series`: Sign-ups | 新規登録
- `chart.signups.delta`: ▲ {percent} % from last week · {weeks} weeks shown | ▲ 先週から{percent}% · {weeks}週分を表示
- `chart.signups.not_enough`: A trend appears after 3 weeks. | 3週分そろうと推移が表示されます。
- `chart.signups.week`: Week | 週
- `chart.show_table`: Show as a table | 表で表示
- `chart.loading`: Loading the chart… | グラフを読み込み中…
- `chart.error`: Couldn’t load the chart. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。
- `chart.retry`: Try Again | 再試行

## Keyboard and focus
1. The sparkline is not focusable (`role="img"`, its `aria-label` says the direction in words).
2. **Show as a table** is optional for a sparkline inside a KpiTile that links to a full chart; keep it otherwise.

## Phone
- Same size on the phone (h-10 w-32); in an item row it sits at the right.
- Never the only way to see a value.

## Data
```json
{"rows":[{"week":"W1","signups":42},{"week":"W2","signups":45},{"week":"W3","signups":44}],"series":{"signups":{"label":"Sign-ups","color":"var(--chart-1)","surface":true}}}
```

- Not a chart type of its own: Chart.js `line` with `scales.x/y.display: false`, `elements.point.radius: 0`, `"surface": true` for a faint fill.
- Web: values come with the page (`| tojson`). No server: `store.signups.weekly(12)`.

## Don't
- Don’t add axes, gridlines or a legend.
- Don’t colour the line red or green by direction: the ▲/▼ text says it.
- Don’t stretch it wider than 160 px; use LineChart.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Sparkline` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
