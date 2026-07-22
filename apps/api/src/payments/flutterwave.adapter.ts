import { Injectable } from "@nestjs/common";
import type {
  InitializeParams,
  InitializeResult,
  PaymentProviderAdapter,
  WebhookResult,
} from "./payment-provider.interface";
import type { PaymentProvider } from "../db/schema";

@Injectable()
export class FlutterwaveAdapter implements PaymentProviderAdapter {
  readonly name: PaymentProvider = "FLUTTERWAVE";
  private readonly secretHash = process.env.FLUTTERWAVE_SECRET_HASH ?? "";

  // ponytail: hosted-checkout stub. With Flutterwave keys, swap for a real
  // POST https://api.flutterwave.com/v3/payments call.
  async initialize(params: InitializeParams): Promise<InitializeResult> {
    return {
      reference: params.reference,
      authorizationUrl: `https://checkout.flutterwave.com/${params.reference}`,
    };
  }

  // Flutterwave sends a static "verif-hash" header to match against a configured secret.
  verifyWebhook(rawBody: string, signature: string | undefined): WebhookResult {
    if (!signature || !this.secretHash || signature !== this.secretHash) return { ok: false };
    const event = JSON.parse(rawBody) as {
      status?: string;
      data?: { tx_ref?: string; status?: string };
    };
    return {
      ok: true,
      reference: event.data?.tx_ref,
      status: event.data?.status === "successful" ? "success" : "failed",
    };
  }
}
