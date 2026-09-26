import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchTask } from '../api/client.js'

const examples = ['Start a cloud kitchen', 'Open a small shop', 'Register my startup for GST']

export default function Home() {
  const [text, setText] = useState('')
  const [city, setCity] = useState('Mumbai')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const nav = useNavigate()

  async function go(q = text) {
    if (!q.trim()) return
    setLoading(true); setError('')
    try {
      const { task_id } = await searchTask(q.slice(0, 300), city)
      if (task_id) nav(`/task/${task_id}`)
      else setError("We don't cover that procedure yet. Try a food business or a small shop registration.")
    } catch {
      setError('Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <section className="max-w-2xl mx-auto px-4 pt-16 sm:pt-24 pb-16">
      <h1 className="font-display text-3xl sm:text-5xl leading-tight">
        Know every form, office and fee — before you start.
      </h1>
      <p className="mt-4 text-muted">
        Describe what you want to do. We map the government steps in the order they have to happen,
        with a link to the official source for each one.
      </p>

      <form onSubmit={(e) => { e.preventDefault(); go() }} className="mt-8 space-y-3">
        <label htmlFor="q" className="sr-only">What do you want to do?</label>
        <textarea
          id="q" rows={2} maxLength={300} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); go() } }}
          placeholder="e.g. I want to start a small tiffin service from home"
          className="w-full rounded-lg border border-line bg-white px-4 py-3 text-base resize-none focus:border-accent outline-none"
        />
        <div className="flex gap-3">
          <label htmlFor="city" className="sr-only">City</label>
          <select id="city" value={city} onChange={(e) => setCity(e.target.value)}
            className="rounded-lg border border-line bg-white px-3 text-sm">
            <option>Mumbai</option>
          </select>
          <button disabled={loading} className="flex-1 sm:flex-none sm:px-8 rounded-lg bg-accent text-white py-3 text-sm font-medium disabled:opacity-60">
            {loading ? 'Finding…' : 'Show my roadmap'}
          </button>
        </div>
      </form>

      {error && <p role="alert" className="mt-4 text-sm text-warn">{error}</p>}

      <div className="mt-8 flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button key={ex} onClick={() => { setText(ex); go(ex) }}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-sm hover:border-accent">
            {ex}
          </button>
        ))}
      </div>
    </section>
  )
}
