import json

import pytest
from fastapi.testclient import TestClient

from app import main, pipeline, search, tts
from app.config import settings
from app.ratelimit import limiter


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    for k in ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "ANTHROPIC_API_KEY", "ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"]:
        monkeypatch.delenv(k, raising=False)
    settings.cache_clear()
    main._store = None
    limiter.reset()
    yield
    settings.cache_clear()
    main._store = None


@pytest.fixture
def client():
    return TestClient(main.app)


@pytest.fixture
def admin(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAILS", "kabir@example.com")
    monkeypatch.setenv("SUPABASE_URL", "https://x.supabase.co")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "anon")
    settings.cache_clear()
    # No service key -> still the JSON store; only auth is "configured".
    monkeypatch.setattr("app.auth.verify_token", lambda tok: {"good": "kabir@example.com", "other": "x@y.com"}.get(tok))
    return {"Authorization": "Bearer good"}


# ---------- public ----------

def test_health(client):
    r = client.get("/health").json()
    assert r["ok"] and r["store"] == "json" and r["tts"] is False


def test_tasks_list_hides_steps(client):
    rows = client.get("/tasks").json()
    assert len(rows) >= 10
    assert all("steps" not in r and "task_id" in r for r in rows)


def test_task_assembled_for_place(client):
    mum = client.get("/tasks/food-business", params={"state": "Maharashtra", "city": "Mumbai"}).json()
    ngp = client.get("/tasks/food-business", params={"state": "Maharashtra", "city": "Nagpur"}).json()
    far = client.get("/tasks/food-business", params={"state": "Nowhere", "city": "X"}).json()
    assert mum["coverage"] == "full" and ngp["coverage"] == "state" and far["coverage"] == "national"
    assert len(mum["steps"]) >= len(ngp["steps"]) >= len(far["steps"])
    assert all(s["status"] == "approved" for s in mum["steps"])
    ids = {s["id"] for s in far["steps"]}
    assert all(d in ids for s in far["steps"] for d in s["depends_on"])  # no dangling dependencies


def test_matches_frontend_mock_rules(client, monkeypatch):
    """Same inputs as the frontend's own getTask: every state/city combo returns a loop-free roadmap."""
    monkeypatch.setenv("RATE_PUBLIC_PER_MIN", "100000"); settings.cache_clear()
    jur = client.get("/jurisdictions").json()
    for t in client.get("/tasks").json():
        for j in jur:
            for c in j["cities"]:
                r = client.get(f"/tasks/{t['task_id']}", params={"state": j["state"], "city": c["city"]}).json()
                assert r["steps"], (t["task_id"], j["state"], c["city"])
                assert not main.has_cycle(r["steps"])


def test_unknown_task_404(client):
    assert client.get("/tasks/nope").status_code == 404


@pytest.mark.parametrize("text,want", [
    ("I want to open a tea stall", "food-business"),
    ("मुझे पासपोर्ट बनवाना है", "passport"),
    ("chai ki tapri", "food-business"),
])
def test_query_keywords(client, text, want):
    r = client.post("/query", json={"text": text}).json()
    assert r == {"task_id": want, "matched_by": "keywords"}


def test_query_no_match_without_llm(client):
    assert client.post("/query", json={"text": "zzqqxx"}).json()["task_id"] is None


def test_query_llm_cannot_invent(client, monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "k")
    settings.cache_clear()

    class R:
        status_code = 200
        def raise_for_status(self): pass
        def json(self): return {"content": [{"text": '{"task_id": "made-up-thing"}'}]}
    monkeypatch.setattr(search.httpx, "post", lambda *a, **k: R())
    assert client.post("/query", json={"text": "zzqqxx"}).json()["task_id"] is None


def test_query_validation(client):
    assert client.post("/query", json={"text": "x" * 301}).status_code == 422
    assert client.post("/query", json={}).status_code == 422


def test_body_size_limit(client):
    r = client.post("/query", content=b"{" + b" " * 70_000 + b"}", headers={"content-type": "application/json"})
    assert r.status_code == 413


def test_tts_not_configured_is_503(client):
    assert client.post("/tts", json={"text": "hello", "lang": "hi"}).status_code == 503


def test_tts_bad_lang(client):
    assert client.post("/tts", json={"text": "hello", "lang": "xx"}).status_code == 422


