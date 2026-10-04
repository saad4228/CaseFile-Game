"use client";

// Replaces the root layout when it fails, so it carries its own document and styles.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", background: "#080A0D", color: "#E7E2D8", fontFamily: "Georgia, serif", display: "grid", placeItems: "center" }}>
        <title>CASEFILE — The line went dead</title>
        <main style={{ maxWidth: 480, padding: 32 }}>
          <p style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: "#8B95A1" }}>
            Archive — Connection interrupted
          </p>
          <h1 style={{ fontSize: 44, lineHeight: 1, margin: "16px 0" }}>The line went dead.</h1>
          <p style={{ fontFamily: "system-ui, sans-serif", fontSize: 15, lineHeight: 1.6, opacity: 0.75 }}>
            CASEFILE couldn&apos;t open. Try again in a moment.
          </p>
          {error.digest && <p style={{ fontFamily: "monospace", fontSize: 11, opacity: 0.5 }}>Reference {error.digest}</p>}
          <button
            type="button"
            onClick={() => retry()}
            style={{ marginTop: 24, padding: "14px 24px", background: "#D98A3A", color: "#080A0D", border: 0, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
