import type { CouponScope, CouponType } from "../db/schema";

// The coupon fields pricing cares about — decoupled from the DB row so this is
// a pure function that's trivial to unit-test.
export interface PriceableCoupon {
  type: CouponType;
  value: number;
  scope: CouponScope;
  scopeValues: string[];
  minSubtotal: number;
  maxDiscount: number | null;
}

export interface CartLine {
  productId: string;
  category: string;
  unitPrice: number; // minor units
  quantity: number;
}

/**
 * Compute the discount (minor units) a coupon applies to a cart, or a rejection
 * reason. Amount-only: eligibility that needs the DB (active window, usage limit,
 * per-customer cap) is checked by the service before calling this.
 */
export function priceCoupon(
  coupon: PriceableCoupon,
  lines: CartLine[],
  subtotal: number,
): { discount: number } | { error: string } {
  if (subtotal < coupon.minSubtotal) {
    return { error: `Order must be at least ${coupon.minSubtotal / 100} to use this code` };
  }

  // Which spend the coupon bites into.
  const base =
    coupon.scope === "ORDER"
      ? subtotal
      : lines
          .filter((l) =>
            coupon.scope === "PRODUCT"
              ? coupon.scopeValues.includes(l.productId)
              : coupon.scopeValues.includes(l.category),
          )
          .reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  if (base <= 0) return { error: "This code doesn't apply to anything in your cart" };

  let discount =
    coupon.type === "PERCENTAGE"
      ? Math.floor((base * coupon.value) / 10000) // value is basis points
      : Math.min(coupon.value, base); // FIXED, but never more than the eligible base

  if (coupon.type === "PERCENTAGE" && coupon.maxDiscount != null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  // A discount can never exceed the order itself.
  discount = Math.min(discount, subtotal);

  if (discount <= 0) return { error: "This code yields no discount on your cart" };
  return { discount };
}
