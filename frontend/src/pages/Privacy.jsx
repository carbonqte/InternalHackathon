import { useEffect } from 'react'

// Template for a student project. Have it reviewed before any real launch.
export default function Privacy() {
  useEffect(() => { document.title = 'Privacy · Civic Navigator' }, [])
  return (
    <article className="max-w-2xl mx-auto px-4 py-12 space-y-4 text-sm leading-relaxed">
      <h1 className="font-display text-3xl">Privacy</h1>
      <p className="text-muted">Last updated 26 September 2026</p>
      <h2 className="font-display text-lg pt-2">What we collect</h2>
      <p>
        The text you type into the search box is sent to our server to find a matching procedure. We don't
        ask for your name, phone number, Aadhaar or any other identity details, and we don't use accounts
        for citizens.
      </p>
      <h2 className="font-display text-lg pt-2">What stays on your device</h2>
      <p>
        Your progress (which steps you've ticked) is saved in your browser's local storage so it survives a
        refresh. It isn't sent to us. Clearing your browser data removes it.
      </p>
      <h2 className="font-display text-lg pt-2">Cookies and tracking</h2>
      <p>We don't use cookies, analytics or advertising trackers. Fonts are loaded from Google Fonts.</p>
      <h2 className="font-display text-lg pt-2">Your rights</h2>
      <p>
        We aim to follow India's Digital Personal Data Protection Act, 2023. To ask about or delete any data
        linked to you, email <a className="text-accent underline" href="mailto:kabirh2006@gmail.com">kabirh2006@gmail.com</a>.
      </p>
    </article>
  )
}
