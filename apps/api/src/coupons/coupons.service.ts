import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, eq, inArray, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { coupons, couponRedemptions, products, variants } from "../db/schema";
import { priceCoupon, type CartLine } from "./coupon-pricing";
import type { CreateCouponDto, UpdateCouponDto } from "./dto/coupons.dto";

@Injectable()
export class CouponsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  private normalize(code: string): string {
    return code.trim().toUpperCase();
  }

  // ── Admin CRUD ──────────────────────────────────────────────────────
  async create(dto: CreateCouponDto) {
    const code = dto.code ? this.normalize(dto.code) : await this.generateCode();
    const [existing] = await this.db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code));
    if (existing) throw new ConflictException("Coupon code already exists");

    const [row] = await this.db
      .insert(coupons)
      .values({
        code,
        type: dto.type,
        value: dto.value,
        scope: dto.scope ?? "ORDER",
        scopeValues: dto.scopeValues ?? [],
        minSubtotal: dto.minSubtotal ?? 0,
        maxDiscount: dto.maxDiscount ?? null,
        usageLimit: dto.usageLimit ?? null,
        perCustomerLimit: dto.perCustomerLimit ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      })
      .returning();
    return row;
  }

  list() {
    return this.db.select().from(coupons).orderBy(sql`${coupons.createdAt} desc`);
  }

  async update(id: string, dto: UpdateCouponDto) {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    for (const k of ["type", "value", "scope", "scopeValues", "minSubtotal", "maxDiscount", "usageLimit", "perCustomerLimit", "active"] as const) {
      if (dto[k] !== undefined) patch[k] = dto[k];
    }
    if (dto.startsAt !== undefined) patch.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) patch.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;

    const [row] = await this.db.update(coupons).set(patch).where(eq(coupons.id, id)).returning();
    if (!row) throw new NotFoundException("Coupon not found");
    return row;
  }

  // Codes are auto-generated on collision rather than asking anyone to resolve it.
  private async generateCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = `GB-${randomBytes(4).toString("hex").toUpperCase()}`;
      const [clash] = await this.db.select({ id: coupons.id }).from(coupons).where(eq(coupons.code, code));
      if (!clash) return code;
    }
    throw new ConflictException("Could not generate a unique coupon code");
  }

  // ── Validation & pricing ────────────────────────────────────────────
  /**
   * Validate a code against a cart and return the applicable discount. Throws
   * BadRequest with a customer-safe reason when the code can't be used. Used by
   * the public preview endpoint AND by order creation (with customerId set).
   */
  async priceForCart(
    rawCode: string,
    lines: CartLine[],
    subtotal: number,
    customerId?: string,
  ): Promise<{ couponId: string; code: string; discount: number }> {
    const code = this.normalize(rawCode);
    const [coupon] = await this.db.select().from(coupons).where(eq(coupons.code, code));
    if (!coupon || !coupon.active) throw new BadRequestException("Invalid coupon code");

    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) throw new BadRequestException("This code isn't active yet");
    if (coupon.endsAt && now > coupon.endsAt) throw new BadRequestException("This code has expired");
    if (coupon.usageLimit != null && coupon.timesRedeemed >= coupon.usageLimit) {
      throw new BadRequestException("This code has reached its usage limit");
    }
    if (customerId && coupon.perCustomerLimit != null) {
      const [{ used }] = await this.db
        .select({ used: sql<number>`count(*)::int` })
        .from(couponRedemptions)
        .where(and(eq(couponRedemptions.couponId, coupon.id), eq(couponRedemptions.customerId, customerId)));
      if (used >= coupon.perCustomerLimit) throw new BadRequestException("You've already used this code");
    }

    const priced = priceCoupon(coupon, lines, subtotal);
    if ("error" in priced) throw new BadRequestException(priced.error);
    return { couponId: coupon.id, code: coupon.code, discount: priced.discount };
  }

  /** Resolve a cart of variant ids to priced lines, then validate the code against it. */
  async previewForCart(
    code: string,
    items: { variantId: string; quantity: number }[],
    customerId?: string,
  ): Promise<{ code: string; discount: number; subtotal: number }> {
    const ids = items.map((i) => i.variantId);
    const rows = await this.db
      .select({ id: variants.id, price: variants.price, productId: products.id, category: products.category })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .where(inArray(variants.id, ids));
    const byId = new Map(rows.map((r) => [r.id, r]));

    const lines: CartLine[] = items.map((i) => {
      const v = byId.get(i.variantId);
      if (!v) throw new BadRequestException("One or more items no longer exist");
      return { productId: v.productId, category: v.category, unitPrice: v.price, quantity: i.quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const { code: matched, discount } = await this.priceForCart(code, lines, subtotal, customerId);
    return { code: matched, discount, subtotal };
  }

  /**
   * Record a redemption inside the order transaction. The conditional increment
   * is the race guard: if the usage limit was hit between pricing and commit,
   * no row updates and we reject rather than over-redeem.
   */
  async redeem(
    tx: DrizzleDB,
    couponId: string,
    orderId: string,
    customerId: string | undefined,
    discount: number,
  ): Promise<void> {
    const bumped = await tx
      .update(coupons)
      .set({ timesRedeemed: sql`${coupons.timesRedeemed} + 1` })
      .where(
        and(
          eq(coupons.id, couponId),
          sql`(${coupons.usageLimit} is null or ${coupons.timesRedeemed} < ${coupons.usageLimit})`,
        ),
      )
      .returning({ id: coupons.id });
    if (bumped.length === 0) throw new BadRequestException("This code has reached its usage limit");

    await tx.insert(couponRedemptions).values({ couponId, orderId, customerId, discount });
  }
}
