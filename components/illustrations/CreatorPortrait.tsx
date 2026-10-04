/**
 * The creator's portrait: an original ink-and-wash noir figure — hat brim shading the eyes,
 * pinstripe suit, red patterned tie, against a hot orange wall. Drawn here, not copied.
 */
export function CreatorPortrait({ label, className }: { label: string; className?: string }) {
  return (
    <svg viewBox="0 0 400 500" className={className} role="img" aria-label={label}>
      <defs>
        <linearGradient id="cp-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9802f" />
          <stop offset="1" stopColor="#c9621f" />
        </linearGradient>
        <pattern id="cp-stripe" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(4)">
          <rect width="13" height="13" fill="#3a4556" />
          <rect x="6" width="1.6" height="13" fill="#9aa5b6" opacity="0.55" />
        </pattern>
        <pattern id="cp-paisley" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
          <rect width="18" height="18" fill="#b02a26" />
          <circle cx="5" cy="5" r="3" fill="#f0dcb4" />
          <circle cx="5" cy="5" r="1.3" fill="#5c1512" />
          <path d="M11 11 q5 -2 4 4 q-3 2 -4 -4z" fill="#6f1b17" />
          <circle cx="14" cy="4" r="1" fill="#f0dcb4" />
        </pattern>
        <clipPath id="cp-face">
          <ellipse cx="200" cy="236" rx="60" ry="76" />
        </clipPath>
      </defs>

      <rect width="400" height="500" fill="url(#cp-wall)" />
      {/* paper texture streaks */}
      <g opacity="0.08" stroke="#5a2a08" strokeWidth="2">
        <path d="M0 60 L400 40 M0 140 L400 128 M0 410 L400 396" />
      </g>

      {/* the figure fills the frame: shoulders run off the bottom, hat near the top */}
      <g transform="translate(200 548) scale(1.26) translate(-200 -500)">
      {/* suit */}
      <path d="M8 500 C20 420 60 372 130 350 L200 338 L270 350 C340 372 380 420 392 500 Z" fill="url(#cp-stripe)" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
      {/* lapels */}
      <path d="M150 342 L200 470 L118 380 L136 352 Z" fill="#2b3341" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      <path d="M250 342 L200 470 L282 380 L264 352 Z" fill="#2b3341" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      {/* shirt */}
      <path d="M160 334 L240 334 L200 440 Z" fill="#efe3c6" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      {/* tie */}
      <path d="M188 344 L212 344 L216 366 L184 366 Z" fill="url(#cp-paisley)" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      <path d="M184 366 L216 366 L226 450 L200 478 L176 450 Z" fill="url(#cp-paisley)" stroke="#111" strokeWidth="3" strokeLinejoin="round" />

      {/* neck */}
      <path d="M170 286 L230 286 L236 340 L200 352 L164 340 Z" fill="#9c6a3c" stroke="#111" strokeWidth="3" strokeLinejoin="round" />
      <path d="M170 300 Q200 326 232 300 L234 330 Q200 344 166 330 Z" fill="#6e4524" opacity="0.7" />

      {/* head */}
      <ellipse cx="200" cy="236" rx="60" ry="76" fill="#c48d56" stroke="#111" strokeWidth="4" />
      <g clipPath="url(#cp-face)">
        {/* shadow side of the face */}
        <path d="M140 160 C168 220 160 280 196 320 L130 330 Z" fill="#8a5730" opacity="0.85" />
        {/* stubble */}
        <path d="M150 268 Q200 330 252 268 L252 330 L150 330 Z" fill="#5d3b22" opacity="0.35" />
        {/* the hat's shadow over the eyes */}
        <path d="M120 150 L282 150 L282 222 C262 236 238 226 218 238 C204 246 190 236 174 240 C156 244 140 232 120 236 Z" fill="#17110c" opacity="0.92" />
      </g>
      {/* nose catching the light */}
      <path d="M204 236 C210 252 214 262 206 270 C200 272 194 270 192 266" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />
      <path d="M206 244 C210 254 211 262 207 266" fill="none" stroke="#e7b27a" strokeWidth="3" strokeLinecap="round" />
      {/* moustache and mouth */}
      <path d="M180 282 C192 274 210 274 224 282 C212 286 192 288 180 282 Z" fill="#2a1a10" />
      <path d="M186 298 Q202 302 218 296" fill="none" stroke="#3b2414" strokeWidth="3" strokeLinecap="round" />
      {/* ear */}
      <path d="M260 230 C272 228 274 252 262 260" fill="#a8723f" stroke="#111" strokeWidth="3" />

      {/* hat */}
      <g transform="rotate(-7 200 170)">
        <path d="M134 176 C132 120 160 92 200 92 C240 92 268 120 266 176 Z" fill="#5c4632" stroke="#111" strokeWidth="4" strokeLinejoin="round" />
        <path d="M168 104 C178 96 196 94 210 98" fill="none" stroke="#8a6f52" strokeWidth="5" strokeLinecap="round" />
        <path d="M136 158 L264 158 L266 178 L134 178 Z" fill="#231912" />
        <ellipse cx="200" cy="182" rx="124" ry="24" fill="#4a3828" stroke="#111" strokeWidth="4" />
        <path d="M84 184 C120 204 280 204 316 184" fill="none" stroke="#2a1f16" strokeWidth="6" />
        <path d="M100 176 C150 166 250 166 300 176" fill="none" stroke="#7d6248" strokeWidth="3" opacity="0.8" />
      </g>
      </g>
    </svg>
  );
}
