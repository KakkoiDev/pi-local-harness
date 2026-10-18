# AreaChart

An area chart for totals over time that add up (by device, by plan), stacked so the top edge is the total.

| | |
| --- | --- |
| Group | Charts |
| Basecoat | `card`, `chart` (Chart.js line with `fill`, `surface: "gradient"`), `table`, `skeleton`, `empty`, `alert` |
| Needs | Rows `[{month, <part>…}]` whose parts add up to the total |
| Used in | Dashboard, AppAdmin, AppCourse |

## Markup

```html
<section class="card" aria-labelledby="sessions-title">
  <header>
    <h2 id="sessions-title" data-t="chart.sessions.title">Sessions by device</h2>
    <p data-t="chart.sessions.lede">Stacked, January to June</p>
  </header>
  <section>
    <canvas id="sessions-chart" class="chart aspect-video max-h-80" role="img" aria-label="Sessions by device, stacked: phones are about two thirds of 4,550 sessions in June." data-chart-type="line" data-chart-label-key="month" data-chart-data='[{"month":"Jan","phone":1640,"computer":980},{"month":"Feb","phone":1880,"computer":1100},{"month":"Mar","phone":1900,"computer":1060},{"month":"Apr","phone":2350,"computer":1310},{"month":"May","phone":2610,"computer":1420},{"month":"Jun","phone":2950,"computer":1600}]' data-chart-series='{"phone":{"label":"Phone","color":"var(--chart-1)","surface":"gradient","dataset":{"fill":true}},"computer":{"label":"Computer","color":"var(--chart-2)","surface":"gradient","dataset":{"fill":true}}}' data-chart-legend="true"></canvas>
    <details class="mt-4"><summary class="text-sm" data-t="chart.show_table">Show as a table</summary><div class="table-container"><table class="table"><thead><tr><th>Month</th><th>Phone</th><th>Computer</th><th>Total</th></tr></thead><tbody><tr><th scope="row">Jan</th><td class="text-right tabular-nums">1,640</td><td class="text-right tabular-nums">980</td><td class="text-right tabular-nums">2,620</td></tr><tr><th scope="row">Feb</th><td class="text-right tabular-nums">1,880</td><td class="text-right tabular-nums">1,100</td><td class="text-right tabular-nums">2,980</td></tr><tr><th scope="row">Mar</th><td class="text-right tabular-nums">1,900</td><td class="text-right tabular-nums">1,060</td><td class="text-right tabular-nums">2,960</td></tr><tr><th scope="row">Apr</th><td class="text-right tabular-nums">2,350</td><td class="text-right tabular-nums">1,310</td><td class="text-right tabular-nums">3,660</td></tr><tr><th scope="row">May</th><td class="text-right tabular-nums">2,610</td><td class="text-right tabular-nums">1,420</td><td class="text-right tabular-nums">4,030</td></tr><tr><th scope="row">Jun</th><td class="text-right tabular-nums">2,950</td><td class="text-right tabular-nums">1,600</td><td class="text-right tabular-nums">4,550</td></tr></tbody></table></div></details>
  </section>
</section>
```

```html
<script>
basecoat.chart(document.getElementById('sessions-chart'), {
  options: {scales: {y: {stacked: true, beginAtZero: true, ticks: {display: true, color: 'var(--muted-foreground)'}}}}
});
</script>
```

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table. |
| Loading | In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays. |
| Empty | No rows: no canvas. `div.empty` with `chart.sessions.empty_title` and `chart.sessions.empty`; the table toggle is hidden. |
| Error | An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was. |
| Not stacked | Drop `stacked: true` only when the series don’t add up (then use LineChart instead: overlapping fills hide each other). |
| Hover / touch on a point | Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index. |
| Legend item | Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart. |
| Theme change | The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `chart.sessions.title` | Sessions by device | デバイス別のセッション |
| `chart.sessions.lede` | Stacked, January to June | 積み上げ、1月〜6月 |
| `chart.sessions.phone` | Phone | スマートフォン |
| `chart.sessions.computer` | Computer | パソコン |
| `chart.sessions.total` | Total | 合計 |
| `chart.sessions.empty_title` | No sessions yet | まだセッションはありません |
| `chart.sessions.empty` | Sessions appear here once people use the app. | アプリが使われると、ここにセッションが表示されます。 |
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
