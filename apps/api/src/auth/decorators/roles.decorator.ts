import { SetMetadata } from "@nestjs/common";
import type { Role } from "../../db/schema";

export const ROLES_KEY = "roles";

/** Restrict a route to staff holding one of these roles (PRD Req. 40). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
