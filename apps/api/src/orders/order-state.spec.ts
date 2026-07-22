import { ORDER_FLOW, canTransition } from "./order-state";
import type { OrderState } from "../db/schema";

describe("order state machine", () => {
  it("allows each legal forward step", () => {
    expect(canTransition("RECEIVED", "PAYMENT_CONFIRMED")).toBe(true);
    expect(canTransition("PAYMENT_CONFIRMED", "INVENTORY_UPDATED")).toBe(true);
    expect(canTransition("DISPATCH", "DELIVERED")).toBe(true);
    expect(canTransition("DELIVERED", "COMPLETED")).toBe(true);
  });

  it("rejects skipping a step", () => {
    expect(canTransition("RECEIVED", "INVENTORY_UPDATED")).toBe(false);
    expect(canTransition("RECEIVED", "DISPATCH")).toBe(false);
  });

  it("rejects moving backwards", () => {
    expect(canTransition("DELIVERED", "DISPATCH")).toBe(false);
    expect(canTransition("PAYMENT_CONFIRMED", "RECEIVED")).toBe(false);
  });

  it("is terminal at COMPLETED", () => {
    expect(ORDER_FLOW.COMPLETED).toHaveLength(0);
  });

  it("every state maps to only forward-or-empty targets", () => {
    const order: OrderState[] = [
      "RECEIVED",
      "PAYMENT_CONFIRMED",
      "INVENTORY_UPDATED",
      "PICKING",
      "PACKING",
      "DISPATCH",
      "DELIVERED",
      "COMPLETED",
    ];
    for (const s of order) {
      for (const next of ORDER_FLOW[s]) {
        expect(order.indexOf(next)).toBe(order.indexOf(s) + 1);
      }
    }
  });
});
