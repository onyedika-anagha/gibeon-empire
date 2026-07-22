import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthUser, JwtPayload } from "./auth.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? "change-me-in-production",
    });
  }

  // The token is signed and short-lived (JWT_EXPIRES_IN), so we trust its
  // claims rather than hitting the DB on every request. Expiry is the
  // automatic-logout mechanism (PRD NFR: session management).
  validate(payload: JwtPayload): AuthUser {
    return {
      id: payload.sub,
      type: payload.type,
      email: payload.email,
      role: payload.role,
    };
  }
}
