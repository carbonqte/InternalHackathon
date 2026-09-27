# Civic Navigator API (FastAPI)

Serves the procedures, understands free-text searches, reads steps aloud with ElevenLabs, and lets an admin
import draft steps from official pages for review. Without any keys it still runs, serving the website's own
JSON files, so you can develop and test before Supabase exists.

## Run it on your PC

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env          # then fill in what you have (all optional for a first run)
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs to try every endpoint. Run the tests with `python -m pytest -q`.
To point the website at it: create `frontend/.env.local` with `VITE_API_BASE=http://localhost:8000`, then `npm run dev`.

## Endpoints

| Method | Path | Who | What |
|---|---|---|---|
| GET | `/health` | anyone | which parts are configured (store, tts, llm) |
| GET | `/jurisdictions` | anyone | states and cities, with coverage and rights info |
| GET | `/tasks` | anyone | list of procedures (no steps) |
| GET | `/tasks/{id}?state=&city=` | anyone | the roadmap for that place: national + state + city steps, approved only |
| POST | `/query` `{text, state, city}` | anyone | `{task_id, matched_by}`: keywords first, then the LLM, which can only pick from our list |
| POST | `/tts` `{text, lang}` | anyone | MP3 audio from ElevenLabs (cached; 503 if not set up, and the site falls back to the browser voice) |
| GET | `/admin/tasks`, `/admin/tasks/{id}` | admin | every step, including pending |
| PATCH | `/admin/tasks/{id}/steps/{step_id}` `{fields}` | admin | edit or approve a step (types checked, loops blocked) |
| POST | `/admin/extract` `{task_id, url, scope, state?, city?}` | admin | fetch an official page and save draft steps as **pending** |

Admin = signed in with Supabase Auth **and** email listed in `ADMIN_EMAILS`.

## How the "AI" part works (no model training)

1. An admin pastes an official page link (only `gov.in` / `nic.in` by default).
2. The server downloads it safely (https only, public addresses only, redirects re-checked, 2 MB limit).
3. The LLM turns the page text into steps in our exact JSON format, using only facts on the page and `null`
   for anything missing, plus a short quote from the page as evidence for each step.
4. The reply is validated (types, lengths, no dependency loops) and saved as `pending`.
5. Citizens never see pending steps. The admin compares them with the source and approves or rejects each one.

## Security built in

- API keys (Supabase service role, ElevenLabs, Anthropic) live only in server environment variables.
- Row Level Security: the public key can only read tasks and **approved** steps; nothing can be written with it.
- CORS allows only the Vercel site and localhost.
- Per-IP rate limits (public 120/min, search 30/min, read-aloud 10/min, import 6/min), with memory capped.
- Request bodies are capped at 64 KB; admin edits are type-checked (links must be `https://`).
- Errors never show internals to users.
- The page fetcher blocks private or internal addresses and connects only to the address it checked.

## Tomorrow: setup checklist

1. **Supabase** (supabase.com, then New project; region Mumbai `ap-south-1`)
   - SQL Editor: paste `supabase/schema.sql` and click Run.
   - Project Settings, then API: copy the URL, the `anon` key and the `service_role` key.
   - Authentication, then Users: add your own email as a user (this is your admin login).
2. **Seed the data**: put the three Supabase values in `backend/.env`, then run `python scripts/seed.py`.
3. **Render** (render.com, then New, then Blueprint, then this repo). It reads `render.yaml` at the repo root.
   Fill in the secret values when asked: the Supabase URL and keys, `ADMIN_EMAILS`, `ELEVENLABS_API_KEY`,
   `ELEVENLABS_VOICE_ID` and `ANTHROPIC_API_KEY`.
4. **Vercel**: Project Settings, then Environment Variables. Add `VITE_API_BASE=https://<your-render-url>` and
   `VITE_TTS=elevenlabs`, then redeploy.
5. **Check it**: open `https://<render-url>/health`. It should show `"store":"supabase","tts":true,"llm":true`.

Note: Render's free plan sleeps after about 15 minutes idle, and the first request then takes about 30 to 50
seconds. Open `/health` a minute before you demo.
