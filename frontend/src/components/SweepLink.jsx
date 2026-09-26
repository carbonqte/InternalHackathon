import { Link } from 'react-router-dom'

// Underline that sweeps in from the left on hover or keyboard focus.
// Adapted from Skiper UI "Skiper 40" (Link000) by @gurvinder-singh02, https://skiper-ui.com (free licence, attribution required).
// Turned off automatically for people who ask for reduced motion (see index.css).
const SWEEP = "relative inline-flex items-center before:pointer-events-none before:absolute before:bottom-0 before:left-0 before:h-[0.07em] before:w-full before:bg-current before:content-[''] before:origin-right before:scale-x-0 before:transition-transform before:duration-300 before:ease-[cubic-bezier(0.4,0,0.2,1)] hover:before:origin-left hover:before:scale-x-100 focus-visible:before:origin-left focus-visible:before:scale-x-100"

export default function SweepLink({ to, href, className = '', children, ...rest }) {
  const cls = `${SWEEP} ${className}`
  return to ? <Link to={to} className={cls} {...rest}>{children}</Link> : <a href={href} className={cls} {...rest}>{children}</a>
}
