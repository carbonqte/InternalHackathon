// Admin sign-in with Supabase Auth (email + password). Only the public anon key is used here;
// the backend then checks the token with Supabase and allows only emails in ADMIN_EMAILS.
const URL_ = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const KEY = 'adminSession'

export const authConfigured = !!(URL_ && ANON)

export function currentSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    return s && s.expires_at * 1000 > Date.now() + 30000 ? s : null
  } catch { return null }
}

export async function signIn(email, password) {
  const res = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error_description || data.msg || 'Sign-in failed. Check your email and password.')
  const s = { access_token: data.access_token, expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600), email: data.user?.email }
  try { sessionStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode: session lasts until reload */ }
  return s
}

export function signOut() {
  try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
}
