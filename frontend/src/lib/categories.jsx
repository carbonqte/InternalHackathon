import { CookingPot, Storefront, Scissors, Factory, DeviceMobile, HouseLine, Briefcase, IdentificationCard, Car, Certificate, Buildings, HandHeart } from '@phosphor-icons/react'
// Business categories. Labels live in i18n (t.cats[key]).
export const CATEGORIES = ['food', 'retail', 'services', 'manufacturing', 'online', 'home']

// Top level: what the citizen needs to do. Business is one of these; property and welfare are not mapped yet.
export const AREAS = ['business', 'ids', 'vehicles', 'certificates', 'property', 'welfare']
export const SOON = ['property', 'welfare']

// Icons: Phosphor Icons (MIT, https://phosphoricons.com), duotone weight.
const ICONS = { food: CookingPot, retail: Storefront, services: Scissors, manufacturing: Factory, online: DeviceMobile, home: HouseLine,
  business: Briefcase, ids: IdentificationCard, vehicles: Car, certificates: Certificate, property: Buildings, welfare: HandHeart }
export function CatIcon({ k, size = 32 }) {
  const I = ICONS[k] || HouseLine
  return <I size={size} weight="duotone" aria-hidden="true" />
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
