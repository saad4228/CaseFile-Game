import type { EvidenceCategory } from "@/lib/game-engine/types";

// Hand-inked line icons, one per kind of record. Stroke only, inherits colour.
const paths: Record<EvidenceCategory, string> = {
  CCTV: "M3 8h12l3-2v8l-3-2H3z M6 12v5 M4 17h4",
  PHOTO: "M3 7h4l2-2h6l2 2h4v12H3z M12 10a3 3 0 1 0 0 6a3 3 0 1 0 0-6",
  PHONE: "M5 9c0-3 3-4 7-4s7 1 7 4l-2 2-3-1v-2H10v2l-3 1z M7 12h10l2 8H5z M12 14a2 2 0 1 0 0 4a2 2 0 1 0 0-4",
  MESSAGES: "M4 5h16v11H9l-5 4z M8 9h8 M8 12h5",
  BANK: "M3 9l9-5 9 5z M5 10v7 M10 10v7 M14 10v7 M19 10v7 M3 19h18",
  HOTEL: "M8 14a4 4 0 1 1 3-6.7L21 7v3h-2v2h-2v-2h-5.3A4 4 0 0 1 8 14z M7 10.5h.5",
  AUDIO: "M3 7h18v11H3z M8 12.5a2 2 0 1 0 0-.1z M16 12.5a2 2 0 1 0 0-.1z M10 12.5h4 M7 16h10",
  DOCUMENT: "M6 3h9l4 4v14H6z M15 3v4h4 M9 11h7 M9 14h7 M9 17h5",
  INTERVIEW: "M8 3h8v9a4 4 0 0 1-8 0z M5 11a7 7 0 0 0 14 0 M12 18v3 M9 21h6",
  LOCATION: "M12 21s-6-6.5-6-11a6 6 0 1 1 12 0c0 4.5-6 11-6 11z M12 7.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 1 0 0-5",
  FORENSIC: "M9 3h6 M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3 M7.5 15h9",
  NEWS: "M3 5h15v14H5a2 2 0 0 1-2-2z M18 9h3v8a2 2 0 0 1-2 2 M6 8h9 M6 11h4 M12 11h3 M6 14h9",
  DIGITAL: "M4 6h16v10H4z M2 19h20 M9 16v3 M15 16v3",
};

export function RecordIcon({ category, className = "h-4 w-4" }: { category: EvidenceCategory; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[category]} />
    </svg>
  );
}
