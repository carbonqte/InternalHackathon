"""Admin check. Admins sign in with Supabase Auth in the browser; the frontend sends the access token.
We ask Supabase who the token belongs to, then allow only emails listed in ADMIN_EMAILS."""
import httpx
from fastapi import Header, HTTPException

from .config import settings


def verify_token(token: str) -> str | None:
    """Returns the signed-in user's email, or None if the token is not valid."""
    s = settings()
    if not (s.supabase_url and s.supabase_anon_key):
        return None
    try:
        r = httpx.get(f"{s.supabase_url}/auth/v1/user",
                      headers={"apikey": s.supabase_anon_key, "Authorization": f"Bearer {token}"}, timeout=8)
    except httpx.HTTPError:
        return None
    return (r.json().get("email") or "").lower() if r.status_code == 200 else None


def require_admin(authorization: str = Header(default="")) -> str:
    s = settings()
    if not s.admin_emails or not s.supabase_url:
        raise HTTPException(503, "Admin sign-in is not set up on this server yet.")
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Please sign in.")
    email = verify_token(authorization[7:].strip())
    if not email:
        raise HTTPException(401, "Your sign-in has expired. Please sign in again.")
    if email not in s.admin_emails:
        raise HTTPException(403, "This account is not an admin.")
    return email
