import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "../../db/schema";
import { ROLES_KEY } from "../decorators/roles.decorator";
import type { AuthUser } from "../auth.types";

/** Enforces @Roles() — staff only, and only the listed roles (PRD Req. 40). */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const user = context.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || user.type !== "staff" || !user.role) {
      throw new ForbiddenException("Staff access required");
    }
    if (!required.includes(user.role)) {
      throw new ForbiddenException("Insufficient role");
    }
    return true;
  }
}
