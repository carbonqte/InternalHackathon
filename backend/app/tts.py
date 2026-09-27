"""Read-aloud through ElevenLabs. The API key stays here on the server; browsers only ever see audio."""
import hashlib
from collections import OrderedDict

import httpx

from .config import Settings

MAX_CHARS = 1200
_cache: "OrderedDict[str, bytes]" = OrderedDict()  # same text twice (very common: step names) costs no credits
_CACHE_ITEMS = 300


class TTSUnavailable(Exception):
    pass


def synthesize(text: str, lang: str, s: Settings) -> bytes:
    if not (s.elevenlabs_key and s.elevenlabs_voice):
        raise TTSUnavailable("not configured")
    text = text.strip()[:MAX_CHARS]
    key = hashlib.sha256(f"{s.elevenlabs_model}|{s.elevenlabs_voice}|{text}".encode()).hexdigest()
    if key in _cache:
        _cache.move_to_end(key)
        return _cache[key]
    r = httpx.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{s.elevenlabs_voice}",
        params={"output_format": "mp3_44100_64"},
        headers={"xi-api-key": s.elevenlabs_key, "content-type": "application/json", "accept": "audio/mpeg"},
        json={"text": text, "model_id": s.elevenlabs_model},
        timeout=20,
    )
    if r.status_code != 200:
        # ElevenLabs explains the problem in the body (quota, bad model, blocked voice); keep it for the server log.
        raise TTSUnavailable(f"elevenlabs {r.status_code}: {r.text[:300]}")
    _cache[key] = r.content
    if len(_cache) > _CACHE_ITEMS:
        _cache.popitem(last=False)
    return r.content
