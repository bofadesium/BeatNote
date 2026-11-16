"""Production entry point for the hosted demo.

Serves the exported Expo web build at / and the existing FastAPI app under /api,
so the browser talks to one origin and no CORS setup is needed.

Run: uvicorn deploy.server:app --app-dir . --host 0.0.0.0 --port ${PORT:-8000}
"""
import pathlib
import sys

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

ROOT = pathlib.Path(__file__).resolve().parent.parent
WEB_DIR = pathlib.Path("/app/web") if pathlib.Path("/app/web").is_dir() else ROOT / "web"

sys.path.insert(0, str(ROOT / "backend"))

import main as api  # noqa: E402  (needs backend/ on sys.path)

app = FastAPI(title="BeatNote")
app.mount("/api", api.app)
app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
