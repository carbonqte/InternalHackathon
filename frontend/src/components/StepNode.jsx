import { Handle, Position } from '@xyflow/react'
import { TypeIcon, LockIcon, CheckIcon } from './icons.jsx'
import { useLang, tr } from '../lib/i18n.jsx'

const styles = {
  done: 'bg-white border-done text-ink',
  available: 'bg-white border-accent text-ink shadow-sm',
  locked: 'bg-paper border-line text-lock',
}

export default function StepNode({ data }) {
  const { step, state, selected, fresh, stage, first } = data
  const { lang, t } = useLang()
  return (
    <div
      className={`relative w-[220px] h-[72px] rounded-lg border-2 pl-4 pr-3 py-2 flex gap-2 items-start cursor-pointer transition ${styles[state]} ${selected ? 'ring-2 ring-offset-2 ring-accent' : ''} ${fresh ? 'animate-unlock' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <span className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-paper border-2 border-current grid place-items-center text-[11px] font-semibold text-ink">{stage}</span>
      {first && <span className="absolute -top-2.5 right-2 rounded bg-accent text-white text-[10px] font-medium px-1.5 py-0.5">{t.startHere}</span>}
      <span className={`mt-0.5 ${state === 'done' ? 'text-done' : state === 'available' ? 'text-accent' : ''}`}>
        {state === 'done' ? <CheckIcon /> : state === 'locked' ? <LockIcon /> : <TypeIcon type={step.type} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight line-clamp-2">{tr(step, 'name', lang)}</span>
        <span className="block text-[11px] text-muted mt-0.5">{t.types[step.type]}</span>
      </span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  )
}
