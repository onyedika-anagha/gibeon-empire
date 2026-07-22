import { createHmac } from "node:crypto";
import { PaymentsService } from "./payments.service";
import { PaystackAdapter } from "./paystack.adapter";
import { FlutterwaveAdapter } from "./flutterwave.adapter";
import { SettingsService } from "../settings/settings.service";
import { OrdersService } from "../orders/orders.service";
import type { DrizzleDB } from "../db/db.module";

function dbWithOrder(order: unknown) {
  return {
    select: () => ({ from: () => ({ where: () => Promise.resolve([order]) }) }),
    insert: () => ({ values: () => ({ onConflictDoUpdate: () => Promise.resolve() }) }),
  } as unknown as DrizzleDB;
}

describe("PaymentsService provider selection", () => {
  const order = { id: "o1", reference: "GE-X", total: 5000, channel: "ONLINE", contactEmail: "a@b.com" };
  const ordersService = {} as OrdersService;

  function service(active: "PAYSTACK" | "FLUTTERWAVE") {
    const settings = { getActiveProvider: jest.fn().mockResolvedValue(active) } as unknown as SettingsService;
    return new PaymentsService(dbWithOrder(order), settings, ordersService, new PaystackAdapter(), new FlutterwaveAdapter());
  }

  it("initializes with the admin-selected provider (Paystack)", async () => {
    const res = await service("PAYSTACK").initialize("o1");
    expect(res.provider).toBe("PAYSTACK");
    expect(res.authorizationUrl).toContain("paystack");
  });

  it("switches provider when the toggle changes (Flutterwave)", async () => {
    const res = await service("FLUTTERWAVE").initialize("o1");
    expect(res.provider).toBe("FLUTTERWAVE");
    expect(res.authorizationUrl).toContain("flutterwave");
  });

  it("resolves each adapter by name", () => {
    const svc = service("PAYSTACK");
    expect(svc.getAdapter("PAYSTACK").name).toBe("PAYSTACK");
    expect(svc.getAdapter("FLUTTERWAVE").name).toBe("FLUTTERWAVE");
  });
});

describe("PaystackAdapter webhook verification", () => {
  const secret = "sk_test_secret";
  beforeAll(() => {
    process.env.PAYSTACK_SECRET = secret;
  });

  it("accepts a correctly-signed charge.success and extracts the reference", () => {
    const adapter = new PaystackAdapter();
    const body = JSON.stringify({ event: "charge.success", data: { reference: "GE-X" } });
    const sig = createHmac("sha512", secret).update(body).digest("hex");
    expect(adapter.verifyWebhook(body, sig)).toEqual({ ok: true, reference: "GE-X", status: "success" });
  });

  it("rejects a bad signature", () => {
    const adapter = new PaystackAdapter();
    const body = JSON.stringify({ event: "charge.success", data: { reference: "GE-X" } });
    expect(adapter.verifyWebhook(body, "deadbeef").ok).toBe(false);
  });
});
