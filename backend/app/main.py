"""Civic Navigator API.

Public (no login):  GET /health, /jurisdictions, /tasks, /tasks/{id}?state=&city=   POST /query, /tts,
    /api/request-verification (counts requests to fast-track an unverified procedure; stored in local SQLite)
Admin queue:  GET /api/admin/requests (admin sign-in on the live server; open on a laptop with no sign-in set up)
Admin (Supabase sign-in + email in ADMIN_EMAILS):  GET /admin/tasks, /admin/tasks/{id}
    PATCH /admin/tasks/{id}/steps/{step_id}   POST /admin/extract
Response shapes match frontend/src/api/client.js, so the frontend only swaps mock calls for fetch().
"""
import logging
import os
import sqlite3
import threading
from contextlib import closing
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from . import pipeline, search, tts
from .assemble import assemble, has_cycle, public_summary
from .auth import require_admin
from .config import settings
from .ratelimit import limiter
from .store import STATUSES, STEP_EDITABLE, NotFound, make_store

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
log = logging.getLogger("civic")

MAX_BODY = 64_000

app = FastAPI(title="Civic Navigator API", docs_url="/docs", redoc_url=None)
_store = None


def store():
    global _store
    if _store is None:
        _store = make_store(settings())
    return _store


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings().cors_origins,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=False,
    max_age=600,
)


@app.middleware("http")
async def guard(request: Request, call_next):
    # Reject oversized bodies before reading them. Bodies must declare their size (no chunked uploads).
    raw_len = request.headers.get("content-length")
    if request.method in ("POST", "PATCH", "PUT") and raw_len is None:
        return JSONResponse({"detail": "Content-Length required."}, status_code=411)
    try:
        size = int(raw_len or 0)
    except ValueError:
        return JSONResponse({"detail": "Bad Content-Length."}, status_code=400)
    if size < 0 or size > MAX_BODY:
        return JSONResponse({"detail": "Request too large."}, status_code=413)
    if request.url.path not in ("/health",):
        try:
            limiter.check(request, "public", settings().rate_public)
        except HTTPException as e:
            return JSONResponse({"detail": e.detail}, status_code=e.status_code, headers=e.headers)
    try:
        resp = await call_next(request)
    except Exception:
        # Never leak internals, and keep the CORS header so the browser can show this message instead of "Failed to fetch".
        log.exception("unhandled error on %s", request.url.path)
        resp = JSONResponse({"detail": "Something went wrong on our side. Please try again."}, status_code=500)
        origin = request.headers.get("origin")
        if origin in settings().cors_origins:
            resp.headers["Access-Control-Allow-Origin"] = origin
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["Referrer-Policy"] = "no-referrer"
    resp.headers["X-Frame-Options"] = "DENY"
    return resp


@app.exception_handler(Exception)
async def unexpected(request: Request, exc: Exception):
    # Never leak stack traces or internals to users.
    log.exception("unhandled error on %s", request.url.path)
    return JSONResponse({"detail": "Something went wrong on our side. Please try again."}, status_code=500)


# ---------- public ----------

@app.get("/health")
def health():
    s = settings()
    return {"ok": True, "store": "supabase" if s.use_supabase else "json",
            "tts": bool(s.elevenlabs_key and s.elevenlabs_voice), "llm": bool(s.anthropic_key)}


@app.get("/jurisdictions")
def jurisdictions():
    return store().jurisdictions()


@app.get("/tasks")
def tasks():
    return sorted((public_summary(t) for t in store().tasks()), key=lambda t: t.get("popular", 99))


@app.get("/tasks/{task_id}")
def task(task_id: str, state: str = "Maharashtra", city: str = "Mumbai"):
    try:
        t = store().task(task_id[:80])
    except NotFound:
        raise HTTPException(404, "We don't have that procedure yet.")
    return assemble(t, store().jurisdictions(), state[:60], city[:60])


class Query(BaseModel):
    text: str = Field(min_length=1, max_length=300)
    state: str | None = Field(default=None, max_length=60)
    city: str | None = Field(default=None, max_length=60)


@app.post("/query")
def query(q: Query, request: Request):
    limiter.check(request, "query", settings().rate_query)
    task_id, how = search.find_task(q.text, store().tasks(), settings())
    return {"task_id": task_id, "matched_by": how}


