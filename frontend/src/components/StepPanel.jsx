import { stepState } from '../lib/graph.js'
import { useLang, tr } from '../lib/i18n.jsx'

export default function StepPanel({ step, steps, done, onToggle }) {
  const { lang, t } = useLang()
  if (!step) return <p className="text-sm text-muted">{t.selectStep}</p>
  const state = stepState(step, done)
  const blockers = step.depends_on.filter((d) => !done.has(d)).map((d) => tr(steps.find((s) => s.id === d), 'name', lang))

  return (
    <div key={step.id} className="space-y-4 animate-enter">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{t.types[step.type]}</p>
        <h2 className="font-display text-xl mt-1">{tr(step, 'name', lang)}</h2>
      </div>

      <dl className="text-sm space-y-3">
        {step.office && <Row label={t.where}>{tr(step, 'office', lang)}</Row>}
        {step.fee && <Row label={t.fee}>{step.fee}</Row>}
        {step.documents?.length > 0 && (
          <Row label={t.bring}>
            <ul className="list-disc pl-4 space-y-0.5">{step.documents.map((d) => <li key={d}>{d}</li>)}</ul>
          </Row>
        )}
      </dl>

      {isSafeUrl(step.link) && (
        <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-accent underline underline-offset-2">
          {t.officialSource}
        </a>
      )}

      {state === 'locked' ? (
        <p className="text-sm rounded-md bg-paper border border-line p-3 text-muted">
          {t.finishFirst} {blockers.join(', ')}
        </p>
      ) : (
        <button
          onClick={() => onToggle(step.id)}
          className={`w-full rounded-md py-2.5 text-sm font-medium ${state === 'done' ? 'border border-line bg-white' : 'bg-accent text-white hover:opacity-90'}`}
        >
          {state === 'done' ? t.markUndone : t.markDone}
        </button>
      )}
    </div>
  )
}

function isSafeUrl(u) {
  try { return ['https:', 'http:'].includes(new URL(u).protocol) } catch { return false }
}

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[76px_1fr] gap-2">
    <dt className="text-muted">{label}</dt>
    <dd>{children}</dd>
  </div>
)
