"use client";

import { usePos } from "@/hooks/usePos";
import ThemeToggle from "./ThemeToggle";
import Wordmark from "./Wordmark";

export default function TopBar() {
  const { email, online, pending, lastSync, logout, syncNow } = usePos();

  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-panel/90 px-6 py-3 backdrop-blur">
      <Wordmark compact />

      <div className="flex items-center gap-3">
        <span
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
            online ? "border-ok/30 text-ok" : "border-danger/30 text-danger"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-ok" : "bg-danger"}`} />
          {online ? "Online" : "Offline"}
        </span>

        {pending > 0 && (
          <span className="rounded-full bg-warn/15 px-3 py-1.5 text-xs font-medium text-warn tnum">
            {pending} queued
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => void syncNow()}
            className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-gold hover:text-gold active:scale-95"
          >
            Sync
          </button>
          <span className="hidden text-[11px] text-faint sm:inline tnum">
            {lastSync ? `synced ${lastSync.toLocaleTimeString()}` : "not synced"}
          </span>
        </div>

        <span className="hidden h-5 w-px bg-line md:block" />

        <div className="hidden items-center gap-3 md:flex">
          <span className="max-w-[14rem] truncate text-xs text-muted" title={email ?? undefined}>
            {email}
          </span>
        </div>

        <ThemeToggle />

        <button
          onClick={logout}
          className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted transition hover:border-danger hover:text-danger active:scale-95"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
