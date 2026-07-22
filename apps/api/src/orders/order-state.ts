import type { OrderState } from "../db/schema";

/**
 * The single order lifecycle shared by web and POS (PRD Req. 18). Transitions
 * are a guarded state machine — not a free-text status — so every step is
 * validated and logged.
 */
export const ORDER_FLOW: Record<OrderState, OrderState[]> = {
  RECEIVED: ["PAYMENT_CONFIRMED"],
  PAYMENT_CONFIRMED: ["INVENTORY_UPDATED"],
  INVENTORY_UPDATED: ["PICKING"],
  PICKING: ["PACKING"],
  PACKING: ["DISPATCH"],
  DISPATCH: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  COMPLETED: [],
};

export function canTransition(from: OrderState, to: OrderState): boolean {
  return ORDER_FLOW[from]?.includes(to) ?? false;
}

/** Fulfilment steps staff can drive manually (post inventory-update). */
export const MANUAL_STEPS: OrderState[] = [
  "PICKING",
  "PACKING",
  "DISPATCH",
  "DELIVERED",
  "COMPLETED",
];
