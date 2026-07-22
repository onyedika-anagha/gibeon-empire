import { randomBytes } from "node:crypto";

/** URL-safe slug from a human-readable field. Never user-supplied (slug-rule). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Short random suffix to guarantee slug uniqueness; regenerated on collision. */
export function shortSuffix(bytes = 3): string {
  return randomBytes(bytes).toString("hex");
}

/** Backend-generated SKU/code (slug-rule: never user-editable). */
export function generateSku(prefix = "GE"): string {
  return `${prefix}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/** True when a Postgres error is a unique-constraint violation. */
export function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}
