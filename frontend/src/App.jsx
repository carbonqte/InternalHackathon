import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Admin from './pages/Admin.jsx'
import Privacy from './pages/Privacy.jsx'
import NotFound from './pages/NotFound.jsx'
import { LANGS, useLang } from './lib/i18n.jsx'

export default function App() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line">
        <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-lg">Civic Navigator</Link>
          <div className="flex items-center gap-4">
            <label htmlFor="lang" className="sr-only">{t.language}</label>
            <select id="lang" value={lang} onChange={(e) => setLang(e.target.value)}
              className="rounded-md border border-line bg-white px-2 py-1 text-sm">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            <Link to="/admin" className="text-sm text-muted hover:text-ink hidden sm:inline">{t.admin}</Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/task/:taskId" element={<Roadmap />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="border-t border-line text-xs text-muted">
        <div className="max-w-6xl mx-auto px-4 py-4 space-y-2">
          <p>{t.disclaimer}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} Civic Navigator · TSEC Internal Hackathon</span>
            <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">{t.privacy}</Link>
            <a href="mailto:kabirh2006@gmail.com" className="underline underline-offset-2 hover:text-ink">{t.contact}</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
