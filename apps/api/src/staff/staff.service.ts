import { ConflictException, Inject, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { staff, type Role } from "../db/schema";
import { AuditService } from "../common/audit/audit.service";

@Injectable()
export class StaffService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.db
      .select({ id: staff.id, email: staff.email, name: staff.name, role: staff.role, createdAt: staff.createdAt })
      .from(staff)
      .orderBy(staff.createdAt);
  }

  async create(dto: { email: string; name: string; password: string; role: Role }, actor: string) {
    const [existing] = await this.db.select({ id: staff.id }).from(staff).where(eq(staff.email, dto.email));
    if (existing) throw new ConflictException("Email already in use");

    const [member] = await this.db
      .insert(staff)
      .values({
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash: await bcrypt.hash(dto.password, 12),
      })
      .returning({ id: staff.id, email: staff.email, name: staff.name, role: staff.role });

    await this.audit.record({ actor, action: "staff.create", entity: "staff", entityId: member.id, data: { role: dto.role } });
    return member;
  }

  /** Clears a member's TOTP so they must re-enrol on next login (admin recovery). */
  async resetTotp(id: string, actor: string) {
    await this.db
      .update(staff)
      .set({ totpSecret: null, totpEnabledAt: null, updatedAt: new Date() })
      .where(eq(staff.id, id));
    await this.audit.record({ actor, action: "staff.totp_reset", entity: "staff", entityId: id });
    return { ok: true };
  }

  async updateRole(id: string, role: Role, actor: string) {
    const [member] = await this.db
      .update(staff)
      .set({ role, updatedAt: new Date() })
      .where(eq(staff.id, id))
      .returning({ id: staff.id, email: staff.email, name: staff.name, role: staff.role });
    await this.audit.record({ actor, action: "staff.update_role", entity: "staff", entityId: id, data: { role } });
    return member;
  }
}
