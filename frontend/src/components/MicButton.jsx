import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/i18n.jsx'

const BCP = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', kn: 'kn-IN', gu: 'gu-IN', ta: 'ta-IN' }
const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)

// Voice search with the browser's speech recognition (Chrome, Edge, Safari). Hidden where unsupported.
export default function MicButton({ onText, onError }) {
  const { lang, t } = useLang()
  const [on, setOn] = useState(false)
  const rec = useRef(null)
  useEffect(() => () => rec.current?.abort(), [])
  if (!Recognition) return null

  function toggle() {
    if (on) { rec.current?.stop(); return }
    const r = new Recognition()
    r.lang = BCP[lang] || 'en-IN'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (e) => { const said = e.results[0]?.[0]?.transcript?.trim(); if (said) onText(said) }
    r.onerror = (e) => onError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? t.micBlocked : t.micFailed)
    r.onend = () => setOn(false)
    rec.current = r
    try { r.start(); setOn(true) } catch { setOn(false) }
  }

  return (
    <button type="button" onClick={toggle} aria-pressed={on} aria-label={on ? t.micStop : t.micStart}
      className={`shrink-0 grid place-items-center w-11 h-11 rounded-[3px] border ${on ? 'border-warn bg-warn/10 text-warn animate-pulse' : 'border-line bg-card hover:border-muted'}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" />
      </svg>
    </button>
  )
}
