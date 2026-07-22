export function formatMoney(minor: number, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    minor / 100,
  );
}
