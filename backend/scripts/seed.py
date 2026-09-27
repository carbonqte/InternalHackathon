"""Copy the website's current JSON data into Supabase (safe to run more than once: rows are upserted).

Usage (from the backend folder, with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in .env or the shell):
    python scripts/seed.py
"""
import json
import os
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
try:
    from dotenv import load_dotenv  # optional
    load_dotenv(ROOT / ".env")
except ImportError:
    pass

from app.config import Settings  # noqa: E402


def main() -> None:
    s = Settings()
    if not s.use_supabase:
        sys.exit("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.")
    tasks = json.loads((s.data_dir / "tasks.json").read_text(encoding="utf-8"))
    jur = json.loads((s.data_dir / "jurisdictions.json").read_text(encoding="utf-8"))
    h = {"apikey": s.supabase_service_key, "Authorization": f"Bearer {s.supabase_service_key}",
         "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}
    base = f"{s.supabase_url}/rest/v1"

    def up(table, rows):
        r = httpx.post(f"{base}/{table}", headers=h, json=rows, timeout=30)
        if r.status_code >= 300:
            sys.exit(f"{table}: HTTP {r.status_code} {r.text[:300]}")
        print(f"{table}: {len(rows)} rows")

    up("jurisdictions", [{"state": j["state"], "data": j} for j in jur])
    up("tasks", [{"task_id": t["task_id"], "meta": {k: v for k, v in t.items() if k not in ("steps", "task_id")}} for t in tasks])
    up("steps", [
        {"id": st["id"], "task_id": t["task_id"], "status": st.get("status", "approved"), "position": i,
         "source_url": st.get("link"), "data": {k: v for k, v in st.items() if k != "status"}}
        for t in tasks for i, st in enumerate(t["steps"])
    ])


if __name__ == "__main__":
    main()
