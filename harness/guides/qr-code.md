---
triggers: qr, qr code, qrcode, QRコード
---
A QR code: never a web service. Installing a package is the person's step (Gate refuses `uv add`, `pip install`).
Python with segno already in the project: `segno.make(text, error="m")`, `.save(out, kind="svg", scale=4, border=2)`
or `.terminal(out=..., compact=True)`; without it, ask the person to run `uv add segno`, or use the JS generator: copy
`{harness}/kit/vendor/qrcode-generator-2.0.4/qrcode.mjs` into js/vendor/; `qrcode(0, 'M')`, `addData`, `make`,
`createSvgTag({cellSize: 4, margin: 4, scalable: true})`. Black on white, margin 2. `{harness}/kit/cards/qrcode.md`.
