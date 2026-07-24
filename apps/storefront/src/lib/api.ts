// Single typed boundary to the Gibeon API. Types mirror the NestJS responses.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type StockState = "in_stock" | "low_stock" | "sold_out";
export interface VariantStock {
  variantId: string;
  state: StockState;
  remaining?: number;
}
export interface ApiVariant {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number; // minor units
  compareAtPrice?: number | null;
  barcode?: string | null;
  stock: VariantStock;
}
export interface ApiMedia {
  id: string;
  url: string;
  kind: "IMAGE" | "VIDEO";
  alt?: string | null;
}
export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string; // slug — routes on /shop/{category}
  categoryLabel: string; // display name, resolved by the API
  brand: string;
  media: ApiMedia[];
  variants: ApiVariant[];
}

export interface ProductQuery {
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  limit?: number;
}

export type OrderState =
  | "RECEIVED"
  | "PAYMENT_CONFIRMED"
  | "INVENTORY_UPDATED"
  | "PICKING"
  | "PACKING"
  | "DISPATCH"
  | "DELIVERED"
  | "COMPLETED";

export interface OrderEvent {
  id: string;
  fromState: OrderState | null;
  toState: OrderState;
  actor: string;
  createdAt: string;
}
export interface Order {
  id: string;
  reference: string;
  channel: "ONLINE" | "POS";
  state: OrderState;
  contactEmail?: string | null;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  taxRate: number; // basis points, as charged on this order
  total: number;
  createdAt?: string;
  items: Array<{ id: string; variantId: string; nameSnapshot: string; unitPrice: number; quantity: number }>;
  events: OrderEvent[];
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const { token, ...rest } = init ?? {};
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...rest.headers,
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const msg = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    throw new ApiError(res.status, msg ?? `Request failed (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

function qs(query: object): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export interface Category {
  slug: string;
  label: string;
}

export const api = {
  // Catalogue (public, SSR-friendly)
  categories: (opts?: { revalidate?: number }) =>
    req<Category[]>(`/products/categories`, { next: { revalidate: opts?.revalidate ?? 3600 } } as RequestInit),
  taxRate: () => req<{ vatRateBps: number }>(`/settings/tax`, { next: { revalidate: 3600 } } as RequestInit),
  products: (query: ProductQuery = {}, opts?: { revalidate?: number }) =>
    req<ApiProduct[]>(`/products${qs(query)}`, { next: { revalidate: opts?.revalidate ?? 60 } } as RequestInit),
  // Typeahead — same endpoint as `products`, but uncached and capped.
  searchProducts: (q: string, init?: RequestInit) =>
    req<ApiProduct[]>(`/products${qs({ q, limit: 6 })}`, { cache: "no-store", ...init }),
  product: (slug: string, opts?: { revalidate?: number }) =>
    req<ApiProduct>(`/products/${slug}`, { next: { revalidate: opts?.revalidate ?? 60 } } as RequestInit),
  stock: (ids: string[]) =>
    ids.length ? req<VariantStock[]>(`/inventory/stock${qs({ ids: ids.join(",") })}`, { cache: "no-store" }) : Promise.resolve([]),

  // Orders + payments
  createOrder: (
    body: {
      channel: "ONLINE";
      contactEmail?: string;
      items: Array<{ variantId: string; quantity: number }>;
      discountTotal?: number;
    },
    token?: string,
  ) => req<Order>(`/orders`, { method: "POST", body: JSON.stringify(body), token }),
  myOrders: (token: string) => req<Order[]>(`/orders`, { token }),
  trackOrder: (reference: string, token: string) =>
    req<Order>(`/orders/${reference}`, { token }),
  paymentStatus: (reference: string) =>
    req<{ reference: string; state: OrderState; paid: boolean }>(
      `/payments/${encodeURIComponent(reference)}/status`,
      { cache: "no-store" },
    ),
  initializePayment: (orderId: string) =>
    req<{ provider: string; reference: string; authorizationUrl: string }>(`/payments/initialize`, {
      method: "POST",
      body: JSON.stringify({ orderId }),
    }),

  // Auth
  register: (body: { email: string; firstName: string; lastName: string; password: string }) =>
    req<{ accessToken: string }>(`/auth/register`, { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    req<{ accessToken: string }>(`/auth/login`, { method: "POST", body: JSON.stringify(body) }),
  requestReset: (email: string) =>
    req<{ resetToken?: string }>(`/auth/password/request-reset`, { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    req<{ ok: boolean }>(`/auth/password/reset`, { method: "POST", body: JSON.stringify({ token, password }) }),
  me: (token: string) => req<{ id: string; email: string; type: string }>(`/auth/me`, { token }),
};

export { ApiError };
