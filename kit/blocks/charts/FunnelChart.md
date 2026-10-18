# FunnelChart

App Block card (Charts). A funnel for the steps people go through (visit, view, add to cart, pay), drawn as horizontal bars, with how many carried on at each step.

- Basecoat: `card`, `chart` (Chart.js has no funnel: a horizontal `bar` with `indexAxis: 'y'`), `table`, `skeleton`, `empty`
- Needs: Stages in order with a count each (each ≤ the one before)
- Used in: AppShop admin, AppCrm, Dashboard

## Markup
Copy, never retype: `{harness}/kit/blocks/charts/FunnelChart.html` (11 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/charts/FunnelChart.2.html` (11 lines of HTML).

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States
- Loaded (default): The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table.
- Loading: In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays.
- Empty: No rows: no canvas. `div.empty` with `chart.funnel.empty_title` and `chart.funnel.empty`; the table toggle is hidden.
- Error: An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was.
- Carried on: The sentence under the chart and the table’s third column give the share that carried on from the step before; the page computes them.
- One series: No legend (`data-chart-legend="false"`); bars all `var(--chart-1)`.
- Hover / touch on a point: Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index.
- Legend item: Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart.
- Theme change: The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do.

## Texts
(Key | English | 日本語)
- `chart.funnel.title`: Shop funnel | ショップのファネル
- `chart.funnel.lede`: {month}, from visit to payment | {month}、訪問から支払いまで
- `chart.funnel.people`: People | 人数
- `chart.funnel.carried_on`: Carried on | 次へ進んだ割合
- `chart.funnel.overall`: Overall: {percent} % of visitors paid. | 全体：訪問者の{percent}%が支払いまで進みました。
- `chart.funnel.drop`: Biggest drop: {from} → {to} ({percent} % carry on). | 最大の離脱：{from} → {to}（{percent}%が次へ）。
- `chart.funnel.stage.visit`: Visited the shop | ショップを訪問
- `chart.funnel.stage.view`: Viewed a product | 商品を表示
- `chart.funnel.stage.cart`: Added to cart | カートに追加
- `chart.funnel.stage.checkout`: Started checkout | 購入手続きを開始
- `chart.funnel.stage.paid`: Paid | 支払い完了
- `chart.funnel.empty_title`: No visits in {month} | {month}の訪問はありません
- `chart.funnel.empty`: The funnel fills in as people visit the shop. | ショップが訪問されると、ファネルが表示されます。
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
- The chart is `h-64` tall (container class `aspect-auto h-64`), stage names on the left; long names wrap in the table, not in the chart.
- Up to 6 stages.

## Data
```json
{"rows":[{"stage":"Visited the shop","people":12400},{"stage":"Viewed a product","people":6820},{"stage":"Added to cart","people":2140}],"series":{"people":{"label":"People","color":"var(--chart-1)"}}}
```

- Web: `GET /stats/funnel?month=2026-10`. No server: `store.events.funnel(stages, month)` (counts distinct visitors per stage).

## Don't
- Don’t draw a trapezoid “funnel” shape: bar lengths must be comparable.
- Don’t sort the stages by size: keep the order people go through.
- Don’t put percentages only in the tooltip.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> FunnelChart` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
