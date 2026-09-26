import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchTask } from '../api/client.js'
import { useLang } from '../lib/i18n.jsx'

export default function Home() {
  useEffect(() => { document.title = 'Civic Navigator' }, [])
  const [text, setText] = useState('')
  const [city, setCity] = useState('Mumbai')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()
  const { t } = useLang()

  async function go(q = text) {
    if (!q.trim()) return
    setLoading(true); setError('')
    try {
      const { task_id } = await searchTask(q.slice(0, 300), city)
      if (task_id) nav(`/task/${task_id}`)
      else setError(t.notCovered)
    } catch {
      setError(t.genericError)
    } finally { setLoading(false) }
  }

  return (
    <section className="max-w-2xl mx-auto px-4 pt-16 sm:pt-24 pb-16">
      <h1 className="font-display text-3xl sm:text-5xl leading-tight">
        {t.heroTitle}
      </h1>
      <p className="mt-4 text-muted">
        {t.heroSub}
      </p>

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
          <select id="city" value={city} onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 text-sm">
            <option>Mumbai</option>
          </select>
          <button disabled={loading} className="flex-1 sm:flex-none sm:px-8 rounded-lg bg-accent text-white py-3 text-sm font-medium disabled:opacity-60">
            {loading ? t.finding : t.showRoadmap}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="mt-4 text-sm text-warn">{error}</p>}

      <div className="mt-8 flex flex-wrap gap-2">
        {t.examples.map((ex) => (
          <button key={ex} onClick={() => { setText(ex); go(ex) }}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-accent">
            {ex}
          </button>
        ))}
      </div>
    </section>
  )
}
