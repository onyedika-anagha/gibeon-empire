import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { customers, passwordResets, staff } from "../db/schema";
import { AuditService } from "../common/audit/audit.service";
import type { JwtPayload, StaffLoginChallenge, TotpChallengePayload } from "./auth.types";
import type { ChangePasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from "./dto/auth.dto";

const SALT_ROUNDS = 12;
const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour
const TOTP_ISSUER = "Gibeon Empire";
const CHALLENGE_TTL = "5m"; // window to complete the second factor

// Tolerate one 30s step of clock drift on the authenticator device.
authenticator.options = { window: 1 };

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

  // ── Staff (admin + POS, RBAC — PRD Req. 40, TOTP enforced) ──────────
  /**
   * Step 1: verify the password. Never returns a session token — every
   * staff account must clear TOTP first. Unenrolled accounts (no
   * totpEnabledAt) are handed a fresh secret + QR to set up authenticator.
   */
  async loginStaff(dto: LoginDto): Promise<StaffLoginChallenge> {
    const [member] = await this.db.select().from(staff).where(eq(staff.email, dto.email));
    if (!member || !(await bcrypt.compare(dto.password, member.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!member.totpEnabledAt) {
      // (Re)issue a pending secret until enrolment is confirmed.
      const secret = authenticator.generateSecret();
      await this.db
        .update(staff)
        .set({ totpSecret: secret, updatedAt: new Date() })
        .where(eq(staff.id, member.id));
      const otpauthUrl = authenticator.keyuri(member.email, TOTP_ISSUER, secret);
      const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
      return {
        status: "TOTP_ENROLL",
        challenge: this.signChallenge(member, "enroll"),
        otpauthUrl,
        qrDataUrl,
      };
    }

    return { status: "TOTP_REQUIRED", challenge: this.signChallenge(member, "verify") };
  }

  /**
   * Step 2: verify the 6-digit code against the (possibly pending) secret.
   * On success, an unenrolled account is activated and a real session token
   * is issued.
   */
  async verifyStaffTotp(dto: { challenge: string; code: string }) {
    let claims: TotpChallengePayload;
    try {
      claims = this.jwt.verify<TotpChallengePayload>(dto.challenge);
    } catch {
      throw new UnauthorizedException("Challenge expired — sign in again");
    }
    if (!claims.purpose) throw new UnauthorizedException("Invalid challenge");

    const [member] = await this.db.select().from(staff).where(eq(staff.id, claims.sub));
    if (!member?.totpSecret || !authenticator.check(dto.code, member.totpSecret)) {
      throw new UnauthorizedException("Invalid code");
    }

    if (claims.purpose === "enroll") {
      await this.db
        .update(staff)
        .set({ totpEnabledAt: new Date(), updatedAt: new Date() })
        .where(eq(staff.id, member.id));
      await this.audit.record({ actor: member.id, action: "staff.totp_enrolled", entity: "staff", entityId: member.id });
    }

    return this.sign({ sub: member.id, type: "staff", email: member.email, role: member.role });
  }

  /**
   * Staff changes their own password. Verifies the current one, rejects a
   * no-op change, then rehashes. Recorded to the audit trail (never the value).
   */
  async changeStaffPassword(userId: string, dto: ChangePasswordDto) {
    const [member] = await this.db.select().from(staff).where(eq(staff.id, userId));
    if (!member) throw new UnauthorizedException("Account not found");
    if (!(await bcrypt.compare(dto.currentPassword, member.passwordHash))) {
      throw new BadRequestException("Current password is incorrect");
    }
    if (await bcrypt.compare(dto.newPassword, member.passwordHash)) {
      throw new BadRequestException("New password must be different from the current one");
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.db.update(staff).set({ passwordHash, updatedAt: new Date() }).where(eq(staff.id, userId));
    await this.audit.record({
      actor: userId,
      action: "staff.password_change",
      entity: "staff",
      entityId: userId,
    });
    return { ok: true };
  }

  private signChallenge(
    member: { id: string; email: string; role: TotpChallengePayload["role"] },
    purpose: TotpChallengePayload["purpose"],
  ): string {
    const payload: TotpChallengePayload = { sub: member.id, email: member.email, role: member.role, purpose };
    return this.jwt.sign(payload, { expiresIn: CHALLENGE_TTL });
  }
}
