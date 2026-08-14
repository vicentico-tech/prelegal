import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app


@pytest.fixture()
def static_client(tmp_path, monkeypatch):
    monkeypatch.setattr(main_module, "STATIC_DIR", tmp_path)
    (tmp_path / "index.html").write_text("<html>home</html>")
    (tmp_path / "login.html").write_text("<html>login</html>")
    (tmp_path / "404.html").write_text("<html>missing</html>")
    with TestClient(app) as client:
        yield client


def test_serves_root_index(static_client):
    response = static_client.get("/")
    assert response.status_code == 200
    assert "home" in response.text


def test_serves_named_route_html(static_client):
    response = static_client.get("/login")
    assert response.status_code == 200
    assert "login" in response.text


def test_unknown_route_serves_custom_404(static_client):
    response = static_client.get("/does-not-exist")
    assert response.status_code == 404
    assert "missing" in response.text


def test_resolve_within_static_rejects_traversal(tmp_path, monkeypatch):
    monkeypatch.setattr(main_module, "STATIC_DIR", tmp_path)
    (tmp_path / "index.html").write_text("home")
    outside = tmp_path.parent / "secret.txt"
    outside.write_text("secret")

    assert main_module._resolve_within_static("../secret.txt") is None


def test_resolve_within_static_allows_nested_file(tmp_path, monkeypatch):
    monkeypatch.setattr(main_module, "STATIC_DIR", tmp_path)
    nested = tmp_path / "_next" / "static" / "chunk.js"
    nested.parent.mkdir(parents=True)
    nested.write_text("console.log(1)")

    resolved = main_module._resolve_within_static("_next/static/chunk.js")

    assert resolved == nested.resolve()
