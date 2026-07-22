"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "solid",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "danger" }) {
  const styles = {
    solid: "bg-ink text-white hover:opacity-90",
    ghost: "text-ink ring-1 ring-line hover:bg-mist",
    danger: "bg-danger text-white hover:opacity-90",
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-white ${className}`}>{children}</div>;
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-slate">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-ink"
      />
    </label>
  );
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "gold" | "ok" | "danger" }) {
  const c = {
    slate: "bg-mist text-slate",
    gold: "bg-gold/15 text-gold",
    ok: "bg-ok/15 text-ok",
    danger: "bg-danger/15 text-danger",
  }[tone];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c}`}>{children}</span>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
