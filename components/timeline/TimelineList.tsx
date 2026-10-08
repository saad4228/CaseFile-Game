"use client";

import { evidenceCode } from "@/components/evidence/format";
import { useGame } from "@/components/game/GameContext";
import type { CustomEvent } from "@/lib/game-engine/state";
import type { Evidence } from "@/lib/game-engine/types";

// The night on a narrow screen. There is no room for a row per person, so everything that
// has a time runs down one column in order, with the records from inside the window edged.

export function TimelineList({
  rows,
  placeName,
  focus,
  focusFrom,
  focusTo,
  blindCount,
  readOnly,
  onOpen,
  onAdd,
}: {
  rows: { id: string; at: number; e?: Evidence; custom?: CustomEvent }[];
  placeName: Map<string, string>;
  focus: boolean;
  focusFrom: number | null;
  focusTo: number | null;
  blindCount: number;
  readOnly: boolean;
  onOpen: (id: string) => void;
  onAdd: () => void;
}) {
  const { suspects, dispatch } = useGame();
  return (
      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto p-4 md:hidden">
        <div className="paper mx-auto px-4 pb-5 pt-4">
          <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-[#1d1a14]">The night</p>
          <p className="mt-1 text-[12.5px] leading-snug text-[#4f4636]">
            Every record with a time on it, in order.{focus ? " The red ones happened while Daniel died." : ""}
          </p>
          {focus && blindCount > 0 && (
            <p className="mt-2 font-hand text-[22px] leading-none text-crimson-600">
              {blindCount} {blindCount === 1 ? "person has" : "people have"} nothing on file while he died.
            </p>
          )}
          <ol className="mt-4 space-y-2">
            {rows.map((item) => {
              const inside = focusFrom !== null && focusTo !== null && item.at >= focusFrom && item.at <= focusTo;
              if (item.custom) {
                return (
                  <li key={item.id} className="grid grid-cols-[52px_1fr] gap-3">
                    <input
                      aria-label="Time"
                      type="time"
                      className="w-full bg-transparent pt-2 font-mono text-xs font-semibold text-[#1d1a14] outline-none"
                      value={item.custom.time}
                      onChange={(ev) =>
                        /^\d{2}:\d{2}$/.test(ev.target.value) &&
                        dispatch({ t: "custom.update", event: { ...item.custom!, time: ev.target.value } })
                      }
                    />
                    <div className="sticky-note flex items-start gap-2 px-3 py-2">
                      <input
                        aria-label="What happened?"
                        className="w-full min-w-0 bg-transparent font-hand text-[20px] leading-tight text-[#2a2410] outline-none placeholder:text-[#2a2410]/45"
                        placeholder="what happened?"
                        value={item.custom.label}
                        onChange={(ev) => dispatch({ t: "custom.update", event: { ...item.custom!, label: ev.target.value } })}
                      />
                      <button
                        type="button"
                        className="shrink-0 px-1 text-[#2a2410]/50 hover:text-crimson-600"
                        onClick={() => dispatch({ t: "custom.remove", id: item.custom!.id })}
                        aria-label="Remove this moment"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                );
              }
              const e = item.e!;
              return (
                <li key={item.id} className="grid grid-cols-[52px_1fr] gap-3">
                  <span className={`pt-2 font-mono text-xs font-semibold ${inside ? "text-crimson-600" : "text-[#1d1a14]/70"}`}>
                    {e.time?.slice(0, 5)}
                  </span>
                  <button
                    type="button"
                    className={`slip w-full px-3 py-2 text-left ${inside ? "!border-crimson-600/60" : ""}`}
                    onClick={() => onOpen(e.id)}
                  >
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#4f4636]">
                      {evidenceCode(e.number)}
                      {e.location ? ` · ${placeName.get(e.location)}` : ""}
                    </p>
                    <p className="text-[13.5px] leading-snug text-[#1d1a14]">{e.title}</p>
                    {e.suspects.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-[#4f4636]">
                        {e.suspects.map((id) => suspects.find((s) => s.id === id)?.name ?? id).join(", ")}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
            {rows.length === 0 && (
              <li className="py-8 text-center font-hand text-[22px] text-[#4f4636]">No timestamped records yet.</li>
            )}
          </ol>
          {!readOnly && (
            <button
              type="button"
              className="mt-4 w-full border border-dashed border-[#1d1a14]/35 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#4f4636]"
              onClick={onAdd}
            >
              + Add what you think happened
            </button>
          )}
        </div>
      </div>
  );
}
