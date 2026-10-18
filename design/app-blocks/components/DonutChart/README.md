# DonutChart

A donut (or pie) for the parts of one whole, at most five parts, with the total in the middle and the percentages in a table.

| | |
| --- | --- |
| Group | Charts |
| Basecoat | `card`, `chart` (type `doughnut` or `pie`; colours per slice from `--chart-1…5` in row order), `table`, `skeleton`, `empty` |
| Needs | Rows `[{method, share}]`, sorted largest first, at most 5 (the 5th is “Other” when there are more) |
| Used in | Dashboard, AppShop admin, AppCrm |

## Markup

```html
<section class="card" aria-labelledby="payments-title">
  <header>
    <h2 id="payments-title" data-t="chart.payments.title">Payment methods</h2>
    <p data-t="chart.payments.lede">Share of 1,284 orders in October</p>
  </header>
  <section>
    <div class="relative">
      <canvas id="payments-chart" class="chart aspect-square max-h-72 mx-auto" role="img" aria-label="Payment methods: card 48 %, convenience store 21 %, bank transfer 14 %, QR code payment 12 %, other 5 %." data-chart-type="doughnut" data-chart-label-key="method" data-chart-data='[{"method":"Card","share":48},{"method":"Convenience store","share":21},{"method":"Bank transfer","share":14},{"method":"QR code payment","share":12},{"method":"Other","share":5}]' data-chart-series='{"share":{"label":"Share"}}' data-chart-legend="true"></canvas>
      <div class="pointer-events-none absolute inset-0 grid place-content-center text-center"><span class="text-2xl font-semibold tabular-nums">1,284</span><span class="text-muted-foreground text-xs">orders</span></div>
    </div>
    <details class="mt-4"><summary class="text-sm" data-t="chart.show_table">Show as a table</summary><div class="table-container"><table class="table"><thead><tr><th>Method</th><th>Share</th></tr></thead><tbody><tr><th scope="row">Card</th><td class="text-right tabular-nums">48 %</td></tr><tr><th scope="row">Convenience store</th><td class="text-right tabular-nums">21 %</td></tr><tr><th scope="row">Bank transfer</th><td class="text-right tabular-nums">14 %</td></tr><tr><th scope="row">QR code payment</th><td class="text-right tabular-nums">12 %</td></tr><tr><th scope="row">Other</th><td class="text-right tabular-nums">5 %</td></tr></tbody></table></div></details>
  </section>
</section>
```

```html
<script>
basecoat.chart(document.getElementById('payments-chart'), {options: {cutout: '68%'}});
</script>
```

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table. |
| Loading | In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays. |
| Empty | No rows: no canvas. `div.empty` with `chart.payments.empty_title` and `chart.payments.empty`; the table toggle is hidden. |
| Error | An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was. |
| Legend | Always on (`data-chart-legend="true"`): slices are told apart by the legend order and the table, not by colour alone. |
| More than five parts | Merge the smallest into “Other” (`chart.payments.other`); the table lists every part. |
| Pie | Same markup with `data-chart-type="pie"` and no centre label: use it only when the total doesn’t matter. |
| Hover / touch on a point | Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index. |
| Legend item | Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart. |
| Theme change | The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `chart.payments.title` | Payment methods | 支払い方法 |
| `chart.payments.lede` | Share of {count} orders in {month} | {month}の注文{count}件の内訳 |
| `chart.payments.share` | Share | 割合 |
| `chart.payments.orders` | orders | 件 |
| `chart.payments.other` | Other | その他 |
| `chart.payments.empty_title` | No orders in {month} | {month}の注文はありません |
| `chart.payments.empty` | The split appears after the first order. | 最初の注文のあとに内訳が表示されます。 |
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

- The donut stays square and centred (`aspect-square max-h-72 mx-auto`); the legend wraps under it.
- The centre label is HTML over the canvas (`absolute inset-0 grid place-content-center`), so it scales with text size and translates.
- Touch a slice for its tooltip; the table gives exact numbers.

## Data

```json
{"rows":[{"method":"Card","share":48},{"method":"Convenience store","share":21}],"series":{"share":{"label":"Share"}}}
```

- For pie and doughnut the wrapper uses the FIRST series key as the value (`share`) and the label key (`method`) for slice names; slice colours follow `--chart-1…5` in row order unless a row carries `color`.
- `cutout` (a Chart.js option) sets the hole: `68%`.
- Web: `GET /stats/payments?month=2026-10`. No server: `store.orders.byPayment(month)`.

## Don't

- Don’t show more than five slices or a 3D or exploded pie.
- Don’t write percentages on the slices: they collide on small slices; use the legend and the table.
- Don’t use a donut for change over time.
