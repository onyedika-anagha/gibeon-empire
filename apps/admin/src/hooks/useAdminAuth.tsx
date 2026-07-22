"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken, type Role } from "@/lib/api";

interface Ctx {
  ready: boolean;
  token: string | null;
  email: string | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<Ctx | null>(null);
const KEY = "gibeon.admin.token";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem(KEY);
    if (!t) {
      setReady(true);
      return;
    }
    setToken(t);
    api
      .me()
      .then((u) => {
        setTok(t);
        setEmail(u.email);
        setRole(u.role ?? null);
      })
      .catch(() => localStorage.removeItem(KEY))
      .finally(() => setReady(true));
  }, []);

  const value: Ctx = {
    ready,
    token,
    email,
    role,
    login: async (e, password) => {
      const { accessToken } = await api.staffLogin(e, password);
      localStorage.setItem(KEY, accessToken);
      setToken(accessToken);
      const u = await api.me();
      if (u.type !== "staff") throw new Error("Not a staff account");
      setTok(accessToken);
      setEmail(u.email);
      setRole(u.role ?? null);
    },
    logout: () => {
      localStorage.removeItem(KEY);
      setToken(null);
      setTok(null);
      setEmail(null);
      setRole(null);
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
