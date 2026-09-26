import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LangProvider } from './lib/i18n.jsx'
import { Analytics } from '@vercel/analytics/react'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter><LangProvider><App /><Analytics /></LangProvider></BrowserRouter>
  </StrictMode>,
)
