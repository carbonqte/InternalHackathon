import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getTask, loadProgress, saveProgress } from '../api/client.js'
import RoadmapGraph from '../components/RoadmapGraph.jsx'
import StepList from '../components/StepList.jsx'
import StepPanel from '../components/StepPanel.jsx'

export default function Roadmap() {
  const { taskId } = useParams()
  const [task, setTask] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(() => loadProgress(taskId))
  const [selected, setSelected] = useState(null)
  const [view, setView] = useState(() => (window.innerWidth < 768 ? 'list' : 'graph'))

  useEffect(() => {
    getTask(taskId)
      .then((t) => { document.title = `${t.title} · Civic Navigator`; setTask(t); setSelected(t.steps.find((s) => s.depends_on.length === 0)?.id) })
      .catch(() => setError('This roadmap could not be loaded.'))
  }, [taskId])

  function toggle(id) {
    const next = new Set(done)
    if (next.has(id)) {
      // Un-ticking a step also un-ticks everything that depended on it.
      const drop = [id]
      while (drop.length) {
        const cur = drop.pop()
        next.delete(cur)
        task.steps.filter((s) => s.depends_on.includes(cur) && next.has(s.id)).forEach((s) => drop.push(s.id))
      }
    } else next.add(id)
    setDone(next); saveProgress(taskId, next)
  }

  if (error) return <p className="max-w-6xl mx-auto px-4 py-12">{error} <Link to="/" className="text-accent underline">Go back</Link></p>
  if (!task) return (
    <section aria-busy="true" aria-label="Loading roadmap" className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-24 rounded bg-line" />
      <div className="mt-4 h-8 w-72 max-w-full rounded bg-line" />
      <div className="mt-6 h-2 rounded bg-line" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="h-[420px] rounded-xl bg-line/60" />
        <div className="h-56 rounded-xl bg-line/60" />
      </div>
    </section>
  )

  const pct = Math.round((done.size / task.steps.length) * 100)
  const step = task.steps.find((s) => s.id === selected)

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-muted hover:text-ink">← New search</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">{task.title}</h1>
          <p className="text-sm text-muted mt-1">
            {task.city} · Last verified {task.last_verified}
            {task.sample_data && <span className="ml-2 rounded bg-warn/10 text-warn px-1.5 py-0.5 text-xs">Sample data</span>}
          </p>
        </div>
        <div role="tablist" className="flex rounded-lg border border-line bg-white p-1 text-sm">
          {['graph', 'list'].map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md capitalize ${view === v ? 'bg-accent text-white' : 'text-muted'}`}>{v}</button>
          ))}
        </div>
      </div>

      <div className="mt-5" aria-label={`${pct}% complete`}>
        <div className="flex justify-between text-xs text-muted mb-1"><span>{done.size} of {task.steps.length} steps done</span><span>{pct}%</span></div>
        <div className="h-2 rounded-full bg-line overflow-hidden"><div className="h-full bg-done transition-all" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {view === 'graph'
          ? <RoadmapGraph steps={task.steps} done={done} selectedId={selected} onSelect={setSelected} />
          : <StepList steps={task.steps} done={done} selectedId={selected} onSelect={setSelected} />}
        <aside className="rounded-xl border border-line bg-white p-5 h-fit lg:sticky lg:top-6">
          <StepPanel step={step} steps={task.steps} done={done} onToggle={toggle} />
        </aside>
      </div>
    </section>
  )
}
