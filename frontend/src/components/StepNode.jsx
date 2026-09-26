import { Handle, Position } from '@xyflow/react'
import { TypeIcon, LockIcon, CheckIcon, typeLabel } from './icons.jsx'

const styles = {
  done: 'bg-white border-done text-ink',
  available: 'bg-white border-accent text-ink shadow-sm',
  locked: 'bg-paper border-line text-lock',
}

export default function StepNode({ data }) {
  const { step, state, selected } = data
  return (
    <div
      className={`w-[220px] h-[72px] rounded-lg border-2 px-3 py-2 flex gap-2 items-start cursor-pointer transition ${styles[state]} ${selected ? 'ring-2 ring-offset-2 ring-accent' : ''}`}
    >
      <Handle type="target" position={Position.Top} className="!opacity-0" />
      <span className={`mt-0.5 ${state === 'done' ? 'text-done' : state === 'available' ? 'text-accent' : ''}`}>
        {state === 'done' ? <CheckIcon /> : state === 'locked' ? <LockIcon /> : <TypeIcon type={step.type} />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight line-clamp-2">{step.name}</span>
        <span className="block text-[11px] text-muted mt-0.5">{typeLabel[step.type]}</span>
      </span>
      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  )
}
