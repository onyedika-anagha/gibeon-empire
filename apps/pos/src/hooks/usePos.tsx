"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setToken } from "@/lib/api";
import { pendingCount, pullSnapshot, pushOutbox } from "@/lib/sync";

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
  online: boolean;
  pending: number;
  lastSync: Date | null;
  pendingTotp: PendingTotp | null;
  login: (email: string, password: string) => Promise<void>;
  verifyTotp: (code: string) => Promise<void>;
  cancelLogin: () => void;
  logout: () => void;
  syncNow: () => Promise<void>;
}

const PosCtx = createContext<Ctx | null>(null);
const KEY = "gibeon.pos.token";

export function PosProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setTok] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingTotp, setPendingTotp] = useState<PendingTotp | null>(null);

  const syncNow = useCallback(async () => {
    if (!navigator.onLine) return;
    // Push first so a fresh snapshot never clobbers un-synced optimistic stock.
    try {
      await pushOutbox();
    } catch {
      /* stay offline-tolerant */
    }
    const p = await pendingCount();
    setPending(p);
    if (p === 0) {
      try {
        await pullSnapshot();
      } catch {
        /* ignore */
      }
    }
    setLastSync(new Date());
  }, []);

  // Restore session.
  useEffect(() => {
    setOnline(navigator.onLine);
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
      })
      .catch(() => localStorage.removeItem(KEY))
      .finally(() => setReady(true));
  }, []);

  // Auto-sync: on reconnect (Background Sync isn't available in Safari, so we
  // also lean on the "online" event) + a periodic retry timer (PRD Req. 36).
  useEffect(() => {
    if (!token) return;
    void syncNow();
    const onOnline = () => {
      setOnline(true);
      void syncNow();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const timer = setInterval(() => {
      if (navigator.onLine) void syncNow();
      void pendingCount().then(setPending);
    }, 15000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(timer);
    };
  }, [token, syncNow]);

  const value: Ctx = {
    ready,
    token,
    email,
    online,
    pending,
    lastSync,
    syncNow,
    pendingTotp,
    // Step 1: password yields a TOTP challenge, never a session token.
    login: async (e, password) => {
      const res = await api.staffLogin(e, password);
      setPendingTotp(
        res.status === "TOTP_ENROLL"
          ? { challenge: res.challenge, mode: "enroll", qrDataUrl: res.qrDataUrl, otpauthUrl: res.otpauthUrl }
          : { challenge: res.challenge, mode: "verify" },
      );
    },
    // Step 2: verify the authenticator code, then open the till session.
    verifyTotp: async (code) => {
      if (!pendingTotp) throw new Error("Sign in again");
      const { accessToken } = await api.verifyTotp(pendingTotp.challenge, code);
      setToken(accessToken);
      const u = await api.me();
      if (u.type !== "staff") throw new Error("Not a staff account");
      localStorage.setItem(KEY, accessToken);
      setTok(accessToken);
      setEmail(u.email);
      setPendingTotp(null);
      void syncNow();
    },
    cancelLogin: () => setPendingTotp(null),
    logout: () => {
      localStorage.removeItem(KEY);
      setToken(null);
      setTok(null);
      setEmail(null);
      setPendingTotp(null);
    },
  };

  return <PosCtx.Provider value={value}>{children}</PosCtx.Provider>;
}

export function usePos() {
  const ctx = useContext(PosCtx);
  if (!ctx) throw new Error("usePos must be used within PosProvider");
  return ctx;
}