def test_tts_success_and_cache(client, monkeypatch):
    monkeypatch.setenv("ELEVENLABS_API_KEY", "k")
    monkeypatch.setenv("ELEVENLABS_VOICE_ID", "v")
    settings.cache_clear()
    calls = []

    class R:
        status_code = 200
        content = b"ID3fake"
    def fake(url, **kw):
        calls.append(kw["json"]["text"])
        assert kw["headers"]["xi-api-key"] == "k"
        return R()
    monkeypatch.setattr(tts.httpx, "post", fake)
    tts._cache.clear()
    for _ in range(2):
        r = client.post("/tts", json={"text": "नमस्ते", "lang": "hi"})
        assert r.status_code == 200 and r.headers["content-type"] == "audio/mpeg" and r.content == b"ID3fake"
    assert calls == ["नमस्ते"]  # second call served from cache, no credits spent


def test_public_rate_limit(client, monkeypatch):
    monkeypatch.setenv("RATE_PUBLIC_PER_MIN", "3"); settings.cache_clear()
    assert [client.get("/tasks").status_code for _ in range(4)] == [200, 200, 200, 429]
    assert client.get("/health").status_code == 200  # health checks never limited


def test_tts_rate_limited(client, monkeypatch):
    monkeypatch.setenv("RATE_TTS_PER_MIN", "2")
    settings.cache_clear()
    codes = [client.post("/tts", json={"text": "hi"}).status_code for _ in range(3)]
    assert codes == [503, 503, 429]


