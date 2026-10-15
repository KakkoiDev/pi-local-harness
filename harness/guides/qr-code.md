---
triggers: qr, qr code, qrcode, QRコード
---
A QR code: never a web service. Python (a web app, a terminal app): segno, `uv add segno`; `segno.make(text, error="m")`,
`.save(out, kind="svg", scale=4, border=2, xmldecl=False, svgns=False)` for an inline SVG, `.terminal(out=..., compact=True)`
for a terminal. App with no server: `kit/vendor/qrcode-generator-2.0.4/qrcode.mjs` copied into js/vendor/; `qrcode(0, 'M')`,
`addData`, `make`, `createSvgTag({cellSize: 4, margin: 4, scalable: true})`. Black on white, a margin of 2. kit/cards/qrcode.md.
