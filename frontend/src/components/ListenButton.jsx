import { useEffect, useState } from 'react'
import { canSpeak, speak, stopSpeaking } from '../lib/speech.js'
import { useLang } from '../lib/i18n.jsx'

export default function ListenButton({ text, id }) {
  const { lang, t } = useLang()
  const [on, setOn] = useState(false)
  // stop when the user switches step or leaves the page
  useEffect(() => { setOn(false); return () => stopSpeaking() }, [id])
  if (!canSpeak()) return null
  return (
    <button type="button" aria-pressed={on}
      onClick={() => { if (on) { stopSpeaking(); setOn(false) } else { setOn(true); speak(text, lang, () => setOn(false)) } }}
      className="inline-flex items-center gap-2 min-h-11 rounded-md border border-line bg-card px-3 text-sm hover:border-muted">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {on ? <><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></>
            : <><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14" /></>}
      </svg>
      {on ? t.stopListen : t.listen}
    </button>
  )
}
