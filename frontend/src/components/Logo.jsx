// Brand mark: three checkpoints on a path; the last one is the goal.
export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden className="shrink-0">
      <rect width="30" height="30" rx="3" fill="var(--color-ink)" />
      <path d="M7 21 L13 11 L23 11" fill="none" stroke="var(--color-paper)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".6" />
      <circle cx="7" cy="21" r="2.6" fill="var(--color-paper)" />
      <circle cx="13" cy="11" r="2.6" fill="var(--color-paper)" />
      <circle cx="23" cy="11" r="3" fill="var(--color-stamp)" />
    </svg>
  )
}
