from pathlib import Path

from fastapi.testclient import TestClient

from app.main import create_app


def client(tmp_path: Path) -> TestClient:
    return TestClient(create_app(tmp_path / "test.sqlite3"))


def test_the_page_lists_notes_newest_first(tmp_path: Path) -> None:
    web = client(tmp_path)
    assert "No notes yet" in web.get("/").text
    web.post("/notes", data={"title": "first"}); web.post("/notes", data={"title": "second"})
    page = web.get("/").text
    assert page.index("second") < page.index("first")


def test_adding_returns_the_form_and_the_new_note(tmp_path: Path) -> None:
    response = client(tmp_path).post("/notes", data={"title": "buy milk"})
    assert response.status_code == 200
    assert 'id="note-form"' in response.text and '<hx-partial hx-target="#notes" hx-swap="afterbegin">' in response.text and "buy milk" in response.text


def test_an_empty_title_comes_back_as_the_form_with_its_error(tmp_path: Path) -> None:
    response = client(tmp_path).post("/notes", data={"title": "  "})
    assert response.status_code == 422
    assert "Write something first." in response.text and 'aria-invalid="true"' in response.text


def test_delete_removes_one_note(tmp_path: Path) -> None:
    web = client(tmp_path)
    web.post("/notes", data={"title": "keep"}); web.post("/notes", data={"title": "drop"})
    assert web.delete("/notes/2").status_code == 200
    page = web.get("/").text
    assert "keep" in page and "drop" not in page


def test_japanese_from_the_browser_or_the_choice(tmp_path: Path) -> None:
    web = client(tmp_path)
    assert "メモを追加" in web.get("/", headers={"accept-language": "ja-JP,ja;q=0.9"}).text
    web.post("/language", data={"lang": "en"})
    assert "Add Note" in web.get("/", headers={"accept-language": "ja"}).text, "the person's choice wins"


def test_the_pwa_files_are_served(tmp_path: Path) -> None:
    web = client(tmp_path)
    assert web.get("/manifest.webmanifest").json()["display"] == "standalone"
    worker = web.get("/sw.js")
    assert worker.status_code == 200 and "caches.open" in worker.text
