import { stepState } from '../lib/graph.js'
import { useLang, tr, fmtDate, CONTACT } from '../lib/i18n.jsx'

export function hostOf(u) {
  try { const x = new URL(u); return ['https:', 'http:'].includes(x.protocol) ? x.hostname.replace(/^www\./, '') : null } catch { return null }
}
const isGov = (h) => /\.(gov|nic)\.in$/.test(h)

export default function StepPanel({ step, steps, done, onToggle, taskTitle }) {
  const { lang, t } = useLang()
  if (!step) return <p className="text-sm text-muted">{t.selectStep}</p>
  const state = stepState(step, done)
  const blockers = step.depends_on.filter((d) => !done.has(d)).map((d) => tr(steps.find((s) => s.id === d), 'name', lang))
  const host = hostOf(step.link)
  const fee = step.fee == null ? null : step.fee === 'Free' ? t.free : step.fee === 'No government fee' ? t.noFee : step.fee
  const report = `mailto:${CONTACT}?subject=${encodeURIComponent(`Outdated info: ${taskTitle} / ${step.name}`)}`

  return (
    <div key={step.id} className="space-y-4 animate-enter">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {t.types[step.type]}
          {step.type !== 'milestone' && (
            <span className={`ml-2 normal-case tracking-normal rounded px-1.5 py-0.5 ${step.requirement === 'conditional' ? 'bg-warn/10 text-warn' : 'bg-accent-soft text-accent'}`}>
              {t[step.requirement] || t.required}
            </span>
          )}
        </p>
        <h2 className="font-display text-xl mt-1">{tr(step, 'name', lang)}</h2>
        {step.condition && <p className="text-sm text-warn mt-1">{tr(step, 'condition', lang)}</p>}
      </div>

      {step.type !== 'milestone' && (
        <dl className="text-sm space-y-3">
          {step.office && <Row label={t.where}>{tr(step, 'office', lang)}</Row>}
          <Row label={t.fee}>{fee ?? <span className="text-warn">{t.feeUnknown}</span>}</Row>
          <Row label={t.processing}>{step.processing_time ?? <span className="text-muted">{t.timeUnknown}</span>}</Row>
          {step.documents?.length > 0 && (
            <Row label={t.bring}>
              <ul className="list-disc pl-4 space-y-0.5">{step.documents.map((d) => <li key={d}>{d}</li>)}</ul>
            </Row>
          )}
          {step.verified_on && <Row label={t.checked}>{fmtDate(step.verified_on, lang)}</Row>}
        </dl>
      )}

      {host && (
        <div className="space-y-1.5">
          <a href={step.link} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 rounded-md border border-accent px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent-soft">
            <span className="whitespace-nowrap">{t.openPortal}</span><span className="min-w-0 text-xs text-muted font-normal truncate">{host} ↗</span>
          </a>
          {!isGov(host) && <p className="text-xs text-warn">{t.notOfficialDomain}</p>}
        </div>
      )}

      {state === 'locked' ? (
        <p className="text-sm rounded-md bg-paper border border-line p-3 text-muted">{t.finishFirst} {blockers.join(', ')}</p>
      ) : state === 'done' ? (
        <div className="flex items-center justify-between rounded-md bg-done/10 px-3 py-2.5 text-sm">
          <span className="font-medium text-done">✓ {t.completed}</span>
          <button onClick={() => onToggle(step.id)} className="text-muted underline underline-offset-2 hover:text-ink">{t.undo}</button>
        </div>
      ) : (
        <button onClick={() => onToggle(step.id)} className="w-full rounded-md py-2.5 text-sm font-medium bg-accent text-white hover:opacity-90">
          {t.markDone}
        </button>
      )}

      {step.type !== 'milestone' && (
        <a href={report} className="block text-xs text-muted underline underline-offset-2 hover:text-ink">{t.report}</a>
      )}
    </div>
  )
}

const Row = ({ label, children }) => (
  <div className="grid grid-cols-[76px_1fr] gap-2">
    <dt className="text-muted">{label}</dt>
    <dd>{children}</dd>
  </div>
)
