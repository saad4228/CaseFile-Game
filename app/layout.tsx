import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, IBM_Plex_Mono, IBM_Plex_Sans, Reenie_Beanie } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const reenie = Reenie_Beanie({
  variable: "--font-reenie",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CASEFILE — Every clue tells a story",
    template: "%s · CASEFILE",
  },
  description:
    "A cinematic multiplayer deduction game. Inspect evidence, reconstruct timelines, challenge testimony and build a proof together.",
};

export const viewport: Viewport = {
  themeColor: "#080A0D",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${plexSans.variable} ${plexMono.variable} ${reenie.variable} h-full antialiased`}
    >
      <body className="grain min-h-full bg-ink-950 text-bone-100">{children}</body>
    </html>
  );
}