class Speak(BaseModel):
    text: str = Field(min_length=1, max_length=tts.MAX_CHARS)
    lang: Literal["en", "hi", "mr", "kn", "gu", "ta"] = "en"


@app.post("/tts")
def speak(body: Speak, request: Request):
    limiter.check(request, "tts", settings().rate_tts)
    try:
        audio = tts.synthesize(body.text, body.lang, settings())
    except tts.TTSUnavailable as e:
        # The frontend falls back to the browser's own voice on any non-200.
        log.warning("tts unavailable: %s", e)
        raise HTTPException(503, "Read-aloud is not available right now.")
    return Response(audio, media_type="audio/mpeg", headers={"Cache-Control": "public, max-age=86400"})


# ---------- admin ----------

@app.get("/admin/tasks")
def admin_tasks(_: str = Depends(require_admin)):
    return [{**public_summary(t), "pending": sum(1 for s in t["steps"] if s.get("status") == "pending")}
            for t in store().tasks()]


@app.get("/admin/tasks/{task_id}")
def admin_task(task_id: str, _: str = Depends(require_admin)):
    try:
        return store().task(task_id)
    except NotFound:
        raise HTTPException(404, "No such procedure.")


class StepPatch(BaseModel):
    fields: dict = Field(max_length=30)


_TEXT = {"name", "name_hi", "name_mr", "name_kn", "name_gu", "name_ta", "office", "office_hi", "office_mr",
         "why", "why_hi", "why_mr", "fee", "processing_time", "condition", "condition_hi", "condition_mr"}


def _check_fields(f: dict) -> None:
    """Admins are trusted, but approved values go straight to every citizen's browser, so types are enforced."""
    for k, v in f.items():
        if k in _TEXT and not (v is None or (isinstance(v, str) and len(v) <= 400)):
            raise HTTPException(422, f"{k} must be text of at most 400 characters.")
    if "link" in f and not (isinstance(f["link"], str) and f["link"].startswith("https://") and len(f["link"]) <= 500):
        raise HTTPException(422, "link must be an https:// address.")
    if "documents" in f and not (isinstance(f["documents"], list) and len(f["documents"]) <= 20
                                 and all(isinstance(d, str) and len(d) <= 120 for d in f["documents"])):
        raise HTTPException(422, "documents must be a list of short texts.")
    if "type" in f and f["type"] not in ("document", "form", "visit", "payment", "milestone"):
        raise HTTPException(422, "Unknown step type.")
    if "requirement" in f and f["requirement"] not in ("required", "conditional"):
        raise HTTPException(422, "requirement must be required or conditional.")
    if "legal" in f and f["legal"] is not None:
        lg = f["legal"]
        if not (isinstance(lg, dict) and isinstance(lg.get("act"), str) and len(lg["act"]) <= 200
                and isinstance(lg.get("url"), str) and lg["url"].startswith("https://")):
            raise HTTPException(422, "legal must have an act name and an https:// url.")


@app.patch("/admin/tasks/{task_id}/steps/{step_id}")
def admin_update_step(task_id: str, step_id: str, body: StepPatch, who: str = Depends(require_admin)):
    bad = set(body.fields) - STEP_EDITABLE
    if bad:
        raise HTTPException(422, f"These fields can't be edited: {', '.join(sorted(bad))}")
    if "status" in body.fields and body.fields["status"] not in STATUSES:
        raise HTTPException(422, "Status must be approved, pending or rejected.")
    _check_fields(body.fields)
    try:
        t = store().task(task_id)
    except NotFound:
        raise HTTPException(404, "No such procedure.")
    if "depends_on" in body.fields:
        ids = {s["id"] for s in t["steps"]}
        deps = body.fields["depends_on"]
        if not isinstance(deps, list) or any(d not in ids or d == step_id for d in deps):
            raise HTTPException(422, "depends_on must list other steps of this procedure.")
        trial = [{**s, "depends_on": deps if s["id"] == step_id else s.get("depends_on", [])} for s in t["steps"]]
        if has_cycle(trial):
            raise HTTPException(422, "That would make steps depend on each other in a loop.")
    fields = dict(body.fields)
    if fields.get("status") == "approved":
        from datetime import date
        fields.setdefault("verified_on", date.today().isoformat())
    try:
        step = store().update_step(task_id, step_id, fields)
    except NotFound:
        raise HTTPException(404, "No such step.")
    log.info("admin %s updated %s/%s: %s", who, task_id, step_id, sorted(fields))
    return step


