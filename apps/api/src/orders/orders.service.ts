import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { customers, orderEvents, orderItems, orders, payments, products, variants } from "../db/schema";
import type { Channel, OrderState } from "../db/schema";
import { AuditService } from "../common/audit/audit.service";
import { InventoryService } from "../inventory/inventory.service";
import { NotificationsService } from "../notifications/notifications.service";
import { canTransition } from "./order-state";
import type { AuthUser } from "../auth/auth.types";
import type { CreateOrderDto } from "./dto/order.dto";

function generateReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  return `GE-${stamp}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationsService,
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
    const discountTotal = dto.discountTotal ?? 0;
    const total = Math.max(0, subtotal - discountTotal);

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
          total,
        })
        .returning();

      await tx.insert(orderItems).values(lines.map((l) => ({ ...l, orderId: order.id })));
      await tx.insert(orderEvents).values({ orderId: order.id, toState: "RECEIVED", actor });
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
