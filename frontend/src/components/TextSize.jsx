import { SIZES, useTextSize } from '../lib/textsize.js'
import { useLang } from '../lib/i18n.jsx'

export default function TextSize() {
  const [size, setSize] = useTextSize()
  const { t } = useLang()
  return (
    <div role="group" aria-label={t.textSize} className="flex rounded-md border border-line bg-card">
      {SIZES.map(({ k }, i) => (
        <button key={k} type="button" onClick={() => setSize(k)} aria-pressed={size === k} aria-label={t.sizes[i]}
          className={`min-h-11 min-w-9 px-1.5 font-semibold leading-none ${size === k ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'} ${i === 0 ? 'rounded-l-md' : ''} ${i === 2 ? 'rounded-r-md' : ''}`}>
          <span style={{ fontSize: `${12 + i * 3}px` }}>A</span>
        </button>
      ))}
    </div>
  )
}
