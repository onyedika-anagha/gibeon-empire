import { Injectable } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  InitializeParams,
  InitializeResult,
  PaymentProviderAdapter,
  WebhookResult,
} from "./payment-provider.interface";
import type { PaymentProvider } from "../db/schema";

@Injectable()
export class PaystackAdapter implements PaymentProviderAdapter {
  readonly name: PaymentProvider = "PAYSTACK";
  private readonly secret = process.env.PAYSTACK_SECRET ?? "";

  // ponytail: returns a hosted-checkout stub. With PAYSTACK_SECRET set, swap for
  // a real POST https://api.paystack.co/transaction/initialize call.
  async initialize(params: InitializeParams): Promise<InitializeResult> {
    return {
      reference: params.reference,
      authorizationUrl: `https://checkout.paystack.com/${params.reference}`,
    };
  }

  // Paystack signs the raw body with HMAC-SHA512 of the secret key.
  verifyWebhook(rawBody: string, signature: string | undefined): WebhookResult {
    if (!signature || !this.secret) return { ok: false };
    const expected = createHmac("sha512", this.secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false };

    const event = JSON.parse(rawBody) as {
      event: string;
      data?: { reference?: string };
    };
    return {
      ok: true,
      reference: event.data?.reference,
      status: event.event === "charge.success" ? "success" : "failed",
    };
  }
}
