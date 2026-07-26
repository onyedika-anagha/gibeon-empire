import { priceCoupon, type CartLine, type PriceableCoupon } from "./coupon-pricing";

const base: PriceableCoupon = {
  type: "PERCENTAGE",
  value: 2000, // 20%
  scope: "ORDER",
  scopeValues: [],
  minSubtotal: 0,
  maxDiscount: null,
};

// Two lines: a SHIRT in "tops" and a BAG in "accessories".
const lines: CartLine[] = [
  { productId: "shirt", category: "tops", unitPrice: 5000, quantity: 2 }, // 10000
  { productId: "bag", category: "accessories", unitPrice: 20000, quantity: 1 }, // 20000
];
const subtotal = 30000;

function discount(r: ReturnType<typeof priceCoupon>): number {
  if ("error" in r) throw new Error(r.error);
  return r.discount;
}

describe("priceCoupon", () => {
  it("percentage off the whole order", () => {
    expect(discount(priceCoupon(base, lines, subtotal))).toBe(6000); // 20% of 30000
  });

  it("fixed amount off, never exceeding the base", () => {
    expect(discount(priceCoupon({ ...base, type: "FIXED", value: 5000 }, lines, subtotal))).toBe(5000);
    expect(discount(priceCoupon({ ...base, type: "FIXED", value: 999999 }, lines, subtotal))).toBe(30000);
  });

  it("percentage caps at maxDiscount", () => {
    expect(discount(priceCoupon({ ...base, maxDiscount: 4000 }, lines, subtotal))).toBe(4000);
  });

  it("product scope only discounts eligible lines", () => {
    const c = { ...base, scope: "PRODUCT" as const, scopeValues: ["bag"] };
    expect(discount(priceCoupon(c, lines, subtotal))).toBe(4000); // 20% of the 20000 bag only
  });

  it("category scope only discounts eligible lines", () => {
    const c = { ...base, scope: "CATEGORY" as const, scopeValues: ["tops"] };
    expect(discount(priceCoupon(c, lines, subtotal))).toBe(2000); // 20% of the 10000 tops only
  });

  it("rejects when nothing in the cart matches the scope", () => {
    const c = { ...base, scope: "PRODUCT" as const, scopeValues: ["nonexistent"] };
    expect(priceCoupon(c, lines, subtotal)).toEqual({ error: expect.any(String) });
  });

  it("rejects when subtotal is below the minimum", () => {
    expect(priceCoupon({ ...base, minSubtotal: 50000 }, lines, subtotal)).toEqual({
      error: expect.any(String),
    });
  });
});
