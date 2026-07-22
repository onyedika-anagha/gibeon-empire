import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { authenticator } from "otplib";
import { AuthService } from "./auth.service";
import type { DrizzleDB } from "../db/db.module";
import { AuditService } from "../common/audit/audit.service";

jest.mock("bcrypt");

/** Minimal Drizzle stub: `select().from().where()` resolves to `selectRows`. */
function makeDb(selectRows: unknown[]) {
  const insert = jest.fn(() => ({
    values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }),
  }));
  const update = jest.fn(() => ({
    set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
  }));
  const db = {
    select: jest.fn(() => ({
      from: () => ({ where: jest.fn().mockResolvedValue(selectRows) }),
    })),
    insert,
    update,
  };
  return { db, insert, update };
}

describe("AuthService", () => {
  const jwt = {
    sign: jest.fn().mockReturnValue("signed.jwt.token"),
    verify: jest.fn(),
  } as unknown as JwtService;
  const audit = { record: jest.fn() } as unknown as AuditService;

  beforeEach(() => jest.clearAllMocks());

  describe("loginCustomer", () => {
    it("returns an access token on valid credentials", async () => {
      const { db } = makeDb([{ id: "c1", email: "a@b.com", passwordHash: "hash" }]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);

      await expect(service.loginCustomer({ email: "a@b.com", password: "pw" })).resolves.toEqual({
        accessToken: "signed.jwt.token",
      });
    });

    it("rejects a wrong password", async () => {
      const { db } = makeDb([{ id: "c1", email: "a@b.com", passwordHash: "hash" }]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);

      await expect(
        service.loginCustomer({ email: "a@b.com", password: "bad" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("rejects an unknown email", async () => {
      const { db } = makeDb([]);
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);
      await expect(
        service.loginCustomer({ email: "x@y.com", password: "pw" }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("loginStaff (TOTP enforced)", () => {
    it("issues an enrolment challenge + QR when TOTP is not yet set up", async () => {
      const { db, update } = makeDb([
        { id: "s1", email: "staff@x.com", passwordHash: "hash", role: "ADMIN", totpEnabledAt: null },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);

      const res = await service.loginStaff({ email: "staff@x.com", password: "pw" });
      expect(res.status).toBe("TOTP_ENROLL");
      expect(res).toMatchObject({ qrDataUrl: expect.stringContaining("data:image/png"), challenge: "signed.jwt.token" });
      expect(update).toHaveBeenCalled(); // pending secret persisted
    });

    it("asks only for a code when TOTP is already enrolled", async () => {
      const { db } = makeDb([
        { id: "s1", email: "staff@x.com", passwordHash: "hash", role: "CASHIER", totpEnabledAt: new Date() },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);

      await expect(service.loginStaff({ email: "staff@x.com", password: "pw" })).resolves.toEqual({
        status: "TOTP_REQUIRED",
        challenge: "signed.jwt.token",
      });
    });

    it("never leaks a session token from the password step", async () => {
      const { db } = makeDb([
        { id: "s1", email: "staff@x.com", passwordHash: "hash", role: "ADMIN", totpEnabledAt: new Date() },
      ]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);
      const res = await service.loginStaff({ email: "staff@x.com", password: "pw" });
      expect(res).not.toHaveProperty("accessToken");
    });
  });

  describe("verifyStaffTotp", () => {
    it("returns a session token for a valid code from the secret", async () => {
      const secret = authenticator.generateSecret();
      const code = authenticator.generate(secret);
      const { db } = makeDb([{ id: "s1", email: "staff@x.com", role: "ADMIN", totpSecret: secret, totpEnabledAt: new Date() }]);
      (jwt.verify as jest.Mock).mockReturnValue({ sub: "s1", purpose: "verify" });
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);

      await expect(service.verifyStaffTotp({ challenge: "c", code })).resolves.toEqual({ accessToken: "signed.jwt.token" });
    });

    it("rejects a wrong code", async () => {
      const secret = authenticator.generateSecret();
      const { db } = makeDb([{ id: "s1", email: "staff@x.com", role: "ADMIN", totpSecret: secret, totpEnabledAt: new Date() }]);
      (jwt.verify as jest.Mock).mockReturnValue({ sub: "s1", purpose: "verify" });
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);
      await expect(service.verifyStaffTotp({ challenge: "c", code: "000000" })).rejects.toThrow(UnauthorizedException);
    });

    it("rejects an expired/invalid challenge", async () => {
      const { db } = makeDb([]);
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("jwt expired");
      });
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);
      await expect(service.verifyStaffTotp({ challenge: "bad", code: "123456" })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("requestPasswordReset", () => {
    it("does not reveal whether an email exists (no insert, empty result)", async () => {
      const { db, insert } = makeDb([]);
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);
      await expect(service.requestPasswordReset("nobody@x.com")).resolves.toEqual({});
      expect(insert).not.toHaveBeenCalled();
    });

    it("creates a reset token for a known customer", async () => {
      const { db, insert } = makeDb([{ id: "c1" }]);
      const service = new AuthService(db as unknown as DrizzleDB, jwt, audit);
      const res = await service.requestPasswordReset("a@b.com");
      expect(res.resetToken).toEqual(expect.any(String));
      expect(insert).toHaveBeenCalledTimes(1);
    });
  });
});
