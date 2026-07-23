"use client";

// Legacy shared primitives, now thin wrappers over shadcn/ui so every
// existing page adopts the themed look without changing its imports.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as SButton } from "@/components/ui/button";
import { Badge as SBadge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const BUTTON_VARIANT = { solid: "default", ghost: "outline", danger: "destructive" } as const;

export function Button({
  variant = "solid",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "danger" }) {
  return <SButton variant={BUTTON_VARIANT[variant]} className={className} {...props} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  // Themed drop-in for the old bg-white card; pages control their own layout/padding.
  return (
    <div className={cn("rounded-xl border border-border bg-card text-card-foreground", className)}>{children}</div>
  );
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
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

const BADGE_TONE = {
  slate: { variant: "secondary" as const, className: "" },
  gold: { variant: "outline" as const, className: "border-gold/40 text-gold" },
  warn: { variant: "outline" as const, className: "border-warn/40 text-warn" },
  ok: { variant: "outline" as const, className: "border-ok/40 text-ok" },
  danger: { variant: "destructive" as const, className: "" },
};

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: keyof typeof BADGE_TONE }) {
  const t = BADGE_TONE[tone];
  return (
    <SBadge variant={t.variant} className={t.className}>
      {children}
    </SBadge>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
