import { stages, stepState } from '../lib/graph.js'
import { useLang, tr } from '../lib/i18n.jsx'

const Lock = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="inline -mt-0.5 mr-1"><rect x="5" y="11" width="14" height="10" rx="1.5" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>
)

// Modelled on GOV.UK's step-by-step pattern: numbered stages, "and" for steps you can do in parallel.
// Only the step you can act on now gets a label; locked steps are simply quieter.
export default function StepList({ steps, done, selectedId, onSelect, fresh }) {
  const { lang, t } = useLang()
  return (
    <ol>
      {stages(steps).map((group, i, all) => {
        const groupDone = group.every((s) => done.has(s.id))
        const groupNow = group.some((s) => stepState(s, done) === 'available')
        return (
          <li key={i} className="relative pl-12 pb-2 min-w-0">
            {i < all.length - 1 && <span aria-hidden className="absolute left-[15px] top-9 bottom-0 w-px bg-line" />}
            <span className={`absolute left-0 top-2.5 w-8 h-8 grid place-items-center font-display text-lg tabular-nums ${groupDone ? 'text-done' : groupNow ? 'text-stamp' : 'text-muted'}`}>
              {groupDone ? '✓' : i + 1}
            </span>
            {group.map((s, j) => {
              const st = stepState(s, done)
              const sel = s.id === selectedId
              return (
                <div key={s.id}>
                  {j > 0 && <p className="text-xs font-semibold text-muted pt-1">{t.and}</p>}
                  <button
                    onClick={() => onSelect(s.id)}
                    aria-current={sel ? 'step' : undefined}
                    className={`w-full text-left py-3 pl-3 -ml-3 pr-2 border-l-2 flex items-start justify-between gap-3 transition-colors ${sel ? 'border-stamp bg-card' : 'border-transparent hover:bg-card'} ${fresh?.has(s.id) ? 'animate-unlock' : ''}`}
                  >
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      <span className={`block font-medium leading-snug ${st === 'locked' ? 'text-muted' : ''} ${st === 'done' ? 'line-through decoration-done/60 text-muted' : ''}`}>
                        {st === 'locked' && <span className="sr-only">{t.tagLocked}: </span>}
                        {tr(s, 'name', lang)}
                      </span>
                      <span className="block text-sm text-muted mt-0.5">{st === 'locked' && <Lock />}{t.types[s.type]}{s.office ? ` · ${tr(s, 'office', lang)}` : ''}</span>
                    </span>
                    {st === 'available' && <span className="shrink-0 text-xs font-semibold text-stamp pt-1">{t.tagStart}</span>}
                    {st === 'done' && <span className="sr-only">{t.tagDone}</span>}
                  </button>
                </div>
              )
            })}
          </li>
        )
      })}
    </ol>
  )
}
