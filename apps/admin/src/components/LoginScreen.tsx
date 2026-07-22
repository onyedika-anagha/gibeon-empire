"use client";

import { useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Monogram from "./Monogram";

/** Two-step staff sign-in: password, then the enforced TOTP second factor. */
export default function LoginScreen() {
  const { login, verifyTotp, cancelLogin, pending } = useAdminAuth();
  const [email, setEmail] = useState("");
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
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    void run(() => login(email, password));
  };
  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    void run(() => verifyTotp(code));
  };

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-lg">
        <div className="flex items-center gap-2">
          <Monogram className="size-7 text-foreground" />
          <span className="text-lg font-semibold tracking-tight">
            Gibeon<span className="text-gold"> Admin</span>
          </span>
        </div>

        {!pending ? (
          <>
            <p className="mt-1 text-sm text-muted-foreground">Staff sign in.</p>
            <form onSubmit={submitPassword} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Checking…" : "Continue"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              {pending.mode === "enroll" ? "Set up two-factor authentication" : "Enter your authenticator code"}
            </p>

            {pending.mode === "enroll" && (
              <div className="mt-5 flex flex-col items-center gap-3">
                {pending.qrDataUrl && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={pending.qrDataUrl} alt="TOTP QR code" className="size-40 rounded-lg bg-white p-2" />
                )}
                <p className="text-center text-xs text-muted-foreground">
                  Scan with Google Authenticator, 1Password, or Authy, then enter the 6-digit code.
                </p>
                {pending.otpauthUrl && (
                  <code className="w-full break-all rounded-md bg-muted px-2 py-1 text-center text-[11px] text-muted-foreground">
                    {secretOf(pending.otpauthUrl)}
                  </code>
                )}
              </div>
            )}

            <form onSubmit={submitCode} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-[0.4em]"
                  required
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
                {busy ? "Verifying…" : pending.mode === "enroll" ? "Activate & sign in" : "Verify"}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setCode("");
                  setError("");
                  cancelLogin();
                }}
                className="text-xs text-muted-foreground underline hover:text-foreground"
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

/** Pull the shared secret out of an otpauth:// URI for manual key entry. */
function secretOf(url: string): string {
  try {
    return new URL(url).searchParams.get("secret") ?? "";
  } catch {
    return "";
  }
}
