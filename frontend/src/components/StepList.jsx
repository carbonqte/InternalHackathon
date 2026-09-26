import { stepState, topoOrder } from '../lib/graph.js'
import { TypeIcon, LockIcon, CheckIcon } from './icons.jsx'

export default function StepList({ steps, done, selectedId, onSelect }) {
  return (
    <ol className="space-y-2">
      {topoOrder(steps).map((s, i) => {
        const st = stepState(s, done)
        return (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s.id)}
              className={`w-full text-left flex items-center gap-3 rounded-lg border px-3 py-3 ${s.id === selectedId ? 'border-accent bg-accent-soft' : 'border-line bg-white'} ${st === 'locked' ? 'text-lock' : ''}`}
            >
              <span className="w-6 text-xs text-muted tabular-nums">{i + 1}</span>
              <span className={st === 'done' ? 'text-done' : st === 'available' ? 'text-accent' : ''}>
                {st === 'done' ? <CheckIcon /> : st === 'locked' ? <LockIcon /> : <TypeIcon type={s.type} />}
              </span>
              <span className="text-sm font-medium">{s.name}</span>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
