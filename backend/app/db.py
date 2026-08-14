import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

DB_PATH = Path(os.environ.get("DB_PATH", Path(__file__).resolve().parent.parent / "data" / "app.db"))


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """A connection that commits on success and always closes, even on error.

    Plain `with sqlite3.connect(...) as conn:` only manages the transaction,
    not the connection itself, which leaks file handles and (on Windows)
    blocks a later reset_db() from unlinking the database file.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def reset_db() -> None:
    """Recreate the database from scratch. Called on every app startup so each
    container run starts with an empty, schema-fresh SQLite file."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    DB_PATH.unlink(missing_ok=True)
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
