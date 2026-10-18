# KpiTile

App Block card (Charts). A tile with one key number, its change from the last period in words and an arrow, an optional sparkline, and a link to the full report.

- Basecoat: `card` (`data-size="sm"`), `badge`, `chart` (Sparkline), `skeleton`
- Needs: The value, the previous period’s value, optionally 6–12 recent values
- Used in: Dashboard (a row of 3–4), AppAdmin, AppShop admin, AppCrm

## Markup
Copy, never retype: `{harness}/kit/blocks/charts/KpiTile.html` (12 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/charts/KpiTile.2.html` (5 lines of HTML).

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States
- Loaded (default): Label, value, the change badge (`▲ 9 %` with `data-variant="secondary"` going up, `▼` with `outline` going down), the period, the sparkline, the link.
- Good or bad direction: Up isn’t always good (refunds). The arrow shows direction only; never colour it green/red. If the page must judge, add the word: `kpi.better` / `kpi.worse`.
- No comparison yet: First period: no badge, `kpi.no_comparison` instead.
- Loading: `skeleton` for label, value and badge; `aria-busy="true"` on the card.
- Error: Value `—`, `kpi.error` and a link-style **Try Again**.
- Long numbers: `tabular-nums`, compact above a million (`Intl.NumberFormat(lang, {notation: "compact"})`: 1.2M / 120万).
- Going down: The badge shows `kpi.change_down` (“▼ 4 %”) instead of `kpi.change_up`; same colour, the arrow carries the direction.

## Texts
(Key | English | 日本語)
- `kpi.revenue.title`: Revenue | 売上
- `kpi.revenue.period`: vs last week | 先週比
- `kpi.revenue.link`: View report | レポートを見る
- `kpi.customers.title`: New customers | 新規のお客さま
- `kpi.refunds.title`: Refunds | 返金
- `kpi.change_up`: ▲ {percent} % | ▲ {percent}%
- `kpi.change_down`: ▼ {percent} % | ▼ {percent}%
- `kpi.week`: Week | 週
- `kpi.better`: better | 改善
- `kpi.worse`: worse | 悪化
- `kpi.no_comparison`: First week: a comparison appears next week. | 初週のため、比較は来週から表示されます。
- `kpi.error`: Couldn’t load. | 読み込めませんでした。
- `chart.show_table`: Show as a table | 表で表示
- `chart.loading`: Loading the chart… | グラフを読み込み中…
- `chart.error`: Couldn’t load the chart. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。
- `chart.retry`: Try Again | 再試行

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

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> KpiTile` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
