import { lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
// The graph library is only needed on roadmap pages, so it loads when one opens.
const Roadmap = lazy(() => import('./pages/Roadmap.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const Privacy = lazy(() => import('./pages/Privacy.jsx'))
import NotFound from './pages/NotFound.jsx'
import Browse from './pages/Browse.jsx'
import LangChooser from './components/LangChooser.jsx'
import { LANGS, useLang } from './lib/i18n.jsx'
import ThemeMenu from './components/ThemeMenu.jsx'
import TextSize from './components/TextSize.jsx'

export default function App() {
  const { lang, setLang, t } = useLang()
  return (
    <div className="min-h-screen flex flex-col">
      <LangChooser />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-accent focus:text-on-accent focus:px-4 focus:py-3">{t.skip}</a>
      <header className="border-b border-line">
        <nav className="max-w-6xl mx-auto px-4 min-h-16 py-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <span className="flex items-baseline gap-3 min-w-0">
            <Link to="/" className="font-display text-lg shrink-0 flex items-center min-h-11">Civic Navigator</Link>
            <span className="hidden md:inline text-xs text-muted truncate">{t.notGov}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <span className="hidden sm:flex"><TextSize /></span>
            <ThemeMenu />
            <label htmlFor="lang" className="sr-only">{t.language}</label>
            <select id="lang" value={lang} onChange={(e) => setLang(e.target.value)}
              className="min-h-11 rounded-md border border-line bg-card px-2 text-sm">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}{l.beta ? ' (Beta)' : ''}</option>)}
            </select>
            <Link to="/admin" className="text-sm text-muted hover:text-ink hidden sm:flex items-center min-h-11">{t.admin}</Link>
          </div>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<p className="max-w-6xl mx-auto px-4 py-12 text-muted" aria-busy="true">…</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/task/:taskId" element={<Roadmap />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
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
