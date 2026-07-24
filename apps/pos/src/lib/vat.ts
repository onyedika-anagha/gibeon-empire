// The till prices sales while offline, so the VAT rate is cached from the last
// snapshot pull. Same rule as the API: VAT on the discounted amount, added on top.
const KEY = "gibeon.pos.vatBps";
const DEFAULT_BPS = 750; // Nigerian VAT, 7.5%

export function vatOn(amount: number, rateBps: number): number {
  return Math.round((amount * rateBps) / 10_000);
}

export function getVatRateBps(): number {
  if (typeof localStorage === "undefined") return DEFAULT_BPS;
  const raw = Number(localStorage.getItem(KEY));
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_BPS;
}

export function setVatRateBps(bps: number): void {
  localStorage.setItem(KEY, String(bps));
}

export function formatRate(bps: number): string {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
}
