import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./useCart";

const wrapper = ({ children }: { children: React.ReactNode }) => <CartProvider>{children}</CartProvider>;
const sample = { variantId: "v1", slug: "silk-slip", name: "Silk Slip", size: "S", color: "Ink", price: 22000 };

describe("useCart", () => {
  beforeEach(() => localStorage.clear());

  it("adds an item and computes count + subtotal", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.add(sample));
    expect(result.current.count).toBe(1);
    expect(result.current.subtotal).toBe(22000);
  });

  it("merges quantity when the same variant is added again", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.add(sample));
    act(() => result.current.add(sample, 2));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(66000);
  });

  it("removes an item when quantity drops to zero", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.add(sample));
    act(() => result.current.setQty("v1", 0));
    expect(result.current.items).toHaveLength(0);
  });

  it("clears the cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.add(sample));
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });
});
