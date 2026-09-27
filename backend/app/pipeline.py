"""Official page -> draft steps for a human to approve.

fetch_source: downloads an official page, but only from allowed government domains (https, no private IPs,
              redirects re-checked, size and time limits). This stops the fetcher being used to reach internal hosts.
extract_steps: asks the LLM to turn the page text into steps in our exact JSON shape, using only facts on the page.
               Anything it can't find must be null. The result is validated and saved as status "pending";
               nothing reaches citizens until an admin approves it.
"""
from __future__ import annotations

import hashlib
import ipaddress
import json
import socket
from html.parser import HTMLParser
from typing import Literal
from urllib.parse import urljoin, urlparse

import httpx
from pydantic import BaseModel, Field, ValidationError, field_validator

from .assemble import has_cycle
from .config import Settings

MAX_BYTES = 2_000_000
MAX_TEXT = 24_000  # characters of page text sent to the LLM


class SourceError(Exception):
    pass


class ExtractError(Exception):
    pass


# ---------- fetching ----------

def _allowed_host(host: str, domains: list[str]) -> bool:
    host = host.lower().rstrip(".")
    return any(host == d or host.endswith("." + d) for d in domains)


def resolve_public(host: str) -> str | None:
    """Resolve once and return an address only if EVERY answer is a public internet address."""
    try:
        infos = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
    except (socket.gaierror, UnicodeError):
        return None
    ips = [ipaddress.ip_address(i[4][0].split("%")[0]) for i in infos]
    if not ips or any(not ip.is_global for ip in ips):
        return None
    return str(ips[0])


def check_url(url: str, s: Settings) -> str:
    """Validates the URL and returns the vetted IP address to connect to."""
    p = urlparse(url)
    if p.scheme != "https":
        raise SourceError("Only https:// links are allowed.")
    if not p.hostname or not _allowed_host(p.hostname, s.source_domains):
        raise SourceError(f"Only official domains are allowed ({', '.join(s.source_domains)}).")
    if p.port not in (None, 443):
        raise SourceError("Unusual port not allowed.")
    if p.username or p.password:
        raise SourceError("Links with a username or password are not allowed.")
    ip = resolve_public(p.hostname)
    if not ip:
        raise SourceError("That address does not resolve to a public server.")
    return ip


class _Text(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "head"}

    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self._skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.SKIP:
            self._skip += 1
        elif tag in {"p", "li", "br", "tr", "h1", "h2", "h3", "h4", "div", "td"}:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in self.SKIP and self._skip:
            self._skip -= 1

    def handle_data(self, data):
        if not self._skip and data.strip():
            self.parts.append(data.strip() + " ")


def html_to_text(html: str) -> str:
    p = _Text()
    p.feed(html)
    lines = [" ".join(line.split()) for line in "".join(p.parts).splitlines()]
    return "\n".join(line for line in lines if line)


def fetch_source(url: str, s: Settings) -> str:
    """Returns the readable text of an official page."""
    try:
        return _fetch(url, s)
    except httpx.HTTPError as e:  # site down, timeout, TLS or network trouble
        raise SourceError(f"Could not reach that page ({type(e).__name__}). Check the link opens in your browser, then try again.") from e


def _fetch(url: str, s: Settings) -> str:
    current = url
    with httpx.Client(timeout=15, follow_redirects=False, headers={"User-Agent": "CivicNavigatorBot/1.0 (student project)"}) as c:
        for _ in range(4):
            ip = check_url(current, s)
            p = urlparse(current)
            # Connect to the exact address we checked (no second DNS lookup, so no DNS-rebinding trick),
            # while TLS still verifies the certificate for the real hostname.
            netloc = f"[{ip}]" if ":" in ip else ip
            pinned = p._replace(netloc=netloc).geturl()
            with c.stream("GET", pinned, headers={"Host": p.hostname}, extensions={"sni_hostname": p.hostname}) as r:
                if r.is_redirect:
                    current = urljoin(current, r.headers.get("location", ""))
                    continue
                if r.status_code != 200:
                    raise SourceError(f"The page returned HTTP {r.status_code}.")
                ctype = r.headers.get("content-type", "")
                if "html" not in ctype and "text" not in ctype:
                    raise SourceError("Only web pages are supported for now (not PDFs or files).")
                body = b""
                for chunk in r.iter_bytes():
                    body += chunk
                    if len(body) > MAX_BYTES:
                        raise SourceError("The page is too large.")
                try:
                    decoded = body.decode(r.encoding or "utf-8", errors="replace")
                except LookupError:  # page declares a charset Python doesn't know
                    decoded = body.decode("utf-8", errors="replace")
                text = html_to_text(decoded)
                if len(text) < 200:
                    raise SourceError("Could not find readable text on that page.")
                return text[:MAX_TEXT]
    raise SourceError("Too many redirects.")


