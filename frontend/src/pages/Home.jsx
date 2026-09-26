import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listJurisdictions, listTasks, searchTask, getTask } from '../api/client.js'
import { useLang, tr, CONTACT, LANGS } from '../lib/i18n.jsx'
import MicButton from '../components/MicButton.jsx'
import { topoOrder } from '../lib/graph.js'
import { AREAS, SOON, CatIcon, lastPlace, savePlace, placeQuery, suggest } from '../lib/categories.jsx'
import Suggestions from '../components/Suggestions.jsx'
import SweepLink from '../components/SweepLink.jsx'

// Real procedures shown as the homepage example, in this order.
const SAMPLES = ['passport', 'driving-licence', 'food-business', 'aadhaar-update']

export default function Home() {
  const { lang, setLang, t } = useLang()
  const [text, setText] = useState('')
  const [state, setState] = useState(() => lastPlace().state)
  const [city, setCity] = useState(() => lastPlace().city)
  const [showSug, setShowSug] = useState(false)
  const [places, setPlaces] = useState([])
  const [error, setError] = useState('')
  const [miss, setMiss] = useState(false)
  const [loading, setLoading] = useState(false)
  const [journeys, setJourneys] = useState([])
  const [sampleId, setSampleId] = useState(SAMPLES[0])
  const [sample, setSample] = useState(null)
  const nav = useNavigate()

  useEffect(() => { document.title = 'Civic Navigator' }, [])
  useEffect(() => { listTasks().then(setJourneys).catch(() => {}); listJurisdictions().then(setPlaces).catch(() => {}) }, [])
  useEffect(() => {
    let live = true
    getTask(sampleId, state, city).then((d) => live && setSample(d)).catch(() => live && setSample(null))
    return () => { live = false }
  }, [sampleId, state, city])
  const cities = places.find((p) => p.state === state)?.cities || []
  const loc = placeQuery({ state, city })
  useEffect(() => { savePlace({ state, city }) }, [state, city])
  const sugg = showSug ? suggest(journeys, text, lang).map((j) => ({ ...j, href: `/task/${j.task_id}${loc}` })) : []
  const count = (a) => journeys.filter((j) => j.area === a).length
  const samples = SAMPLES.map((id) => journeys.find((j) => j.task_id === id)).filter(Boolean)
  const steps = sample ? topoOrder(sample.steps).filter((s) => s.type !== 'milestone') : []

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

  const want = places.find((p) => p.state === state)?.lang
  const wantLang = LANGS.find((x) => x.code === want)

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="pt-8 sm:pt-14 pb-12 grid gap-10 lg:gap-16 lg:grid-cols-[1fr_1fr] items-start">
        <section>
          <h1 className="font-display text-[2.1rem] sm:text-[3.25rem] leading-[1.08] max-w-xl">{t.heroTitle}</h1>
          <p className="mt-4 text-muted text-[1.05rem] max-w-lg">{t.heroSub}</p>

          <form onSubmit={(e) => { e.preventDefault(); go() }} className="mt-8 space-y-4">
            <label htmlFor="q" className="block font-semibold">{t.askLabel}</label>
            <div className="flex gap-2 items-stretch -mt-2">
              <textarea
                id="q" rows={2} maxLength={300} value={text} onChange={(e) => { setText(e.target.value); setShowSug(true) }}
                aria-autocomplete="list" aria-controls="q-suggest" aria-expanded={sugg.length > 0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go() }
                  if (e.key === 'ArrowDown' && sugg.length) { e.preventDefault(); document.querySelector('#q-suggest a')?.focus() }
                  if (e.key === 'Escape') setShowSug(false)
                }}
                placeholder={t.askPlaceholder}
                className="w-full rounded-[3px] border-[1.5px] border-ink/70 bg-card px-4 py-3 text-base resize-none focus:border-accent outline-none"
              />
              <MicButton onText={(said) => { setText(said); go(said) }} onError={setError} />
            </div>
            <Suggestions id="q-suggest" items={sugg} query={text} onClose={() => setShowSug(false)} />
            <fieldset className="grid grid-cols-2 gap-3">
              <legend className="text-sm text-muted mb-1.5">{t.whereBiz}</legend>
              <label className="text-xs text-muted">{t.state}
                <select value={state} onChange={(e) => { const s = e.target.value; setState(s); setCity(places.find((p) => p.state === s)?.cities[0]?.city || '') }}
                  className="mt-1 block w-full rounded-[3px] border border-line bg-card px-3 py-2.5 text-sm text-ink">
                  {places.map((p) => <option key={p.state} value={p.state}>{tr(p, 'state', lang)}{p.covered ? '' : ` (${t.partial})`}</option>)}
                </select>
              </label>
              <label className="text-xs text-muted">{t.city}
                <select value={city} onChange={(e) => setCity(e.target.value)}
                  className="mt-1 block w-full rounded-[3px] border border-line bg-card px-3 py-2.5 text-sm text-ink">
                  {cities.map((c) => <option key={c.city} value={c.city}>{c.city}{c.covered ? '' : ` (${t.partial})`}</option>)}
                </select>
              </label>
            </fieldset>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <button disabled={loading} className="min-h-12 px-7 rounded-[3px] bg-ink text-paper font-semibold disabled:opacity-60 hover:bg-accent">
                {loading ? t.finding : t.showRoadmap}
              </button>
              {wantLang && want !== lang && (
                <button type="button" lang={want} onClick={() => setLang(want)} className="min-h-11 text-sm underline underline-offset-4 decoration-line hover:decoration-ink">
                  {({ en: 'View in English', hi: 'हिन्दी में देखें', mr: 'मराठीत पहा', kn: 'ಕನ್ನಡದಲ್ಲಿ ನೋಡಿ', gu: 'ગુજરાતીમાં જુઓ', ta: 'தமிழில் பார்க்க' })[want]}{wantLang.beta ? ' (Beta)' : ''}
                </button>
              )}
            </div>
            <p className="text-xs text-muted max-w-md">{t.onlyMumbai}</p>
            {error && <p role="alert" className="text-sm text-warn">{error}</p>}
          </form>

          {miss && (
            <div role="status" className="mt-6 border-l-2 border-warn pl-4 py-1">
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

        {/* The product itself: a real roadmap from our data, not a mock-up. */}
        <section aria-labelledby="sample" className="border border-ink/80 bg-card">
          <div className="px-5 pt-4 border-b border-line">
            <p className="text-xs text-muted">{t.sampleLabel}</p>
            <div role="tablist" aria-label={t.sampleLabel} className="mt-1 flex flex-wrap gap-x-5 -mb-px">
              {samples.map((j) => (
                <button key={j.task_id} type="button" role="tab" aria-selected={sampleId === j.task_id} onClick={() => setSampleId(j.task_id)}
                  className={`shrink-0 min-h-11 border-b-2 text-sm ${sampleId === j.task_id ? 'border-stamp text-ink font-semibold' : 'border-transparent text-muted hover:text-ink'}`}>
                  {tr(j, 'title', lang)}
                </button>
              ))}
            </div>
          </div>
          <div role="tabpanel" className="px-5 py-4">
            <h2 id="sample" className="text-xl">{sample ? tr(sample, 'title', lang) : '…'}</h2>
            <ol className="mt-3">
              {steps.map((s, i) => (
                <li key={s.id} className="grid grid-cols-[2rem_1fr] gap-x-2 py-3 border-t border-line first:border-t-0">
                  <span className="font-display text-lg text-stamp tabular-nums leading-6">{i + 1}</span>
                  <span>
                    <span className="block font-medium leading-6">{tr(s, 'name', lang)}</span>
                    <span className="block text-sm text-muted">
                      {t.types?.[s.type] || s.type}{s.office ? ` · ${tr(s, 'office', lang)}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex items-center min-h-12 px-5 border-t border-ink/80">
            <SweepLink to={`/task/${sampleId}${loc}`} className="font-semibold pb-0.5">{t.openFull}</SweepLink>
          </div>
        </section>
      </div>

      <section aria-labelledby="cats" className="border-t border-ink/80 pt-8 pb-14">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="cats" className="text-2xl sm:text-3xl">{t.catTitle}</h2>
          <SweepLink to="/browse" className="text-sm font-semibold pb-0.5">{t.seeAllPlain(journeys.length)}</SweepLink>
        </div>
        <ul className="mt-6 grid lg:grid-cols-2 lg:gap-x-12">
          {AREAS.map((a) => {
            const soon = SOON.includes(a)
            const inner = (
              <>
                <span className={soon ? 'text-muted' : 'text-ink'}><CatIcon k={a} size={24} /></span>
                <span className="min-w-0">
                  <span className="block font-semibold leading-snug">{t.areas[a]}</span>
                  <span className="block text-sm text-muted">{t.areaHint[a]}</span>
                </span>
                <span className="text-sm text-muted tabular-nums text-right">{soon ? t.comingSoon : t.nProcedures(count(a))}</span>
              </>
            )
            const cls = 'grid grid-cols-[1.75rem_1fr_auto] items-center gap-3 py-4 border-b border-line'
            return (
              <li key={a}>
                {soon ? <div className={`${cls} opacity-70`}>{inner}</div>
                  : <Link to={`/browse?area=${a}`} className={`${cls} hover:bg-card -mx-2 px-2`}>{inner}</Link>}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
