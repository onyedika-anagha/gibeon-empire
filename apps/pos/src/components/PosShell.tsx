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
  const { login, verifyTotp, cancelLogin, pendingTotp } = usePos();
  const [email, setEmail] = useState("cashier@gibeonempire.com");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-ink";

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8">
        <div className="text-xl font-semibold tracking-tight text-ink">
          Gibeon<span className="text-gold"> POS</span>
        </div>

        {!pendingTotp ? (
          <>
            <p className="mt-1 text-sm text-slate">Till sign in.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => login(email, password));
              }}
              className="mt-6 space-y-4"
            >
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputCls} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={inputCls} />
              {error && <p className="text-sm text-danger">{error}</p>}
              <button type="submit" disabled={busy} className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white disabled:opacity-50">
                {busy ? "Checking…" : "Continue"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate">
              {pendingTotp.mode === "enroll" ? "Set up two-factor authentication" : "Enter your authenticator code"}
            </p>
            {pendingTotp.mode === "enroll" && pendingTotp.qrDataUrl && (
              <div className="mt-5 flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pendingTotp.qrDataUrl} alt="TOTP QR code" className="h-40 w-40 rounded-lg bg-white p-2" />
                <p className="text-center text-xs text-slate">Scan with your authenticator app, then enter the 6-digit code.</p>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(() => verifyTotp(code));
              }}
              className="mt-5 space-y-4"
            >
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                className={`${inputCls} text-center text-lg tracking-[0.4em]`}
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <button type="submit" disabled={busy || code.length !== 6} className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white disabled:opacity-50">
                {busy ? "Verifying…" : pendingTotp.mode === "enroll" ? "Activate & sign in" : "Verify"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCode("");
                  setError("");
                  cancelLogin();
                }}
                className="w-full text-xs text-slate underline hover:text-ink"
              >
                Back to sign in
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
