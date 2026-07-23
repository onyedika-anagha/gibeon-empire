import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, inArray } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../../db/db.module";
import { auditLogs, staff } from "../../db/schema";

export interface AuditEntry {
  actor: string; // staff id or "system"
  action: string; // e.g. "stock.adjust", "order.transition", "price.update"
  entity: string; // e.g. "inventory", "order"
  entityId: string;
  data?: unknown;
}

export interface AuditQuery {
  entity?: string;
  action?: string;
  actor?: string;
  limit?: number;
}

// Actors are free text: staff/customer ids, "system", or POS labels like
// "cashier-1". Only UUID-shaped actors can be matched against staff.id (a
// uuid column) — anything else would make Postgres throw on the cast.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  /** Most-recent-first audit trail with optional filters, actor email resolved. */
  async list(query: AuditQuery) {
    const conds = [
      query.entity ? eq(auditLogs.entity, query.entity) : undefined,
      query.action ? eq(auditLogs.action, query.action) : undefined,
      query.actor ? eq(auditLogs.actor, query.actor) : undefined,
    ].filter(Boolean);

    const rows = await this.db
      .select()
      .from(auditLogs)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(Math.min(query.limit ?? 100, 500));

    // Resolve staff ids to emails so the log reads for a human.
    const ids = [...new Set(rows.map((r) => r.actor))].filter((a) => UUID_RE.test(a));
    const people = ids.length
      ? await this.db.select({ id: staff.id, email: staff.email }).from(staff).where(inArray(staff.id, ids))
      : [];
    const byId = new Map(people.map((p) => [p.id, p.email]));

    return rows.map((r) => ({ ...r, actorEmail: byId.get(r.actor) ?? null }));
  }
}
