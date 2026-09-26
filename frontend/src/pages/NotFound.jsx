import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n.jsx'

export default function NotFound() {
  const { t } = useLang()
  useEffect(() => { document.title = 'Page not found · Civic Navigator' }, [])
  return (
    <section className="max-w-2xl mx-auto px-4 py-24">
      <h1 className="font-display text-3xl">{t.notFound}</h1>
      <p className="mt-3 text-muted">{t.notFoundSub}</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-accent text-white px-5 py-2.5 text-sm font-medium">{t.backToSearch}</Link>
    </section>
  )
}
