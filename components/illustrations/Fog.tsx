/** Slow drifting fog bands. CSS only; frozen under reduced motion. */
export function Fog({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <div className="fog-band absolute -left-1/4 bottom-[8%] h-[38%] w-[150%] opacity-50" />
      <div className="fog-band fog-band-slow absolute -left-1/2 bottom-[-6%] h-[30%] w-[160%] opacity-40" />
      <style>{`
        /* Soft-edged gradients instead of filter: blur() — same look, no per-frame filter cost. */
        .fog-band {
          background: radial-gradient(ellipse 45% 70% at 30% 60%, rgba(113,132,147,.18), rgba(113,132,147,.06) 45%, transparent 75%),
                      radial-gradient(ellipse 40% 60% at 70% 50%, rgba(113,132,147,.15), rgba(113,132,147,.05) 45%, transparent 75%);
          will-change: transform;
          animation: fog-drift 46s linear infinite alternate;
        }
        .fog-band-slow { animation-duration: 70s; animation-direction: alternate-reverse; }
        @keyframes fog-drift { from { transform: translate3d(-6%, 0, 0); } to { transform: translate3d(10%, 0, 0); } }
      `}</style>
    </div>
  );
}
