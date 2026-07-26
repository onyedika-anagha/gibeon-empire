// A card terminal we can push a sale amount to and poll for the outcome.
// One contract so a second vendor (PAX, Opay, etc.) drops in behind it later;
// today the only implementation is Moniepoint's ERP "Push Payment Request" API.

export type TerminalPaymentMethod = "CARD_PURCHASE" | "POS_TRANSFER" | "ANY";

/** Normalised across vendors — the POS only ever sees these three. */
export type TerminalStatus = "pending" | "processed" | "cancelled";

export interface TerminalPushParams {
  /** Our sale id, reused as the provider's merchantReference so the two stay linked. */
  reference: string;
  amount: number; // minor units (kobo), same convention as the rest of the system
  terminalSerial: string;
  paymentMethod?: TerminalPaymentMethod;
}

export interface TerminalPushResult {
  reference: string;
  accepted: boolean; // the provider queued the push to the device (not yet paid)
}

export interface TerminalStatusResult {
  reference: string;
  status: TerminalStatus;
  amountPaid?: number;
  paymentMethod?: string;
}

export interface TerminalProviderAdapter {
  readonly name: string;
  /** Send the amount to the physical terminal; the customer taps their card there. */
  push(params: TerminalPushParams): Promise<TerminalPushResult>;
  /** Poll the provider for the truth — the 202 from push only means "queued". */
  status(reference: string): Promise<TerminalStatusResult>;
}
