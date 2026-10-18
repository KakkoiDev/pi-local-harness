# FunnelChart

A funnel for the steps people go through (visit, view, add to cart, pay), drawn as horizontal bars, with how many carried on at each step.

| | |
| --- | --- |
| Group | Charts |
| Basecoat | `card`, `chart` (Chart.js has no funnel: a horizontal `bar` with `indexAxis: 'y'`), `table`, `skeleton`, `empty` |
| Needs | Stages in order with a count each (each ≤ the one before) |
| Used in | AppShop admin, AppCrm, Dashboard |

## Markup

```html
<section class="card" aria-labelledby="funnel-title">
  <header>
    <h2 id="funnel-title" data-t="chart.funnel.title">Shop funnel</h2>
    <p data-t="chart.funnel.lede">October, from visit to payment</p>
  </header>
  <section>
    <canvas id="funnel-chart" class="chart aspect-auto h-64" role="img" aria-label="Shop funnel: 12,400 visits, 986 paid, 8 % overall. The biggest drop is from viewing a product to adding to cart (31 % carry on)." data-chart-type="bar" data-chart-label-key="stage" data-chart-data='[{"stage":"Visited the shop","people":12400},{"stage":"Viewed a product","people":6820},{"stage":"Added to cart","people":2140},{"stage":"Started checkout","people":1310},{"stage":"Paid","people":986}]' data-chart-series='{"people":{"label":"People","color":"var(--chart-1)"}}' data-chart-legend="false"></canvas>
    <p class="text-muted-foreground mt-2 text-sm"><span data-t="chart.funnel.overall">Overall: <b class="text-foreground">8 %</b> of visitors paid.</span> <span data-t="chart.funnel.drop">Biggest drop: Viewed a product → Added to cart (31 % carry on).</span></p>
    <details class="mt-4"><summary class="text-sm" data-t="chart.show_table">Show as a table</summary><div class="table-container"><table class="table"><thead><tr><th>Stage</th><th>People</th><th>Carried on</th></tr></thead><tbody><tr><th scope="row">Visited the shop</th><td class="text-right tabular-nums">12,400</td><td class="text-right tabular-nums">100 %</td></tr><tr><th scope="row">Viewed a product</th><td class="text-right tabular-nums">6,820</td><td class="text-right tabular-nums">55 %</td></tr><tr><th scope="row">Added to cart</th><td class="text-right tabular-nums">2,140</td><td class="text-right tabular-nums">31 %</td></tr><tr><th scope="row">Started checkout</th><td class="text-right tabular-nums">1,310</td><td class="text-right tabular-nums">61 %</td></tr><tr><th scope="row">Paid</th><td class="text-right tabular-nums">986</td><td class="text-right tabular-nums">75 %</td></tr></tbody></table></div></details>
  </section>
</section>
```

```html
<script>
basecoat.chart(document.getElementById('funnel-chart'), {
  options: {
    indexAxis: 'y',
    scales: {
      x: {ticks: {display: false}},
      y: {grid: {display: false}, ticks: {display: true, color: 'var(--foreground)'}}
    }
  }
});
</script>
```

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table. |
| Loading | In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays. |
| Empty | No rows: no canvas. `div.empty` with `chart.funnel.empty_title` and `chart.funnel.empty`; the table toggle is hidden. |
| Error | An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was. |
| Carried on | The sentence under the chart and the table’s third column give the share that carried on from the step before; the page computes them. |
| One series | No legend (`data-chart-legend="false"`); bars all `var(--chart-1)`. |
| Hover / touch on a point | Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index. |
| Legend item | Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart. |
| Theme change | The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `chart.funnel.title` | Shop funnel | ショップのファネル |
| `chart.funnel.lede` | {month}, from visit to payment | {month}、訪問から支払いまで |
| `chart.funnel.people` | People | 人数 |
| `chart.funnel.carried_on` | Carried on | 次へ進んだ割合 |
| `chart.funnel.overall` | Overall: {percent} % of visitors paid. | 全体：訪問者の{percent}%が支払いまで進みました。 |
| `chart.funnel.drop` | Biggest drop: {from} → {to} ({percent} % carry on). | 最大の離脱：{from} → {to}（{percent}%が次へ）。 |
| `chart.funnel.stage.visit` | Visited the shop | ショップを訪問 |
| `chart.funnel.stage.view` | Viewed a product | 商品を表示 |
| `chart.funnel.stage.cart` | Added to cart | カートに追加 |
| `chart.funnel.stage.checkout` | Started checkout | 購入手続きを開始 |
| `chart.funnel.stage.paid` | Paid | 支払い完了 |
| `chart.funnel.empty_title` | No visits in {month} | {month}の訪問はありません |
| `chart.funnel.empty` | The funnel fills in as people visit the shop. | ショップが訪問されると、ファネルが表示されます。 |
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
