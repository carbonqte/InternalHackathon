"""Builds the roadmap a citizen sees for one place. Same rules as frontend/src/api/client.js getTask()."""
import copy


def public_summary(task: dict) -> dict:
    """What GET /tasks lists: everything except the steps and review metadata."""
    return {k: v for k, v in task.items() if k not in ("steps", "last_verified", "sample_data")}


def assemble(task: dict, jurisdictions: list[dict], state: str, city: str) -> dict:
    j = next((x for x in jurisdictions if x.get("state") == state), None)
    state_ok = bool(j and j.get("covered"))
    city_ok = state_ok and any(c.get("city") == city and c.get("covered") for c in j.get("cities", []))

    def applies(s: dict) -> bool:
        if s.get("status") != "approved":
            return False
        scope = s.get("scope")
        return (
            scope == "national"
            or (scope == "state" and state_ok and s.get("state") == state)
            or (scope == "local" and city_ok and s.get("city") == city)
        )

    kept = [s for s in task.get("steps", []) if applies(s)]
    keep = {s["id"] for s in kept}
    out = copy.deepcopy({k: v for k, v in task.items() if k != "steps"})
    out.update(
        state=state,
        city=city,
        coverage="full" if city_ok else "state" if state_ok else "national",
        rights=(j or {}).get("rights"),
        steps=[{**copy.deepcopy(s), "depends_on": [d for d in s.get("depends_on", []) if d in keep]} for s in kept],
    )
    return out


def has_cycle(steps: list[dict]) -> bool:
    """Kahn's algorithm: if we can't order every step, the dependencies loop."""
    ids = {s["id"] for s in steps}
    indeg = {s["id"]: sum(1 for d in s.get("depends_on", []) if d in ids) for s in steps}
    out: dict[str, list[str]] = {i: [] for i in ids}
    for s in steps:
        for d in s.get("depends_on", []):
            if d in ids:
                out[d].append(s["id"])
    queue = [i for i, n in indeg.items() if n == 0]
    seen = 0
    while queue:
        cur = queue.pop()
        seen += 1
        for n in out[cur]:
            indeg[n] -= 1
            if indeg[n] == 0:
                queue.append(n)
    return seen != len(ids)
