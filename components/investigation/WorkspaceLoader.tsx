"use client";

import dynamic from "next/dynamic";

// The workspace reads saved progress from this device, so it renders client-only.
export const WorkspaceLoader = dynamic(() => import("./Workspace").then((m) => m.Workspace), {
  ssr: false,
  loading: () => (
    <div className="flex h-[100svh] items-center justify-center bg-ink-950">
      <p className="animate-pulse font-mono text-xs uppercase tracking-[0.35em] text-steel-300">Accessing archive…</p>
    </div>
  ),
});
