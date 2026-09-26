import { useState } from 'react'
import { LANGS, useLang } from '../lib/i18n.jsx'

// First visit only: a slim, script-native language bar above the header.
// It never blocks the page; choosing a language (or closing it) remembers the choice.
export function useLangBar() {
  return useState(() => { try { return !localStorage.getItem('langChosen') } catch { return false } })
}

export default function LangChooser({ open, onClose }) {
  const { lang, setLang } = useLang()
  if (!open) return null
  const done = (code) => { if (code) setLang(code); try { localStorage.setItem('langChosen', '1') } catch { /* private mode */ } onClose() }
  return (
    <section aria-labelledby="lang-bar" className="bg-card border-b border-line">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
        <h2 id="lang-bar" aria-label="Choose your language" className="!font-sans !tracking-normal text-sm font-semibold shrink-0 hidden md:block">Choose your language · भाषा चुनें</h2>
        <ul aria-labelledby="lang-bar" className="flex gap-1.5 overflow-x-auto min-w-0 -my-1 py-1">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button type="button" lang={l.code} onClick={() => done(l.code)} aria-pressed={lang === l.code}
                className={`relative min-h-9 rounded-[3px] border px-3 text-sm ${lang === l.code ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card hover:border-accent'} shrink-0`}>
                {l.label}{l.beta && <span className="sr-only"> (Beta)</span>}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => done()} aria-label="Close language bar"
          className="ml-auto shrink-0 grid place-items-center min-h-9 min-w-9 rounded-full text-muted hover:text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </section>
  )
}
