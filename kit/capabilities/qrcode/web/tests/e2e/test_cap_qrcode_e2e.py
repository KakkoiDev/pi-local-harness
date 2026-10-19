# pyright: basic
"""Share by QR code (a capability chosen in Project Start), in a real browser: its scenario in SCENARIOS.md, one test named
after its title. The app and the browser come from tests/e2e/conftest.py; with no browser set up it is skipped and
says so."""
from typing import Any


def test_a_qr_code_is_drawn_for_the_page_address(base: str, page: Any) -> None:
    # Given the app open in the browser
    page.goto(base)
    # When the page draws a QR code for its own address with the library the capability brought
    page.evaluate("""async () => {
      const { default: qrcode } = await import('/static/vendor/qrcode.mjs');
      const code = qrcode(0, 'M'); code.addData(location.href); code.make();
      document.body.insertAdjacentHTML('beforeend', `<div id="e2e-qr">${code.createSvgTag({ cellSize: 4, margin: 4, scalable: true })}</div>`);
    }""")
    # Then the QR code is on the page
    page.locator("#e2e-qr svg").wait_for()
