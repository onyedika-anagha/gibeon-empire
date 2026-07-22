import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { customers, passwordResets, staff } from "../db/schema";
import { AuditService } from "../common/audit/audit.service";
import type { JwtPayload } from "./auth.types";
import type { LoginDto, RegisterDto, ResetPasswordDto } from "./dto/auth.dto";

const SALT_ROUNDS = 12;
const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  private sign(payload: JwtPayload): { accessToken: string } {
    return { accessToken: this.jwt.sign(payload) };
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  // ── Customer (storefront, PRD Req. 5–7) ─────────────────────────────
  async registerCustomer(dto: RegisterDto) {
    const [existing] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.email, dto.email));
    if (existing) throw new ConflictException("Email already registered");

    const [customer] = await this.db
      .insert(customers)
      .values({
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash: await bcrypt.hash(dto.password, SALT_ROUNDS),
      })
      .returning({ id: customers.id, email: customers.email });

    return this.sign({ sub: customer.id, type: "customer", email: customer.email });
  }

  async loginCustomer(dto: LoginDto) {
    const [customer] = await this.db
      .select({ id: customers.id, email: customers.email, passwordHash: customers.passwordHash })
      .from(customers)
      .where(eq(customers.email, dto.email));
    if (!customer?.passwordHash || !(await bcrypt.compare(dto.password, customer.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.sign({ sub: customer.id, type: "customer", email: customer.email });
  }

  /**
   * Issues a single-use reset token. In prod this token is emailed (queued in
   * task 4.6); until then it is returned so the flow is testable.
   * ponytail: returns the token directly — swap for an email dispatch, never leak it in prod.
   * Always returns 200 whether or not the email exists (no user enumeration).
   */
  async requestPasswordReset(email: string): Promise<{ resetToken?: string }> {
    const [customer] = await this.db
      .select({ id: customers.id })
      .from(customers)
      .where(eq(customers.email, email));
    if (!customer) return {};

    const token = randomBytes(32).toString("hex");
    await this.db.insert(passwordResets).values({
      customerId: customer.id,
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    });
    return { resetToken: token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const [record] = await this.db
      .select()
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.tokenHash, this.hashToken(dto.token)),
          isNull(passwordResets.usedAt),
          gt(passwordResets.expiresAt, new Date()),
        ),
      );
    if (!record) throw new BadRequestException("Invalid or expired reset token");

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    await this.db.transaction(async (tx) => {
      await tx
        .update(customers)
        .set({ passwordHash })
        .where(eq(customers.id, record.customerId));
      await tx
        .update(passwordResets)
        .set({ usedAt: new Date() })
        .where(eq(passwordResets.id, record.id));
      await this.audit.record(
        {
          actor: record.customerId,
          action: "customer.password_reset",
          entity: "customer",
          entityId: record.customerId,
        },
        tx as unknown as DrizzleDB,
      );
    });
    return { ok: true };
  }

  // ── Staff (admin + POS, RBAC — PRD Req. 40) ─────────────────────────
  async loginStaff(dto: LoginDto) {
    const [member] = await this.db.select().from(staff).where(eq(staff.email, dto.email));
    if (!member || !(await bcrypt.compare(dto.password, member.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    return this.sign({
      sub: member.id,
      type: "staff",
      email: member.email,
      role: member.role,
    });
  }
}
