# Dashboard

App Block card (Content). A summary page: four stat tiles with their change since the last period, one chart of the trend, and a short list of what needs attention.

- Basecoat: `card`, `badge`, `chart`, `select` (native), `item`, `btn`, `skeleton`
- Route: `/` or `/dashboard`
- Needs: Web: `GET /dashboard?period=30d` (the page) and `GET /dashboard/data?period=30d` (JSON for the chart). No server: `store.summary(period)` over local data. Chart.js 4.5.1 + Basecoat chart wrapper.
- Links to: KpiTile, LineChart, AreaChart, BarChart, EmptyState, LoadingState, ErrorRetry, DataTable

## Markup
Copy, never retype: `{harness}/kit/blocks/content/Dashboard.html` (58 lines of HTML).

Texts with `{…}` are filled before they are shown (web: `t("dashboard.updated", time=…)`; no server: `t(key, {time})`).

## States
- Loaded (default): As above. Tiles show the value, the change badge and `dashboard.vs_previous`.
- Loading: Each tile's value and badge become `<div class="skeleton h-8 w-24"></div>` / `h-5 w-16`; the canvas is replaced by `<div class="skeleton aspect-[5/2]">`; `aria-busy="true"` on `main`.
- Change down: The badge text starts with `−` and uses `data-variant="outline"`; never red unless down is bad for this number (refunds up is `destructive`).
- No data yet: The tiles show `—`; the chart card body becomes the EmptyState with `dashboard.empty.title` / `dashboard.empty.body` and a link to where data comes from.
- Error: The chart card body becomes the ErrorRetry block (`dashboard.error`, **Try Again** reloads `GET /dashboard/data`); tiles that loaded stay.
- Period changed: `hx-get="/dashboard?period=…" hx-trigger="change" hx-target="main" hx-select="main"` on the select; the URL keeps `?period=`.
- Nothing needs attention: The last card shows `dashboard.attention.none`.

## Texts
(Key | English | 日本語)
- `dashboard.title`: Overview | 概要
- `dashboard.updated`: Updated at {time} | {time} に更新
- `dashboard.period`: Period | 期間
- `dashboard.period.7d`: Last 7 days | 過去 7 日間
- `dashboard.period.30d`: Last 30 days | 過去 30 日間
- `dashboard.period.12m`: Last 12 months | 過去 12 か月
- `dashboard.stats`: Key numbers | 主な数値
- `dashboard.stat.revenue`: Revenue | 売上
- `dashboard.stat.orders`: Orders | 注文数
- `dashboard.stat.customers`: New customers | 新規顧客
- `dashboard.stat.refunds`: Refunds | 返金
- `dashboard.vs_previous`: vs previous period | 前期間比
- `dashboard.chart.title`: Revenue by week | 週ごとの売上
- `dashboard.chart.lede`: This period against the one before | 今期間と前期間の比較
- `dashboard.chart.now`: This period | 今期間
- `dashboard.chart.before`: Previous period | 前期間
- `dashboard.chart.table`: Show as a table | 表で表示
- `dashboard.attention`: Needs attention | 要対応
- `dashboard.attention.late`: {count} orders are late | {count} 件の注文が遅れています
- `dashboard.attention.late_hint`: Shipped more than 5 days after ordering | 注文から 5 日以上経って発送
- `dashboard.attention.none`: Nothing needs attention. | 対応が必要な項目はありません。
- `dashboard.empty.title`: No numbers yet | まだ数値がありません
- `dashboard.empty.body`: Numbers appear after the first order. | 最初の注文のあとに数値が表示されます。
- `dashboard.error`: The chart couldn’t load. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> Dashboard` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
