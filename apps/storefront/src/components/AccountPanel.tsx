"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import OrderHistory from "./OrderHistory";

type Tab = "login" | "register" | "forgot";

export default function AccountPanel() {
  const { token, email, login, register, logout } = useAuth();

  if (token) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-[0.24em] text-taupe">Account</span>
            <h1 className="mt-2 font-display text-4xl tracking-[-0.02em] text-ink">{email}</h1>
          </div>
          <button onClick={logout} className="rounded-full px-4 py-2 text-sm text-stone ring-1 ring-ink/12 hover:bg-ink/5">
            Sign out
          </button>
        </div>
        <h2 className="mt-12 text-[11px] uppercase tracking-[0.18em] text-taupe">Your orders</h2>
        <div className="mt-5">
          <OrderHistory token={token} />
        </div>
      </div>
    );
  }

  return <AuthForms login={login} register={register} />;
}

function AuthForms({
  login,
  register,
}: {
  login: (e: string, p: string) => Promise<string>;
  register: (b: { email: string; firstName: string; lastName: string; password: string }) => Promise<string>;
}) {
  const [tab, setTab] = useState<Tab>("login");
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (tab === "login") await login(form.email, form.password);
      else if (tab === "register") await register(form);
      else {
        const res = await api.requestReset(form.email);
        // ponytail: token is surfaced only because dev has no mailer wired yet.
        setNotice(
          res.resetToken
            ? `Reset link sent. Dev token: ${res.resetToken}`
            : "If that email exists, a reset link is on its way.",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex justify-center gap-2">
        {(["login", "register", "forgot"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError("");
              setNotice("");
            }}
            className={`rounded-full px-4 py-1.5 text-[13px] capitalize transition-all duration-400 ${
              tab === t ? "bg-ink text-ivory" : "text-stone ring-1 ring-ink/12 hover:bg-ink/5"
            }`}
          >
            {t === "forgot" ? "Reset" : t}
          </button>
        ))}
      </div>

      <h1 className="text-center font-display text-4xl tracking-[-0.02em] text-ink">
        {tab === "login" ? "Welcome back." : tab === "register" ? "Join the house." : "Reset password."}
      </h1>

      <form onSubmit={submit} className="mt-8 space-y-4">
        {tab === "register" && (
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" value={form.firstName} onChange={(v) => set("firstName", v)} required />
            <Input label="Last name" value={form.lastName} onChange={(v) => set("lastName", v)} required />
          </div>
        )}
        <Input label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} required />
        {tab !== "forgot" && (
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(v) => set("password", v)}
            required
            minLength={tab === "register" ? 8 : undefined}
          />
        )}

        {error && <p className="text-[13px] text-red-700">{error}</p>}
        {notice && <p className="break-all text-[13px] text-gold">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-ink py-3.5 text-sm text-ivory transition-all duration-500 active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Please wait…" : tab === "login" ? "Sign in" : tab === "register" ? "Create account" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.14em] text-taupe">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        minLength={minLength}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl bg-ivory px-4 py-3 text-sm text-ink ring-1 ring-ink/10 focus:outline-none focus:ring-ink/30"
      />
    </label>
  );
}
