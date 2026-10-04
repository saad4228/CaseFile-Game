"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useGame } from "@/components/game/GameContext";
import type { MessageView } from "@/lib/sessions/types";

const REACTIONS = ["✓", "?", "!", "✗", "👁"];
const noop = () => () => {};

/** Local clock time; blank during server render so the viewer's timezone can't cause a mismatch. */
function Time({ t }: { t: number }) {
  const client = useSyncExternalStore(noop, () => true, () => false);
  return <>{client ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</>;
}

/** Render body text with #NNN references and @mentions highlighted. Text only — never HTML. */
function Body({ m, onOpen, mentionWords }: { m: MessageView; onOpen: (id: string) => void; mentionWords: string[] }) {
  const parts = m.body.split(/(#0*\d{1,3}\b|@[\p{L}\p{N}_-]{2,24})/u);
  return (
    <>
      {parts.map((p, i) => {
        if (/^#0*\d{1,3}$/.test(p)) {
          const id = `E-${String(Number(p.slice(1))).padStart(3, "0")}`;
          const ref = m.refs.find((r) => r.id === id);
          if (!ref) return <Fragment key={i}>{p}</Fragment>;
          const open = ref.access === "team" || ref.access === "mine";
          return open ? (
            <button
              key={i}
              type="button"
              onClick={() => onOpen(id)}
              className="mx-0.5 inline border border-amber-500/60 bg-amber-500/10 px-1 font-mono text-[12px] text-amber-300 hover:bg-amber-500/20"
              title={ref.title ?? undefined}
            >
              {p}
            </button>
          ) : (
            <span key={i} className="mx-0.5 inline border border-ink-600 px-1 font-mono text-[12px] text-steel-400" title={ref.holder ? `Private — held by ${ref.holder}` : "Not discovered"}>
              🔒{p}
            </span>
          );
        }
        if (p.startsWith("@")) {
          const me = mentionWords.includes(p.slice(1).toLowerCase());
          return (
            <span key={i} className={me ? "bg-amber-500/25 px-0.5 text-amber-200" : "text-steel-300"}>
              {p}
            </span>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

export function ChatPanel({
  open,
  onClose,
  onOpen,
  inline = false,
}: {
  open: boolean;
  onClose?: () => void;
  onOpen: (id: string) => void;
  inline?: boolean;
}) {
  const { messages, sendMessage, react, pin, me, players } = useGame();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const mentionWords = [me.codename.split(" ")[0].toLowerCase(), me.codename.replace(/\s+/g, "").toLowerCase()];
  const pinned = messages.filter((m) => m.pinned);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, open]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const r = await sendMessage(body);
    setSending(false);
    if (r.ok) setText("");
    else setError(r.error);
  };

  const panel = (
    <div className={`flex h-full flex-col ${inline ? "" : "border-l border-ink-700 bg-ink-900/[0.97] shadow-[-20px_0_60px_rgba(0,0,0,.5)]"}`}>
      {!inline && (
        <div className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
          <p className="label !text-bone-100">Team channel</p>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-steel-400">
              {players.filter((p) => p.online).length}/{players.length} online
            </span>
            <button type="button" onClick={onClose} className="text-steel-400 hover:text-bone-100" aria-label="Close chat">
              ✕
            </button>
          </div>
        </div>
      )}
      {pinned.length > 0 && (
        <div className="max-h-28 overflow-y-auto border-b border-ink-700 bg-amber-500/5 px-4 py-2">
          {pinned.map((m) => (
            <p key={m.id} className="truncate text-[12px] text-bone-100/80">
              <span className="mr-1 text-amber-300">📌</span>
              <span className="font-mono text-[10px] uppercase text-steel-300">{m.codename}:</span> {m.body}
            </p>
          ))}
        </div>
      )}
      <div ref={listRef} className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite" aria-label="Messages">
        {messages.length === 0 && <p className="mt-10 text-center text-sm italic text-bone-100/40">Nothing said yet.</p>}
        {messages.map((m) =>
          m.kind === "SYSTEM" ? (
            <p key={m.id} className="border-l-2 border-ink-600 pl-3 font-mono text-[11px] leading-relaxed text-steel-300">
              <Body m={m} onOpen={onOpen} mentionWords={[]} /> <span className="text-steel-400/60">· <Time t={m.createdAt} /></span>
            </p>
          ) : (
            <div key={m.id} className="group">
              <p className="flex items-baseline gap-2">
                <span className={`font-mono text-[11px] uppercase tracking-[0.12em] ${m.userId === me.userId ? "text-amber-300" : "text-bone-100"}`}>
                  {m.codename}
                </span>
                <span className="font-mono text-[10px] text-steel-400">
                  <Time t={m.createdAt} />
                </span>
                {m.pinned && <span className="text-[10px] text-amber-300">📌</span>}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-bone-100/90">
                <Body m={m} onOpen={onOpen} mentionWords={mentionWords} />
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {m.reactions.map((r) => (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => react(m.id, r.emoji)}
                    aria-pressed={r.mine}
                    className={`border px-1.5 text-[11px] ${r.mine ? "border-amber-500/70 bg-amber-500/10" : "border-ink-600"}`}
                  >
                    {r.emoji} {r.count}
                  </button>
                ))}
                <span className="flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  {REACTIONS.filter((r) => !m.reactions.some((x) => x.emoji === r)).map((r) => (
                    <button key={r} type="button" onClick={() => react(m.id, r)} className="px-1 text-[11px] text-steel-400 hover:text-bone-100" aria-label={`React ${r}`}>
                      {r}
                    </button>
                  ))}
                  <button type="button" onClick={() => pin(m.id)} className="px-1 font-mono text-[10px] text-steel-400 hover:text-bone-100">
                    {m.pinned ? "unpin" : "pin"}
                  </button>
                </span>
              </div>
            </div>
          ),
        )}
      </div>
      <div className="border-t border-ink-700 p-3">
        {error && (
          <p role="alert" className="mb-2 text-xs text-crimson-400">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={2}
            maxLength={600}
            placeholder="Cite a record with #012, mention with @name"
            aria-label="Message"
            className="min-h-[2.75rem] flex-1 resize-none border border-ink-600 bg-ink-950 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <button type="button" className="btn btn-primary btn-sm self-end" onClick={send} disabled={!text.trim() || sending}>
            Send
          </button>
        </div>
      </div>
    </div>
  );

  if (inline) return panel;
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="absolute inset-y-0 right-0 z-30 w-full max-w-[400px]"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          aria-label="Team chat"
        >
          {panel}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
