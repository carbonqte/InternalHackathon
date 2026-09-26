import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Roadmap from './pages/Roadmap.jsx'
import Admin from './pages/Admin.jsx'

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
        </Routes>
      </main>
      <footer className="border-t border-line text-xs text-muted">
        <p className="max-w-6xl mx-auto px-4 py-4">
          Not an official government service. Information is gathered from public government websites
          and may be out of date — always confirm at the linked official source before applying.
        </p>
      </footer>
    </div>
  )
}
