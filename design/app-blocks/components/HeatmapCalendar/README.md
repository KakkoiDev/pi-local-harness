# HeatmapCalendar

A calendar grid of small squares, one per day, shaded by how much happened that day (lessons, commits, orders), with a weekly table.

| | |
| --- | --- |
| Group | Charts |
| Basecoat | `card`, `table`, `skeleton`, `[data-tooltip]`. **No Chart.js**: Chart.js has no matrix type without a plugin; a CSS grid is lighter, crisp, and every cell is a real element. |
| Needs | One count per day for the period, and the level thresholds |
| Used in | Dashboard, AppCourse, AppCode (contributions), Profile |

## Markup

```html
<section class="card" aria-labelledby="lessons-title">
  <header>
    <h2 id="lessons-title" data-t="chart.lessons.title">Lessons per day</h2>
    <p data-t="chart.lessons.lede">The last 12 weeks</p>
  </header>
  <section>
    <div role="img" aria-label="Lessons per day over 12 weeks: most active on weekdays, 4 days with 4 or more lessons.">
      <div class="flex gap-2" aria-hidden="true">
        <div class="grid grid-rows-7 gap-1 text-muted-foreground">
          <span class="h-3.5 text-[10px] leading-[14px]" data-t="chart.day.mon">Mon</span><span class="h-3.5"></span><span class="h-3.5 text-[10px] leading-[14px]" data-t="chart.day.wed">Wed</span><span class="h-3.5"></span><span class="h-3.5 text-[10px] leading-[14px]" data-t="chart.day.fri">Fri</span><span class="h-3.5"></span><span class="h-3.5"></span>
        </div>
        <div class="grid grid-flow-col grid-rows-7 gap-1">
          <!-- 7 × weeks cells, Monday first, oldest week first; class from the level (States) -->
          <span class="size-3.5 rounded-[3px] bg-border" data-tooltip="0 lessons · Mon 21 Jul"></span>
          <span class="size-3.5 rounded-[3px] bg-[color-mix(in_oklab,var(--chart-1)_55%,var(--muted))]" data-tooltip="2 lessons · Tue 22 Jul"></span>
          <!-- … -->
          <span class="size-3.5"></span><!-- a day still to come: empty, no colour -->
        </div>
      </div>
      <div class="text-muted-foreground mt-3 flex items-center gap-1 text-xs" aria-hidden="true"><span data-t="chart.lessons.less">Less</span><span class="size-3.5 rounded-[3px] bg-border"></span><span class="size-3.5 rounded-[3px] bg-[color-mix(in_oklab,var(--chart-1)_30%,var(--muted))]"></span><span class="size-3.5 rounded-[3px] bg-[color-mix(in_oklab,var(--chart-1)_55%,var(--muted))]"></span><span class="size-3.5 rounded-[3px] bg-[color-mix(in_oklab,var(--chart-1)_80%,var(--muted))]"></span><span class="size-3.5 rounded-[3px] bg-[var(--chart-1)]"></span><span data-t="chart.lessons.more">More</span></div>
    </div>
    <details class="mt-4"><summary class="text-sm" data-t="chart.show_table">Show as a table</summary><div class="table-container"><table class="table"><thead><tr><th>Week</th><th>Lessons</th><th>Active days</th></tr></thead><tbody><tr><th scope="row">Week 9</th><td class="text-right tabular-nums">14</td><td class="text-right tabular-nums">6</td></tr><tr><th scope="row">Week 10</th><td class="text-right tabular-nums">14</td><td class="text-right tabular-nums">5</td></tr><tr><th scope="row">Week 11</th><td class="text-right tabular-nums">8</td><td class="text-right tabular-nums">3</td></tr><tr><th scope="row">Week 12</th><td class="text-right tabular-nums">11</td><td class="text-right tabular-nums">4</td></tr></tbody></table></div></details>
  </section>
</section>
```

```html
<script>
// no script: the grid is rendered by Jinja (web) or by the page from the store (no server)
// levels: 0 → none, 1 → 1, 2 → 2, 3 → 3, 4 → 4 or more (or quartiles of the period for big counts)
</script>
```

Load once per page, in this order: `vendor/chart.js-4.5.1/chart.umd.min.js`, `vendor/basecoat/basecoat.min.js` (or `all.min.js`), `vendor/basecoat/chart.min.js`. Chart.js is vendored and pinned (MIT); no CDN.

## States

| State | What changes |
| --- | --- |
| Loaded (default) | Columns are weeks (oldest left), rows Monday→Sunday, day labels Mon/Wed/Fri. Cells: level 0 `bg-border`; 1 `bg-[color-mix(in_oklab,var(--chart-1)_30%,var(--muted))]`; 2 `…_55%…`; 3 `…_80%…`; 4 `bg-[var(--chart-1)]`. The legend repeats the five swatches between Less and More. |
| Days to come | Cells after today are empty spans with no background. |
| Hover / focus | `data-tooltip="2 lessons · Tue 22 Jul"` (Basecoat tooltip on hover). Cells are not focusable; the table is the keyboard way. |
| Empty | All cells at level 0 and `chart.lessons.empty` under the grid; the grid still shows so the period is visible. |
| Loading | One `skeleton` block the size of the grid. |
| Long periods | A year is 53 columns: the grid scrolls sideways inside its own `overflow-x-auto` box, scrolled to the latest week on load. |

## Texts

| Key | English | 日本語 |
| --- | --- | --- |
| `chart.lessons.title` | Lessons per day | 1日のレッスン数 |
| `chart.lessons.lede` | The last 12 weeks | 直近12週 |
| `chart.lessons.less` | Less | 少ない |
| `chart.lessons.more` | More | 多い |
| `chart.lessons.cell` | {count} lessons · {date} | {count}レッスン · {date} |
| `chart.lessons.week` | Week | 週 |
| `chart.lessons.total` | Lessons | レッスン |
| `chart.lessons.active_days` | Active days | 学習した日 |
| `chart.lessons.empty` | No lessons yet. Finish one and it shows up here. | まだレッスンはありません。1つ終えるとここに表示されます。 |
| `chart.day.mon` | Mon | 月 |
| `chart.day.wed` | Wed | 水 |
| `chart.day.fri` | Fri | 金 |
| `chart.show_table` | Show as a table | 表で表示 |
| `chart.loading` | Loading the chart… | グラフを読み込み中… |
| `chart.error` | Couldn’t load the chart. Check your connection and try again. | グラフを読み込めませんでした。接続を確認して、もう一度お試しください。 |
| `chart.retry` | Try Again | 再試行 |

## Keyboard and focus

1. The grid is one picture (`role="img"`, `aria-label` summarises it); cells are `aria-hidden` inside it.
2. **Show as a table** gives each week’s total and active days.

## Phone

- Cells stay 14 px; 12 weeks is 12 × 18 px = 216 px wide, fits a phone. Longer periods scroll inside the card (`overflow-x-auto`), latest week visible first.
- Long-press shows the tooltip; the table is the reliable way.

## Data

```json
{"from":"2026-07-21","days":[0,2,1,0,3,4,0],"levels":[0,1,2,3,4]}
```

- Web: Jinja loops the days into the grid (`{% for day in days %}`), level from a filter. No server: `store.lessons.perDay(from, to)` and the page builds the spans.
- Dates in tooltips with `Intl.DateTimeFormat(lang, {weekday: "short", day: "numeric", month: "short"})`.

## Don't

- Don’t use more than five levels or a second colour.
- Don’t make the cells smaller than 12 px.
- Don’t pull in a Chart.js matrix plugin for this.
