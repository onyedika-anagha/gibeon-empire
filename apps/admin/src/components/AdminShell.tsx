"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { cn } from "@/lib/utils";
import Monogram from "./Monogram";
import ThemeToggle from "./ThemeToggle";
import LoginScreen from "./LoginScreen";

const NAV: [string, string][] = [
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
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!token) return <LoginScreen />;

  // Audit log is admin-only (the API enforces it too); hide it for other roles.
  const nav: [string, string][] = role === "ADMIN" ? [...NAV, ["Audit", "/audit"]] : NAV;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="flex w-60 flex-col justify-between border-r border-sidebar-border bg-sidebar px-4 py-6">
        <div>
          <div className="flex items-center gap-2 px-2">
            <Monogram className="size-6 text-sidebar-foreground" />
            <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
              Gibeon<span className="text-gold"> Admin</span>
            </span>
          </div>
          <nav className="mt-8 flex flex-col gap-1">
            {nav.map(([label, href]) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="px-2">
          <p className="truncate text-xs text-muted-foreground">{email}</p>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-primary">{role}</p>
          <button onClick={logout} className="mt-3 text-xs text-muted-foreground underline hover:text-foreground">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-8 backdrop-blur">
          <span className="text-sm text-muted-foreground">Workspace · Gibeon Empire</span>
          <ThemeToggle />
        </header>
        <main className="flex-1 px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
