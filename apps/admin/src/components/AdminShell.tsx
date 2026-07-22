"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button, Card, Field } from "./ui";

const NAV = [
  ["Overview", "/"],
  ["Products", "/products"],
  ["Orders", "/orders"],
  ["Inventory", "/stock"],
  ["Reviews", "/reviews"],
  ["Staff", "/staff"],
  ["Settings", "/settings"],
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const { ready, token, email, role, logout } = useAdminAuth();
  const pathname = usePathname();

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate">Loading…</div>;
  }
  if (!token) return <LoginScreen />;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col justify-between border-r border-line bg-white px-4 py-6">
        <div>
          <div className="px-2 text-lg font-semibold tracking-tight text-ink">
            Gibeon<span className="text-gold"> Admin</span>
          </div>
          <nav className="mt-8 space-y-1">
            {NAV.map(([label, href]) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    active ? "bg-ink text-white" : "text-slate hover:bg-mist hover:text-ink"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="px-2">
          <p className="truncate text-xs text-slate">{email}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-gold">{role}</p>
          <button onClick={logout} className="mt-3 text-xs text-slate underline hover:text-ink">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 px-8 py-10">{children}</main>
    </div>
  );
}

function LoginScreen() {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
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
      <Card className="w-full max-w-sm p-8">
        <div className="text-lg font-semibold tracking-tight text-ink">
          Gibeon<span className="text-gold"> Admin</span>
        </div>
        <p className="mt-1 text-sm text-slate">Staff sign in.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
