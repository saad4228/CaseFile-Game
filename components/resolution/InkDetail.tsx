import { inkArt } from "@/data/cases/case-047/ink";
import type { InkDetail as Kind } from "@/lib/game-engine/types";
import { inkDrawings } from "./ink-drawings";

/**
 * Close-up ink panels for the resolution comic (reference 8): black ink on paper white, light
 * drawn as hatching, red used once — for the drink. 400×240 each. A drawn panel, when one is
 * on file, is placed inside the same box rather than replacing the SVG.
 */
export function InkDetail({ kind, className, slice }: { kind: Kind; className?: string; slice?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 400 240" preserveAspectRatio={slice ? "xMidYMid slice" : undefined} role="img" aria-label={LABEL[kind]}>
      <rect width="400" height="240" fill="#f1ede4" />
      {inkArt[kind] ? (
        <image href={inkArt[kind]} x="0" y="0" width="400" height="240" preserveAspectRatio="xMidYMid slice" />
      ) : (
        inkDrawings[kind]
      )}
    </svg>
  );
}

const LABEL: Record<Kind, string> = {
  console: "A hand flips a switch on a security console; the third-floor feed cuts to static.",
  glass: "From above: a turndown tray with a chocolate and a tumbler of whisky.",
  keycard: "A master keycard slides into the lock of Room 314; the light turns green.",
  door: "A hand on the handle of Room 314, the door swinging in, a lamp still lit inside. Two-tone chime.",
  window: "The Blackwood at night; the light in one third-floor window goes out.",
  stairs: "Shoes going down concrete stairs, fast.",
  river: "A phone drops from a hand into black water.",
  printout: "A printer feeds out a door report; a pen strikes lines through it.",
  ring: "A hand on a bar table beside a whisky glass, wearing a signet ring: a circle cut by a single vertical line.",
  "dying-call": "A hand going slack on hotel carpet, a phone still in the fingers with a call in progress.",
  burner: "A prepaid phone ringing unanswered on the passenger seat of an empty car in a garage.",
  monkshood: "Monkshood growing in a rooftop conservatory, labelled ACONITUM NAPELLUS.",
  handover: "Two hands under a bar table, one passing a USB drive into the other.",
  envelope: "An envelope pushed across a bar table by a hand wearing a circle-and-line signet ring.",
  contract: "A Vesper County document being signed by the Deputy Commissioner, the signet ring on his other hand.",
  ledger: "A bank statement under a ruler: four monthly payments of $40,000 from HH Consulting to Reed Media.",
};
