"use client";

import dynamic from "next/dynamic";
import type { PlayView } from "@/lib/game-engine/types";
import type { CasePublic } from "./GameContext";

// Device-only mode reads progress from localStorage, so it renders client-side only.
const Inner = dynamic(
  async () => {
    const [{ LocalGame }, { Workspace }, { useGame }] = await Promise.all([
      import("./LocalGame"),
      import("@/components/investigation/Workspace"),
      import("./GameContext"),
    ]);
    function WithRestart() {
      const { restart } = useGame();
      return <Workspace onPlayAgain={restart} />;
    }
    return function LocalInner(props: { pub: CasePublic; brief: string[]; initialPlay: PlayView }) {
      return (
        <LocalGame {...props}>
          <WithRestart />
        </LocalGame>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[100svh] items-center justify-center">
        <p className="animate-pulse font-mono text-xs uppercase tracking-[0.35em] text-steel-300">Accessing archive…</p>
      </div>
    ),
  },
);

export function LocalApp(props: { pub: CasePublic; brief: string[]; initialPlay: PlayView }) {
  return <Inner {...props} />;
}
