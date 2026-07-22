import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import type { DrizzleDB } from "../db/db.module";
import { AuditService } from "../common/audit/audit.service";

jest.mock("bcrypt");

/** Minimal Drizzle stub: `select().from().where()` resolves to `selectRows`. */
function makeDb(selectRows: unknown[]) {
  const insert = jest.fn(() => ({
    values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }),
  }));
  const db = {
    select: jest.fn(() => ({
      from: () => ({ where: jest.fn().mockResolvedValue(selectRows) }),
    })),
    insert,
  };
  return { db, insert };
}

describe("AuthService", () => {
  const jwt = { sign: jest.fn().mockReturnValue("signed.jwt.token") } as unknown as JwtService;
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
