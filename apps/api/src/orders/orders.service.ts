import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq, gte, inArray, isNull, ne, sql } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { customers, orderEvents, orderItems, orders, orderStateEnum, payments, products, variants } from "../db/schema";
import type { Channel, OrderState } from "../db/schema";
import { AuditService } from "../common/audit/audit.service";
import { InventoryService } from "../inventory/inventory.service";
import { NotificationsService } from "../notifications/notifications.service";
import { SettingsService, vatOn } from "../settings/settings.service";
import { CouponsService } from "../coupons/coupons.service";
import { canTransition } from "./order-state";
import { generateReference } from "../common/reference";
import type { AuthUser } from "../auth/auth.types";
import type { CreateOrderDto } from "./dto/order.dto";

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
    private readonly coupons: CouponsService,
  ) {}

  // ── Create (web or POS) ─────────────────────────────────────────────
  async create(dto: CreateOrderDto, customerId: string | undefined, actor: string) {
    const variantIds = dto.items.map((i) => i.variantId);
    const priced = await this.db
      .select({
        id: variants.id,
        price: variants.price,
        size: variants.size,
        color: variants.color,
        name: products.name,
        productId: products.id,
        category: products.category,
      })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .where(inArray(variants.id, variantIds));
    const byId = new Map(priced.map((p) => [p.id, p]));
    if (byId.size !== new Set(variantIds).size) {
      throw new BadRequestException("One or more variants do not exist");
    }

    const lines = dto.items.map((i) => {
      const v = byId.get(i.variantId)!;
      return {
        variantId: i.variantId,
        nameSnapshot: `${v.name} — ${v.size}/${v.color}`,
        unitPrice: v.price,
        quantity: i.quantity,
      };
    });
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

    // Coupon discount is computed server-side from the code; a manual discount
    // (staff-applied) still adds on top. Total discount can't exceed the subtotal.
    let discountTotal = dto.discountTotal ?? 0;
    let coupon: { couponId: string; discount: number } | null = null;
    if (dto.couponCode) {
      const couponLines = lines.map((l) => {
        const v = byId.get(l.variantId)!;
        return { productId: v.productId, category: v.category, unitPrice: l.unitPrice, quantity: l.quantity };
      });
      const applied = await this.coupons.priceForCart(dto.couponCode, couponLines, subtotal, customerId);
      coupon = { couponId: applied.couponId, discount: applied.discount };
      discountTotal += applied.discount;
    }
    discountTotal = Math.min(discountTotal, subtotal);

    // VAT is charged on the discounted amount and added on top (PRD Req. 9).
    const taxRate = await this.settings.getVatRateBps();
    const taxable = Math.max(0, subtotal - discountTotal);
    const taxTotal = vatOn(taxable, taxRate);
    const total = taxable + taxTotal;

    return this.db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          reference: generateReference(),
          channel: dto.channel as Channel,
          customerId,
          contactEmail: dto.contactEmail,
          subtotal,
          discountTotal,
          taxTotal,
          taxRate,
          total,
        })
        .returning();

      await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));
      await tx.insert(orderEvents).values({ orderId: order.id, toState: "RECEIVED", actor });
      if (coupon) {
        await this.coupons.redeem(tx as unknown as DrizzleDB, coupon.couponId, order.id, customerId, coupon.discount);
      }
      await this.audit.record(
        { actor, action: "order.create", entity: "order", entityId: order.id, data: { channel: dto.channel, total } },
        tx as unknown as DrizzleDB,
      );
      return this.getById(order.id, tx as unknown as DrizzleDB);
    });
  }

  // ── Guarded transition (PRD Req. 18, 19) ────────────────────────────
  private async transition(
    exec: DrizzleDB,
    orderId: string,
    from: OrderState,
    to: OrderState,
    actor: string,
  ) {
    if (!canTransition(from, to)) {
      throw new ConflictException(`Illegal transition ${from} → ${to}`);
    }
    await exec.update(orders).set({ state: to, updatedAt: new Date() }).where(eq(orders.id, orderId));
    await exec.insert(orderEvents).values({ orderId, fromState: from, toState: to, actor });
  }

  /**
   * Payment confirmed → deduct stock → inventory updated, all logged.
   * Idempotent: a re-confirmed order short-circuits. Called by the payment
   * webhook (PRD Req. 4.5).
   */
  async confirmPayment(orderId: string, actor = "system") {
    const order = await this.getById(orderId);
    if (order.state !== "RECEIVED") return order; // already progressed — idempotent

    await this.db.transaction(async (tx) => {
      await tx.update(payments).set({ status: "CONFIRMED" }).where(eq(payments.orderId, orderId));
      await this.transition(tx as unknown as DrizzleDB, orderId, "RECEIVED", "PAYMENT_CONFIRMED", actor);
    });

    // Deduct at checkout time (PRD Req. 24) — each in its own locked transaction.
    for (const item of order.items) {
      await this.inventory.deduct(item.variantId, item.quantity, actor);
    }

    await this.transition(this.db, orderId, "PAYMENT_CONFIRMED", "INVENTORY_UPDATED", actor);

    const email = order.contactEmail ?? (await this.customerEmail(order.customerId));
    if (email) {
      await this.notifications.enqueueOrderConfirmation({
        orderReference: order.reference,
        email,
        items: order.items.map((i) => ({
          nameSnapshot: i.nameSnapshot,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        taxTotal: order.taxTotal,
        taxRate: order.taxRate,
        total: order.total,
      });
    }
    return this.getById(orderId);
  }

  /** Manual fulfilment steps driven by staff (PRD Req. 41). */
  async advance(orderId: string, to: OrderState, actor: string) {
    const order = await this.getById(orderId);
    await this.transition(this.db, orderId, order.state, to, actor);
    await this.audit.record({ actor, action: "order.transition", entity: "order", entityId: orderId, data: { from: order.state, to } });
    return this.getById(orderId);
  }

  // ── Reads ───────────────────────────────────────────────────────────
  async getByReference(reference: string, user: AuthUser) {
    const [order] = await this.db.select().from(orders).where(eq(orders.reference, reference));
    if (!order) throw new NotFoundException("Order not found");
    // Customers may only see their own orders; staff see any (PRD Req. 8).
    if (user.type === "customer" && order.customerId !== user.id) {
      throw new ForbiddenException("Not your order");
    }
    return this.getById(order.id);
  }

  async listAll(state?: string) {
    const valid = state && (orderStateEnum.enumValues as readonly string[]).includes(state);
    const rows = await this.db
      .select()
      .from(orders)
      .where(valid ? eq(orders.state, state as OrderState) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(200);
    return rows;
  }

  async listForCustomer(customerId: string) {
    const rows = await this.db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
    return rows;
  }

  /**
   * Attach past guest orders to a customer once they prove they own the email.
   * Called on register and login: any order placed as a guest (no customerId)
   * whose contact email matches — case-insensitively — is claimed so it shows up
   * in their history. Idempotent: a second call links nothing. Returns the count.
   */
  async linkGuestOrders(customerId: string, email: string): Promise<number> {
    const linked = await this.db
      .update(orders)
      .set({ customerId })
      .where(
        and(
          isNull(orders.customerId),
          eq(sql`lower(${orders.contactEmail})`, email.toLowerCase()),
        ),
      )
      .returning({ id: orders.id });

    if (linked.length > 0) {
      await this.audit.record({
        actor: customerId,
        action: "order.guest_linked",
        entity: "customer",
        entityId: customerId,
        data: { count: linked.length },
      });
    }
    return linked.length;
  }

  /**
   * Revenue/VAT trend for the dashboard and remittance reporting (PRD Req. 41).
   * Unpaid (RECEIVED) orders are excluded — nothing is owed to the taxman until
   * payment actually lands.
   */
  async report(range: "week" | "month" | "year") {
    const now = new Date();
    if (range === "year") {
      const since = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      return this.aggregate("month", since);
    }
    const since = new Date(now);
    since.setDate(since.getDate() - (range === "week" ? 7 : 30));
    return this.aggregate("day", since);
  }

  private async aggregate(granularity: "day" | "month", since: Date) {
    const bucket =
      granularity === "day"
        ? sql`date_trunc('day', ${orders.createdAt})::text`
        : sql`date_trunc('month', ${orders.createdAt})::text`;
    return this.db
      .select({
        period: sql<string>`${bucket}`,
        orderCount: sql<number>`count(*)::int`,
        subtotal: sql<number>`coalesce(sum(${orders.subtotal}), 0)::int`,
        taxTotal: sql<number>`coalesce(sum(${orders.taxTotal}), 0)::int`,
        total: sql<number>`coalesce(sum(${orders.total}), 0)::int`,
      })
      .from(orders)
      .where(and(ne(orders.state, "RECEIVED"), gte(orders.createdAt, since)))
      .groupBy(bucket)
      .orderBy(bucket);
  }

  private async customerEmail(customerId: string | null): Promise<string | undefined> {
    if (!customerId) return undefined;
    const [c] = await this.db.select({ email: customers.email }).from(customers).where(eq(customers.id, customerId));
    return c?.email;
  }

  private async getById(id: string, exec: DrizzleDB = this.db) {
    const [order] = await exec.select().from(orders).where(eq(orders.id, id));
    if (!order) throw new NotFoundException("Order not found");
    const [items, events] = await Promise.all([
      exec.select().from(orderItems).where(eq(orderItems.orderId, id)),
      exec.select().from(orderEvents).where(eq(orderEvents.orderId, id)),
    ]);
    return { ...order, items, events };
  }
}
