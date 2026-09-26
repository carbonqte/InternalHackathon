// Read-aloud: ElevenLabs (natural voice) through OUR backend when it's configured, else the browser's built-in voice.
// The ElevenLabs API key never reaches the browser: the frontend only calls POST {VITE_API_BASE}/tts.
const TTS_ON = import.meta.env.VITE_TTS === 'elevenlabs'
const API = import.meta.env.VITE_API_BASE || ''
const BCP = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', kn: 'kn-IN', gu: 'gu-IN', ta: 'ta-IN' }
// If the device has no voice for a language, a close one that can read the same script.
// Marathi is written in Devanagari, so a Hindi voice reads it understandably.
const FALLBACK = { mr: 'hi' }

let audio = null
let url = null
let queue = [] // kept referenced: Chrome drops utterances that get garbage-collected mid-speech
let run = 0

export function stopSpeaking() {
  run++
  queue = []
  try { window.speechSynthesis?.cancel() } catch { /* not supported */ }
  if (audio) { audio.pause(); audio = null }
  if (url) { URL.revokeObjectURL(url); url = null }
}

export const canSpeak = () => TTS_ON || (typeof window !== 'undefined' && 'speechSynthesis' in window)

// Chrome loads its voice list after the page; asking too early returns [] and the utterance is silent.
function voices() {
  const synth = window.speechSynthesis
  const now = synth.getVoices()
  if (now.length) return Promise.resolve(now)
  return new Promise((resolve) => {
    const done = () => { synth.removeEventListener('voiceschanged', done); resolve(synth.getVoices()) }
    synth.addEventListener('voiceschanged', done)
    setTimeout(done, 2500)
  })
}

function pick(list, lang) {
  const want = BCP[lang] || 'en-IN'
  const by = (code) => list.filter((v) => v.lang?.replace('_', '-').toLowerCase().startsWith(code.toLowerCase()))
  const exact = by(want), same = by(want.slice(0, 2))
  // Prefer local voices (work offline), then online ones.
  const best = (arr) => arr.find((v) => v.localService) || arr[0]
  return best(exact) || best(same) || null
}

/** Which voice language this device can use for `lang`: the language itself, a fallback, or null. */
export async function voiceFor(lang) {
  if (TTS_ON) return lang
  if (!canSpeak()) return null
  const list = await voices()
  if (pick(list, lang)) return lang
  const fb = FALLBACK[lang]
  return fb && pick(list, fb) ? fb : null
}

// Split into sentence-sized pieces: Chrome's online voices stop after roughly 15 seconds of one utterance.
function chunks(text) {
  return text.split(/(?<=[.!?।॥])\s+/).flatMap((s) => (s.length > 220 ? s.match(/.{1,220}(\s|$)/g) : [s])).map((s) => s.trim()).filter(Boolean)
}

async function browserSpeak(text, lang, onEnd) {
  const synth = window.speechSynthesis
  const my = run
  const list = await voices()
  const use = pick(list, lang) ? lang : FALLBACK[lang] && pick(list, FALLBACK[lang]) ? FALLBACK[lang] : null
  if (my !== run) return
  if (!use) { onEnd('novoice'); return }
  const voice = pick(list, use)
  queue = chunks(text).map((part) => {
    const u = new SpeechSynthesisUtterance(part)
    u.voice = voice; u.lang = voice.lang; u.rate = 0.95
    return u
  })
  queue.forEach((u, i) => {
    u.onerror = (e) => { if (my === run && e.error !== 'interrupted' && e.error !== 'canceled') onEnd('error') }
    if (i === queue.length - 1) u.onend = () => { if (my === run) onEnd() }
  })
  // A speak() right after cancel() is sometimes swallowed by Chrome; give it a tick.
  setTimeout(() => { if (my === run) queue.forEach((u) => synth.speak(u)) }, 60)
}

/** Speak text in the UI language. Calls onEnd(reason?) when finished; reason is 'novoice' or 'error' on failure. */
export async function speak(text, lang, onEnd = () => {}) {
  stopSpeaking()
  if (TTS_ON) {
    const my = run
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(`${API}/tts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 1200), lang }), signal: ctrl.signal,
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`tts ${res.status}`)
      if (my !== run) return
      url = URL.createObjectURL(await res.blob())
      audio = new Audio(url)
      audio.onended = () => { stopSpeaking(); onEnd() }
      await audio.play()
      return
    } catch {
      if (my !== run) return
      stopSpeaking() // backend down, slow or out of credits: fall back so the button still works
    }
  }
  browserSpeak(text, lang, onEnd)
}
