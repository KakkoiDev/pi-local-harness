# BarChart

App Block card (Charts). A bar chart to compare amounts across categories or days, grouped side by side or stacked into a total.

- Basecoat: `card`, `chart` (type `bar`; bar corners from `--chart-bar-radius`), `table`, `skeleton`, `empty`, `alert`
- Needs: Rows `[{day, <series>…}]`
- Used in: Dashboard, AppShop admin, AppAdmin, FunnelChart (horizontal)

## Markup
Copy, never retype: `{harness}/kit/blocks/charts/BarChart.html` (10 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/charts/BarChart.2.html` (10 lines of HTML).

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States
- Loaded (default): The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table.
- Loading: In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays.
- Empty: No rows: no canvas. `div.empty` with `chart.orders.empty_title` and `chart.orders.empty`; the table toggle is hidden.
- Error: An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was.
- Grouped or stacked: Grouped compares series with each other; stacked compares totals. Choose one per chart; the lede says which.
- Horizontal: Long category names (products, pages): add `indexAxis: 'y'` to `options` and show the y ticks instead of x.
- Many categories: More than 12 bars: show the top 11 and an “Other” bar; the table lists all.
- Hover / touch on a point: Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index.
- Legend item: Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart.
- Theme change: The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do.

## Texts
(Key | English | 日本語)
- `chart.orders.title`: Orders per day | 曜日別の注文数
- `chart.orders.lede`: This week, grouped | 今週、グループ表示
- `chart.orders.lede_stacked`: This week, stacked | 今週、積み上げ
- `chart.orders.new`: New customers | 新規のお客さま
- `chart.orders.returning`: Returning | リピーター
- `chart.orders.total`: Total | 合計
- `chart.orders.empty_title`: No orders this week | 今週の注文はまだありません
- `chart.orders.empty`: Orders appear here as soon as someone buys. | 購入があると、すぐにここに表示されます。
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
- Stacked rather than grouped below 48rem (grouped bars get too thin); at most 7 labels on the x axis below 48rem: pass `options.scales.x.ticks.maxTicksLimit: 6` (the wrapper merges it).
- Touch and hold shows the tooltip; the table is the way to read exact values.

## Data
```json
{"rows":[{"day":"Mon","new":12,"returning":30},{"day":"Tue","new":18,"returning":34}],"series":{"new":{"label":"New customers","color":"var(--chart-1)"},"returning":{"label":"Returning","color":"var(--chart-2)"}}}
```

- Web: `GET /stats/orders?week=2026-W42` → card fragment. No server: `store.orders.byDay(week)`.
- Day names come from the translations (`Intl.DateTimeFormat(lang, {weekday: "short"})`).

## Don't
- Don’t start the value axis above zero: bar length is the value.
- Don’t mix grouped and stacked in one chart.
- Don’t use a bar chart for a share of a whole with two or three parts only if a DonutChart reads faster; for more parts bars are better.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> BarChart` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
