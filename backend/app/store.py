"""Where procedures live.

JsonStore reads the same files the frontend uses today (frontend/src/mock), so the API works before Supabase exists.
SupabaseStore talks to Supabase's REST API (PostgREST) with the service-role key, which stays on the server.
Both return tasks in exactly the shape the frontend expects: {task_id, title, ..., steps: [...]}.
"""
from __future__ import annotations

import copy
import json
import threading
import time
from datetime import datetime, timezone

import httpx

from .config import Settings

STEP_EDITABLE = {
    "name", "name_hi", "name_mr", "name_kn", "name_gu", "name_ta",
    "office", "office_hi", "office_mr", "why", "why_hi", "why_mr",
    "fee", "processing_time", "documents", "link", "status", "requirement",
    "condition", "condition_hi", "condition_mr", "depends_on", "type", "legal",
}
STATUSES = {"approved", "pending", "rejected"}


class NotFound(Exception):
    pass


class JsonStore:
    """In-memory copy of the JSON files. Edits last until the server restarts (fine for local dev and tests)."""

    def __init__(self, settings: Settings) -> None:
        self._lock = threading.Lock()
        self._tasks = json.loads((settings.data_dir / "tasks.json").read_text(encoding="utf-8"))
        self._jur = json.loads((settings.data_dir / "jurisdictions.json").read_text(encoding="utf-8"))

    def jurisdictions(self) -> list[dict]:
        return copy.deepcopy(self._jur)

    def tasks(self) -> list[dict]:
        return copy.deepcopy(self._tasks)

    def task(self, task_id: str) -> dict:
        for t in self._tasks:
            if t["task_id"] == task_id:
                return copy.deepcopy(t)
        raise NotFound(task_id)

    def update_step(self, task_id: str, step_id: str, fields: dict) -> dict:
        with self._lock:
            t = next((x for x in self._tasks if x["task_id"] == task_id), None)
            s = t and next((x for x in t["steps"] if x["id"] == step_id), None)
            if not s:
                raise NotFound(step_id)
            s.update(fields)
            return copy.deepcopy(s)

    def add_steps(self, task_id: str, steps: list[dict]) -> list[dict]:
        with self._lock:
            t = next((x for x in self._tasks if x["task_id"] == task_id), None)
            if not t:
                raise NotFound(task_id)
            t["steps"].extend(copy.deepcopy(steps))
            return copy.deepcopy(steps)


class SupabaseStore:
    """Tables (see supabase/schema.sql): tasks(task_id, meta), steps(id, task_id, data, status), jurisdictions(state, data).
    Reads are cached for a short time so a busy demo doesn't hammer the database."""

    TTL = 30

    def __init__(self, settings: Settings) -> None:
        self._base = f"{settings.supabase_url}/rest/v1"
        key = settings.supabase_service_key
        self._h = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        self._client = httpx.Client(timeout=10)
        self._cache: dict[str, tuple[float, object]] = {}

    def _get(self, path: str, params: dict) -> list[dict]:
        k = path + json.dumps(params, sort_keys=True)
        hit = self._cache.get(k)
        if hit and time.time() - hit[0] < self.TTL:
            return copy.deepcopy(hit[1])  # type: ignore[arg-type]
        r = self._client.get(f"{self._base}/{path}", params=params, headers=self._h)
        r.raise_for_status()
        data = r.json()
        self._cache[k] = (time.time(), data)
        return copy.deepcopy(data)

    def _clear(self) -> None:
        self._cache.clear()

    def jurisdictions(self) -> list[dict]:
        return [row["data"] for row in self._get("jurisdictions", {"select": "data", "order": "state"})]

    def tasks(self) -> list[dict]:
        metas = self._get("tasks", {"select": "task_id,meta"})
        steps = self._get("steps", {"select": "task_id,data,status", "order": "position"})
        by: dict[str, list[dict]] = {}
        for s in steps:
            by.setdefault(s["task_id"], []).append({**s["data"], "status": s["status"]})
        return [{**m["meta"], "task_id": m["task_id"], "steps": by.get(m["task_id"], [])} for m in metas]

    def task(self, task_id: str) -> dict:
        for t in self.tasks():
            if t["task_id"] == task_id:
                return t
        raise NotFound(task_id)

    def update_step(self, task_id: str, step_id: str, fields: dict) -> dict:
        rows = self._get("steps", {"select": "data,status", "id": f"eq.{step_id}", "task_id": f"eq.{task_id}"})
        if not rows:
            raise NotFound(step_id)
        data = {**rows[0]["data"], **{k: v for k, v in fields.items() if k != "status"}}
        status = fields.get("status", rows[0]["status"])
        r = self._client.patch(
            f"{self._base}/steps",
            params={"id": f"eq.{step_id}", "task_id": f"eq.{task_id}"},
            headers={**self._h, "Prefer": "return=representation"},
            json={"data": data, "status": status, "updated_at": datetime.now(timezone.utc).isoformat()},
        )
        r.raise_for_status()
        self._clear()
        return {**data, "status": status}

    def add_steps(self, task_id: str, steps: list[dict]) -> list[dict]:
        rows = [
            {
                "id": s["id"], "task_id": task_id, "status": s.get("status", "pending"),
                "data": {k: v for k, v in s.items() if k != "status"},
                "source_url": s.get("source_url"), "position": 1000 + i,
            }
            for i, s in enumerate(steps)
        ]
        r = self._client.post(f"{self._base}/steps", headers={**self._h, "Prefer": "return=minimal"}, json=rows)
        r.raise_for_status()
        self._clear()
        return steps


def make_store(settings: Settings):
    return SupabaseStore(settings) if settings.use_supabase else JsonStore(settings)