class ExtractReq(BaseModel):
    task_id: str = Field(max_length=80)
    url: str = Field(max_length=500)
    scope: Literal["national", "state", "local"] = "national"
    state: str | None = Field(default=None, max_length=60)
    city: str | None = Field(default=None, max_length=60)


@app.post("/admin/extract")
def admin_extract(body: ExtractReq, request: Request, who: str = Depends(require_admin)):
    limiter.check(request, "extract", 6)
    if body.scope == "state" and not body.state or body.scope == "local" and not (body.state and body.city):
        raise HTTPException(422, "State steps need a state; local steps need a state and a city.")
    try:
        t = store().task(body.task_id)
    except NotFound:
        raise HTTPException(404, "No such procedure.")
    try:
        steps = pipeline.extract_steps(t, body.url, body.scope, body.state, body.city, settings())
    except pipeline.SourceError as e:
        raise HTTPException(422, f"Could not use that page: {e}")
    except pipeline.ExtractError as e:
        raise HTTPException(502, str(e))
    existing = {s["id"] for s in t["steps"]}
    fresh = [s for s in steps if s["id"] not in existing]
    store().add_steps(body.task_id, fresh)
    log.info("admin %s extracted %d pending steps for %s from %s", who, len(fresh), body.task_id, body.url)
    return {"added": len(fresh), "skipped_existing": len(steps) - len(fresh), "steps": fresh}


# ---------- verification requests (demand-driven triage queue) ----------
# Citizens can ask for an unverified (AI-drafted) procedure to be fast-tracked. Each click adds one to a counter
# in a small local SQLite file, and admins review the most-requested procedures first.
# SQLite is used on purpose: zero setup for local demos. On Render's free plan the file resets on each deploy.

_db_lock = threading.Lock()


def _db_path() -> str:
    return os.getenv("REQUESTS_DB", str(Path(__file__).resolve().parents[1] / "data" / "requests.db"))


def _db() -> sqlite3.Connection:
    path = _db_path()
    if path != ":memory:":
        Path(path).parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(path, timeout=5)
    con.row_factory = sqlite3.Row
    con.execute(
        "CREATE TABLE IF NOT EXISTS procedure_requests ("
        " id INTEGER PRIMARY KEY AUTOINCREMENT,"
        " procedure_name TEXT NOT NULL UNIQUE,"
        " request_count INTEGER NOT NULL DEFAULT 0)"
    )
    return con


class VerifyReq(BaseModel):
    task_id: str = Field(min_length=1, max_length=80)
    procedure_name: str | None = Field(default=None, max_length=200)  # informational; the server uses its own title


@app.post("/api/request-verification")
def request_verification(body: VerifyReq, request: Request):
    limiter.check(request, "verify", 5)
    try:
        t = store().task(body.task_id)
    except NotFound:
        raise HTTPException(404, "We don't have that procedure.")
    if t.get("is_verified", True):
        raise HTTPException(409, "This procedure is already verified.")
    # The name is taken from our own data, never from the request, so the queue can't be filled with junk text.
    name = t.get("title") or t["task_id"]
    with _db_lock, closing(_db()) as con, con:
        con.execute(
            "INSERT INTO procedure_requests (procedure_name, request_count) VALUES (?, 1) "
            "ON CONFLICT(procedure_name) DO UPDATE SET request_count = request_count + 1",
            (name,),
        )
        count = con.execute("SELECT request_count FROM procedure_requests WHERE procedure_name = ?", (name,)).fetchone()[0]
    return {"procedure_name": name, "request_count": count}


def admin_or_local(authorization: str = Header(default="")) -> str:
    """On the live server (admin sign-in set up) this is the normal admin check.
    On a laptop with no sign-in configured, the queue is open so the demo runs with zero setup."""
    s = settings()
    if s.admin_emails and s.supabase_url:
        return require_admin(authorization)
    return "local-demo"


@app.get("/api/admin/requests")
def admin_requests(_: str = Depends(admin_or_local)):
    with _db_lock, closing(_db()) as con:
        rows = con.execute(
            "SELECT id, procedure_name, request_count FROM procedure_requests ORDER BY request_count DESC, id ASC LIMIT 200"
        ).fetchall()
    return [dict(r) for r in rows]
