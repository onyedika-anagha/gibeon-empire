import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DRIZZLE, type DrizzleDB } from "../db/db.module";
import { settings } from "../db/schema";
import type { PaymentProvider } from "../db/schema";

@Injectable()
export class SettingsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async get<T = unknown>(key: string): Promise<T | undefined> {
    const [row] = await this.db.select().from(settings).where(eq(settings.key, key));
    return row?.value as T | undefined;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.db
      .insert(settings)
      .values({ key, value })
      .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
  }

  // Active payment provider toggle (PRD Req. 29) — admin controls which of the
  // two providers checkout uses; changing it takes effect with no deploy.
  async getActiveProvider(): Promise<PaymentProvider> {
    return (await this.get<PaymentProvider>("activePaymentProvider")) ?? "PAYSTACK";
  }

  async setActiveProvider(provider: PaymentProvider): Promise<void> {
    await this.set("activePaymentProvider", provider);
  }

  // Nigerian VAT, held in basis points so the arithmetic stays in integers
  // (750 bps = 7.5%). Admin-editable; each order snapshots the rate it used.
  async getVatRateBps(): Promise<number> {
    return (await this.get<number>("vatRateBps")) ?? DEFAULT_VAT_BPS;
  }

  async setVatRateBps(bps: number): Promise<void> {
    await this.set("vatRateBps", bps);
  }
}

export const DEFAULT_VAT_BPS = 750;

/** VAT added on top of the taxable amount, rounded to the nearest kobo. */
export function vatOn(taxableAmount: number, rateBps: number): number {
  return Math.round((taxableAmount * rateBps) / 10_000);
}
