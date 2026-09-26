const P = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
export const TypeIcon = ({ type }) => {
  switch (type) {
    case 'document': return <svg {...P}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>
    case 'form': return <svg {...P}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13 7l4 4" /></svg>
    case 'visit': return <svg {...P}><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /></svg>
    case 'payment': return <svg {...P}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></svg>
    default: return <svg {...P}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
  }
}
export const LockIcon = () => <svg {...P}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
export const CheckIcon = () => <svg {...P}><path d="M5 12l5 5L20 7" /></svg>
export const typeLabel = { document: 'Document', form: 'Online form', visit: 'Office visit', payment: 'Payment', milestone: 'Milestone' }
