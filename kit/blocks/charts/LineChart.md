# LineChart

App Block card (Charts). A line chart for a value over time, one to five series, with its legend, tooltip and a table of the same numbers.

- Basecoat: `card`, `chart` (Chart.js 4.5.1 through `basecoat.chart`), `table`, `skeleton`, `empty`, `alert`
- Needs: Rows `[{month, <series>…}]` from the page (web: rendered into `data-chart-data` by Jinja with `| tojson`; no server: from the store)
- Used in: Dashboard, AppAdmin, KpiTile (as a sparkline)

## Markup
Copy, never retype: `{harness}/kit/blocks/charts/LineChart.html` (10 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/charts/LineChart.2.html` (5 lines of HTML).

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States
- Loaded (default): The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table.
- Loading: In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays.
- Empty: No rows: no canvas. `div.empty` with `chart.visits.empty_title` and `chart.visits.empty`; the table toggle is hidden.
- Error: An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was.
- One series: Leave `data-chart-legend="false"`: the card title names the series.
- Comparison series: The second series is dashed (`"dataset": {"borderDash": [6, 4]}`) so it differs by more than colour.
- Hover / touch on a point: Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index.
- Legend item: Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart.
- Theme change: The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do.

## Texts
(Key | English | 日本語)
- `chart.visits.title`: Visits | 訪問数
- `chart.visits.lede`: January to June, this year and last year | 1月〜6月、今年と昨年
- `chart.visits.this_year`: This year | 今年
- `chart.visits.last_year`: Last year | 昨年
- `chart.visits.empty_title`: No visits yet | まだ訪問はありません
- `chart.visits.empty`: Visits appear here the day after someone opens your site. | サイトが開かれた翌日から、ここに訪問数が表示されます。
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
{"rows":[{"month":"Jan","this_year":1820,"last_year":1510},{"month":"Feb","this_year":2140,"last_year":1600}],"series":{"this_year":{"label":"This year","color":"var(--chart-1)"},"last_year":{"label":"Last year","color":"var(--chart-2)","dataset":{"borderDash":[6,4]}}}}
```

- `data-chart-label-key` names the row field used for the x axis (`month`). Each key of `data-chart-series` is a row field drawn as one line; `label` is the legend text (translated), `color` one of `var(--chart-1…5)` in order.
- Web: `GET /stats/visits?from=2026-01&to=2026-06` returns the card fragment (htmx `hx-get` on the period select, `hx-target` the card); 200 with rows, 204 for empty.
- No server: `store.visits.byMonth(from, to)` returns the rows.
- Numbers in the table use `Intl.NumberFormat(lang)`; months come from the translated labels, not from the canvas.

## Don't
- Don’t pick colours outside `var(--chart-1…5)` or reorder them per chart: series 1 is always `--chart-1`.
- Don’t put more than five lines in one chart; split it.
- Don’t make the y axis start above zero for counts.
- Don’t write the numbers only in the canvas: the table is required.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> LineChart` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
