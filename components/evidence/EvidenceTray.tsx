"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { EVIDENCE_DRAG_TYPE } from "@/components/board/constants";
import { useGame } from "@/components/game/GameContext";
import { useIsSmallScreen } from "@/lib/client/settings";
import type { EvidenceCategory } from "@/lib/game-engine/types";
import { EvidenceCard } from "./EvidenceCard";

const groups: { id: string; label: string; cats: EvidenceCategory[] }[] = [
  { id: "all", label: "All", cats: [] },
  { id: "statements", label: "Statements", cats: ["INTERVIEW"] },
  { id: "records", label: "Records", cats: ["HOTEL", "DOCUMENT", "DIGITAL", "BANK", "NEWS"] },
  { id: "visual", label: "CCTV & photos", cats: ["CCTV", "PHOTO"] },
  { id: "phone", label: "Phone & location", cats: ["PHONE", "MESSAGES", "LOCATION", "AUDIO"] },
  { id: "forensic", label: "Forensic", cats: ["FORENSIC"] },
];

export function EvidenceTray({ onOpen, fresh }: { onOpen: (id: string) => void; fresh: string[] }) {
  const { evidence, personal, shared, holders, mode } = useGame();
  const [group, setGroup] = useState("all");
  // Phones start with the tray folded away so the view above gets the screen; one tap opens it.
  const small = useIsSmallScreen();
  const [userCollapsed, setCollapsed] = useState<boolean | null>(null);
  const collapsed = userCollapsed ?? small;
  const g = groups.find((x) => x.id === group)!;
  const shown = evidence.filter((e) => g.cats.length === 0 || g.cats.includes(e.category));
  const unseen = evidence.filter((e) => !personal.seen.includes(e.id)).length;
  const privateCount = mode === "TEAM" ? evidence.filter((e) => holders[e.id] === "me").length : 0;

  return (
    <section className="desk-surface relative z-20 border-t border-[#2a2219]" aria-label="Evidence tray">
      <div className="flex items-center gap-3 px-3 py-2 md:px-5">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          className="-my-1 flex shrink-0 items-center gap-2 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-bone-100 md:py-1"
        >
          <span aria-hidden="true" className={`inline-block transition-transform ${collapsed ? "-rotate-90" : ""}`}>
            ▾
          </span>
          Evidence · {evidence.length}
          {unseen > 0 && (
            <>
              <span aria-hidden="true" className="text-amber-300">
                · {unseen}
                <span className="hidden sm:inline"> unexamined</span>
              </span>
              {/* phrased in full for screen readers, and at every width - the visible label
                  is hidden below sm, which would otherwise leave a bare number */}
              <span className="sr-only">, {unseen} unexamined</span>
            </>
          )}
          {privateCount > 0 && <span className="hidden text-steel-300 md:inline">· {privateCount} private</span>}
        </button>
        <div className="scrollbar-thin ml-auto flex gap-1 overflow-x-auto">
          {groups.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={group === x.id}
              onClick={() => {
                setGroup(x.id);
                setCollapsed(false);
              }}
              className={`shrink-0 px-2.5 py-2.5 font-mono text-[10px] uppercase tracking-[0.15em] md:py-1 ${
                group === x.id ? "bg-ink-700 text-bone-100" : "text-steel-400 hover:text-bone-100"
              }`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <ul className="scrollbar-thin flex gap-4 overflow-x-auto px-3 pb-4 pt-2 md:px-5">
              {shown.map((e, i) => (
                <motion.li
                  key={e.id}
                  className="shrink-0"
                  initial={fresh.includes(e.id) ? { y: -60, rotate: -8, opacity: 0 } : false}
                  animate={{ y: 0, rotate: [-1.2, 0.8, -0.4, 1.1][i % 4], opacity: 1 }}
                  transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
                  whileHover={{ y: -6, rotate: 0 }}
                >
                  <button
                    type="button"
                    draggable
                    onDragStart={(ev) => {
                      ev.dataTransfer.setData(EVIDENCE_DRAG_TYPE, e.id);
                      ev.dataTransfer.effectAllowed = "copy";
                    }}
                    onClick={() => onOpen(e.id)}
                    className="block cursor-grab active:cursor-grabbing"
                    aria-label={`Inspect ${e.title}`}
                  >
                    <EvidenceCard
                      e={e}
                      compact
                      unseen={!personal.seen.includes(e.id)}
                      pinned={shared.board.nodes.some((n) => n.ref === e.id)}
                      privateRecord={mode === "TEAM" && holders[e.id] === "me"}
                    />
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
