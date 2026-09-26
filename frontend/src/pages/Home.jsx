import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listTasks, searchTask } from '../api/client.js'
import { useLang, tr, CONTACT } from '../lib/i18n.jsx'

export default function Home() {
  const { lang, t } = useLang()
  const [text, setText] = useState('')
  const [city, setCity] = useState('Mumbai')
  const [error, setError] = useState('')
  const [miss, setMiss] = useState(false)
  const [loading, setLoading] = useState(false)
  const [journeys, setJourneys] = useState([])
  const nav = useNavigate()

  useEffect(() => { document.title = 'Civic Navigator' }, [])
  useEffect(() => { listTasks().then(setJourneys).catch(() => {}) }, [])

  async function go(q = text) {
    if (!q.trim()) return
    setLoading(true); setError(''); setMiss(false)
    try {
      const { task_id } = await searchTask(q.slice(0, 300), city)
      if (task_id) nav(`/task/${task_id}`)
      else setMiss(true)
    } catch {
      setError(t.genericError)
    } finally { setLoading(false) }
  }

  return (
    <>
      <section className="max-w-2xl mx-auto px-4 pt-14 sm:pt-20 pb-10">
        <h1 className="font-display text-3xl sm:text-5xl leading-tight">{t.heroTitle}</h1>
        <p className="mt-4 text-muted">{t.heroSub}</p>

        <form onSubmit={(e) => { e.preventDefault(); go() }} className="mt-8 space-y-3">
          <label htmlFor="q" className="sr-only">{t.askLabel}</label>
          <textarea
            id="q" rows={2} maxLength={300} value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go() } }}
            placeholder={t.askPlaceholder}
            className="w-full rounded-lg border border-line bg-white px-4 py-3 text-base resize-none focus:border-accent outline-none"
          />
          <div className="flex gap-3">
            <label htmlFor="city" className="sr-only">{t.city}</label>
            <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-line bg-white px-3 text-sm">
              <option value="Mumbai">Mumbai</option>
              <option disabled>{t.moreCities}</option>
            </select>
            <button disabled={loading} className="flex-1 sm:flex-none sm:px-8 rounded-lg bg-accent text-white py-3 text-sm font-medium disabled:opacity-60">
              {loading ? t.finding : t.showRoadmap}
            </button>
          </div>
          <p className="text-xs text-muted">{t.onlyMumbai}</p>
        </form>

        {error && <p role="alert" className="mt-4 text-sm text-warn">{error}</p>}

        {miss && (
          <div role="status" className="mt-6 rounded-xl border border-warn/40 bg-white p-5">
            <p className="font-medium">{t.notCoveredTitle}</p>
            <p className="text-sm text-muted mt-2">{t.supportedNow}</p>
            <ul className="mt-2 space-y-1">
              {journeys.map((j) => (
                <li key={j.task_id}><Link to={`/task/${j.task_id}`} className="text-sm text-accent underline underline-offset-2">{tr(j, 'title', lang)}</Link></li>
              ))}
            </ul>
            <a href={`mailto:${CONTACT}?subject=${encodeURIComponent('Please add: ' + text.slice(0, 80))}`}
              className="mt-4 inline-block text-sm underline underline-offset-2 text-muted hover:text-ink">{t.suggest}</a>
          </div>
        )}
      </section>

      <section className="max-w-2xl mx-auto px-4 pb-10">
        <h2 className="text-xs uppercase tracking-wide text-muted">{t.popular}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {journeys.map((j) => (
            <Link key={j.task_id} to={`/task/${j.task_id}`}
              className="rounded-lg border border-line bg-white px-4 py-3 hover:border-accent">
              <span className="block text-sm font-medium">{tr(j, 'title', lang)}</span>
              <span className="block text-xs text-muted mt-0.5">{j.city}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-line">
        <div className="max-w-5xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-display text-2xl">{t.howTitle}</h2>
            <ol className="mt-5 space-y-4">
              {t.how.map((line, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full border-2 border-ink grid place-items-center text-sm font-semibold">{i + 1}</span>
                  <p className="pt-1">{line}</p>
                </li>
              ))}
            </ol>
          </div>
          <ul className="space-y-3 text-sm self-center">
            {t.trust.map((line) => (
              <li key={line} className="flex items-baseline gap-3 border-b border-line pb-3 last:border-0">
                <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-accent translate-y-[-2px]" />{line}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
