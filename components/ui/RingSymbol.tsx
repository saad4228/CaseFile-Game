/** The recurring mark: a circle cut by a single vertical line. */
export function RingSymbol({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-label="A circle cut by a single vertical line" role="img">
      <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <line x1="20" y1="3" x2="20" y2="37" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}
