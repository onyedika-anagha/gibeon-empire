import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "../../db/schema";
import { RolesGuard } from "./roles.guard";
import type { AuthUser } from "../auth.types";

function contextWith(user: AuthUser | undefined): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  function requireRoles(...roles: Role[]) {
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(roles.length ? roles : undefined);
  }

  it("allows routes with no @Roles() requirement", () => {
    requireRoles();
    expect(guard.canActivate(contextWith(undefined))).toBe(true);
  });

  it("allows staff holding a required role", () => {
    requireRoles("ADMIN");
    const user: AuthUser = { id: "s1", type: "staff", email: "a@b.com", role: "ADMIN" };
    expect(guard.canActivate(contextWith(user))).toBe(true);
  });

  it("blocks staff without a required role", () => {
    requireRoles("ADMIN");
    const user: AuthUser = { id: "s1", type: "staff", email: "a@b.com", role: "CASHIER" };
    expect(() => guard.canActivate(contextWith(user))).toThrow(ForbiddenException);
  });

  it("blocks customers from staff-only routes", () => {
    requireRoles("STORE_MANAGER");
    const user: AuthUser = { id: "c1", type: "customer", email: "c@b.com" };
    expect(() => guard.canActivate(contextWith(user))).toThrow(ForbiddenException);
  });
});
