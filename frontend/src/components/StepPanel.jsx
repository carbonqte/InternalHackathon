import { stepState } from '../lib/graph.js'
import { typeLabel } from './icons.jsx'

export default function StepPanel({ step, steps, done, onToggle }) {
  if (!step) return <p className="text-sm text-muted">Select a step to see what you need.</p>
  const state = stepState(step, done)
  const blockers = step.depends_on.filter((d) => !done.has(d)).map((d) => steps.find((s) => s.id === d)?.name)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{typeLabel[step.type]}</p>
        <h2 className="font-display text-xl mt-1">{step.name}</h2>
      </div>

      <dl className="text-sm space-y-3">
        {step.office && <Row label="Where">{step.office}</Row>}
        {step.fee && <Row label="Fee">{step.fee}</Row>}
        {step.documents?.length > 0 && (
          <Row label="Bring">
            <ul className="list-disc pl-4 space-y-0.5">{step.documents.map((d) => <li key={d}>{d}</li>)}</ul>
          </Row>
        )}
      </dl>

      {isSafeUrl(step.link) && (
        <a href={step.link} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-accent underline underline-offset-2">
          Official source ↗
        </a>
      )}

      {state === 'locked' ? (
        <p className="text-sm rounded-md bg-paper border border-line p-3 text-muted">
          Finish first: {blockers.join(', ')}
        </p>
      ) : (
        <button
          onClick={() => onToggle(step.id)}
          className={`w-full rounded-md py-2.5 text-sm font-medium ${state === 'done' ? 'border border-line bg-white' : 'bg-accent text-white hover:opacity-90'}`}
        >
          {state === 'done' ? 'Mark as not done' : 'Mark as done'}
        </button>
      )}
    </div>
  )
}

function isSafeUrl(u) {
  try { return ['https:', 'http:'].includes(new URL(u).protocol) } catch { return false }
}

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[64px_1fr] gap-2">
    <dt className="text-muted">{label}</dt>
    <dd>{children}</dd>
  </div>
)
