import { useEffect, useState } from 'react'
import { listTasks, getTaskAdmin, updateStep } from '../api/client.js'

// NOTE: no auth yet. The backend must protect /admin routes before this goes live.
export default function Admin() {
  const [tasks, setTasks] = useState([])
  const [taskId, setTaskId] = useState('')
  const [task, setTask] = useState(null)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => { document.title = 'Admin review · Civic Navigator' }, [])
  useEffect(() => { listTasks().then((t) => { setTasks(t); setTaskId(t[0]?.task_id) }) }, [])
  useEffect(() => { if (taskId) getTaskAdmin(taskId).then(setTask) }, [taskId])

  async function save(stepId, fields) {
    if (busy) return
    setBusy(true)
    try {
      await updateStep(taskId, stepId, fields)
      setTask(await getTaskAdmin(taskId)); setEditing(null)
    } finally { setBusy(false) }
  }

  const pending = task?.steps.filter((s) => s.status === 'pending').length ?? 0

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl">Review extracted steps</h1>
      <p className="text-sm text-muted mt-1">Scraped steps stay hidden from citizens until approved here.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="task" className="text-sm text-muted">Procedure</label>
        <select id="task" value={taskId} onChange={(e) => setTaskId(e.target.value)} className="max-w-full min-w-0 rounded-lg border border-line bg-card px-3 py-2 text-sm">
          {tasks.map((t) => <option key={t.task_id} value={t.task_id}>{t.title}</option>)}
        </select>
        {pending > 0 && <span className="text-xs rounded bg-warn/10 text-warn px-2 py-1">{pending} pending</span>}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted border-b border-line">
            <tr><th className="p-3">Step</th><th className="p-3">Applies to</th><th className="p-3">Office</th><th className="p-3">Fee</th><th className="p-3">Needs</th><th className="p-3">Status</th><th className="p-3" /></tr>
          </thead>
          <tbody>
            {task?.steps.map((s) => editing === s.id
              ? <EditRow key={s.id} step={s} onSave={(f) => save(s.id, f)} onCancel={() => setEditing(null)} />
              : (
                <tr key={s.id} className="border-b border-line last:border-0 align-top">
                  <td className="p-3 font-medium">{s.name}</td>
                  <td className="p-3 text-muted whitespace-nowrap">{s.scope === 'local' ? s.city : s.scope === 'state' ? s.state : 'All India'}</td>
                  <td className="p-3">{s.office || '—'}</td>
                  <td className="p-3">{s.fee || '—'}</td>
                  <td className="p-3 text-muted">{s.depends_on.join(', ') || '—'}</td>
                  <td className="p-3">
                    <span className={`text-xs rounded px-2 py-0.5 ${s.status === 'approved' ? 'bg-done/10 text-done' : 'bg-warn/10 text-warn'}`}>{s.status}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap text-right space-x-3">
                    <button onClick={() => setEditing(s.id)} className="text-accent">Edit</button>
                    {s.status === 'pending'
                      ? <button onClick={() => save(s.id, { status: 'approved' })} className="text-done font-medium">Approve</button>
                      : <button onClick={() => save(s.id, { status: 'pending' })} className="text-muted">Unapprove</button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function EditRow({ step, onSave, onCancel }) {
  const [f, setF] = useState({ name: step.name, office: step.office, fee: step.fee, link: step.link })
  const input = (k) => (
    <input value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-label={k}
      className="w-full rounded border border-line px-2 py-1" />
  )
  return (
    <tr className="border-b border-line bg-accent-soft/40 align-top">
      <td className="p-3">{input('name')}</td>
      <td className="p-3" />
      <td className="p-3">{input('office')}</td>
      <td className="p-3">{input('fee')}</td>
      <td className="p-3" colSpan={2}>{input('link')}</td>
      <td className="p-3 whitespace-nowrap text-right space-x-3">
        <button onClick={() => onSave(f)} className="text-done font-medium">Save</button>
        <button onClick={onCancel} className="text-muted">Cancel</button>
      </td>
    </tr>
  )
}
