"use client";

import { useRouter } from "next/navigation";
import { Workspace } from "@/components/investigation/Workspace";
import { Lobby } from "@/components/lobby/Lobby";
import type { SessionView } from "@/lib/sessions/types";
import { useGame, type CasePublic } from "./GameContext";
import { RemoteGame } from "./RemoteGame";

function PhaseSwitch() {
  const { phase, meta } = useGame();
  const router = useRouter();
  if (phase === "LOBBY") return <Lobby />;
  return <Workspace onPlayAgain={() => router.push(`/cases/${meta.id}`)} />;
}

export function SessionApp({ pub, initial }: { pub: CasePublic; initial: SessionView }) {
  return (
    <RemoteGame pub={pub} initial={initial}>
      <PhaseSwitch />
    </RemoteGame>
  );
}
