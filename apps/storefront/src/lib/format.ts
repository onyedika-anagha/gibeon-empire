/** API stores money in minor units (kobo). Render as major-unit currency. */
export function formatMoney(minor: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

const TONES: Array<[string, string, string]> = [
  ["#e7d3c7", "#c9a99a", "to-[#c9a99a]"],
  ["#c9c0b3", "#8f8577", "to-[#8f8577]"],
  ["#e9ddc9", "#cbb489", "to-[#cbb489]"],
  ["#d8cbe0", "#b3a0c4", "to-[#b3a0c4]"],
  ["#e2cfd0", "#b58f92", "to-[#b58f92]"],
];

/** Deterministic fabric-tone gradient for a product without real photography. */
export function toneFor(seed: string): [string, string, string] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}
