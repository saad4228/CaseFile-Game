import { ImageResponse } from "next/og";

export const alt = "CASEFILE — Every clue tells a story. Case 047: The Last Call.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(217,138,58,0.28), #080A0D 70%)",
          color: "#E7E2D8",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 10, color: "#718493", fontFamily: "monospace" }}>
          VESPER CITY PD — CASE 047
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 150, letterSpacing: 6, lineHeight: 1 }}>CASEFILE</div>
          <div style={{ display: "flex", width: 220, height: 4, background: "#D98A3A", marginTop: 28 }} />
          <div style={{ fontSize: 52, marginTop: 28, fontStyle: "italic", color: "#F0AE55" }}>Every clue tells a story.</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: 26, color: "#E7E2D8", opacity: 0.8, fontFamily: "sans-serif" }}>
            A cinematic multiplayer deduction game
          </div>
          <div
            style={{
              display: "flex",
              border: "4px solid #C24A3F",
              color: "#C24A3F",
              padding: "8px 22px",
              fontSize: 34,
              letterSpacing: 6,
              transform: "rotate(-8deg)",
              fontFamily: "monospace",
            }}
          >
            UNSOLVED
          </div>
        </div>
      </div>
    ),
    size,
  );
}
