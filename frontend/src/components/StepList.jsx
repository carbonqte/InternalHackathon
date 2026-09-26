import { stages, stepState } from '../lib/graph.js'
import { typeLabel } from './icons.jsx'

const tag = {
  done: ['Done', 'bg-done/10 text-done'],
  available: ['Start now', 'bg-accent text-white'],
  locked: ['Cannot start yet', 'bg-line/70 text-lock'],
}

// Modelled on GOV.UK's step-by-step pattern: numbered stages, "and" for steps you can do in parallel.
export default function StepList({ steps, done, selectedId, onSelect, fresh }) {
  return (
    <ol className="relative">
      {stages(steps).map((group, i, all) => (
        <li key={i} className="relative pl-12 pb-6 last:pb-0">
          {i < all.length - 1 && <span aria-hidden className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-line" />}
          <span className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 grid place-items-center text-sm font-semibold bg-paper ${group.every((s) => done.has(s.id)) ? 'border-done text-done' : 'border-ink'}`}>
            {i + 1}
          </span>
          <div className="space-y-2">
            {group.map((s, j) => {
              const st = stepState(s, done)
              const [label, cls] = tag[st]
              return (
                <div key={s.id}>
                  {j > 0 && <p className="text-xs font-semibold text-muted uppercase tracking-wide py-1">and</p>}
                  <button
                    onClick={() => onSelect(s.id)}
                    aria-current={s.id === selectedId ? 'step' : undefined}
                    className={`w-full text-left rounded-lg border px-4 py-3 flex items-center justify-between gap-3 transition-colors ${s.id === selectedId ? 'border-accent bg-accent-soft' : 'border-line bg-white hover:border-muted'} ${fresh?.has(s.id) ? 'animate-unlock' : ''}`}
                  >
                    <span className="min-w-0">
                      <span className={`block text-sm font-medium ${st === 'locked' ? 'text-lock' : ''} ${st === 'done' ? 'line-through decoration-done/60' : ''}`}>{s.name}</span>
                      <span className="block text-xs text-muted mt-0.5">{typeLabel[s.type]}{s.office ? ` · ${s.office}` : ''}</span>
                    </span>
                    <span className={`shrink-0 text-[11px] font-medium rounded px-2 py-1 ${cls}`}>{label}</span>
                  </button>
                </div>
              )
            })}
          </div>
        </li>
      ))}
    </ol>
  )
}
