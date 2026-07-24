import type { OrderState } from "./api";

/** The fulfilment pipeline, in order — shared by the history list and detail view. */
export const ORDER_STEPS: OrderState[] = [
  "RECEIVED",
  "PAYMENT_CONFIRMED",
  "INVENTORY_UPDATED",
  "PICKING",
  "PACKING",
  "DISPATCH",
  "DELIVERED",
  "COMPLETED",
];

export const ORDER_STATE_LABEL: Record<OrderState, string> = {
  RECEIVED: "Received",
  PAYMENT_CONFIRMED: "Payment confirmed",
  INVENTORY_UPDATED: "Preparing",
  PICKING: "Picking",
  PACKING: "Packing",
  DISPATCH: "Dispatched",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};
