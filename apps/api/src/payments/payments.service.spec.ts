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
    process.env.PAYSTACK_SECRET = "sk_test_secret";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: true,
        data: { reference: "GE-X", authorization_url: "https://checkout.paystack.com/abc123" },
      }),
    }) as unknown as typeof fetch;

    const res = await service("PAYSTACK").initialize("o1");
    expect(res.provider).toBe("PAYSTACK");
    expect(res.authorizationUrl).toBe("https://checkout.paystack.com/abc123");
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe("https://api.paystack.co/transaction/initialize");
    expect(JSON.parse(init.body)).toMatchObject({ reference: "GE-X", amount: 5000, email: "a@b.com" });
  });

  it("switches provider when the toggle changes (Flutterwave)", async () => {
    process.env.FLUTTERWAVE_SECRET = "FLWSECK_TEST";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "success", data: { link: "https://checkout.flutterwave.com/v3/hosted/pay/abc" } }),
    }) as unknown as typeof fetch;

    const res = await service("FLUTTERWAVE").initialize("o1");
    expect(res.provider).toBe("FLUTTERWAVE");
    expect(res.authorizationUrl).toBe("https://checkout.flutterwave.com/v3/hosted/pay/abc");
    // Flutterwave bills in major units — 5000 kobo is ₦50.
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toMatchObject({
      tx_ref: "GE-X",
      amount: 50,
    });
  });

  it("resolves each adapter by name", () => {
    const svc = service("PAYSTACK");
    expect(svc.getAdapter("PAYSTACK").name).toBe("PAYSTACK");
    expect(svc.getAdapter("FLUTTERWAVE").name).toBe("FLUTTERWAVE");
  });
});

describe("PaymentsService callback status", () => {
  const order = { id: "o1", reference: "GE-X", total: 5000, channel: "ONLINE", state: "RECEIVED" };

  function service(verifyResult: string) {
    process.env.PAYSTACK_SECRET = "sk_test_secret";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: true, data: { status: verifyResult } }),
    }) as unknown as typeof fetch;

    const settings = { getActiveProvider: jest.fn().mockResolvedValue("PAYSTACK") } as unknown as SettingsService;
    const confirmPayment = jest.fn().mockResolvedValue({ ...order, state: "INVENTORY_UPDATED" });
    const orders = { confirmPayment } as unknown as OrdersService;
    const svc = new PaymentsService(dbWithOrder(order), settings, orders, new PaystackAdapter(), new FlutterwaveAdapter());
    return { svc, confirmPayment };
  }

  it("confirms the order when the provider says the transaction succeeded", async () => {
    const { svc, confirmPayment } = service("success");
    const res = await svc.statusByReference("GE-X");
    expect(confirmPayment).toHaveBeenCalledWith("o1");
    expect(res).toMatchObject({ paid: true, state: "INVENTORY_UPDATED" });
  });

  it("does not confirm on an unverified redirect", async () => {
    const { svc, confirmPayment } = service("abandoned");
    const res = await svc.statusByReference("GE-X");
    expect(confirmPayment).not.toHaveBeenCalled();
    expect(res).toMatchObject({ paid: false, status: "pending" });
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
