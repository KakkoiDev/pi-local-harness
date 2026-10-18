# LineChart

A line chart for a value over time, one to five series, with its legend, tooltip and a table of the same numbers.

| | |
| --- | --- |
| Group | Charts |
| Basecoat | `card`, `chart` (Chart.js 4.5.1 through `basecoat.chart`), `table`, `skeleton`, `empty`, `alert` |
| Needs | Rows `[{month, <series>…}]` from the page (web: rendered into `data-chart-data` by Jinja with `| tojson`; no server: from the store) |
| Used in | Dashboard, AppAdmin, KpiTile (as a sparkline) |

## Markup

```html
<section class="card" aria-labelledby="visits-title">
  <header>
    <h2 id="visits-title" data-t="chart.visits.title">Visits</h2>
    <p data-t="chart.visits.lede">January to June, this year and last year</p>
  </header>
  <section>
    <canvas id="visits-chart" class="chart aspect-video max-h-80" role="img" aria-label="Visits rose from 1,820 in January to 3,240 in June, above last year every month." data-chart-type="line" data-chart-label-key="month" data-chart-data='[{"month":"Jan","this_year":1820,"last_year":1510},{"month":"Feb","this_year":2140,"last_year":1600},{"month":"Mar","this_year":2010,"last_year":1720},{"month":"Apr","this_year":2630,"last_year":1930},{"month":"May","this_year":2890,"last_year":2050},{"month":"Jun","this_year":3240,"last_year":2210}]' data-chart-series='{"this_year":{"label":"This year","color":"var(--chart-1)"},"last_year":{"label":"Last year","color":"var(--chart-2)","dataset":{"borderDash":[6,4]}}}' data-chart-legend="true"></canvas>
    <details class="mt-4"><summary class="text-sm" data-t="chart.show_table">Show as a table</summary><div class="table-container"><table class="table"><thead><tr><th>Month</th><th>This year</th><th>Last year</th></tr></thead><tbody><tr><th scope="row">Jan</th><td class="text-right tabular-nums">1,820</td><td class="text-right tabular-nums">1,510</td></tr><tr><th scope="row">Feb</th><td class="text-right tabular-nums">2,140</td><td class="text-right tabular-nums">1,600</td></tr><tr><th scope="row">Mar</th><td class="text-right tabular-nums">2,010</td><td class="text-right tabular-nums">1,720</td></tr><tr><th scope="row">Apr</th><td class="text-right tabular-nums">2,630</td><td class="text-right tabular-nums">1,930</td></tr><tr><th scope="row">May</th><td class="text-right tabular-nums">2,890</td><td class="text-right tabular-nums">2,050</td></tr><tr><th scope="row">Jun</th><td class="text-right tabular-nums">3,240</td><td class="text-right tabular-nums">2,210</td></tr></tbody></table></div></details>
  </section>
</section>
```

```html
<script>
basecoat.chart(document.getElementById('visits-chart'), {
  options: {scales: {y: {beginAtZero: true, ticks: {display: true, color: 'var(--muted-foreground)'}}}}
});
</script>
```

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table. |
| Loading | In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays. |
| Empty | No rows: no canvas. `div.empty` with `chart.visits.empty_title` and `chart.visits.empty`; the table toggle is hidden. |
| Error | An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was. |
| One series | Leave `data-chart-legend="false"`: the card title names the series. |
| Comparison series | The second series is dashed (`"dataset": {"borderDash": [6, 4]}`) so it differs by more than colour. |
| Hover / touch on a point | Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index. |
| Legend item | Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart. |
| Theme change | The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `chart.visits.title` | Visits | 訪問数 |
| `chart.visits.lede` | January to June, this year and last year | 1月〜6月、今年と昨年 |
| `chart.visits.this_year` | This year | 今年 |
| `chart.visits.last_year` | Last year | 昨年 |
| `chart.visits.empty_title` | No visits yet | まだ訪問はありません |
| `chart.visits.empty` | Visits appear here the day after someone opens your site. | サイトが開かれた翌日から、ここに訪問数が表示されます。 |
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
