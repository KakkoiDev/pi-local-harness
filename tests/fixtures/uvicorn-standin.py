"""A stand-in for `uv run uvicorn app.main:app --port N` in the golden journey (task 327), offline.

The Web app package's real server is FastAPI, which uv would download; tests never download. This stand-in serves, on
127.0.0.1:N from the project folder, a minimal page over the project's own habit code (app.habits, app.streaks,
app.chart, written by the model in the journey): the page, adding a habit and ticking it today all call that code, so
the Preview shows what the finished project can do. Its web layer is the test's; its logic is the project's.
Usage (the journey's uv stand-in runs it): python3 uvicorn-standin.py <port>
"""
import datetime
import html
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import sys
import tempfile
from urllib.parse import parse_qs

sys.path.insert(0, str(Path.cwd()))
from app.habits import add_habit, list_habits, tick, ticks  # noqa: E402  the project's code
from app.streaks import streak  # noqa: E402
from app.chart import month_chart  # noqa: E402

DB = Path(tempfile.mkdtemp(prefix='habits-preview-')) / 'habits.sqlite3'
try: NAME = json.loads(Path('messages/en.json').read_text(encoding='utf-8')).get('app.name') or 'App'
except (OSError, ValueError): NAME = 'App'


def page():
    today = datetime.date.today()
    rows = ''.join(f'<li data-habit="{html.escape(name)}">{html.escape(name)} · streak <b class="streak">{streak(ticks(DB, name))}</b>'
                   f' · this month <span class="month">{sum(month_chart(today.year, today.month, ticks(DB, name)))}</span>'
                   f'<form method="post" action="/tick"><input type="hidden" name="name" value="{html.escape(name)}"><button>Tick today</button></form></li>'
                   for name in list_habits(DB))
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{html.escape(NAME)}</title></head><body>'
            f'<h1>{html.escape(NAME)}</h1><form method="post" action="/habits"><label>Habit <input name="name"></label><button>Add</button></form>'
            f'<ul id="habits">{rows}</ul></body></html>').encode()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass

    def send(self, body, status=200):
        self.send_response(status); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        self.send(page()) if self.path.split('?')[0] == '/' else self.send(b'Not found', 404)

    def do_POST(self):
        form = parse_qs(self.rfile.read(int(self.headers.get('Content-Length') or 0)).decode())
        name = (form.get('name') or [''])[0].strip()
        if self.path == '/habits' and name: add_habit(DB, name)
        elif self.path == '/tick' and name: tick(DB, name, datetime.date.today().isoformat())
        self.send_response(303); self.send_header('Location', '/'); self.send_header('Content-Length', '0'); self.end_headers()


ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1])), Handler).serve_forever()
