# ScatterChart

A scatter chart to show how two numbers go together (hours and scores, price and sales), one point per item, groups told apart by colour and point shape.

| | |
| --- | --- |
| Group | Charts |
| Basecoat | `card`, `chart` (type `scatter`, data passed as `chartData` because points are `{x, y}`), `table`, `skeleton`, `empty` |
| Needs | Points `[{x, y}]` per group, plus both axis names |
| Used in | Dashboard, AppCourse, AppCrm |

## Markup

```html
<section class="card" aria-labelledby="study-title">
  <header>
    <h2 id="study-title" data-t="chart.study.title">Study hours and scores</h2>
    <p data-t="chart.study.lede">Each point is one student, last test</p>
  </header>
  <section>
    <canvas id="study-chart" class="chart aspect-video max-h-80" role="img" aria-label="Study hours against test score: more hours, higher scores, in both classes." data-chart-type="scatter" data-chart-legend="true"></canvas>
    <details class="mt-4"><summary class="text-sm" data-t="chart.show_table">Show as a table</summary><div class="table-container"><table class="table"><thead><tr><th>Class</th><th>Hours a week</th><th>Score</th></tr></thead><tbody><tr><th scope="row">Class A</th><td class="text-right tabular-nums">1</td><td class="text-right tabular-nums">41</td></tr><tr><th scope="row">Class A</th><td class="text-right tabular-nums">2</td><td class="text-right tabular-nums">44</td></tr><tr><th scope="row">Class A</th><td class="text-right tabular-nums">2</td><td class="text-right tabular-nums">49</td></tr><tr><th scope="row">Class A</th><td class="text-right tabular-nums">3</td><td class="text-right tabular-nums">50</td></tr><tr><th scope="row">Class B</th><td class="text-right tabular-nums">1</td><td class="text-right tabular-nums">33</td></tr><tr><th scope="row">Class B</th><td class="text-right tabular-nums">1</td><td class="text-right tabular-nums">32</td></tr><tr><th scope="row">Class B</th><td class="text-right tabular-nums">2</td><td class="text-right tabular-nums">38</td></tr><tr><th scope="row">Class B</th><td class="text-right tabular-nums">3</td><td class="text-right tabular-nums">57</td></tr></tbody></table></div></details>
  </section>
</section>
```

```html
<script>
basecoat.chart(document.getElementById('study-chart'), {
  chartData: {datasets: [
    {label: 'Class A', data: [{"x":1,"y":41},{"x":2,"y":44},{"x":2,"y":49},{"x":3,"y":50},{"x":4,"y":54},{"x":4,"y":60},{"x":5,"y":75},{"x":6,"y":78},{"x":6,"y":78},{"x":7,"y":73},{"x":8,"y":85},{"x":9,"y":85}], backgroundColor: 'var(--chart-1)', borderColor: 'var(--chart-1)', pointStyle: 'circle', pointRadius: 5},
    {label: 'Class B', data: [{"x":1,"y":33},{"x":1,"y":32},{"x":2,"y":38},{"x":3,"y":57},{"x":3,"y":55},{"x":5,"y":64},{"x":5,"y":64},{"x":6,"y":56},{"x":7,"y":63},{"x":7,"y":69},{"x":8,"y":76},{"x":10,"y":87}], backgroundColor: 'var(--chart-2)', borderColor: 'var(--chart-2)', pointStyle: 'triangle', pointRadius: 6}
  ]},
  options: {scales: {x: {title: {display: true, text: 'Hours a week', color: 'var(--muted-foreground)'}, ticks: {color: 'var(--muted-foreground)'}}, y: {min: 0, max: 100, title: {display: true, text: 'Score', color: 'var(--muted-foreground)'}, ticks: {display: true, color: 'var(--muted-foreground)'}}}}
});
</script>
```

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | The card with the chart, the legend under it (`ul.chart-legend`, made by the wrapper) and the closed table. |
| Loading | In place of the canvas: `<div class="skeleton aspect-video w-full" role="status" aria-busy="true">` with the hidden text `chart.loading`. The header stays. |
| Empty | No rows: no canvas. `div.empty` with `chart.study.empty_title` and `chart.study.empty`; the table toggle is hidden. |
| Error | An `alert` with `data-variant="destructive"`, `chart.error_title`, `chart.error` and a **Try Again** button (`chart.retry`) that loads again. Focus stays where it was. |
| Axis titles | Always on: a scatter without axis names can’t be read. Titles are translated strings passed in `options`. |
| Many points | Over 500 points: `pointRadius: 2` and no table rows beyond the first 50 (the table says “first 50 of N”, `chart.study.first_n`). |
| Hover / touch on a point | Basecoat’s tooltip (`.chart-tooltip`, `role="status" aria-live="polite"`) shows the label and every series’ value at that index. |
| Legend item | Legend items are not buttons: series can’t be hidden by tapping. If a page needs that, it is a separate filter control above the chart. |
| Theme change | The wrapper redraws by itself when `html` changes class (`.dark`); nothing to do. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `chart.study.title` | Study hours and scores | 勉強時間と点数 |
| `chart.study.lede` | Each point is one student, last test | 1点が生徒1人、前回のテスト |
| `chart.study.x` | Hours a week | 週の勉強時間 |
| `chart.study.y` | Score | 点数 |
| `chart.study.class_a` | Class A | Aクラス |
| `chart.study.class_b` | Class B | Bクラス |
| `chart.study.first_n` | First {shown} of {count} | {count}件中、最初の{shown}件 |
| `chart.study.empty_title` | No scores yet | まだ点数はありません |
| `chart.study.empty` | Points appear when the first test is marked. | 最初のテストが採点されると点が表示されます。 |
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
- Axis titles stay; points shrink to `pointRadius: 4`.
- Touch and hold shows the tooltip; the table is the way to read exact values.

## Data

```json
{"groups":[{"label":"Class A","points":[{"x":1,"y":41},{"x":2,"y":44},{"x":2,"y":49}]},{"label":"Class B","points":[{"x":1,"y":33},{"x":1,"y":32},{"x":2,"y":38}]}],"x":"Hours a week","y":"Score"}
```

- Scatter points are `{x, y}`, so the rows/series attributes don’t fit: pass `chartData: {datasets: […]}` to `basecoat.chart`; the wrapper still resolves `var(--chart-n)` colours.
- Second group: `pointStyle: 'triangle'` so groups differ by shape, not only colour.
- Web: `GET /stats/study?test=12` returns JSON for the script, or the fragment with the JSON in a `<script type="application/json">`. No server: `store.scores.points(testId)`.

## Don't

- Don’t draw a trend line unless the page computes it and says how (it is a third dataset of type `line`).
- Don’t join the points with lines.
- Don’t leave out the axis titles.
