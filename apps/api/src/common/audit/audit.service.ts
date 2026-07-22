import { Inject, Injectable } from "@nestjs/common";
import { DRIZZLE, type DrizzleDB } from "../../db/db.module";
import { auditLogs } from "../../db/schema";

export interface AuditEntry {
  actor: string; // staff id or "system"
  action: string; // e.g. "stock.adjust", "order.transition", "price.update"
  entity: string; // e.g. "inventory", "order"
  entityId: string;
  data?: unknown;
}

/**
 * Central audit trail (PRD Req. 19, NFR). Every inventory change, price update,
 * and order modification records actor + timestamp here. Accepts an optional
 * executor (a transaction) so the log commits atomically with its change.
 */
@Injectable()
export class AuditService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async record(entry: AuditEntry, tx?: DrizzleDB): Promise<void> {
    const exec = tx ?? this.db;
    await exec.insert(auditLogs).values({
      actor: entry.actor,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      data: entry.data ?? null,
    });
  }
}
