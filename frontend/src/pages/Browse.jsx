import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { listTasks } from '../api/client.js'
import { useLang, tr } from '../lib/i18n.jsx'
import { AREAS, SOON, CATEGORIES, CatIcon, lastPlace, placeQuery, suggest } from '../lib/categories.jsx'

// All procedures, grouped by business type, with a filter box. Works the same for 6 or 600 procedures.
export default function Browse() {
  const { lang, t } = useLang()
  const [params, setParams] = useSearchParams()
  const LIVE = AREAS.filter((a) => !SOON.includes(a))
  const area = LIVE.includes(params.get('area')) ? params.get('area') : CATEGORIES.includes(params.get('cat')) ? 'business' : 'all'
  const cat = area === 'business' && CATEGORIES.includes(params.get('cat')) ? params.get('cat') : 'all'
  const [q, setQ] = useState('')
  const [all, setAll] = useState(null)
  const [error, setError] = useState(false)
  const place = lastPlace()

  useEffect(() => { document.title = `${t.browseTitle} · Civic Navigator` }, [t])
  useEffect(() => { listTasks().then(setAll).catch(() => setError(true)) }, [])

  const shown = useMemo(() => {
    if (!all) return []
    const base = q.trim().length >= 2 ? suggest(all, q, lang, 999) : all
    return base.filter((j) => (area === 'all' || j.area === area) && (cat === 'all' || j.category === cat))
  }, [all, q, area, cat, lang])

  // One group per area; business types show as a note on each row.
  const label = (k) => t.areas[k]
  const groups = LIVE
    .map((c) => ({ c, items: shown.filter((j) => j.area === c) }))
    .filter((g) => g.items.length)

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="inline-flex items-center min-h-11 text-sm text-muted hover:text-ink">{t.newSearch}</Link>
      <h1 className="text-3xl">{t.browseTitle}</h1>
      <p className="text-muted mt-1">{t.browseSub(place.city, place.state)} <Link to="/" className="underline underline-offset-2 hover:text-ink">{t.changePlace}</Link></p>

      <label htmlFor="filter" className="block mt-6 text-sm text-muted">{t.filterLabel}</label>
      <input id="filter" type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={80}
        placeholder={t.filterPlaceholder}
        className="mt-1 w-full min-h-11 rounded-[3px] border-[1.5px] border-ink/70 bg-card px-4 focus:border-accent outline-none" />

      <div role="group" aria-label={t.catTitle} className="mt-4 flex flex-wrap gap-2">
        {['all', ...LIVE].map((a) => (
          <button key={a} type="button" aria-pressed={area === a}
            onClick={() => setParams(a === 'all' ? {} : { area: a })}
            className={`min-h-11 rounded-[3px] border px-4 text-sm ${area === a ? 'border-ink bg-ink text-paper' : 'border-line bg-card hover:border-muted'}`}>
            {a === 'all' ? t.allCats : t.areas[a]}
          </button>
        ))}
      </div>
      {area === 'business' && (
        <div role="group" aria-label={t.bizTypes} className="mt-3 flex flex-wrap gap-2 pl-3 border-l-2 border-line">
          {['all', ...CATEGORIES].map((c) => (
            <button key={c} type="button" aria-pressed={cat === c}
              onClick={() => setParams(c === 'all' ? { area: 'business' } : { area: 'business', cat: c })}
              className={`min-h-10 rounded-[3px] border px-3 text-sm ${cat === c ? 'border-ink bg-ink text-paper' : 'border-line bg-card hover:border-muted'}`}>
              {c === 'all' ? t.allTypes : t.cats[c]}
            </button>
          ))}
        </div>
      )}

      {error && <p role="alert" className="mt-8 text-warn">{t.genericError}</p>}
      {!all && !error && <div aria-busy="true" className="mt-8 space-y-3 animate-pulse">{[0, 1, 2].map((i) => <div key={i} className="h-14 bg-line/60" />)}</div>}

      {all && !groups.length && (
        <div role="status" className="mt-8 border-l-2 border-warn pl-4 py-1">
          <p className="font-medium">{t.notCoveredTitle}</p>
          <button type="button" onClick={() => { setQ(''); setParams({}) }} className="mt-3 min-h-11 text-accent underline underline-offset-2">{t.clearFilters}</button>
        </div>
      )}

      <div className="mt-8 space-y-8" aria-live="polite">
        {groups.map(({ c, items }) => (
          <section key={c} aria-labelledby={`g-${c}`}>
            <h2 id={`g-${c}`} className="flex items-center gap-3 text-xl pb-2 border-b border-ink/80">
              <CatIcon k={c} size={22} />
              {label(c)}
            </h2>
            <ul>
              {items.map((j) => (
                <li key={j.task_id}>
                  <Link to={`/task/${j.task_id}${placeQuery(place)}`}
                    className="flex items-baseline justify-between gap-3 py-3.5 min-h-14 border-b border-line hover:bg-card -mx-2 px-2">
                    <span className="font-medium">{tr(j, 'title', lang)}</span>
                    {j.area === 'business' && j.category && <span className="shrink-0 text-sm text-muted">{t.cats[j.category]}</span>}
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
