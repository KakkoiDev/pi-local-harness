# BarChart

A bar chart to compare amounts across categories or days, grouped side by side or stacked into a total.

| | |
| --- | --- |
| Group | Charts |
| Basecoat | `card`, `chart` (type `bar`; bar corners from `--chart-bar-radius`), `table`, `skeleton`, `empty`, `alert` |
| Needs | Rows `[{day, <series>…}]` |
| Used in | Dashboard, AppShop admin, AppAdmin, FunnelChart (horizontal) |

## Markup

```html
<section class="card" aria-labelledby="orders-title">
  <header>
    <h2 id="orders-title" data-t="chart.orders.title">Orders per day</h2>
    <p data-t="chart.orders.lede">This week, grouped</p>
  </header>
  <section>
    <canvas id="orders-chart" class="chart aspect-video max-h-80" role="img" aria-label="Orders per day: Saturday is busiest with 83 orders, 31 from new customers." data-chart-type="bar" data-chart-label-key="day" data-chart-data='[{"day":"Mon","new":12,"returning":30},{"day":"Tue","new":18,"returning":34},{"day":"Wed","new":15,"returning":29},{"day":"Thu","new":22,"returning":40},{"day":"Fri","new":19,"returning":38},{"day":"Sat","new":31,"returning":52},{"day":"Sun","new":27,"returning":47}]' data-chart-series='{"new":{"label":"New customers","color":"var(--chart-1)"},"returning":{"label":"Returning","color":"var(--chart-2)"}}' data-chart-legend="true"></canvas>
    <details class="mt-4"><summary class="text-sm" data-t="chart.show_table">Show as a table</summary><div class="table-container"><table class="table"><thead><tr><th>Day</th><th>New customers</th><th>Returning</th><th>Total</th></tr></thead><tbody><tr><th scope="row">Mon</th><td class="text-right tabular-nums">12</td><td class="text-right tabular-nums">30</td><td class="text-right tabular-nums">42</td></tr><tr><th scope="row">Tue</th><td class="text-right tabular-nums">18</td><td class="text-right tabular-nums">34</td><td class="text-right tabular-nums">52</td></tr><tr><th scope="row">Wed</th><td class="text-right tabular-nums">15</td><td class="text-right tabular-nums">29</td><td class="text-right tabular-nums">44</td></tr><tr><th scope="row">Thu</th><td class="text-right tabular-nums">22</td><td class="text-right tabular-nums">40</td><td class="text-right tabular-nums">62</td></tr><tr><th scope="row">Fri</th><td class="text-right tabular-nums">19</td><td class="text-right tabular-nums">38</td><td class="text-right tabular-nums">57</td></tr><tr><th scope="row">Sat</th><td class="text-right tabular-nums">31</td><td class="text-right tabular-nums">52</td><td class="text-right tabular-nums">83</td></tr><tr><th scope="row">Sun</th><td class="text-right tabular-nums">27</td><td class="text-right tabular-nums">47</td><td class="text-right tabular-nums">74</td></tr></tbody></table></div></details>
  </section>
</section>
```

```html
<script>
// grouped
basecoat.chart(document.getElementById('orders-chart'), {
  options: {scales: {y: {beginAtZero: true, ticks: {display: true, color: 'var(--muted-foreground)'}}}}
});
// stacked: x and y both stacked
basecoat.chart(document.getElementById('orders-chart'), {
  options: {scales: {x: {stacked: true}, y: {stacked: true, beginAtZero: true, ticks: {display: true, color: 'var(--muted-foreground)'}}}}
});
</script>
```

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table. |
| Loading | In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays. |
| Empty | No rows: no canvas. `div.empty` with `chart.orders.empty_title` and `chart.orders.empty`; the table toggle is hidden. |
| Error | An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was. |
| Grouped or stacked | Grouped compares series with each other; stacked compares totals. Choose one per chart; the lede says which. |
| Horizontal | Long category names (products, pages): add `indexAxis: 'y'` to `options` and show the y ticks instead of x. |
| Many categories | More than 12 bars: show the top 11 and an “Other” bar; the table lists all. |
| Hover / touch on a point | Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index. |
| Legend item | Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart. |
| Theme change | The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `chart.orders.title` | Orders per day | 曜日別の注文数 |
| `chart.orders.lede` | This week, grouped | 今週、グループ表示 |
| `chart.orders.lede_stacked` | This week, stacked | 今週、積み上げ |
| `chart.orders.new` | New customers | 新規のお客さま |
| `chart.orders.returning` | Returning | リピーター |
| `chart.orders.total` | Total | 合計 |
| `chart.orders.empty_title` | No orders this week | 今週の注文はまだありません |
| `chart.orders.empty` | Orders appear here as soon as someone buys. | 購入があると、すぐにここに表示されます。 |
| `chart.error_title` | Couldn’t load the chart | グラフを読み込めませんでした |
| `chart.show_table` | Show as a table | 表で表示 |
| `chart.loading` | Loading the chart… | グラフを読み込み中… |
| `chart.error` | Couldn’t load the chart. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。 |
| `chart.retry` | Try Again | 再試行 |

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
