// All data access lives here. Tomorrow, swap each mock body for a fetch() to FastAPI.
// Keep the response shapes identical and nothing else in the app has to change.
import tasks from '../mock/tasks.json'

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))
const clone = (x) => structuredClone(x)
let db = clone(tasks) // in-memory stand-in for the backend

/** GET /tasks → [{task_id, title, city}] */
export async function listTasks() {
  await delay()
  return db.map(({ task_id, title, title_hi, title_mr, city }) => ({ task_id, title, title_hi, title_mr, city }))
}

/** POST /query {text, city} → {task_id} | {task_id: null}  (backend will use an LLM / embeddings) */
export async function searchTask(text, city = 'Mumbai') {
  await delay()
  const q = text.toLowerCase()
  const scored = db
    .filter((t) => t.city === city)
    .map((t) => ({ id: t.task_id, score: t.keywords.filter((k) => q.includes(k)).length }))
    .sort((a, b) => b.score - a.score)
  return { task_id: scored[0]?.score > 0 ? scored[0].id : null }
}

/** GET /tasks/{id} → task with ONLY approved steps (citizen view) */
export async function getTask(id) {
  await delay()
  const t = db.find((x) => x.task_id === id)
  if (!t) throw new Error('Task not found')
  const approved = new Set(t.steps.filter((s) => s.status === 'approved').map((s) => s.id))
  return clone({
    ...t,
    steps: t.steps
      .filter((s) => approved.has(s.id))
      .map((s) => ({ ...s, depends_on: s.depends_on.filter((d) => approved.has(d)) })),
  })
}

/** GET /admin/tasks/{id} → task with all steps incl. pending */
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

// Progress: GET/PUT /progress/{task_id}. For now it lives in the browser.
const key = (id) => `progress:${id}`
export function loadProgress(id) {
  try { return new Set(JSON.parse(localStorage.getItem(key(id)) || '[]')) } catch { return new Set() }
}
export function saveProgress(id, done) {
  try { localStorage.setItem(key(id), JSON.stringify([...done])) } catch { /* private mode */ }
}
