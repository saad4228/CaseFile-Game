/** "02 — INVESTIGATE" style section marker. */
export function SectionMark({ n, label, className = "" }: { n: string; label: string; className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="font-mono text-xs tracking-[0.3em] text-amber-500">{n}</span>
      <span className="h-px w-12 bg-amber-500/50" />
      <span className="label">{label}</span>
    </div>
  );
}
