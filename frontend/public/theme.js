// Runs before the app so the page never flashes the wrong theme. Kept as a file (not inline) for the CSP.
(function () {
  try {
    var t = localStorage.getItem('theme') || 'system'
    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.dataset.theme = t === 'system' ? (dark ? 'dark' : 'light') : t
  } catch (e) { /* storage blocked: stay light */ }
})()
