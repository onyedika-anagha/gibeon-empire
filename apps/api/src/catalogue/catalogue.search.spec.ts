import { searchPattern } from "./catalogue.service";

describe("searchPattern", () => {
  it("wraps a term in wildcards", () => {
    expect(searchPattern("linen")).toBe("%linen%");
  });

  it("ignores blank terms", () => {
    expect(searchPattern("   ")).toBeUndefined();
  });

  it("escapes ILIKE wildcards so they match literally", () => {
    expect(searchPattern("50% off")).toBe("%50\\% off%");
    expect(searchPattern("a_b")).toBe("%a\\_b%");
    expect(searchPattern("back\\slash")).toBe("%back\\\\slash%");
  });
});
