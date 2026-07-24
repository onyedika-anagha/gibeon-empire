/** Where the provider sends the shopper's browser back after hosted checkout. */
export function checkoutCallbackUrl(): string | undefined {
  const base = process.env.STOREFRONT_URL;
  return base ? `${base.replace(/\/$/, "")}/checkout/callback` : undefined;
}
