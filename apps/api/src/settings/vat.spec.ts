import { vatOn, DEFAULT_VAT_BPS } from "./settings.service";

describe("VAT (added at checkout)", () => {
  it("adds 7.5% on the discounted amount, rounded to the kobo", () => {
    expect(DEFAULT_VAT_BPS).toBe(750);
    expect(vatOn(100_000, DEFAULT_VAT_BPS)).toBe(7_500); // ₦1,000 → ₦75 VAT
    expect(vatOn(1_999, DEFAULT_VAT_BPS)).toBe(150); // 149.925 rounds up
    expect(vatOn(0, DEFAULT_VAT_BPS)).toBe(0);
  });

  it("charges nothing at a zero rate", () => {
    expect(vatOn(100_000, 0)).toBe(0);
  });
});
