// Typed boundary to the Gibeon API for staff operations.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type Role = "ADMIN" | "STORE_MANAGER" | "CASHIER";
export type OrderState =
  | "RECEIVED"
  | "PAYMENT_CONFIRMED"
  | "INVENTORY_UPDATED"
  | "PICKING"
  | "PACKING"
  | "DISPATCH"
  | "DELIVERED"
  | "COMPLETED";

export interface AdminVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  compareAtPrice?: number | null;
  stock: { variantId: string; state: string; remaining?: number };
}
export interface AdminMedia {
  id: string;
  url: string;
  kind: "IMAGE" | "VIDEO";
  alt?: string | null;
}
export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  brand: string;
  media: AdminMedia[];
  variants: AdminVariant[];
}
export interface AuditLog {
  id: string;
  actor: string;
  actorEmail: string | null;
  action: string;
  entity: string;
  entityId: string;
  data: unknown;
  createdAt: string;
}
export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}
export interface AdminOrder {
  id: string;
  reference: string;
  channel: "ONLINE" | "POS";
  state: OrderState;
  contactEmail?: string | null;
  total: number;
  createdAt: string;
}
export interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}
export interface Review {
  id: string;
  variantId: string;
  quantity: number;
  orderReference?: string | null;
  status: "PENDING" | "RESOLVED";
  createdAt: string;
}

export type StaffLoginChallenge =
  | { status: "TOTP_ENROLL"; challenge: string; otpauthUrl: string; qrDataUrl: string }
  | { status: "TOTP_REQUIRED"; challenge: string };

let token: string | null = null;
export function setToken(t: string | null) {
  token = t;
}

// Called when an authenticated request is rejected (expired/invalid session),
// so the app can end the session immediately instead of showing a dead UI.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const authed = Boolean(token); // login/verify calls carry no token
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!res.ok) {
    // A 401 on a request that carried a token means the session died —
    // not a bad-credentials login attempt. End the session.
    if (res.status === 401 && authed) onUnauthorized?.();
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new ApiError(res.status, msg ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  staffLogin: (email: string, password: string) =>
    req<StaffLoginChallenge>(`/auth/staff/login`, { method: "POST", body: JSON.stringify({ email, password }) }),
  verifyTotp: (challenge: string, code: string) =>
    req<{ accessToken: string }>(`/auth/staff/totp/verify`, { method: "POST", body: JSON.stringify({ challenge, code }) }),
  me: () => req<{ id: string; email: string; type: string; role?: Role }>(`/auth/me`),

  products: () => req<AdminProduct[]>(`/products`),
  createProduct: (body: unknown) => req<AdminProduct>(`/products`, { method: "POST", body: JSON.stringify(body) }),
  updateVariant: (variantId: string, body: unknown) =>
    req(`/products/variants/${variantId}`, { method: "PATCH", body: JSON.stringify(body) }),
  addProductMedia: (productId: string, body: { url: string; alt?: string }) =>
    req<AdminMedia>(`/products/${productId}/media`, { method: "POST", body: JSON.stringify(body) }),
  deleteProductMedia: (mediaId: string) =>
    req<{ ok: boolean }>(`/products/media/${mediaId}`, { method: "DELETE" }),
  signUpload: () => req<UploadSignature>(`/media/sign`, { method: "POST" }),

  lowStock: () => req<Array<{ variantId: string; quantity: number; lowStockThreshold: number }>>(`/inventory/low-stock`),
  adjustStock: (body: { variantId: string; mode: "set" | "delta"; value: number; reason: string }) =>
    req(`/inventory/adjust`, { method: "POST", body: JSON.stringify(body) }),

  orders: (state?: string) =>
    req<AdminOrder[]>(`/orders/admin/all${state ? `?state=${state}` : ""}`),
  advanceOrder: (id: string, to: OrderState) =>
    req(`/orders/${id}/advance`, { method: "POST", body: JSON.stringify({ to }) }),

  staff: () => req<StaffMember[]>(`/staff`),
  createStaff: (body: { email: string; name: string; password: string; role: Role }) =>
    req<StaffMember>(`/staff`, { method: "POST", body: JSON.stringify(body) }),
  updateStaffRole: (id: string, role: Role) =>
    req<StaffMember>(`/staff/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  resetStaffTotp: (id: string) => req<{ ok: boolean }>(`/staff/${id}/totp/reset`, { method: "POST" }),

  getProvider: () => req<{ provider: "PAYSTACK" | "FLUTTERWAVE" }>(`/payments/provider`),
  setProvider: (provider: "PAYSTACK" | "FLUTTERWAVE") =>
    req<{ provider: string }>(`/payments/provider`, { method: "PATCH", body: JSON.stringify({ provider }) }),

  reviews: () => req<Review[]>(`/reviews`),
  resolveReview: (id: string, resolution: "BACKORDER" | "SUBSTITUTION" | "REFUND") =>
    req(`/reviews/${id}/resolve`, { method: "POST", body: JSON.stringify({ resolution }) }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    req<{ ok: boolean }>(`/auth/staff/password`, { method: "PATCH", body: JSON.stringify(body) }),

  auditLogs: (params: { entity?: string; action?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.entity) q.set("entity", params.entity);
    if (params.action) q.set("action", params.action);
    q.set("limit", String(params.limit ?? 200));
    return req<AuditLog[]>(`/audit?${q.toString()}`);
  },
};

export { ApiError };
