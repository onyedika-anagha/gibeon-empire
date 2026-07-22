import type { Role } from "../db/schema";

export type SubjectType = "customer" | "staff";

export interface JwtPayload {
  sub: string;
  type: SubjectType;
  email: string;
  role?: Role; // staff only
}

/** Shape attached to `request.user` after JWT validation. */
export interface AuthUser {
  id: string;
  type: SubjectType;
  email: string;
  role?: Role;
}
