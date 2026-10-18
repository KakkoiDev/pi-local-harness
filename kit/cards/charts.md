# Charts for Pi (the card)

One library for every kind of project: Chart.js 4.5.1 (MIT), `kit/vendor/chartjs-4.5.1/chart.umd.min.js`. Copy it into
the project's `static/vendor/chart.umd.min.js` with its `LICENSE.md`. Never a CDN: the app works offline.

## The page

```html
<figure class="card">
  <header><h2 id="sales-title">Sales per month</h2></header>
  <section><canvas id="sales" role="img" aria-labelledby="sales-title"></canvas></section>
  <details><summary>Show as a table</summary>
    <table class="table"><thead><tr><th>Month</th><th>Sales</th></tr></thead>
      <tbody><tr><td>Jan</td><td>12</td></tr><tr><td>Feb</td><td>19</td></tr></tbody></table>
  </details>
</figure>
<script src="/static/vendor/chart.umd.min.js"></script>
<script type="module" src="/static/charts.js"></script>
```

## The script (`static/charts.js`)

```js
// Colours come from the theme (Basecoat's --chart-1..5), so the theme panel restyles charts too.
const css = getComputedStyle(document.documentElement);
const colour = n => css.getPropertyValue(`--chart-${n}`).trim();
new Chart(document.getElementById('sales'), {
  type: 'bar',  // also: 'line', 'pie', 'doughnut', 'scatter', 'radar'
  data: { labels: ['Jan', 'Feb'], datasets: [{ label: 'Sales', data: [12, 19], backgroundColor: colour(1) }] },
  options: { responsive: true, animation: matchMedia('(prefers-reduced-motion: reduce)').matches ? false : {} },
});
```

In the web app, the route passes the numbers to the template (`{{ sales | tojson }}` in a `data-` attribute or a
`<script type="application/json">`); the table and the chart use the same numbers.

## Rules

1. Every chart has a title (`aria-labelledby`) and the same numbers as a table: a chart alone is unreadable for some.
2. Colours only from `--chart-1` to `--chart-5`; never hard-coded hex values.
3. An empty state ("No sales yet") instead of an empty chart; a loading state when the data comes later.
4. Test the numbers (the route or the function that builds them) and that the page has the canvas and the table; do
   not test pixels.
