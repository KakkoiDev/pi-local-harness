# Dashboard

A summary page: four stat tiles with their change since the last period, one chart of the trend, and a short list of what needs attention.

| | |
| --- | --- |
| Group | Content |
| Basecoat | `card`, `badge`, `chart`, `select` (native), `item`, `btn`, `skeleton` |
| Route | `/` or `/dashboard` |
| Needs | Web: `GET /dashboard?period=30d` (the page) and `GET /dashboard/data?period=30d` (JSON for the chart). No server: `store.summary(period)` over local data. Chart.js 4.5.1 + Basecoat chart wrapper. |
| Links to | KpiTile, LineChart, AreaChart, BarChart, EmptyState, LoadingState, ErrorRetry, DataTable |

## Markup

```html
<main class="app grid gap-6 p-4 @3xl:p-8">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl font-semibold" data-t="dashboard.title">Overview</h1>
      <p class="text-muted-foreground text-sm" data-t="dashboard.updated">Updated at 09:41</p>
    </div>
    <div class="field w-40">
      <label class="label sr-only" for="dashboard-period" data-t="dashboard.period">Period</label>
      <select class="select" id="dashboard-period" name="period">
        <option value="7d" data-t="dashboard.period.7d">Last 7 days</option>
        <option value="30d" selected data-t="dashboard.period.30d">Last 30 days</option>
        <option value="12m" data-t="dashboard.period.12m">Last 12 months</option>
      </select>
    </div>
  </header>

  <section class="grid grid-cols-2 gap-4 @3xl:grid-cols-4" aria-labelledby="dashboard-stats">
    <h2 id="dashboard-stats" class="sr-only" data-t="dashboard.stats">Key numbers</h2>
    <article class="card gap-2 p-4">
      <p class="text-muted-foreground text-sm" data-t="dashboard.stat.revenue">Revenue</p>
      <p class="text-2xl font-semibold tabular-nums">¥1,284,000</p>
      <p class="flex flex-wrap items-center gap-1 text-sm"><span class="badge" data-variant="secondary">+12.4%</span><span class="text-muted-foreground" data-t="dashboard.vs_previous">vs previous period</span></p>
    </article>
    <!-- three more tiles: dashboard.stat.orders, dashboard.stat.customers, dashboard.stat.refunds -->
  </section>

  <section class="card" aria-labelledby="dashboard-chart-title">
    <header>
      <h2 id="dashboard-chart-title" class="font-semibold" data-t="dashboard.chart.title">Revenue by week</h2>
      <p class="text-muted-foreground text-sm" data-t="dashboard.chart.lede">This period against the one before</p>
    </header>
    <section>
      <canvas id="dashboard-chart" class="chart aspect-[5/2] @max-3xl:aspect-[4/3]"
        role="img" aria-label="Revenue by week, this period against the one before"
        data-chart-type="line" data-chart-label-key="week" data-chart-legend="true"
        data-chart-data='[{"week":"W1","now":280,"before":240},{"week":"W2","now":310,"before":260}]'
        data-chart-series='{"now":{"label":"This period","color":"var(--chart-1)","surface":"gradient"},"before":{"label":"Previous period","color":"var(--chart-2)"}}'></canvas>
      <details class="mt-2 text-sm">
        <summary data-t="dashboard.chart.table">Show as a table</summary>
        <div class="table-container mt-2"><table class="table">
          <thead><tr><th data-t="dashboard.chart.week">Week</th><th class="text-right" data-t="dashboard.chart.now">This period</th><th class="text-right" data-t="dashboard.chart.before">Previous period</th></tr></thead>
          <tbody><tr><td>W1</td><td class="text-right tabular-nums">¥280,000</td><td class="text-right tabular-nums">¥240,000</td></tr><tr><td>W2</td><td class="text-right tabular-nums">¥310,000</td><td class="text-right tabular-nums">¥260,000</td></tr></tbody>
        </table></div>
      </details>
    </section>
  </section>

  <section class="card" aria-labelledby="dashboard-attention">
    <header><h2 id="dashboard-attention" class="font-semibold" data-t="dashboard.attention">Needs attention</h2></header>
    <section class="grid gap-2">
      <a class="item" data-variant="outline" href="/orders?status=late">
        <section><h3 data-t="dashboard.attention.late">3 orders are late</h3><p data-t="dashboard.attention.late_hint">Shipped more than 5 days after ordering</p></section>
        <aside><span class="badge" data-variant="destructive">3</span></aside>
      </a>
    </section>
  </section>
</main>
<script src="/static/chart.umd.min.js"></script>
<script src="/static/basecoat.min.js"></script>
<script src="/static/basecoat.chart.min.js"></script>
<script>basecoat.chart(document.getElementById('dashboard-chart'));</script>
```

