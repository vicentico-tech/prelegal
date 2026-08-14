import sqlite3

import bcrypt
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.db import get_connection

router = APIRouter(prefix="/api/auth", tags=["auth"])


class Credentials(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, email: str) -> str:
        return email.strip().lower()


class UserResponse(BaseModel):
    id: int
    email: str


@router.post("/signup", response_model=UserResponse, status_code=201)
def signup(credentials: Credentials) -> UserResponse:
    password_hash = bcrypt.hashpw(credentials.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    try:
        with get_connection() as conn:
            cursor = conn.execute(
                "INSERT INTO users (email, password_hash) VALUES (?, ?)",
                (credentials.email, password_hash),
            )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    return UserResponse(id=cursor.lastrowid, email=credentials.email)


@router.post("/signin", response_model=UserResponse)
def signin(credentials: Credentials) -> UserResponse:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, email, password_hash FROM users WHERE email = ?",
            (credentials.email,),
        ).fetchone()

    if row is None or not bcrypt.checkpw(
        credentials.password.encode("utf-8"), row["password_hash"].encode("utf-8")
    ):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return UserResponse(id=row["id"], email=row["email"])
