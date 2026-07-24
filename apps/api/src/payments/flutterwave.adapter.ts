import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type {
  InitializeParams,
  InitializeResult,
  PaymentProviderAdapter,
  PaymentStatus,
  WebhookResult,
} from "./payment-provider.interface";
import { checkoutCallbackUrl } from "./callback";
import type { PaymentProvider } from "../db/schema";

@Injectable()
export class FlutterwaveAdapter implements PaymentProviderAdapter {
  readonly name: PaymentProvider = "FLUTTERWAVE";
  private readonly secret = process.env.FLUTTERWAVE_SECRET ?? "";
  private readonly secretHash = process.env.FLUTTERWAVE_SECRET_HASH ?? "";
  private readonly currency = process.env.FLUTTERWAVE_CURRENCY ?? "NGN";

  async initialize(params: InitializeParams): Promise<InitializeResult> {
    if (!this.secret) throw new ServiceUnavailableException("FLUTTERWAVE_SECRET is not configured");

    const res = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: params.reference,
        amount: params.amount / 100, // Flutterwave bills in major units, unlike Paystack
        currency: this.currency,
        redirect_url: checkoutCallbackUrl(),
        customer: { email: params.email },
      }),
    });

    const body = (await res.json()) as {
      status?: string;
      message?: string;
      data?: { link?: string };
    };
    if (!res.ok || body.status !== "success" || !body.data?.link) {
      throw new ServiceUnavailableException(body.message ?? "Flutterwave initialization failed");
    }

    return { reference: params.reference, authorizationUrl: body.data.link };
  }

  async verify(reference: string): Promise<PaymentStatus> {
    if (!this.secret) return "pending";
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${this.secret}` } },
    );
    const body = (await res.json()) as { status?: string; data?: { status?: string } };
    if (!res.ok || body.status !== "success") return "pending";
    if (body.data?.status === "successful") return "success";
    return body.data?.status === "failed" ? "failed" : "pending";
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
