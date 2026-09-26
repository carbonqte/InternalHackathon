# Civic Navigator — frontend (PSWB02)

React + Vite + Tailwind + React Flow. Runs fully on mock data until the FastAPI backend is ready.

## Run
    npm install
    npm run dev          # http://localhost:5173

Routes: `/` search · `/task/:taskId` roadmap · `/admin` review queue.

## Plugging in the backend
Only `src/api/client.js` touches data. Replace each mock function body with a `fetch` to
`VITE_API_BASE` (default `http://localhost:8000`) and return the same shape:

| Function | Endpoint | Returns |
|---|---|---|
| `listJurisdictions()` | `GET /jurisdictions` | `[{state, covered, cities:[{city, covered}], rights?}]` |
| `listTasks()` | `GET /tasks` | `[{task_id, title, title_hi, title_mr}]` |
| `searchTask(text, state, city)` | `POST /query` | `{task_id}` or `{task_id: null}` |
| `getTask(id, state, city)` | `GET /tasks/{id}?state=&city=` | national + that state's + that city's **approved** steps, plus `coverage` (`full`/`state`/`national`) and `rights` |
| `getTaskAdmin(id)` | `GET /admin/tasks/{id}` | task with all steps |
| `updateStep(taskId, stepId, fields)` | `PATCH /admin/steps/{id}` | updated step |
| `load/saveProgress` | `GET/PUT /progress/{id}` | array of done step ids (localStorage for now) |

Step shape: `{id, name, name_hi, name_mr, type: document|form|visit|payment|milestone, scope: national|state|local, state?, city?, office, documents[], fee (null = not confirmed), processing_time, requirement: required|conditional|optional, condition?, link, legal?: {act, url, verified}, verified_on, status: pending|approved, depends_on[]}`.

Roadmaps are assembled from three layers: all-India steps + the chosen state's steps + the chosen city's steps.
See `src/mock/tasks.json`.

## Before the demo
- Mock fees/steps are **sample data** — replace with scraped + admin-approved values.
- `/admin` has **no auth** yet; protect it in the backend.
- Backend: set CORS to the frontend origin only, keep LLM keys server-side, sanitize scraped HTML.

## Read-aloud with ElevenLabs (backend)
The frontend never holds the ElevenLabs key. It calls **our** backend, and falls back to the browser's
built-in voice if that call fails, times out (8 s) or isn't configured.

- Turn it on: set `VITE_TTS=elevenlabs` (and `VITE_API_BASE`) in Vercel, then redeploy.
- Endpoint: `POST /tts` with JSON `{ "text": string (max 1200 chars), "lang": "en" | "hi" | "mr" }` → `audio/mpeg`.
- Backend keeps `ELEVENLABS_API_KEY` in an environment variable and calls
  `POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`.
- Suggested voice: **Samhita – Grounded, Confident, Warm** (`Em37RvLnPRGl6d9Suxcj`), a native Hindi voice for clear explainer/IVR use.
  Test Marathi output before the demo and pick a model that supports it.
- Protect credits: rate-limit `/tts` per IP, cap text length, and cache audio by `hash(text + lang)` so the same step is only generated once.
- CORS: allow only the Vercel site's origin.
