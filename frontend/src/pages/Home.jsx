import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listJurisdictions, listTasks, searchTask, getTask } from '../api/client.js'
import { useLang, tr, CONTACT } from '../lib/i18n.jsx'
import MicButton from '../components/MicButton.jsx'
import { stages } from '../lib/graph.js'

export default function Home() {
  const { lang, t } = useLang()
  const [text, setText] = useState('')
  const [state, setState] = useState('Maharashtra')
  const [city, setCity] = useState('Mumbai')
  const [places, setPlaces] = useState([])
  const [error, setError] = useState('')
  const [miss, setMiss] = useState(false)
  const [loading, setLoading] = useState(false)
  const [journeys, setJourneys] = useState([])
  const [details, setDetails] = useState({})
  const nav = useNavigate()

  useEffect(() => { document.title = 'Civic Navigator' }, [])
  useEffect(() => { listTasks().then(setJourneys).catch(() => {}); listJurisdictions().then(setPlaces).catch(() => {}) }, [])
  useEffect(() => {
    Promise.all(journeys.map((j) => getTask(j.task_id, state, city).catch(() => null)))
      .then((all) => setDetails(Object.fromEntries(all.filter(Boolean).map((x) => [x.task_id, x]))))
  }, [journeys, state, city])
  const cities = places.find((p) => p.state === state)?.cities || []
  const loc = `?state=${encodeURIComponent(state)}&city=${encodeURIComponent(city)}`

  async function go(q = text) {
    if (!q.trim()) return
    setLoading(true); setError(''); setMiss(false)
    try {
      const { task_id } = await searchTask(q.slice(0, 300), state, city)
      if (task_id) nav(`/task/${task_id}${loc}`)
      else setMiss(true)
    } catch {
      setError(t.genericError)
    } finally { setLoading(false) }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-4 pt-10 sm:pt-16 pb-12 grid gap-10 lg:grid-cols-[1.15fr_1fr] items-start">
      <section>
        <h1 className="font-display text-3xl sm:text-[2.75rem] leading-[1.1] max-w-xl">{t.heroTitle}</h1>
        <p className="mt-4 text-muted">{t.heroSub}</p>

        <form onSubmit={(e) => { e.preventDefault(); go() }} className="mt-8 space-y-3">
          <label htmlFor="q" className="sr-only">{t.askLabel}</label>
          <div className="flex gap-2 items-start">
          <textarea
            id="q" rows={2} maxLength={300} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go() } }}
            placeholder={t.askPlaceholder}
            className="w-full rounded-lg border border-line bg-card px-4 py-3 text-base resize-none focus:border-accent outline-none"
          />
          <MicButton onText={(said) => { setText(said); go(said) }} onError={setError} />
          </div>
          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="text-sm text-muted mb-1.5">{t.whereBiz}</legend>
            <label className="text-xs text-muted">{t.state}
              <select value={state} onChange={(e) => { const s = e.target.value; setState(s); setCity(places.find((p) => p.state === s)?.cities[0]?.city || '') }}
                className="mt-1 block w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink">
                {places.map((p) => <option key={p.state} value={p.state}>{tr(p, 'state', lang)}{p.covered ? '' : ` (${t.partial})`}</option>)}
              </select>
            </label>
            <label className="text-xs text-muted">{t.city}
              <select value={city} onChange={(e) => setCity(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-line bg-card px-3 py-2.5 text-sm text-ink">
                {cities.map((c) => <option key={c.city} value={c.city}>{c.city}{c.covered ? '' : ` (${t.partial})`}</option>)}
              </select>
            </label>
          </fieldset>
          <div className="flex">
            <button disabled={loading} className="flex-1 sm:flex-none sm:px-8 rounded-lg bg-accent text-on-accent py-3 text-sm font-medium disabled:opacity-60">
              {loading ? t.finding : t.showRoadmap}
            </button>
          </div>
          <p className="text-xs text-muted">{t.onlyMumbai}</p>
        </form>

        {error && <p role="alert" className="mt-4 text-sm text-warn">{error}</p>}

        {miss && (
          <div role="status" className="mt-6 rounded-xl border border-warn/40 bg-card p-5">
            <p className="font-medium">{t.notCoveredTitle}</p>
            <p className="text-sm text-muted mt-2">{t.supportedNow}</p>
            <ul className="mt-2 space-y-1">
              {journeys.map((j) => (
                <li key={j.task_id}><Link to={`/task/${j.task_id}${loc}`} className="text-sm text-accent underline underline-offset-2">{tr(j, 'title', lang)}</Link></li>
              ))}
            </ul>
            <a href={`mailto:${CONTACT}?subject=${encodeURIComponent('Please add: ' + text.slice(0, 80))}`}
              className="mt-4 inline-block text-sm underline underline-offset-2 text-muted hover:text-ink">{t.suggest}</a>
          </div>
        )}
      </section>

      <section aria-labelledby="ready" className="rounded-xl border border-line bg-card p-5 sm:p-6">
        <h2 id="ready" className="text-lg">{t.previewTitle}</h2>
        <p className="text-sm text-muted mt-1">{t.previewSub}</p>
        <ul className="mt-5 space-y-3">
          {journeys.map((j) => {
            const d = details[j.task_id]
            const groups = d ? stages(d.steps) : []
            const forms = d ? d.steps.filter((x) => x.type === 'form').length : 0
            const visits = d ? d.steps.filter((x) => x.type === 'visit').length : 0
            return (
              <li key={j.task_id}>
                <Link to={`/task/${j.task_id}${loc}`} className="group block rounded-lg border border-line hover:border-accent p-4">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold group-hover:text-accent">{tr(j, 'title', lang)}</span>
                    <span aria-hidden className="text-accent">→</span>
                  </span>
                  {d && (
                    <>
                      <span aria-hidden className="mt-3 flex items-center gap-1">
                        {groups.map((g, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {i > 0 && <span className="w-3 h-0.5 bg-line" />}
                            <span className={`h-6 min-w-6 px-1.5 rounded-full grid place-items-center text-[11px] font-semibold ${i === 0 ? 'bg-next text-on-next' : 'border border-line text-muted'}`}>{g.length}</span>
                          </span>
                        ))}
                      </span>
                      <span className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted tabular-nums">
                        <span><b className="text-ink">{d.steps.length}</b> {t.stepsWord}</span>
                        <span><b className="text-ink">{forms}</b> {t.onlineForms}</span>
                        <span><b className="text-ink">{visits}</b> {t.officeVisits}</span>
                      </span>
                    </>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
        <ul className="mt-5 pt-4 border-t border-line flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {t.trust.map((line) => <li key={line}>✓ {line}</li>)}
        </ul>
      </section>
      </div>
    </>
  )
}
