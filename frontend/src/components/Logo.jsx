// Brand mark: three checkpoints joined by a path; the last one is the goal (saffron).
export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="8" fill="var(--color-band)" />
      <path d="M8 22 L14 12 L24 12" fill="none" stroke="var(--color-on-band)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
      <circle cx="8" cy="22" r="3" fill="var(--color-on-band)" />
      <circle cx="14" cy="12" r="3" fill="var(--color-on-band)" />
      <circle cx="24" cy="12" r="3.5" fill="var(--color-next)" />
    </svg>
  )
}
