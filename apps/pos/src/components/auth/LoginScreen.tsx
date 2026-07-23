"use client";

import { useState } from "react";
import { usePos } from "@/hooks/usePos";
import ThemeToggle from "@/components/ThemeToggle";
import Wordmark from "@/components/Wordmark";

const inputCls =
  "w-full rounded-xl border border-line bg-elev/60 px-3.5 py-3 text-sm text-fg outline-none transition placeholder:text-faint focus:border-gold";

export default function LoginScreen() {
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
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center px-4">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-line bg-panel p-8 shadow-[0_1px_2px_rgba(26,23,20,0.04),0_12px_40px_-12px_rgba(26,23,20,0.18)]">
          <Wordmark />

          {!pendingTotp ? (
            <>
              <p className="mt-5 text-sm text-muted">Sign in to open the till.</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(() => login(email, password));
                }}
                className="mt-6 space-y-3.5"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="username"
                  className={inputCls}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className={inputCls}
                />
                {error && <p className="text-sm text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-fg py-3 text-sm font-semibold text-bg transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                >
                  {busy ? "Checking…" : "Continue"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-5 text-sm text-muted">
                {pendingTotp.mode === "enroll"
                  ? "Set up two-factor authentication to continue."
                  : "Enter the 6-digit code from your authenticator."}
              </p>
              {pendingTotp.mode === "enroll" && pendingTotp.qrDataUrl && (
                <div className="mt-5 flex flex-col items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingTotp.qrDataUrl}
                    alt="Scan this QR code with your authenticator app"
                    className="h-40 w-40 rounded-xl border border-line bg-white p-2"
                  />
                  <p className="text-center text-xs text-muted">
                    Scan with your authenticator app, then enter the 6-digit code.
                  </p>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(() => verifyTotp(code));
                }}
                className="mt-5 space-y-3.5"
              >
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  autoFocus
                  className={`${inputCls} text-center text-lg tracking-[0.4em] tnum`}
                />
                {error && <p className="text-sm text-danger">{error}</p>}
                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className="w-full rounded-xl bg-fg py-3 text-sm font-semibold text-bg transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
                >
                  {busy ? "Verifying…" : pendingTotp.mode === "enroll" ? "Activate & sign in" : "Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCode("");
                    setError("");
                    cancelLogin();
                  }}
                  className="w-full text-xs text-muted underline-offset-4 transition hover:text-fg hover:underline"
                >
                  Back to sign in
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] text-faint">Gibeon Empire · Till terminal</p>
      </div>
    </div>
  );
}
