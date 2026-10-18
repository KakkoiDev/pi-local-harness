# Charts for Pi (the card)

Chart.js 4.5.1 (MIT, `kit/vendor/chartjs-4.5.1/`) drawn through **Basecoat's own chart wrapper**, `basecoat.chart()`
(Basecoat 1.0.2, MIT, `kit/vendor/basecoat-1.0.2/js/chart.min.js`), as the designer's App Blocks do: tooltips and
legends then use Basecoat's `chart-tooltip` and `chart-legend` styles, and the chart redraws itself on dark mode. Never
a CDN: the app works offline. Paths here are in the harness folder.

## Set up (once per project)

`python3 kit/blocks/add.py <project> LineChart` (or BarChart, AreaChart, DonutChart, ScatterChart,
Sparkline, GaugeRing, FunnelChart, KpiTile, Dashboard) copies Chart.js, Basecoat's script and the wrapper into the
project with their licences (`static/vendor/…` in the web app, `vendor/…` with no server), adds the chart's texts to
`messages/en.json` and `messages/ja.json`, and prints the three script lines to load, in this order, without defer:
`chart.js-4.5.1/chart.umd.min.js`, `basecoat/all.min.js`, `basecoat/chart.min.js`.

## The page

The chart's card (`app_block` tool, or `kit/blocks/charts/<Name>.md`) has the exact markup file to copy. Its
shape:

```html
<section class="card" aria-labelledby="sales-title">
  <header><h2 id="sales-title" data-t="chart.sales.title">Sales per month</h2></header>
  <section>
    <canvas id="sales-chart" class="chart aspect-video" role="img" aria-label="Sales per month: March is highest, 19."
      data-chart-type="bar" data-chart-label-key="month"
      data-chart-data='[{"month":"Jan","sales":12},{"month":"Feb","sales":15},{"month":"Mar","sales":19}]'
      data-chart-series='{"sales":{"label":"Sales","color":"var(--chart-1)"}}' data-chart-legend="true"></canvas>
    <details class="mt-4"><summary data-t="chart.show_table">Show as a table</summary>
      <div class="table-container"><table class="table">…the same numbers…</table></div></details>
  </section>
</section>
<script>
basecoat.chart(document.getElementById('sales-chart'), {
  options: {scales: {y: {beginAtZero: true, ticks: {display: true, color: 'var(--muted-foreground)'}}}}
});
</script>
```

In the web app the route passes the rows to the template (`{{ rows | tojson }}` in `data-chart-data`); the table and the
chart use the same rows. The wrapper hides the y ticks: pass `ticks: {display: true}` when the numbers matter.

## Rules

1. Every chart has a title, `role="img"` with an `aria-label` that states the main finding in words, and the same
   numbers as a table: a chart alone is unreadable for some.
2. Series colours are `var(--chart-1)` … `var(--chart-5)`: colour-blind safe (Okabe–Ito, set by AppFoundations' CSS at
   the end of `styles/input.css`), told apart by lightness too, and restyled by the theme panel. Never a hex value. Use
   them for marks only, never behind text; a second series also differs by dashes or point shape.
3. An empty state ("No sales yet") instead of an empty chart; a skeleton while the data loads; an alert with Try Again
   on error (each chart card lists its states).
4. Test the numbers (the route or the function that builds the rows) and that the page has the canvas and the table;
   do not test pixels. `python3 kit/blocks/check.py <page>` flags a chart without a table or words, and a
   hard-coded colour.
