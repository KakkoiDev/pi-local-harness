#!/usr/bin/env python3
"""Serve the design canvas boards for a local look: python3 design/view.py, then open http://127.0.0.1:8765/Work.dc.html

The boards load ./support.js, the canvas runtime. It belongs to the claude.ai Design artifact type, not to this
repo, so it is not committed: save the canvas artifact's `artifact-type/dc-runtime.js` as design/canvas/support.js
(ignored by git). /_blob/<id> resolves to design/canvas/_blob/<id>.css, the stylesheet the boards link.
"""
import http.server
from pathlib import Path

CANVAS = Path(__file__).resolve().parent / 'canvas'


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(CANVAS), **kwargs)

    def translate_path(self, path):
        if path.startswith('/_blob/'):
            return str(CANVAS / '_blob' / (Path(path).name.split('?')[0] + '.css'))
        return super().translate_path(path)

    def guess_type(self, path):
        return 'text/css' if '/_blob/' in str(path) else super().guess_type(path)


if __name__ == '__main__':
    if not (CANVAS / 'support.js').exists():
        print('design/canvas/support.js is missing; see the note at the top of this file.')
    print('http://127.0.0.1:8765/Work.dc.html')
    http.server.ThreadingHTTPServer(('127.0.0.1', 8765), Handler).serve_forever()
