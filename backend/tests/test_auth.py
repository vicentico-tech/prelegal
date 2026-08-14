import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_signup_creates_user(client):
    response = client.post("/api/auth/signup", json={"email": "a@example.com", "password": "hunter2"})
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "a@example.com"
    assert isinstance(body["id"], int)


def test_signup_duplicate_email_is_rejected(client):
    client.post("/api/auth/signup", json={"email": "dup@example.com", "password": "hunter2"})
    response = client.post("/api/auth/signup", json={"email": "dup@example.com", "password": "other"})
    assert response.status_code == 409


def test_signin_with_correct_credentials(client):
    client.post("/api/auth/signup", json={"email": "b@example.com", "password": "hunter2"})
    response = client.post("/api/auth/signin", json={"email": "b@example.com", "password": "hunter2"})
    assert response.status_code == 200
    assert response.json()["email"] == "b@example.com"


def test_signin_with_wrong_password_is_rejected(client):
    client.post("/api/auth/signup", json={"email": "c@example.com", "password": "hunter2"})
    response = client.post("/api/auth/signin", json={"email": "c@example.com", "password": "wrong"})
    assert response.status_code == 401


def test_signin_with_unknown_email_is_rejected(client):
    response = client.post("/api/auth/signin", json={"email": "nobody@example.com", "password": "whatever"})
    assert response.status_code == 401


def test_email_is_normalized_for_case_and_whitespace(client):
    client.post("/api/auth/signup", json={"email": "  Mixed@Example.com ", "password": "hunter2"})

    signup_again = client.post(
        "/api/auth/signup", json={"email": "mixed@example.com", "password": "other"}
    )
    signin = client.post("/api/auth/signin", json={"email": "MIXED@EXAMPLE.COM", "password": "hunter2"})

    assert signup_again.status_code == 409
    assert signin.status_code == 200
    assert signin.json()["email"] == "mixed@example.com"


def test_database_is_reset_between_app_startups(client):
    client.post("/api/auth/signup", json={"email": "fresh@example.com", "password": "hunter2"})

    with TestClient(app) as fresh_client:
        response = fresh_client.post(
            "/api/auth/signin", json={"email": "fresh@example.com", "password": "hunter2"}
        )

    assert response.status_code == 401
