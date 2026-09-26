import { Link } from 'react-router-dom'
import { tr, useLang } from '../lib/i18n.jsx'

// Shown under the search box while typing. Arrow keys move between items; Escape closes.
export default function Suggestions({ items, query, onClose, id }) {
  const { lang, t } = useLang()
  if (!items.length) return null
  function key(e) {
    const all = [...e.currentTarget.querySelectorAll('a')]
    const i = all.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); all[Math.min(i + 1, all.length - 1)]?.focus() }
    if (e.key === 'ArrowUp') { e.preventDefault(); i <= 0 ? document.getElementById('q')?.focus() : all[i - 1].focus() }
    if (e.key === 'Escape') { onClose(); document.getElementById('q')?.focus() }
  }
  return (
    <ul id={id} aria-label={t.suggestionsLabel} onKeyDown={key}
      className="mt-1 rounded-lg border border-line bg-card shadow-lg overflow-hidden animate-enter">
      {items.map((j) => (
        <li key={j.task_id}>
          <Link to={j.href} className="flex items-center justify-between gap-3 px-4 min-h-11 hover:bg-accent-soft focus:bg-accent-soft outline-none">
            <span>{tr(j, 'title', lang)}</span>
            <span className="text-xs text-muted shrink-0">{j.area === 'business' ? t.cats[j.category] : t.areas[j.area]}</span>
          </Link>
        </li>
      ))}
      <li className="sr-only" aria-live="polite">{t.suggestCount(items.length, query)}</li>
    </ul>
  )
}
