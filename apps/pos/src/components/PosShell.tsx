"use client";

import { useEffect, type ReactNode } from "react";
import { usePos } from "@/hooks/usePos";
import TopBar from "./TopBar";
import LoginScreen from "./auth/LoginScreen";

export default function PosShell({ children }: { children: ReactNode }) {
  const { ready, token } = usePos();

  // Register the offline-shell service worker once.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!ready)
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted">
        <span className="animate-pulse">Starting…</span>
      </div>
    );
  if (!token) return <LoginScreen />;

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
