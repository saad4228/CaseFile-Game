/** Things at the rim of the detective's desk, seen from above (reference 4B). Decoration only. */
export function DeskProps() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block" aria-hidden="true">
      {/* coffee cup and a ring where it stood */}
      <svg className="absolute -left-12 bottom-32 h-40 w-40 opacity-90" viewBox="0 0 160 160">
        <circle cx="118" cy="120" r="30" fill="none" stroke="#3a2412" strokeWidth="3" opacity="0.6" />
        <circle cx="74" cy="74" r="40" fill="#e9e1cf" />
        <circle cx="74" cy="74" r="40" fill="none" stroke="#b9ad95" strokeWidth="3" />
        <circle cx="74" cy="74" r="31" fill="#2a160a" />
        <ellipse cx="66" cy="66" rx="10" ry="6" fill="#fff" opacity="0.12" />
        <path d="M112 64 q22 10 0 22" fill="none" stroke="#e9e1cf" strokeWidth="7" strokeLinecap="round" />
      </svg>
      {/* magnifying glass */}
      <svg className="absolute -right-16 bottom-2 h-44 w-44 rotate-[24deg]" viewBox="0 0 160 160">
        <circle cx="62" cy="62" r="44" fill="rgba(180,210,230,0.08)" stroke="#8b6a3c" strokeWidth="9" />
        <circle cx="62" cy="62" r="44" fill="none" stroke="#c9a46a" strokeWidth="2" />
        <ellipse cx="48" cy="46" rx="14" ry="8" fill="#fff" opacity="0.12" transform="rotate(-30 48 46)" />
        <rect x="96" y="94" width="14" height="58" rx="6" fill="#1a110a" transform="rotate(-45 103 123)" />
      </svg>
      {/* fountain pen */}
      <svg className="absolute right-24 top-28 h-10 w-56 -rotate-[18deg]" viewBox="0 0 220 40">
        <rect x="10" y="12" width="160" height="16" rx="8" fill="#0f0d0b" />
        <rect x="120" y="12" width="6" height="16" fill="#c9a46a" />
        <path d="M170 14 L210 20 L170 26 Z" fill="#c9a46a" />
      </svg>
      {/* crumpled note */}
      <svg className="absolute -right-6 top-[42%] h-20 w-20" viewBox="0 0 100 100">
        <path d="M20 40 L35 18 L60 22 L80 12 L88 40 L78 62 L86 80 L58 88 L36 82 L14 70 Z" fill="#d8cfbd" />
        <path d="M35 18 L48 50 L80 12 M48 50 L14 70 M48 50 L58 88 M48 50 L88 40" stroke="#a89c84" strokeWidth="1.5" fill="none" />
      </svg>
    </div>
  );
}
