import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { orders, payments } from "../db/schema";
import type { PaymentProvider } from "../db/schema";
import { SettingsService } from "../settings/settings.service";
import { OrdersService } from "../orders/orders.service";
import { PaystackAdapter } from "./paystack.adapter";
import { FlutterwaveAdapter } from "./flutterwave.adapter";
import type { PaymentProviderAdapter } from "./payment-provider.interface";

@Injectable()
export class PaymentsService {
  private readonly adapters: Record<PaymentProvider, PaymentProviderAdapter>;

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly settings: SettingsService,
    private readonly ordersService: OrdersService,
    paystack: PaystackAdapter,
    flutterwave: FlutterwaveAdapter,
  ) {
    this.adapters = { PAYSTACK: paystack, FLUTTERWAVE: flutterwave };
  }

  getAdapter(provider: PaymentProvider): PaymentProviderAdapter {
    return this.adapters[provider];
  }

  /** Start a hosted checkout using whichever provider admin has activated (PRD Req. 9, 29). */
  async initialize(orderId: string) {
    const [order] = await this.db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) throw new NotFoundException("Order not found");

    const provider = await this.settings.getActiveProvider();
    const adapter = this.getAdapter(provider);
    const result = await adapter.initialize({
      reference: order.reference,
      amount: order.total,
      email: order.contactEmail ?? "guest@gibeonempire.com",
    });

    await this.db
      .insert(payments)
      .values({
        orderId: order.id,
        provider,
        method: "CARD",
        channel: order.channel,
        amount: order.total,
        status: "PENDING",
        reference: result.reference,
      })
      .onConflictDoUpdate({
        target: payments.orderId,
        set: { provider, amount: order.total, reference: result.reference, status: "PENDING" },
      });

    return { provider, reference: result.reference, authorizationUrl: result.authorizationUrl };
  }

  /** Provider webhook → verify signature → confirm the order (PRD Req. 4.5). */
  async handleWebhook(providerName: PaymentProvider, rawBody: string, signature?: string) {
    const result = this.getAdapter(providerName).verifyWebhook(rawBody, signature);
    if (!result.ok || result.status !== "success" || !result.reference) {
      return { received: true, processed: false };
    }
    const order = await this.orderByReference(result.reference);
    if (order) await this.ordersService.confirmPayment(order.id);
    return { received: true, processed: !!order };
  }

  /**
   * Called when the shopper is redirected back from hosted checkout. The redirect proves
   * nothing, so ask the provider directly and confirm the order if it really paid — the
   * webhook may not have landed yet (and never does on localhost).
   */
  async statusByReference(reference: string) {
    const order = await this.orderByReference(reference);
    if (!order) throw new NotFoundException("Order not found");
    if (order.state !== "RECEIVED") {
      return { reference, state: order.state, paid: true };
    }

    const provider = await this.settings.getActiveProvider();
    const status = await this.getAdapter(provider).verify(reference);
    if (status !== "success") return { reference, state: order.state, paid: false, status };

    const confirmed = await this.ordersService.confirmPayment(order.id);
    return { reference, state: confirmed.state, paid: true };
  }

  /** Dev/testing helper to simulate a successful provider callback (guarded). */
  async simulateSuccess(reference: string) {
    const order = await this.orderByReference(reference);
    if (!order) throw new NotFoundException("Order not found");
    return this.ordersService.confirmPayment(order.id);
  }

  private async orderByReference(reference: string) {
    const [order] = await this.db.select().from(orders).where(eq(orders.reference, reference));
    return order;
  }
}
