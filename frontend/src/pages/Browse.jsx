import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listTasks } from '../api/client.js'
import { useLang, tr } from '../lib/i18n.jsx'
import { CATEGORIES, CatIcon, lastPlace, placeQuery, suggest } from '../lib/categories.jsx'

// All procedures, grouped by business type, with a filter box. Works the same for 6 or 600 procedures.
export default function Browse() {
  const { lang, t } = useLang()
  const [params, setParams] = useSearchParams()
  const cat = CATEGORIES.includes(params.get('cat')) ? params.get('cat') : 'all'
  const [q, setQ] = useState('')
  const [all, setAll] = useState(null)
  const [error, setError] = useState(false)
  const place = lastPlace()

  useEffect(() => { document.title = `${t.browseTitle} · Civic Navigator` }, [t])
  useEffect(() => { listTasks().then(setAll).catch(() => setError(true)) }, [])

  const shown = useMemo(() => {
    if (!all) return []
    const base = q.trim().length >= 2 ? suggest(all, q, lang, 999) : all
    return base.filter((j) => cat === 'all' || j.category === cat)
  }, [all, q, cat, lang])

  const groups = CATEGORIES.filter((c) => cat === 'all' || c === cat)
    .map((c) => ({ c, items: shown.filter((j) => j.category === c) }))
    .filter((g) => g.items.length)

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center min-h-11 text-sm text-muted hover:text-ink">{t.newSearch}</Link>
      <h1 className="text-3xl">{t.browseTitle}</h1>
      <p className="text-muted mt-1">{t.browseSub(place.city, place.state)} <Link to="/" className="underline underline-offset-2 hover:text-ink">{t.changePlace}</Link></p>

      <label htmlFor="filter" className="block mt-6 text-sm text-muted">{t.filterLabel}</label>
      <input id="filter" type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={80}
        placeholder={t.filterPlaceholder}
        className="mt-1 w-full min-h-11 rounded-lg border border-line bg-card px-4 focus:border-accent outline-none" />

      <div role="group" aria-label={t.catTitle} className="mt-4 flex flex-wrap gap-2">
        {['all', ...CATEGORIES].map((c) => (
          <button key={c} type="button" aria-pressed={cat === c}
            onClick={() => setParams(c === 'all' ? {} : { cat: c })}
            className={`min-h-11 rounded-full border px-4 text-sm ${cat === c ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card hover:border-muted'}`}>
            {c === 'all' ? t.allCats : t.cats[c]}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-8 text-warn">{t.genericError}</p>}
      {!all && !error && <div aria-busy="true" className="mt-8 space-y-3 animate-pulse">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-lg bg-line/60" />)}</div>}

      {all && !groups.length && (
        <div role="status" className="mt-8 rounded-xl border border-line bg-card p-5">
          <p className="font-medium">{t.notCoveredTitle}</p>
          <button type="button" onClick={() => { setQ(''); setParams({}) }} className="mt-3 min-h-11 text-accent underline underline-offset-2">{t.clearFilters}</button>
        </div>
      )}

      <div className="mt-8 space-y-8" aria-live="polite">
        {groups.map(({ c, items }) => (
          <section key={c} aria-labelledby={`g-${c}`}>
            <h2 id={`g-${c}`} className="flex items-center gap-3 text-lg">
              <span className="text-accent"><CatIcon k={c} size={26} /></span>
              {t.cats[c]}
            </h2>
            <ul className="mt-3 space-y-2">
              {items.map((j) => (
                <li key={j.task_id}>
                  <Link to={`/task/${j.task_id}${placeQuery(place)}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-card px-4 min-h-14 hover:border-accent">
                    <span className="font-medium">{tr(j, 'title', lang)}</span>
                    <span aria-hidden className="text-accent">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  )
}
