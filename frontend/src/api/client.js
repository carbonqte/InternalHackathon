// All data access lives here. Tomorrow, swap each mock body for a fetch() to FastAPI.
// Keep the response shapes identical and nothing else in the app has to change.
import tasks from '../mock/tasks.json'
import jurisdictions from '../mock/jurisdictions.json'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))
const clone = (x) => structuredClone(x)
let db = clone(tasks) // in-memory stand-in for the backend

/** GET /jurisdictions → [{state, covered, cities:[{city, covered}], rights?}] */
export async function listJurisdictions() {
  await delay(100)
  return clone(jurisdictions)
}

/** GET /tasks → [{task_id, title, ...}] */
export async function listTasks() {
  await delay()
  return db
    .map(({ task_id, title, title_hi, title_mr, category, popular, keywords }) => ({ task_id, title, title_hi, title_mr, category, popular, keywords }))
    .sort((a, b) => (a.popular ?? 99) - (b.popular ?? 99))
}

/** POST /query {text, state, city} → {task_id} | {task_id: null}  (backend will use an LLM / embeddings) */
export async function searchTask(text) {
  await delay()
  const q = text.toLowerCase()
  const scored = db
    .map((t) => ({ id: t.task_id, score: t.keywords.filter((k) => q.includes(k)).length }))
    .sort((a, b) => b.score - a.score)
  return { task_id: scored[0]?.score > 0 ? scored[0].id : null }
}

/**
 * GET /tasks/{id}?state=&city= → task assembled for that place:
 * national steps + steps for that state + steps for that city, approved only.
 * coverage: 'full' (state and city covered), 'state' (city not covered), 'national' (state not covered).
 */
export async function getTask(id, state = 'Maharashtra', city = 'Mumbai') {
  await delay()
  const t = db.find((x) => x.task_id === id)
  if (!t) throw new Error('Task not found')
  const j = jurisdictions.find((x) => x.state === state)
  const stateOk = !!j?.covered
  const cityOk = stateOk && !!j.cities.find((c) => c.city === city)?.covered
  const applies = (s) =>
    s.status === 'approved' &&
    (s.scope === 'national' || (s.scope === 'state' && stateOk && s.state === state) || (s.scope === 'local' && cityOk && s.city === city))
  const keep = new Set(t.steps.filter(applies).map((s) => s.id))
  return clone({
    ...t,
    state, city,
    coverage: cityOk ? 'full' : stateOk ? 'state' : 'national',
    rights: j?.rights || null,
    steps: t.steps.filter((s) => keep.has(s.id)).map((s) => ({ ...s, depends_on: s.depends_on.filter((d) => keep.has(d)) })),
  })
}

/** GET /admin/tasks/{id} → task with all steps (every place, incl. pending) */
export async function getTaskAdmin(id) {
  await delay()
  return clone(db.find((x) => x.task_id === id))
}

/** PATCH /admin/steps/{id} {fields} */
export async function updateStep(taskId, stepId, fields) {
  await delay(150)
  const s = db.find((t) => t.task_id === taskId).steps.find((x) => x.id === stepId)
  Object.assign(s, fields)
  return clone(s)
}

// Progress: GET/PUT /progress/{task_id}. For now it lives in the browser, per task and place.
const key = (id) => `progress:${id}`
export function loadProgress(id) {
  try { return new Set(JSON.parse(localStorage.getItem(key(id)) || '[]')) } catch { return new Set() }
}
export function saveProgress(id, done) {
  try { localStorage.setItem(key(id), JSON.stringify([...done])) } catch { /* private mode */ }
}
