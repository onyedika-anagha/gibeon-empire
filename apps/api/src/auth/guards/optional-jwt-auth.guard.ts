import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Populates request.user when a valid bearer token is present, but never
 * rejects when it is absent — lets guest checkout stay open while still
 * attaching the customer to the order when they are logged in (PRD Req. 5, 8).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  // Never throw on a missing/invalid token — that just means "guest".
  handleRequest<T>(err: unknown, user: T): T {
    return (err ? undefined : user) as T;
  }
}
