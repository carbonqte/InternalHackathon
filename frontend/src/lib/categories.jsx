// Business categories. Labels live in i18n (t.cats[key]); icons are simple line drawings.
export const CATEGORIES = ['food', 'retail', 'services', 'manufacturing', 'online', 'home']

const P = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
export function CatIcon({ k }) {
  switch (k) {
    case 'food': return <svg {...P}><path d="M3 11h18a8 8 0 01-8 8h-2a8 8 0 01-8-8z" /><path d="M8 7c0-1 1-1.5 1-2.5M12 7c0-1 1-1.5 1-2.5M16 7c0-1 1-1.5 1-2.5" /></svg>
    case 'retail': return <svg {...P}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>
    case 'services': return <svg {...P}><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M7.8 16.2L18 4M16.2 16.2L6 4" /></svg>
    case 'manufacturing': return <svg {...P}><path d="M3 21V11l5 3V11l5 3V7l8 4v10H3z" /><path d="M7 17h2M12 17h2M17 17h1" /></svg>
    case 'online': return <svg {...P}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4M9 10l2 2 4-4" /></svg>
    default: return <svg {...P}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-5h4v5" /></svg>
  }
}

// Remember the last place picked on the homepage so other pages can link with it.
export function lastPlace() {
  try { return JSON.parse(localStorage.getItem('place')) || { state: 'Maharashtra', city: 'Mumbai' } } catch { return { state: 'Maharashtra', city: 'Mumbai' } }
}
export function savePlace(p) { try { localStorage.setItem('place', JSON.stringify(p)) } catch { /* private mode */ } }
export const placeQuery = (p) => `?state=${encodeURIComponent(p.state)}&city=${encodeURIComponent(p.city)}`

/** Simple suggestion matching over titles (all languages) and keywords. */
export function suggest(journeys, q, lang, max = 5) {
  const s = q.trim().toLowerCase()
  if (s.length < 2) return []
  return journeys.filter((j) =>
    [j.title, j.title_hi, j.title_mr, ...(j.keywords || [])].some((x) => x?.toLowerCase().includes(s)),
  ).slice(0, max)
}
