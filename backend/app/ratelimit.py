"""Tiny in-memory per-IP rate limiter (sliding window). Enough for one Render instance; swap for Redis if you scale out."""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


MAX_KEYS = 50_000  # memory cap: an attacker cycling fake addresses can't grow this forever


class Limiter:
    def __init__(self) -> None:
        self._hits: dict[tuple[str, str], deque] = defaultdict(deque)
        self._lock = threading.Lock()
        self._sweep = 0.0

    def _cleanup(self, now: float) -> None:
        for k in [k for k, q in self._hits.items() if not q or now - q[-1] > 60]:
            del self._hits[k]
        while len(self._hits) > MAX_KEYS:
            del self._hits[next(iter(self._hits))]

    def check(self, request: Request, bucket: str, per_minute: int) -> None:
        ip = client_ip(request)
        now = time.monotonic()
        with self._lock:
            if now - self._sweep > 30 or len(self._hits) > MAX_KEYS:
                self._cleanup(now)
                self._sweep = now
            q = self._hits[(bucket, ip)]
            while q and now - q[0] > 60:
                q.popleft()
            if len(q) >= per_minute:
                raise HTTPException(status_code=429, detail="Too many requests. Please wait a minute and try again.",
                                    headers={"Retry-After": "60"})
            q.append(now)

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def client_ip(request: Request) -> str:
    # Render's proxy APPENDS the real client address, so the right-most entry is the one we can trust.
    # Anything to its left was sent by the client and may be fake.
    fwd = request.headers.get("x-forwarded-for", "")
    if fwd:
        return fwd.split(",")[-1].strip()[:64]
    return request.client.host if request.client else "unknown"


limiter = Limiter()
