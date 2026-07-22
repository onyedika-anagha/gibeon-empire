"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthCtx {
  token: string | null;
  email: string | null;
  login: (email: string, password: string) => Promise<string>;
  register: (b: { email: string; firstName: string; lastName: string; password: string }) => Promise<string>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "gibeon.token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem(KEY);
    if (t) {
      setToken(t);
      api.me(t).then((u) => setEmail(u.email)).catch(() => {
        localStorage.removeItem(KEY);
        setToken(null);
      });
    }
  }, []);

  function persist(t: string): string {
    localStorage.setItem(KEY, t);
    setToken(t);
    api.me(t).then((u) => setEmail(u.email)).catch(() => {});
    return t;
  }

  const value: AuthCtx = {
    token,
    email,
    login: async (e, password) => persist((await api.login({ email: e, password })).accessToken),
    register: async (b) => persist((await api.register(b)).accessToken),
    logout: () => {
      localStorage.removeItem(KEY);
      setToken(null);
      setEmail(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
