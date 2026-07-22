import { randomBytes } from "node:crypto";

/** Human-readable, unique-enough order reference (e.g. GE-MRVULVM4-EDCD). */
export function generateReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  return `GE-${stamp}-${randomBytes(2).toString("hex").toUpperCase()}`;
}
