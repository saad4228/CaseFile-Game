/**
 * An original trench-coat-and-hat silhouette, drawn from behind, in a 100×260 box.
 * `rim` adds a thin light edge on the lamp side.
 */
export function DetectivePath({ fill = "#050608", rim }: { fill?: string; rim?: string }) {
  const body =
    "M38 24 C38 14 44 9 50 9 C56 9 62 14 62 24 L62 30 C62 34 60 37 57 39 L66 42 C74 45 78 52 79 62 L84 132 C85 140 83 146 80 150 L88 236 C88 240 85 242 81 242 L66 242 L64 258 L57 258 L55 242 L46 242 L44 258 L37 258 L35 242 L20 242 C16 242 13 240 13 236 L20 150 C17 146 15 140 16 132 L21 62 C22 52 26 45 34 42 L43 39 C40 37 38 34 38 30 Z";
  const hat = "M28 22 C28 20 34 18 41 17 L42 4 C46 1 54 1 58 4 L59 17 C66 18 72 20 72 22 C72 25 62 26 50 26 C38 26 28 25 28 22 Z";
  const collar = "M37 40 L44 30 L50 44 L56 30 L63 40 L58 50 L50 46 L42 50 Z";
  return (
    <g>
      <path d={body} fill={fill} />
      <path d={hat} fill={fill} />
      <path d={collar} fill={fill} />
      {rim && (
        <>
          <path d="M79 62 L84 132 C85 140 83 146 80 150 L88 236" stroke={rim} strokeWidth="1.4" fill="none" opacity="0.7" />
          <path d="M59 17 C66 18 72 20 72 22" stroke={rim} strokeWidth="1.2" fill="none" opacity="0.8" />
          <path d="M66 42 C74 45 78 52 79 62" stroke={rim} strokeWidth="1.4" fill="none" opacity="0.6" />
        </>
      )}
    </g>
  );
}

export function Detective({ className, fill, rim }: { className?: string; fill?: string; rim?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 260" aria-hidden="true">
      <DetectivePath fill={fill} rim={rim} />
    </svg>
  );
}
