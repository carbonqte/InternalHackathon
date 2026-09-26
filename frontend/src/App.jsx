import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Admin from './pages/Admin.jsx'
import Privacy from './pages/Privacy.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-line">
        <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-lg">Civic Navigator</Link>
          <Link to="/admin" className="text-sm text-muted hover:text-ink">Admin review</Link>
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
          <p>
            Not an official government service. Information is gathered from public government websites
            and may be out of date. Always confirm at the linked official source before applying.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>© {new Date().getFullYear()} Civic Navigator · TSEC Internal Hackathon</span>
            <Link to="/privacy" className="underline underline-offset-2 hover:text-ink">Privacy</Link>
            <a href="mailto:kabirh2006@gmail.com" className="underline underline-offset-2 hover:text-ink">Contact</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