# ---------- extraction ----------

class DraftStep(BaseModel):
    key: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=3, max_length=140)
    type: Literal["document", "form", "visit", "payment", "milestone"]
    office: str | None = Field(default=None, max_length=200)
    why: str | None = Field(default=None, max_length=400)
    documents: list[str] = Field(default_factory=list, max_length=20)
    fee: str | None = Field(default=None, max_length=120)
    processing_time: str | None = Field(default=None, max_length=120)
    requirement: Literal["required", "conditional"] = "required"
    condition: str | None = Field(default=None, max_length=200)
    depends_on: list[str] = Field(default_factory=list, max_length=10)
    evidence: str = Field(min_length=10, max_length=400)  # the sentence on the page this step comes from

    @field_validator("documents")
    @classmethod
    def _short_docs(cls, v: list[str]) -> list[str]:
        return [d[:120] for d in v if d.strip()]


class Draft(BaseModel):
    steps: list[DraftStep] = Field(min_length=1, max_length=15)


PROMPT = """You turn an official Indian government web page into the ordered steps a citizen must complete.

Rules:
- Use ONLY facts written in the page text below. Do not use outside knowledge.
- If the page does not state a fee, time, office or document, use null (or [] for documents). Never guess.
- "depends_on" lists the keys of steps that must be finished before this one.
- "type" is one of: document, form (online form), visit (in person), payment, milestone (the end result).
- "evidence" is a short exact quote from the page that supports the step.
- Plain English a first-time applicant understands. At most 12 steps.

Reply with JSON only, no prose, in this shape:
{"steps":[{"key":"s1","name":"...","type":"form","office":null,"why":null,"documents":[],"fee":null,
"processing_time":null,"requirement":"required","condition":null,"depends_on":[],"evidence":"..."}]}

Procedure: %(title)s
Source: %(url)s
Page text:
<<<
%(text)s
>>>"""


def call_llm(prompt: str, s: Settings) -> str:
    if not s.anthropic_key:
        raise ExtractError("No LLM key is set on the server (ANTHROPIC_API_KEY).")
    try:
        r = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": s.anthropic_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json={"model": s.llm_model, "max_tokens": 4000, "messages": [{"role": "user", "content": prompt}]},
            timeout=60,
        )
    except httpx.HTTPError as e:
        raise ExtractError(f"Could not reach the AI service ({type(e).__name__}). Try again in a minute.") from e
    if r.status_code != 200:
        raise ExtractError(f"The LLM request failed (HTTP {r.status_code}).")
    return "".join(b.get("text", "") for b in r.json().get("content", []))


def parse_draft(raw: str) -> Draft:
    try:
        data = json.loads(raw[raw.find("{"): raw.rfind("}") + 1])
        draft = Draft.model_validate(data)
    except (ValueError, ValidationError) as e:
        raise ExtractError(f"The LLM reply was not valid step data: {str(e)[:200]}") from e
    keys = [x.key for x in draft.steps]
    if len(set(keys)) != len(keys):
        raise ExtractError("Two steps share the same key.")
    for x in draft.steps:
        x.depends_on = [d for d in x.depends_on if d in keys and d != x.key]
    if has_cycle([{"id": x.key, "depends_on": x.depends_on} for x in draft.steps]):
        raise ExtractError("The steps depend on each other in a loop.")
    return draft


def to_steps(draft: Draft, task_id: str, url: str, scope: str, state: str | None, city: str | None) -> list[dict]:
    tag = hashlib.sha1(url.encode()).hexdigest()[:6]
    ids = {x.key: f"{task_id}-{tag}-{x.key}"[:80] for x in draft.steps}
    return [
        {
            "id": ids[x.key], "name": x.name, "type": x.type, "office": x.office, "why": x.why,
            "documents": x.documents, "fee": x.fee, "processing_time": x.processing_time,
            "requirement": x.requirement, "condition": x.condition,
            "depends_on": [ids[d] for d in x.depends_on], "link": url, "source_url": url,
            "evidence": x.evidence, "scope": scope, "state": state, "city": city,
            "status": "pending", "verified_on": None,
        }
        for x in draft.steps
    ]


def extract_steps(task: dict, url: str, scope: str, state: str | None, city: str | None, s: Settings) -> list[dict]:
    text = fetch_source(url, s)
    raw = call_llm(PROMPT % {"title": task.get("title", task["task_id"]), "url": url, "text": text}, s)
    return to_steps(parse_draft(raw), task["task_id"], url, scope, state, city)
