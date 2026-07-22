"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken, type Role, type StaffLoginChallenge } from "@/lib/api";

/** Second-factor step surfaced to the login UI between password and session. */
export interface PendingTotp {
  challenge: string;
  mode: "enroll" | "verify";
  qrDataUrl?: string;
  otpauthUrl?: string;
}

interface Ctx {
  ready: boolean;
  token: string | null;
  email: string | null;
  role: Role | null;
  pending: PendingTotp | null;
  login: (email: string, password: string) => Promise<void>;
  verifyTotp: (code: string) => Promise<void>;
  cancelLogin: () => void;
  logout: () => void;
}

const AuthCtx = createContext<Ctx | null>(null);
const KEY = "gibeon.admin.token";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [pending, setPending] = useState<PendingTotp | null>(null);
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

  async function finalise(accessToken: string) {
    localStorage.setItem(KEY, accessToken);
    setToken(accessToken);
    const u = await api.me();
    if (u.type !== "staff") throw new Error("Not a staff account");
    setTok(accessToken);
    setEmail(u.email);
    setRole(u.role ?? null);
    setPending(null);
  }

  const value: Ctx = {
    ready,
    token,
    email,
    role,
    pending,
    // Step 1: password never yields a session — it hands back a TOTP challenge.
    login: async (e, password) => {
      const res: StaffLoginChallenge = await api.staffLogin(e, password);
      setPending(
        res.status === "TOTP_ENROLL"
          ? { challenge: res.challenge, mode: "enroll", qrDataUrl: res.qrDataUrl, otpauthUrl: res.otpauthUrl }
          : { challenge: res.challenge, mode: "verify" },
      );
    },
    // Step 2: verify the authenticator code, then establish the session.
    verifyTotp: async (code) => {
      if (!pending) throw new Error("Sign in again");
      const { accessToken } = await api.verifyTotp(pending.challenge, code);
      await finalise(accessToken);
    },
    cancelLogin: () => setPending(null),
    logout: () => {
      localStorage.removeItem(KEY);
      setToken(null);
      setTok(null);
      setEmail(null);
      setRole(null);
      setPending(null);
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