Texts with `{…}` are filled before they are shown (web: `t("dashboard.updated", time=…)`; no server: `t(key, {time})`).

## States

| State | What changes |
| --- | --- |
| Loaded (default) | As above. Tiles show the value, the change badge and `dashboard.vs_previous`. |
| Loading | Each tile's value and badge become `<div class="skeleton h-8 w-24"></div>` / `h-5 w-16`; the canvas is replaced by `<div class="skeleton aspect-[5/2]">`; `aria-busy="true"` on `main`. |
| Change down | The badge text starts with `−` and uses `data-variant="outline"`; never red unless down is bad for this number (refunds up is `destructive`). |
| No data yet | The tiles show `—`; the chart card body becomes the EmptyState with `dashboard.empty.title` / `dashboard.empty.body` and a link to where data comes from. |
| Error | The chart card body becomes the ErrorRetry block (`dashboard.error`, **Try Again** reloads `GET /dashboard/data`); tiles that loaded stay. |
| Period changed | `hx-get="/dashboard?period=…" hx-trigger="change" hx-target="main" hx-select="main"` on the select; the URL keeps `?period=`. |
| Nothing needs attention | The last card shows `dashboard.attention.none`. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `dashboard.title` | Overview | 概要 |
| `dashboard.updated` | Updated at {time} | {time} に更新 |
| `dashboard.period` | Period | 期間 |
| `dashboard.period.7d` | Last 7 days | 過去 7 日間 |
| `dashboard.period.30d` | Last 30 days | 過去 30 日間 |
| `dashboard.period.12m` | Last 12 months | 過去 12 か月 |
| `dashboard.stats` | Key numbers | 主な数値 |
| `dashboard.stat.revenue` | Revenue | 売上 |
| `dashboard.stat.orders` | Orders | 注文数 |
| `dashboard.stat.customers` | New customers | 新規顧客 |
| `dashboard.stat.refunds` | Refunds | 返金 |
| `dashboard.vs_previous` | vs previous period | 前期間比 |
| `dashboard.chart.title` | Revenue by week | 週ごとの売上 |
| `dashboard.chart.lede` | This period against the one before | 今期間と前期間の比較 |
| `dashboard.chart.now` | This period | 今期間 |
| `dashboard.chart.before` | Previous period | 前期間 |
| `dashboard.chart.table` | Show as a table | 表で表示 |
| `dashboard.chart.week` | Week | 週 |
| `dashboard.chart.now` | This period | 今期 |
| `dashboard.chart.before` | Previous period | 前期 |
| `dashboard.attention` | Needs attention | 要対応 |
| `dashboard.attention.late` | {count} orders are late | {count} 件の注文が遅れています |
| `dashboard.attention.late_hint` | Shipped more than 5 days after ordering | 注文から 5 日以上経って発送 |
| `dashboard.attention.none` | Nothing needs attention. | 対応が必要な項目はありません。 |
| `dashboard.empty.title` | No numbers yet | まだ数値がありません |
| `dashboard.empty.body` | Numbers appear after the first order. | 最初の注文のあとに数値が表示されます。 |
| `dashboard.error` | The chart couldn’t load. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。 |

## Keyboard and focus

1. Period → 2. Show as a table → 3. each attention item (links).
- Tiles and the chart are not focusable; the canvas has `role="img"` and an `aria-label` that says what it shows, and the table under “Show as a table” has the numbers.
- Changing the period keeps focus on the select.

## Phone

- Tiles go two per row (`grid-cols-2`), the chart becomes 4:3, the period select stays top right and wraps under the title if needed.
- The chart's tooltip opens on tap; the table is the way to read exact values.

## Data

```json
{"period": "30d", "updated": "2026-10-18T09:41:00+09:00",
 "stats": [{"key": "revenue", "value": 1284000, "unit": "JPY", "change": 0.124},
           {"key": "orders", "value": 312, "change": 0.031},
           {"key": "customers", "value": 87, "change": -0.052},
           {"key": "refunds", "value": 4, "change": 0.333, "up_is_bad": true}],
 "series": [{"week": "W1", "now": 280, "before": 240}],
 "attention": [{"key": "late", "count": 3, "href": "/orders?status=late"}]}
```

- Web: `GET /dashboard?period=30d` renders the page; `GET /dashboard/data?period=30d` returns the JSON above for the chart.
- No server: `store.summary(period)` returns the same object, computed from local records.
- Numbers are formatted with `Intl.NumberFormat(lang)`; yen has no decimals.

## Don't

- Don't put more than four tiles in a row, or a chart in every tile (that's KpiTile with a Sparkline).
- Don't colour the change by sign alone: down can be good.
- Don't draw the chart with hand-written SVG; use the chart wrapper.
