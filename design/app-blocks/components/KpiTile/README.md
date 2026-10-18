# KpiTile

A tile with one key number, its change from the last period in words and an arrow, an optional sparkline, and a link to the full report.

| | |
| --- | --- |
| Group | Charts |
| Basecoat | `card` (`data-size="sm"`), `badge`, `chart` (Sparkline), `skeleton` |
| Needs | The value, the previous period’s value, optionally 6–12 recent values |
| Used in | Dashboard (a row of 3–4), AppAdmin, AppShop admin, AppCrm |

## Markup

```html
<section class="card" data-size="sm" aria-labelledby="revenue-title">
  <header>
    <h2 id="revenue-title" class="text-muted-foreground text-sm font-normal" data-t="kpi.revenue.title">Revenue</h2>
  </header>
  <section class="grid gap-2">
    <p class="text-3xl font-semibold tabular-nums">¥420,000</p>
    <p class="flex flex-wrap items-center gap-2 text-sm"><span class="badge" data-variant="secondary">▲ 9 %</span><span class="text-muted-foreground" data-t="kpi.revenue.period">vs last week</span></p>
    <canvas id="revenue-spark" class="chart aspect-auto h-10 w-full" role="img" aria-label="Revenue over 8 weeks, rising from ¥310,000 to ¥420,000." data-chart-type="line" data-chart-label-key="w" data-chart-data='[{"w":0,"v":310},{"w":1,"v":342},{"w":2,"v":330},{"w":3,"v":365},{"w":4,"v":391},{"w":5,"v":402},{"w":6,"v":388},{"w":7,"v":420}]' data-chart-series='{"v":{"label":"Revenue","color":"var(--chart-1)","surface":true}}' data-chart-legend="false" data-chart-tooltip="false"></canvas>
  </section>
  <footer><a class="text-sm underline-offset-4 hover:underline" href="#" data-t="kpi.revenue.link">View report</a></footer>
</section>
```

```html
<script>
basecoat.chart(document.getElementById('revenue-spark'), {
  options: {scales: {x: {display: false}, y: {display: false}}, elements: {point: {radius: 0}, line: {borderWidth: 2}}}
});
</script>
```

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | Label, value, the change badge (`▲ 9 %` with `data-variant="secondary"` going up, `▼` with `outline` going down), the period, the sparkline, the link. |
| Good or bad direction | Up isn’t always good (refunds). The arrow shows direction only; never colour it green/red. If the page must judge, add the word: `kpi.better` / `kpi.worse`. |
| No comparison yet | First period: no badge, `kpi.no_comparison` instead. |
| Loading | `skeleton` for label, value and badge; `aria-busy="true"` on the card. |
| Error | Value `—`, `kpi.error` and a link-style **Try Again**. |
| Long numbers | `tabular-nums`, compact above a million (`Intl.NumberFormat(lang, {notation: "compact"})`: 1.2M / 120万). |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `kpi.revenue.title` | Revenue | 売上 |
| `kpi.revenue.period` | vs last week | 先週比 |
| `kpi.revenue.link` | View report | レポートを見る |
| `kpi.customers.title` | New customers | 新規のお客さま |
| `kpi.refunds.title` | Refunds | 返金 |
| `kpi.change_up` | ▲ {percent} % | ▲ {percent}% |
| `kpi.change_down` | ▼ {percent} % | ▼ {percent}% |
| `kpi.better` | better | 改善 |
| `kpi.worse` | worse | 悪化 |
| `kpi.no_comparison` | First week: a comparison appears next week. | 初週のため、比較は来週から表示されます。 |
| `kpi.error` | Couldn’t load. | 読み込めませんでした。 |
| `chart.show_table` | Show as a table | 表で表示 |
| `chart.loading` | Loading the chart… | グラフを読み込み中… |
| `chart.error` | Couldn’t load the chart. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。 |
| `chart.retry` | Try Again | 再試行 |

## Keyboard and focus

1. The heading, then the link are the only focus stops (the sparkline is a picture).
2. A screen reader reads: “Revenue, ¥420,000, up 9 % vs last week” — give the badge `aria-label` from `kpi.change_up_long` if the arrow isn’t read (“up 9 percent” / “9%増加”).

## Phone

- Two tiles per row below 48rem (`grid-cols-2 @3xl:grid-cols-4` on the row), value `text-2xl`.
- The sparkline keeps `h-10 w-full`.

## Data

```json
{"label":"Revenue","value":420000,"currency":"JPY","previous":385000,"recent":[310,342,330,365,391,402,388,420]}
```

- Money: `Intl.NumberFormat(lang, {style: "currency", currency: "JPY"})`. Change: `(value - previous) / previous`, rounded to a whole percent.
- Web: tiles come with the dashboard page. No server: `store.kpi(name, period)`.

## Don't

- Don’t colour the number or the arrow red/green.
- Don’t show more than one number per tile.
- Don’t show a change percentage when the previous value is 0: show `kpi.no_comparison`.
