"""Routes: each returns a page or a fragment, never both (the stack's convention)."""
import sqlite3
from pathlib import Path
from typing import Annotated

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app import db, i18n
from app.logic.notes import check_title

ROOT = Path(__file__).resolve().parent.parent


def create_app(database: Path = ROOT / "data.sqlite3") -> FastAPI:
    app = FastAPI()
    connection: sqlite3.Connection = db.connect(database)
    templates = Jinja2Templates(directory=ROOT / "app" / "templates")
    app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")

    def render(request: Request, name: str, status: int = 200, **context: object) -> HTMLResponse:
        asked = request.query_params.get("lang")
        language = i18n.choose(request.cookies.get("lang"), request.headers.get("accept-language"), asked)
        def t(key: str, **values: str) -> str:
            return i18n.translate(language, key, **values)
        response = templates.TemplateResponse(request, name, {"t": t, "lang": language, **context}, status_code=status)
        if asked == language:  # ?lang= is remembered, so the app's next pages and requests keep it
            response.set_cookie("lang", language, max_age=60 * 60 * 24 * 365, samesite="lax")
        return response

    @app.get("/", response_class=HTMLResponse)
    def index(request: Request) -> HTMLResponse:
        return render(request, "pages/index.html", notes=db.notes(connection), title="", problems=[])

    @app.post("/notes", response_class=HTMLResponse)
    def add(request: Request, title: Annotated[str, Form()] = "") -> HTMLResponse:
        clean, problems = check_title(title)
        if problems:  # htmx 4 swaps error responses too: the form comes back with its message, as a 422
            return render(request, "fragments/note_form.html", status=422, title=clean, problems=problems)
        note = db.add_note(connection, clean)
        response = render(request, "fragments/note_created.html", note=note, title="", problems=[])
        return response

    @app.delete("/notes/{note_id}")
    def delete(note_id: int) -> Response:
        db.delete_note(connection, note_id)
        return Response(status_code=200)  # an empty body: htmx swaps the note away

    @app.post("/language")
    def language(lang: Annotated[str, Form()]) -> Response:
        response = Response(status_code=204, headers={"HX-Refresh": "true"})
        if lang in i18n.LANGUAGES:
            response.set_cookie("lang", lang, max_age=60 * 60 * 24 * 365, samesite="lax")
        return response

    @app.get("/manifest.webmanifest")
    def manifest() -> Response:
        return Response((ROOT / "static" / "manifest.webmanifest").read_text(encoding="utf-8"), media_type="application/manifest+json")

    @app.get("/sw.js")
    def service_worker() -> Response:  # served from the root so it controls the whole app
        return Response((ROOT / "static" / "sw.js").read_text(encoding="utf-8"), media_type="text/javascript")

    return app


app = create_app()
