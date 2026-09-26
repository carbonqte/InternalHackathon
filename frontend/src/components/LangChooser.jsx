import { useEffect, useRef, useState } from 'react'
import { LANGS, useLang } from '../lib/i18n.jsx'

// First visit only: a big, script-native language choice. Remembered afterwards.
const HINT = { en: 'Continue in English', hi: 'हिन्दी में आगे बढ़ें', mr: 'मराठीत पुढे जा', kn: 'ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಿರಿ', gu: 'ગુજરાતીમાં આગળ વધો', ta: 'தமிழில் தொடரவும்' }

export default function LangChooser() {
  const { setLang } = useLang()
  const [open, setOpen] = useState(() => { try { return !localStorage.getItem('langChosen') } catch { return false } })
  const first = useRef(null)
  useEffect(() => { if (open) first.current?.focus() }, [open])
  if (!open) return null
  const pick = (code) => { setLang(code); try { localStorage.setItem('langChosen', '1') } catch { /* private mode */ } setOpen(false) }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onKeyDown={(e) => e.key === 'Escape' && pick('en')}>
      <div role="dialog" aria-modal="true" aria-labelledby="lang-title" className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card p-6 shadow-xl animate-enter">
        <h2 id="lang-title" className="text-xl text-center">Choose your language</h2>
        <p className="text-center text-muted mt-1">भाषा चुनें · भाषा निवडा · ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ · ભાષા પસંદ કરો · மொழியைத் தேர்ந்தெடுக்கவும்</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LANGS.map((l, i) => (
            <button key={l.code} ref={i === 0 ? first : null} type="button" lang={l.code} onClick={() => pick(l.code)}
              className="w-full min-h-14 rounded-xl border-2 border-line hover:border-accent focus:border-accent px-4 text-left">
              <span className="flex items-center gap-2 text-lg font-semibold">{l.label}{l.beta && <span className="text-[11px] font-medium rounded bg-accent-soft text-accent px-1.5 py-0.5">Beta</span>}</span>
              <span className="block text-sm text-muted">{HINT[l.code]}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted text-center mt-4">You can change this any time from the top of the page.</p>
      </div>
    </div>
  )
}