def test_security_headers_and_cors(client):
    r = client.get("/tasks", headers={"Origin": "https://civic-navigator-seven.vercel.app"})
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["access-control-allow-origin"] == "https://civic-navigator-seven.vercel.app"
    evil = client.get("/tasks", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in evil.headers


# ---------- admin ----------

def test_admin_needs_setup(client):
    assert client.get("/admin/tasks").status_code == 503


def test_admin_auth(client, admin):
    assert client.get("/admin/tasks").status_code == 401
    assert client.get("/admin/tasks", headers={"Authorization": "Bearer bad"}).status_code == 401
    assert client.get("/admin/tasks", headers={"Authorization": "Bearer other"}).status_code == 403
    assert client.get("/admin/tasks", headers=admin).status_code == 200


def test_admin_edit_step(client, admin):
    t = client.get("/admin/tasks/passport", headers=admin).json()
    sid = t["steps"][0]["id"]
    r = client.patch(f"/admin/tasks/passport/steps/{sid}", headers=admin, json={"fields": {"fee": "₹1,500"}})
    assert r.status_code == 200 and r.json()["fee"] == "₹1,500"
    assert client.patch(f"/admin/tasks/passport/steps/{sid}", headers=admin, json={"fields": {"id": "x"}}).status_code == 422
    assert client.patch(f"/admin/tasks/passport/steps/{sid}", headers=admin, json={"fields": {"status": "live"}}).status_code == 422


def test_admin_blocks_dependency_loop(client, admin):
    steps = client.get("/admin/tasks/passport", headers=admin).json()["steps"]
    first, last = steps[0]["id"], steps[-1]["id"]
    r = client.patch(f"/admin/tasks/passport/steps/{first}", headers=admin, json={"fields": {"depends_on": [last]}})
    assert r.status_code == 422


# ---------- pipeline ----------

GOOD = json.dumps({"steps": [
    {"key": "s1", "name": "Register on the portal", "type": "form", "evidence": "New users must register on the portal first."},
    {"key": "s2", "name": "Pay the application fee", "type": "payment", "fee": "₹1,500", "depends_on": ["s1", "zz"],
     "evidence": "The fee of Rs 1500 is paid online after registration."},
]})


def test_parse_draft_ok():
    d = pipeline.parse_draft("Here you go:\n" + GOOD)
    assert [s.key for s in d.steps] == ["s1", "s2"]
    assert d.steps[1].depends_on == ["s1"]  # unknown key dropped


@pytest.mark.parametrize("raw", [
    "no json here",
    json.dumps({"steps": []}),
    json.dumps({"steps": [{"key": "a", "name": "Do it", "type": "teleport", "evidence": "some long quote"}]}),
    json.dumps({"steps": [
        {"key": "a", "name": "Step A", "type": "form", "depends_on": ["b"], "evidence": "quote number one"},
        {"key": "b", "name": "Step B", "type": "form", "depends_on": ["a"], "evidence": "quote number two"}]}),
])
def test_parse_draft_rejects(raw):
    with pytest.raises(pipeline.ExtractError):
        pipeline.parse_draft(raw)


@pytest.mark.parametrize("url", [
    "http://passportindia.gov.in/x",            # not https
    "https://evil.com/x",                        # not a government domain
    "https://gov.in.evil.com/x",                 # look-alike
    "https://passportindia.gov.in:8443/x",       # odd port
])
def test_check_url_rejects(url):
    with pytest.raises(pipeline.SourceError):
        pipeline.check_url(url, settings())


def test_check_url_blocks_private_ip(monkeypatch):
    monkeypatch.setattr(pipeline.socket, "getaddrinfo", lambda *a, **k: [(0, 0, 0, "", ("10.0.0.5", 443))])
    with pytest.raises(pipeline.SourceError):
        pipeline.check_url("https://intranet.gov.in/x", settings())


def test_html_to_text():
    t = pipeline.html_to_text("<html><head><title>x</title><script>bad()</script></head><body><h1>Apply</h1><p>Step one.</p><li>Bring Aadhaar</li></body></html>")
    assert "bad()" not in t and "Apply" in t and "Bring Aadhaar" in t


def test_admin_extract_adds_pending_not_public(client, admin, monkeypatch):
    monkeypatch.setattr(pipeline, "fetch_source", lambda url, s: "page text " * 50)
    monkeypatch.setattr(pipeline, "call_llm", lambda prompt, s: GOOD)
    before = len(client.get("/tasks/passport").json()["steps"])
    r = client.post("/admin/extract", headers=admin,
                    json={"task_id": "passport", "url": "https://www.passportindia.gov.in/x", "scope": "national"})
    assert r.status_code == 200 and r.json()["added"] == 2
    assert all(s["status"] == "pending" for s in r.json()["steps"])
    assert len(client.get("/tasks/passport").json()["steps"]) == before  # citizens don't see it yet
    again = client.post("/admin/extract", headers=admin,
                        json={"task_id": "passport", "url": "https://www.passportindia.gov.in/x"}).json()
    assert again["added"] == 0 and again["skipped_existing"] == 2


def test_admin_extract_scope_validation(client, admin):
    r = client.post("/admin/extract", headers=admin, json={"task_id": "passport", "url": "https://a.gov.in/x", "scope": "local"})
    assert r.status_code == 422


def test_errors_do_not_leak(client, monkeypatch):
    def boom():
        raise RuntimeError("secret internals")
    monkeypatch.setattr(main, "store", boom)
    r = TestClient(main.app, raise_server_exceptions=False).get("/tasks")
    assert r.status_code == 500 and "secret" not in r.text


# ---------- fixes from the security review ----------

def test_spoofed_forwarded_for_does_not_bypass_limit(client, monkeypatch):
    monkeypatch.setenv("RATE_PUBLIC_PER_MIN", "3"); settings.cache_clear()
    codes = [client.get("/tasks", headers={"X-Forwarded-For": f"1.2.3.{i}, 9.9.9.9"}).status_code for i in range(5)]
    assert codes[-1] == 429


def test_limiter_memory_is_bounded(monkeypatch):
    from app import ratelimit
    monkeypatch.setattr(ratelimit, "MAX_KEYS", 50)
    lim = ratelimit.Limiter()

    class Req:
        client = None
        def __init__(self, ip): self.headers = {"x-forwarded-for": ip}
    for i in range(500):
        lim.check(Req(f"10.0.{i // 250}.{i % 250}"), "b", 100)
    assert len(lim._hits) <= 51


def test_bad_content_length(client):
    r = client.post("/query", content=b'{"text":"x"}', headers={"content-type": "application/json", "content-length": "abc"})
    assert r.status_code == 400


def test_blocks_carrier_nat_and_userinfo(monkeypatch):
    monkeypatch.setattr(pipeline.socket, "getaddrinfo", lambda *a, **k: [(0, 0, 0, "", ("100.64.0.1", 443))])
    with pytest.raises(pipeline.SourceError):
        pipeline.check_url("https://x.gov.in/", settings())
    with pytest.raises(pipeline.SourceError):
        pipeline.check_url("https://user@x.gov.in/", settings())


def test_fetch_connects_to_checked_ip(monkeypatch):
    """The request goes to the IP we vetted, with the real hostname for TLS; a second DNS answer can't redirect it."""
    monkeypatch.setattr(pipeline.socket, "getaddrinfo", lambda *a, **k: [(0, 0, 0, "", ("164.100.1.1", 443))])
    seen = {}

    class Resp:
        is_redirect = False; status_code = 200; encoding = "x-unknown-charset"
        headers = {"content-type": "text/html"}
        def __enter__(self): return self
        def __exit__(self, *a): pass
        def iter_bytes(self): yield b"<p>" + b"Apply online. " * 40 + b"</p>"

    def fake_stream(self, method, url, headers=None, extensions=None):
        seen.update(url=url, host=headers["Host"], sni=extensions["sni_hostname"]); return Resp()
    monkeypatch.setattr(pipeline.httpx.Client, "stream", fake_stream)
    text = pipeline.fetch_source("https://www.passportindia.gov.in/apply", settings())
    assert seen == {"url": "https://164.100.1.1/apply", "host": "www.passportindia.gov.in", "sni": "www.passportindia.gov.in"}
    assert "Apply online" in text  # unknown charset handled


@pytest.mark.parametrize("fields", [
    {"link": "javascript:alert(1)"}, {"documents": "not a list"}, {"name": 5}, {"type": "x"},
    {"legal": {"act": "A", "url": "http://x"}},
])
def test_admin_patch_types(client, admin, fields):
    sid = client.get("/admin/tasks/passport", headers=admin).json()["steps"][0]["id"]
    assert client.patch(f"/admin/tasks/passport/steps/{sid}", headers=admin, json={"fields": fields}).status_code == 422


def test_unreachable_page_gives_clear_message(client, admin, monkeypatch):
    def boom(*a, **k):
        raise pipeline.httpx.ConnectError("down")
    monkeypatch.setattr(pipeline.socket, "getaddrinfo", lambda *a, **k: [(0, 0, 0, "", ("164.100.1.1", 443))])
    monkeypatch.setattr(pipeline.httpx.Client, "stream", boom)
    r = client.post("/admin/extract", headers=admin, json={"task_id": "passport", "url": "https://www.fssai.gov.in/"})
    assert r.status_code == 422 and "Could not reach that page" in r.json()["detail"]


def test_llm_unreachable_gives_clear_message(monkeypatch):
    monkeypatch.setenv("ANTHROPIC_API_KEY", "k"); settings.cache_clear()
    def boom(*a, **k):
        raise pipeline.httpx.ConnectTimeout("slow")
    monkeypatch.setattr(pipeline.httpx, "post", boom)
    with pytest.raises(pipeline.ExtractError, match="Could not reach the AI service"):
        pipeline.call_llm("x", settings())


def test_server_error_keeps_cors_header(monkeypatch):
    def boom():
        raise RuntimeError("secret internals")
    monkeypatch.setattr(main, "store", boom)
    r = TestClient(main.app, raise_server_exceptions=False).get("/tasks", headers={"Origin": "https://civic-navigator-seven.vercel.app"})
    assert r.status_code == 500 and "secret" not in r.text
    assert r.headers.get("access-control-allow-origin") == "https://civic-navigator-seven.vercel.app"


# ---------- verification requests (SQLite queue) ----------

@pytest.fixture
def reqdb(monkeypatch, tmp_path):
    monkeypatch.setenv("REQUESTS_DB", str(tmp_path / "req.db"))


def test_request_verification_counts_and_sorts(client, reqdb):
    for _ in range(3):
        r = client.post("/api/request-verification", json={"task_id": "solar-subsidy", "procedure_name": "anything"})
        assert r.status_code == 200
    assert r.json() == {"procedure_name": "Get a rooftop solar subsidy", "request_count": 3}  # server's title, not client text
    rows = client.get("/api/admin/requests").json()  # no admin sign-in configured -> open for local demo
    assert rows[0]["procedure_name"] == "Get a rooftop solar subsidy" and rows[0]["request_count"] == 3


def test_request_verification_rejects_verified_and_unknown(client, reqdb):
    assert client.post("/api/request-verification", json={"task_id": "passport"}).status_code == 409
    assert client.post("/api/request-verification", json={"task_id": "nope"}).status_code == 404
    assert client.post("/api/request-verification", json={}).status_code == 422


def test_request_verification_rate_limited(client, reqdb):
    codes = [client.post("/api/request-verification", json={"task_id": "solar-subsidy"}).status_code for _ in range(7)]
    assert codes[:5] == [200] * 5 and 429 in codes[5:]


def test_admin_requests_needs_admin_when_configured(client, reqdb, admin):
    assert client.get("/api/admin/requests").status_code == 401
    assert client.get("/api/admin/requests", headers={"Authorization": "Bearer other"}).status_code == 403
    assert client.get("/api/admin/requests", headers=admin).status_code == 200


def test_unverified_task_is_served_with_flag(client):
    t = client.get("/tasks/solar-subsidy").json()
    assert t["is_verified"] is False and len(t["steps"]) == 6
