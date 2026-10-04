/** Slow drifting fog bands. CSS only; frozen under reduced motion. */
export function Fog({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
      <div className="fog-band absolute -left-1/4 bottom-[8%] h-[38%] w-[150%] opacity-50" />
      <div className="fog-band fog-band-slow absolute -left-1/2 bottom-[-6%] h-[30%] w-[160%] opacity-40" />
      <style>{`
        .fog-band {
          background: radial-gradient(ellipse 40% 60% at 30% 60%, rgba(113,132,147,.22), transparent 70%),
                      radial-gradient(ellipse 35% 50% at 70% 50%, rgba(113,132,147,.18), transparent 70%);
          filter: blur(20px);
          animation: fog-drift 46s linear infinite alternate;
        }
        .fog-band-slow { animation-duration: 70s; animation-direction: alternate-reverse; }
        @keyframes fog-drift { from { transform: translateX(-6%); } to { transform: translateX(10%); } }
      `}</style>
    </div>
  );
}
