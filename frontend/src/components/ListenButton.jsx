import { useEffect, useState } from 'react'
import { canSpeak, speak, stopSpeaking, voiceFor } from '../lib/speech.js'
import { useLang, LANGS } from '../lib/i18n.jsx'

export default function ListenButton({ text, id }) {
  const { lang, t } = useLang()
  const [on, setOn] = useState(false)
  const [note, setNote] = useState('')
  const [voice, setVoice] = useState(lang)
  // stop when the user switches step or leaves the page
  useEffect(() => { setOn(false); setNote(''); return () => stopSpeaking() }, [id])
  useEffect(() => { let live = true; voiceFor(lang).then((v) => live && setVoice(v)); return () => { live = false } }, [lang])
  if (!canSpeak()) return null
  const name = (c) => LANGS.find((l) => l.code === c)?.label || c
  const fallbackNote = voice && voice !== lang ? t.voiceFallback(name(lang), name(voice)) : ''
  return (
    <div>
      <button type="button" aria-pressed={on} aria-describedby={`listen-note-${id}`}
        onClick={() => {
          if (on) { stopSpeaking(); setOn(false); return }
          setNote(''); setOn(true)
          speak(text, lang, (why) => {
            setOn(false)
            if (why === 'novoice') setNote(t.noVoice(name(lang)))
            else if (why === 'error') setNote(t.voiceError)
          })
        }}
        className="inline-flex items-center gap-2 min-h-11 rounded-[3px] border border-line bg-card px-3 text-sm hover:border-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {on ? <><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></>
              : <><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14" /></>}
        </svg>
        {on ? t.stopListen : t.listen}
      </button>
      <p id={`listen-note-${id}`} role="status" className="text-xs text-muted mt-1.5 empty:hidden">{note || fallbackNote}</p>
    </div>
  )
}
