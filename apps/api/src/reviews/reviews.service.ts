import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { oversellReviews } from "../db/schema";
import { AuditService } from "../common/audit/audit.service";

type Resolution = "BACKORDER" | "SUBSTITUTION" | "REFUND";

@Injectable()
export class ReviewsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly audit: AuditService,
  ) {}

  /** Called by the reconciliation engine (task 7.8) when an offline sale oversold. */
  async flag(
    input: { variantId: string; quantity: number; saleClientId?: string; orderReference?: string },
    tx?: DrizzleDB,
  ) {
    const exec = tx ?? this.db;
    const [row] = await exec.insert(oversellReviews).values(input).returning({ id: oversellReviews.id });
    return row;
  }

  listPending() {
    return this.db.select().from(oversellReviews).where(eq(oversellReviews.status, "PENDING"));
  }

  async resolve(id: string, resolution: Resolution, actor: string, note?: string) {
    const [row] = await this.db
      .update(oversellReviews)
      .set({ status: "RESOLVED", resolution, note, resolvedAt: new Date(), resolvedBy: actor })
      .where(eq(oversellReviews.id, id))
      .returning();
    if (!row) throw new NotFoundException("Review not found");
    await this.audit.record({ actor, action: "oversell.resolve", entity: "oversell_review", entityId: id, data: { resolution } });
    return row;
  }
}
