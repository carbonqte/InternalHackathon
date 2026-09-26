// Read-aloud: ElevenLabs (natural voice) through OUR backend when it's configured, else the browser's built-in voice.
// The ElevenLabs API key never reaches the browser: the frontend only calls POST {VITE_API_BASE}/tts.
const TTS_ON = import.meta.env.VITE_TTS === 'elevenlabs'
const API = import.meta.env.VITE_API_BASE || ''
const BCP = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' }

let audio = null
let url = null

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel() } catch { /* not supported */ }
  if (audio) { audio.pause(); audio = null }
  if (url) { URL.revokeObjectURL(url); url = null }
}

export const canSpeak = () => TTS_ON || (typeof window !== 'undefined' && 'speechSynthesis' in window)

function browserSpeak(text, lang, onEnd) {
  const synth = window.speechSynthesis
  if (!synth) { onEnd(); return }
  const u = new SpeechSynthesisUtterance(text)
  u.lang = BCP[lang] || 'en-IN'
  const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith(u.lang.toLowerCase().slice(0, 2)))
  if (voice) u.voice = voice
  u.rate = 0.95
  u.onend = onEnd; u.onerror = onEnd
  synth.speak(u)
}

/** Speak text in the UI language. Calls onEnd when finished or stopped by failure. */
export async function speak(text, lang, onEnd = () => {}) {
  stopSpeaking()
  if (TTS_ON) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(`${API}/tts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 1200), lang }), signal: ctrl.signal,
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`tts ${res.status}`)
      url = URL.createObjectURL(await res.blob())
      audio = new Audio(url)
      audio.onended = () => { stopSpeaking(); onEnd() }
      await audio.play()
      return
    } catch {
      stopSpeaking() // backend down, slow or out of credits: fall back so the button still works
    }
  }
  browserSpeak(text, lang, onEnd)
}
