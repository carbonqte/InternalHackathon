import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { getTask, loadProgress, saveProgress } from '../api/client.js'
import RoadmapGraph from '../components/RoadmapGraph.jsx'
import StepList from '../components/StepList.jsx'
import StepPanel from '../components/StepPanel.jsx'
import { stepState } from '../lib/graph.js'
import { useLang, tr, fmtDate } from '../lib/i18n.jsx'

export default function Roadmap() {
  const { taskId } = useParams()
  const [params] = useSearchParams()
  const place = { state: params.get('state') || 'Maharashtra', city: params.get('city') || 'Mumbai' }
  const progressKey = `${taskId}:${place.state}:${place.city}`
  const { lang, t } = useLang()
  const [task, setTask] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(() => loadProgress(progressKey))
  const [selected, setSelected] = useState(null)
  const [fresh, setFresh] = useState(new Set())
  const freshTimer = useRef()
  const [copied, setCopied] = useState(false)
  const [view, setView] = useState(() => (window.innerWidth < 768 ? 'list' : 'graph'))

  useEffect(() => {
    getTask(taskId, place.state, place.city)
      .then((x) => { setTask(x); setSelected(x.steps.find((s) => s.depends_on.length === 0)?.id) })
      .catch(() => setError('load'))
  }, [taskId, place.state, place.city])

  useEffect(() => { if (task) document.title = `${tr(task, 'title', lang)} · Civic Navigator` }, [task, lang])

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
    } else {
      next.add(id)
      // Highlight steps this action just unlocked, and move the user to the first one.
      const unlocked = task.steps.filter((s) => stepState(s, done) === 'locked' && stepState(s, next) === 'available').map((s) => s.id)
      if (unlocked.length) {
        setFresh(new Set(unlocked)); setSelected(unlocked[0])
        clearTimeout(freshTimer.current); freshTimer.current = setTimeout(() => setFresh(new Set()), 1600)
      }
    }
    setDone(next); saveProgress(progressKey, next)
  }

  if (error) return <p className="max-w-6xl mx-auto px-4 py-12">{t.loadError} <Link to="/" className="text-accent underline">{t.goBack}</Link></p>
  if (!task) return (
    <section aria-busy="true" aria-label="Loading roadmap" className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-24 rounded bg-line" />
      <div className="mt-4 h-8 w-72 max-w-full rounded bg-line" />
      <div className="mt-6 h-2 rounded bg-line" />
      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[420px] rounded-xl bg-line/60" />
        <div className="h-56 rounded-xl bg-line/60" />
      </div>
    </section>
  )

  const pct = Math.round((done.size / task.steps.length) * 100)
  const step = task.steps.find((s) => s.id === selected)
  const nextUp = task.steps.filter((s) => stepState(s, done) === 'available')
  const visits = task.steps.filter((s) => s.type === 'visit').length
  const online = task.steps.filter((s) => s.type === 'form').length

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/" className="text-sm text-muted hover:text-ink">{t.newSearch}</Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">{tr(task, 'title', lang)}</h1>
          <p className="text-sm text-muted mt-1">
            <span>{task.city}, {task.state}</span>
            <span aria-hidden> · </span>
            <Link to="/" className="underline underline-offset-2 hover:text-ink no-print">{t.changePlace}</Link>
            <span aria-hidden> · </span>
            <span>{t.verifiedLabel} {fmtDate(task.last_verified, lang)}</span>
            {task.sample_data && <><span aria-hidden> · </span><span className="rounded bg-warn/10 text-warn px-1.5 py-0.5 text-xs">{t.sampleData}</span></>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button onClick={async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* clipboard blocked */ } }}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm">{copied ? t.copied : t.copyLink}</button>
          <button onClick={() => { setView('list'); setTimeout(() => window.print(), 100) }}
            className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm">{t.print}</button>
        <div role="tablist" className="flex rounded-lg border border-line bg-white p-1 text-sm">
          {['graph', 'list'].map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md ${view === v ? 'bg-accent text-white' : 'text-muted'}`}>{t[v]}</button>
          ))}
        </div>
        </div>
      </div>

      {task.coverage !== 'full' && (
        <p role="note" className="mt-4 rounded-lg border border-warn/40 bg-warn/5 px-4 py-3 text-sm">
          {task.coverage === 'state' ? t.covState(task.city, task.state) : t.covNational(task.state)}
        </p>
      )}

      <div className="mt-5" aria-label={`${pct}% complete`}>
        <div className="flex justify-between text-xs text-muted mb-1"><span>{t.stepsDone(done.size, task.steps.length)}</span><span>{pct}%</span></div>
        <div className="h-2 rounded-full bg-line overflow-hidden"><div className="h-full bg-done transition-all" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="mt-5 rounded-xl border border-line bg-white px-5 py-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
        <div className="min-w-0">
          <p className="text-xs text-muted">{nextUp.length ? t.doNext : t.status}</p>
          <p className="font-medium mt-0.5">
            {nextUp.length
              ? nextUp.map((s, i) => (
                  <span key={s.id}>{i > 0 && <span className="text-muted font-normal"> {t.and} </span>}
                    <button onClick={() => setSelected(s.id)} className="underline decoration-line underline-offset-4 hover:decoration-accent">{tr(s, 'name', lang)}</button>
                  </span>))
              : t.allDone}
          </p>
        </div>
        <div><p className="text-xs text-muted">{t.onlineForms}</p><p className="font-medium mt-0.5 tabular-nums">{online}</p></div>
        <div><p className="text-xs text-muted">{t.officeVisits}</p><p className="font-medium mt-0.5 tabular-nums">{visits}</p></div>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {view === 'graph'
          ? <RoadmapGraph steps={task.steps} done={done} selectedId={selected} onSelect={setSelected} fresh={fresh} />
          : <StepList steps={task.steps} done={done} selectedId={selected} onSelect={setSelected} fresh={fresh} />}
        <aside className="rounded-xl border border-line bg-white p-5 h-fit lg:sticky lg:top-6 no-print">
          <StepPanel step={step} steps={task.steps} done={done} onToggle={toggle} taskTitle={task.title} rights={task.rights} />
        </aside>
      </div>
    </section>
  )
}
