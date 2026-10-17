# QR codes for Pi (the card)

One way per kind of project; never a QR web service (the app works offline and the address stays private).

## Web app and terminal app (Python): segno

`uv add segno` (pinned in the project's uv.lock). Pure Python, no dependencies, typed (strict pyright passes).

```python
import io
import segno

def qr_svg(text: str) -> str:
    """An inline SVG for a page (the text is encoded, not inserted as HTML)."""
    out = io.BytesIO()
    segno.make(text, error="m").save(out, kind="svg", scale=4, border=2, xmldecl=False, svgns=False)
    return out.getvalue().decode()

def qr_terminal(text: str) -> str:
    """For a terminal app: put it in a Static widget."""
    out = io.StringIO()
    segno.make(text).terminal(out=out, compact=True)
    return out.getvalue()
```

In a Jinja template: `{{ qr | safe }}` with `qr = qr_svg(url)` made in the route (segno escapes nothing it does not
produce: the SVG is its own markup, the text is encoded as modules). A PNG to download: `kind="png", scale=8`.

## App with no server (browser): qrcode-generator

`kit/vendor/qrcode-generator-2.0.4/qrcode.mjs`, copied into the project's `js/vendor/` (MIT).

```js
import qrcode from './vendor/qrcode.mjs';
const code = qrcode(0, 'M'); code.addData(text); code.make();
element.innerHTML = code.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
```

## Rules

1. Error correction M by default; H only when a logo covers the middle.
2. Keep a margin (border) of at least 2 modules, and black on white: the Pi Workbench 1-bit inverse theme still draws the QR black
   on white, or phones cannot read it.
3. Test what matters: the page has the SVG, and the function that builds the encoded text (the URL) returns what you
   expect. Decoding the image in a test is not needed.
