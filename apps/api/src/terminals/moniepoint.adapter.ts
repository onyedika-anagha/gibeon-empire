import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type {
  TerminalProviderAdapter,
  TerminalPushParams,
  TerminalPushResult,
  TerminalStatus,
  TerminalStatusResult,
} from "./terminal-provider.interface";

// Moniepoint ERP "Push Payment Request" API.
// Enable ERP Integration in the dashboard (POS Terminal Configuration), create a
// client for the ID/secret, and note each terminal serial. Terminal app must be v1.7.2+.
// Docs: https://teamapt.atlassian.net/wiki/spaces/EI (base host: channel.moniepoint.com)
@Injectable()
export class MoniepointAdapter implements TerminalProviderAdapter {
  readonly name = "MONIEPOINT";
  private readonly baseUrl = process.env.MONIEPOINT_BASE_URL ?? "https://channel.moniepoint.com";
  private readonly clientId = process.env.MONIEPOINT_CLIENT_ID ?? "";
  private readonly clientSecret = process.env.MONIEPOINT_CLIENT_SECRET ?? "";
  private token: { value: string; expiresAt: number } | null = null;

  private async authHeader(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt - 60_000 > now) return `Bearer ${this.token.value}`;
    if (!this.clientId || !this.clientSecret) {
      throw new ServiceUnavailableException("Moniepoint client credentials are not configured");
    }

    const res = await fetch(`${this.baseUrl}/v1/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: this.clientId, clientSecret: this.clientSecret }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      accessToken?: string;
      access_token?: string;
      expiresIn?: number;
      expires_in?: number;
    };
    const value = body.accessToken ?? body.access_token;
    if (!res.ok || !value) throw new ServiceUnavailableException("Moniepoint authentication failed");

    // ponytail: default 5-min TTL when the provider omits one; verify the real field/value on sandbox.
    const ttlSec = body.expiresIn ?? body.expires_in ?? 300;
    this.token = { value, expiresAt: now + ttlSec * 1000 };
    return `Bearer ${value}`;
  }

  async push(params: TerminalPushParams): Promise<TerminalPushResult> {
    const res = await fetch(`${this.baseUrl}/v1/transactions`, {
      method: "POST",
      headers: { Authorization: await this.authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({
        terminalSerial: params.terminalSerial,
        // Moniepoint charges in whole naira; the rest of the system is in kobo. Convert at
        // the boundary — a kobo value here trips "Transaction amount limit exceeded" (the
        // terminal can't tender kobo anyway, so rounding to the nearest naira is correct).
        amount: Math.round(params.amount / 100),
        merchantReference: params.reference,
        transactionType: "PURCHASE",
        paymentMethod: params.paymentMethod ?? "ANY",
      }),
    });

    if (res.status === 401) {
      this.token = null; // force re-auth next call
      throw new ServiceUnavailableException("Moniepoint rejected the access token");
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new ServiceUnavailableException(body.message ?? `Moniepoint push failed (${res.status})`);
    }
    return { reference: params.reference, accepted: true };
  }

  async status(reference: string): Promise<TerminalStatusResult> {
    const res = await fetch(
      `${this.baseUrl}/v1/transactions/merchants/${encodeURIComponent(reference)}`,
      { headers: { Authorization: await this.authHeader() } },
    );
    // A not-yet-visible transaction reads as still pending rather than an error.
    if (!res.ok) return { reference, status: "pending" };

    const body = (await res.json().catch(() => ({}))) as {
      status?: string;
      amountPaid?: number;
      paymentMethod?: string;
    };
    return {
      reference,
      status: mapStatus(body.status),
      // Moniepoint reports naira; hand it back in kobo like everything else.
      amountPaid: body.amountPaid != null ? body.amountPaid * 100 : undefined,
      paymentMethod: body.paymentMethod,
    };
  }
}

/** Moniepoint returns PENDING | PROCESSED | CANCELLED. Anything unknown stays pending. */
export function mapStatus(raw: string | undefined): TerminalStatus {
  switch (raw) {
    case "PROCESSED":
      return "processed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}
