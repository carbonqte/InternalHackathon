import { useEffect, useRef, useState } from 'react'
import { THEMES, useTheme } from '../lib/theme.js'
import { useLang } from '../lib/i18n.jsx'
import TextSize from './TextSize.jsx'

const P = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const Icon = ({ k }) => {
  if (k === 'light') return <svg {...P}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  if (k === 'dark') return <svg {...P}><path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" /></svg>
  if (k === 'contrast') return <svg {...P}><circle cx="12" cy="12" r="9" /><path d="M12 3v18" /><path d="M12 3a9 9 0 010 18z" fill="currentColor" /></svg>
  return <svg {...P}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>
}

// Icon button + small menu. Closes on outside click or Escape; arrow keys move between options.
export default function ThemeMenu() {
  const [theme, setTheme] = useTheme()
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const box = useRef(null)
  const btn = useRef(null)

  useEffect(() => {
    if (!open) return
    const off = (e) => { if (!box.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus() } }
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    box.current?.querySelector('[aria-checked="true"]')?.focus()
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [open])

  function onKey(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...box.current.querySelectorAll('[role=menuitemradio]')]
    const i = items.indexOf(document.activeElement)
    items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus()
  }

  return (
    <div ref={box} className="relative">
      <button ref={btn} type="button" onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu" aria-expanded={open} aria-label={t.display}
        className="flex items-center gap-1.5 min-h-11 rounded-md border border-line bg-card px-2.5 text-sm hover:border-muted">
        <Icon k={theme} />
        <span className="hidden sm:inline">{t.display}</span>
      </button>
      {open && (
        <div role="menu" aria-label={t.display} onKeyDown={onKey}
          className="fixed inset-x-4 top-14 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 mt-2 sm:w-56 rounded-lg border border-line bg-card p-1 shadow-lg z-50 animate-enter">
          <p className="px-3 pt-2 pb-1 text-xs text-muted">{t.theme}</p>
          {THEMES.map((k) => (
            <button key={k} type="button" role="menuitemradio" aria-checked={theme === k}
              onClick={() => { setTheme(k); setOpen(false); btn.current?.focus() }}
              className={`w-full flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-left ${theme === k ? 'bg-accent-soft text-accent font-medium' : 'hover:bg-paper'}`}>
              <Icon k={k} />{t.themes[k]}
              {theme === k && <span className="ml-auto" aria-hidden>✓</span>}
            </button>
          ))}
          <div className="border-t border-line mt-1 pt-2 px-2 pb-1">
            <p className="text-xs text-muted mb-1.5">{t.textSize}</p>
            <TextSize />
          </div>
        </div>
      )}
    </div>
  )
}
