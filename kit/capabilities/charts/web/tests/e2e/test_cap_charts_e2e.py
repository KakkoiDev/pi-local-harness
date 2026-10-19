# pyright: basic
"""Dashboard and charts (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
after its title. The app and the browser come from tests/e2e/conftest.py; with no browser set up it is skipped and
says so."""
from typing import Any


def test_a_chart_draws_with_the_pinned_chart_library(base: str, page: Any) -> None:
    # Given the app open in the browser
    page.goto(base)
    # When the page draws a bar chart with the chart library the capability brought
    page.add_script_tag(url="/static/vendor/chart.js-4.5.1/chart.umd.min.js")
    drawn = page.evaluate("""() => {
      const canvas = Object.assign(document.createElement('canvas'), { id: 'e2e-chart' });
      document.body.append(canvas);
      new Chart(canvas, { type: 'bar', data: { labels: ['a', 'b'], datasets: [{ label: 'Count', data: [1, 2] }] }, options: { animation: false } });
      return Boolean(Chart.getChart(canvas)) && canvas.width > 0;
    }""")
    # Then the chart is on the page, drawn on its canvas
    assert drawn
