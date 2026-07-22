import type { PaymentProvider } from "../db/schema";

export interface InitializeParams {
  reference: string;
  amount: number; // minor units
  email: string;
}

export interface InitializeResult {
  reference: string;
  authorizationUrl: string;
}

export interface WebhookResult {
  ok: boolean;
  reference?: string;
  status?: "success" | "failed";
}

/** One contract, two providers (PRD Req. 28). Selected at runtime by the admin toggle. */
export interface PaymentProviderAdapter {
  readonly name: PaymentProvider;
  initialize(params: InitializeParams): Promise<InitializeResult>;
  /** Verify a provider webhook against its signature and extract the outcome. */
  verifyWebhook(rawBody: string, signature: string | undefined): WebhookResult;
}
