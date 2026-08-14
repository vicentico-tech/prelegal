import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.auth import router as auth_router
from app.chat import router as chat_router
from app.db import reset_db

STATIC_DIR = Path(os.environ.get("STATIC_DIR", Path(__file__).resolve().parent.parent / "static"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    reset_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)

if (STATIC_DIR / "_next").is_dir():
    app.mount("/_next", StaticFiles(directory=STATIC_DIR / "_next"), name="next-assets")


def _resolve_within_static(relative_path: str) -> Path | None:
    """Resolve relative_path under STATIC_DIR, rejecting any attempt to escape it."""
    candidate = (STATIC_DIR / relative_path).resolve()
    static_root = STATIC_DIR.resolve()
    if candidate != static_root and static_root not in candidate.parents:
        return None
    return candidate


@app.get("/{full_path:path}")
def serve_frontend(full_path: str) -> FileResponse:
    index_relative = f"{full_path}/index.html" if full_path else "index.html"
    for relative in (full_path, f"{full_path}.html", index_relative):
        resolved = _resolve_within_static(relative)
        if resolved is not None and resolved.is_file():
            return FileResponse(resolved)

    not_found = _resolve_within_static("404.html")
    if not_found is not None and not_found.is_file():
        return FileResponse(not_found, status_code=404)

    raise HTTPException(status_code=404, detail="Not found")
