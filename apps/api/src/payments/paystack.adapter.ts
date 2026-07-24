import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { createHmac, timingSafeEqual } from "node:crypto";
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
export class PaystackAdapter implements PaymentProviderAdapter {
  readonly name: PaymentProvider = "PAYSTACK";
  private readonly secret = process.env.PAYSTACK_SECRET ?? "";

  async initialize(params: InitializeParams): Promise<InitializeResult> {
    if (!this.secret) throw new ServiceUnavailableException("PAYSTACK_SECRET is not configured");

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: params.reference,
        amount: params.amount, // already minor units (kobo)
        email: params.email,
        callback_url: checkoutCallbackUrl(),
      }),
    });

    const body = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { reference: string; authorization_url: string };
    };
    if (!res.ok || !body.status || !body.data) {
      throw new ServiceUnavailableException(body.message ?? "Paystack initialization failed");
    }

    return {
      reference: body.data.reference,
      authorizationUrl: body.data.authorization_url,
    };
  }

  async verify(reference: string): Promise<PaymentStatus> {
    if (!this.secret) return "pending";
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${this.secret}` } },
    );
    const body = (await res.json()) as { status?: boolean; data?: { status?: string } };
    if (!res.ok || !body.status) return "pending";
    if (body.data?.status === "success") return "success";
    // abandoned/ongoing transactions can still be completed — only a hard fail is final.
    return body.data?.status === "failed" ? "failed" : "pending";
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
