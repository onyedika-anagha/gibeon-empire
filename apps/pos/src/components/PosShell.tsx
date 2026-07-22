"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePos } from "@/hooks/usePos";

export default function PosShell({ children }: { children: ReactNode }) {
  const { ready, token } = usePos();

  // Register the offline-shell service worker once.
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!ready) return <div className="grid min-h-screen place-items-center text-sm text-slate">Starting…</div>;
  if (!token) return <LoginScreen />;

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="flex-1">{children}</div>
    </div>
  );
}

function TopBar() {
  const { email, online, pending, lastSync, logout, syncNow } = usePos();
  return (
    <header className="no-print flex items-center justify-between border-b border-line bg-white px-6 py-3">
      <div className="text-lg font-semibold tracking-tight text-ink">
        Gibeon<span className="text-gold"> POS</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className={`flex items-center gap-2 ${online ? "text-ok" : "text-danger"}`}>
          <span className={`h-2 w-2 rounded-full ${online ? "bg-ok" : "bg-danger"}`} />
          {online ? "Online" : "Offline"}
        </span>
        {pending > 0 && (
          <span className="rounded-full bg-warn/15 px-2.5 py-0.5 text-xs font-medium text-warn">
            {pending} queued
          </span>
        )}
        <button onClick={() => void syncNow()} className="text-slate underline hover:text-ink">
          Sync
        </button>
        <span className="text-xs text-slate">
          {lastSync ? `synced ${lastSync.toLocaleTimeString()}` : "not synced"}
        </span>
        <span className="text-slate">·</span>
        <span className="text-slate">{email}</span>
        <button onClick={logout} className="text-slate underline hover:text-ink">
          Sign out
        </button>
      </div>
    </header>
  );
}

function LoginScreen() {
  const { login } = usePos();
  const [email, setEmail] = useState("cashier@gibeonempire.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
        <div className="text-xl font-semibold tracking-tight text-ink">
          Gibeon<span className="text-gold"> POS</span>
        </div>
        <p className="mt-1 text-sm text-slate">Till sign in.</p>
        <div className="mt-6 space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </form>
    </div>
  );
}
