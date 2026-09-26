import { useEffect, useState } from 'react'

export const SIZES = [{ k: 'm', scale: 1 }, { k: 'l', scale: 1.125 }, { k: 'xl', scale: 1.25 }]
export const scaleOf = () => SIZES.find((s) => s.k === document.documentElement.dataset.textsize)?.scale || 1

export function useTextSize() {
  const [size, setSize] = useState(() => { try { return localStorage.getItem('textsize') || 'm' } catch { return 'm' } })
  useEffect(() => {
    document.documentElement.dataset.textsize = size
    try { localStorage.setItem('textsize', size) } catch { /* private mode */ }
    window.dispatchEvent(new Event('textsize'))
  }, [size])
  return [size, setSize]
}

/** Re-render when text size changes (the graph needs to resize its boxes). */
export function useTextScale() {
  const [s, setS] = useState(scaleOf)
  useEffect(() => { const on = () => setS(scaleOf()); window.addEventListener('textsize', on); return () => window.removeEventListener('textsize', on) }, [])
  return s
}
