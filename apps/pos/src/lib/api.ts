import type { OutboxSale, SnapshotVariant } from "./db";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

let token: string | null = null;
export function setToken(t: string | null) {
  token = t;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new Error(msg ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export type ReconciliationResult =
  | { clientId: string; status: "committed"; orderReference: string }
  | { clientId: string; status: "flagged_oversell"; orderReference: string }
  | { clientId: string; status: "duplicate_ignored" };

export type StaffLoginChallenge =
  | { status: "TOTP_ENROLL"; challenge: string; otpauthUrl: string; qrDataUrl: string }
  | { status: "TOTP_REQUIRED"; challenge: string };

export const api = {
  staffLogin: (email: string, password: string) =>
    req<StaffLoginChallenge>(`/auth/staff/login`, { method: "POST", body: JSON.stringify({ email, password }) }),
  verifyTotp: (challenge: string, code: string) =>
    req<{ accessToken: string }>(`/auth/staff/totp/verify`, { method: "POST", body: JSON.stringify({ challenge, code }) }),
  me: () => req<{ id: string; email: string; type: string; role?: string }>(`/auth/me`),

  pull: () => req<{ syncedAt: string; variants: SnapshotVariant[] }>(`/sync/pull`, { method: "POST" }),
  push: (sales: OutboxSale[]) =>
    req<ReconciliationResult[]>(`/sync/push`, {
      method: "POST",
      body: JSON.stringify({
        sales: sales.map((s) => ({
          clientId: s.clientId,
          items: s.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice })),
          method: s.method,
          discountTotal: s.discountTotal,
          soldAt: s.soldAt,
        })),
      }),
    }),
};
