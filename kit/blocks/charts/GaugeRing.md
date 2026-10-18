# GaugeRing

App Block card (Charts). A gauge or progress ring for one value against a limit or goal (storage used, lessons done), with the value written in the middle.

- Basecoat: `card`, `chart` (Chart.js has no gauge: a `doughnut` with two parts, used and free; `circumference: 270, rotation: -135` makes the gauge, 360 the ring), `skeleton`
- Needs: One value and its maximum
- Used in: Dashboard, AccountSettings (storage), AppCourse (lessons), KpiTile

## Markup
Copy, never retype: `{harness}/kit/blocks/charts/GaugeRing.html` (19 lines of HTML).

Copy, never retype: `{harness}/kit/blocks/charts/GaugeRing.2.html` (9 lines of HTML).

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States
- Loaded (default): The arc, the value in the middle as HTML, the scale under it. No legend, no tooltip: the number is written.
- Over a warning line: From 90 %: the used part takes `var(--chart-5)` and a line of text under it says what to do (`chart.storage.almost_full`, `text-destructive`, `role="status"`). The colour change is never the only signal.
- Full: 100 %: `chart.storage.full`, and the action that was blocked says why.
- Ring: Small progress (lessons, steps): `size-24` ring, label beside it. Use `ProgressStatus` (a bar) when space is a line.
- Loading: A round `skeleton` the size of the gauge.
- Theme change: The wrapper redraws; the free part is `var(--border)`.
- Goal variant: `chart.goal.title` and `chart.goal.lede` (“3 of 5 done”) replace the storage title and lede when the gauge shows a goal.

## Texts
(Key | English | 日本語)
- `chart.storage.title`: Storage used | 使用中の容量
- `chart.storage.lede`: {used} of {limit} | {limit}中 {used}
- `chart.storage.scale`: 0 GB · {limit} | 0 GB · {limit}
- `chart.storage.almost_full`: Almost full. Delete files or upgrade to keep uploading. | まもなくいっぱいです。アップロードを続けるには、ファイルを削除するかプランを変更してください。
- `chart.storage.full`: Storage is full. New uploads are paused. | 容量がいっぱいです。新しいアップロードは一時停止中です。
- `chart.goal.title`: Lessons this week | 今週のレッスン
- `chart.goal.lede`: {done} of {goal} done | {goal}件中{done}件完了
- `chart.show_table`: Show as a table | 表で表示
- `chart.storage.used`: Used | 使用中
- `chart.storage.free`: Free | 空き
- `chart.storage.total`: Total | 合計
- `chart.loading`: Loading the chart… | グラフを読み込み中…
- `chart.error`: Couldn’t load the chart. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。
- `chart.retry`: Try Again | 再試行

## Keyboard and focus
1. Not focusable; the `aria-label` states the value, the limit and the percentage.
2. No table: the value and the limit are written as text next to it.

## Phone
- The gauge stays `w-56` centred; the ring keeps `size-24` with its label beside it.
- The warning sentence wraps under the gauge.

## Data
```json
{"used_bytes":7730941132,"limit_bytes":10737418240,"warn_at":0.9}
```

- The page computes the percentage and passes `[used, 100 - used]` as one dataset; colours `var(--chart-1)` and `var(--border)`.
- Sizes are formatted with `Intl.NumberFormat(lang, {style: "unit", unit: "gigabyte", maximumFractionDigits: 1})`.
- Web: comes with the page. No server: `store.usage()` (IndexedDB `navigator.storage.estimate()` for a no-server app).

## Don't
- Don’t add a needle, ticks or coloured zones: one arc, one value.
- Don’t animate the arc on every refresh (`animation: false`).
- Don’t use it for a value with no maximum: use KpiTile.

## Pi Workbench
- Assumes AppFoundations (its card comes with this one).
- Set up: `python3 {harness}/kit/blocks/add.py <project> GaugeRing` copies the libraries it needs (with licences) and adds its texts to messages/en.json and messages/ja.json.
- Check a page: `python3 {harness}/kit/blocks/check.py <file>` (classes Basecoat 1.0.2 does not have, missing labels, charts without a table, hard-coded colours, CDN links).
