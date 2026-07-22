// ── Gibeon Empire · typed API client ──────────────────────────────────
// Thin fetch wrapper over the NestJS API. Frontends import this instead of
// hand-rolling fetch calls, so the request/response contract stays typed and
// in one place. Endpoints are filled in as the API lands (PRD Section 7).

import type {
  Order,
  OutboxSale,
  Product,
  ReconciliationResult,
  VariantStock,
} from "./index";

export interface ApiClientOptions {
  baseUrl: string;
  /** e.g. () => `Bearer ${token}` — resolved per request */
  authHeader?: () => string | undefined;
  fetchImpl?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface CatalogueQuery {
  category?: string;
  size?: string;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
}

export function createApiClient(opts: ApiClientOptions) {
  const doFetch = opts.fetchImpl ?? fetch;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const auth = opts.authHeader?.();
    const res = await doFetch(`${opts.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) {
      let body: unknown;
      try {
        body = await res.json();
      } catch {
        /* non-JSON error body */
      }
      throw new ApiError(res.status, `${init?.method ?? "GET"} ${path} → ${res.status}`, body);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  }

  const qs = (query: object) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return {
    request,

    catalogue: {
      list: (query: CatalogueQuery = {}) => request<Product[]>(`/products${qs(query)}`),
      bySlug: (slug: string) => request<Product>(`/products/${slug}`),
    },

    inventory: {
      stock: (variantIds: string[]) =>
        request<VariantStock[]>(`/inventory/stock${qs({ ids: variantIds.join(",") })}`),
    },

    orders: {
      track: (reference: string) => request<Order>(`/orders/${reference}`),
    },

    // POS offline sync (PRD Req. 35).
    sync: {
      push: (sales: OutboxSale[]) =>
        request<ReconciliationResult[]>(`/sync/push`, {
          method: "POST",
          body: JSON.stringify({ sales }),
        }),
      pull: (since?: string) => request<{ products: Product[] }>(`/sync/pull${qs({ since })}`),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
