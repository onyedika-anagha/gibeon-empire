import type { Role } from "../db/schema";

export type SubjectType = "customer" | "staff";

export interface JwtPayload {
  sub: string;
  type: SubjectType;
  email: string;
  role?: Role; // staff only
}

/**
 * Short-lived token issued between password check and TOTP verification.
 * The `purpose` claim marks it as NOT a session token — the JWT strategy
 * rejects any token carrying it, so it can never be used as a bearer.
 */
export interface TotpChallengePayload {
  sub: string;
  email: string;
  role: Role;
  purpose: "enroll" | "verify";
}

/** Result of staff password login — never a session token, always a TOTP challenge. */
export type StaffLoginChallenge =
  | { status: "TOTP_ENROLL"; challenge: string; otpauthUrl: string; qrDataUrl: string }
  | { status: "TOTP_REQUIRED"; challenge: string };

/** Shape attached to `request.user` after JWT validation. */
export interface AuthUser {
  id: string;
  type: SubjectType;
  email: string;
  role?: Role;
}
