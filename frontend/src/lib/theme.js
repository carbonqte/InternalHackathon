import { useEffect, useState } from 'react'

export const THEMES = ['system', 'light', 'dark', 'contrast']
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')

function apply(t) {
  document.documentElement.dataset.theme = t === 'system' ? (mq().matches ? 'dark' : 'light') : t
}

export function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('theme') || 'system' } catch { return 'system' } })
  useEffect(() => {
    apply(theme)
    try { localStorage.setItem('theme', theme) } catch { /* private mode */ }
    if (theme !== 'system') return
    const m = mq(); const on = () => apply('system')
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [theme])
  return [theme, setTheme]
}
