# AreaChart

App Block card (Charts). An area chart for totals over time that add up (by device, by plan), stacked so the top edge is the total.

- Basecoat: `card`, `chart` (Chart.js line with `fill`, `surface: "gradient"`), `table`, `skeleton`, `empty`, `alert`
- Needs: Rows `[{month, <part>…}]` whose parts add up to the total
- Used in: Dashboard, AppAdmin, AppCourse

## Markup
Copy, never retype: `{harness}/kit/blocks/charts/AreaChart.html` (10 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/charts/AreaChart.2.html` (5 lines of HTML).

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States
- Loaded (default): The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table.
- Loading: In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays.
- Empty: No rows: no canvas. `div.empty` with `chart.sessions.empty_title` and `chart.sessions.empty`; the table toggle is hidden.
- Error: An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was.
- Not stacked: Drop `stacked: true` only when the series don’t add up (then use LineChart instead: overlapping fills hide each other).
- Hover / touch on a point: Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index.
- Legend item: Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart.
- Theme change: The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do.

## Texts
(Key | English | 日本語)
- `chart.sessions.title`: Sessions by device | デバイス別のセッション
- `chart.sessions.lede`: Stacked, January to June | 積み上げ、1月〜6月
- `chart.sessions.phone`: Phone | スマートフォン
- `chart.sessions.computer`: Computer | パソコン
- `chart.sessions.total`: Total | 合計
- `chart.sessions.empty_title`: No sessions yet | まだセッションはありません
- `chart.sessions.empty`: Sessions appear here once people use the app. | アプリが使われると、ここにセッションが表示されます。
- `chart.error_title`: Couldn’t load the chart | グラフを読み込めませんでした
- `chart.show_table`: Show as a table | 表で表示
- `chart.loading`: Loading the chart… | グラフを読み込み中…
- `chart.error`: Couldn’t load the chart. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。
- `chart.retry`: Try Again | 再試行

## Keyboard and focus
1. The canvas is not focusable: it is a picture (`role="img"` with an `aria-label` that states the main finding in words).
2. **Show as a table** (`summary`) is the keyboard and screen-reader way to every value: Space or Return opens it.
3. Any control in the header (period select, etc.) comes before the chart in Tab order.

## Phone
- The card fills the width; the canvas keeps `aspect-video` (about 358 × 201 px at 390 px) unless stated.
- At most 6 labels on the x axis below 48rem: pass `options.scales.x.ticks.maxTicksLimit: 6` (the wrapper merges it).
- Touch and hold shows the tooltip; the table is the way to read exact values.

## Data
```json
{"rows":[{"month":"Jan","phone":1640,"computer":980},{"month":"Feb","phone":1880,"computer":1100}],"series":{"phone":{"label":"Phone","color":"var(--chart-1)","surface":"gradient","dataset":{"fill":true}},"computer":{"label":"Computer","color":"var(--chart-2)","surface":"gradient","dataset":{"fill":true}}}}
```

- `"surface": "gradient"` makes the wrapper fill from 80 % to 10 % of the series colour; `"dataset": {"fill": true}` turns the fill on for a line.
- The table has a **Total** column computed by the page, not by the chart.
- Web: `GET /stats/sessions` → card fragment. No server: `store.sessions.byMonth()`.

## Don't
- Don’t stack more than three areas; use a BarChart (stacked) instead.
- Don’t use opacity alone to tell series apart: the two colours also differ in lightness.
- Don’t smooth the lines (`tension`) so much that the values look different from the table.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> AreaChart` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
