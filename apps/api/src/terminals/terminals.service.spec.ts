import { BadRequestException } from "@nestjs/common";
import { TerminalsService } from "./terminals.service";
import { MoniepointAdapter, mapStatus } from "./moniepoint.adapter";
import type { TerminalPushParams } from "./terminal-provider.interface";

function serviceWithAdapter() {
  const pushed: TerminalPushParams[] = [];
  const adapter = {
    name: "MONIEPOINT",
    push: (p: TerminalPushParams) => {
      pushed.push(p);
      return Promise.resolve({ reference: p.reference, accepted: true });
    },
    status: (reference: string) => Promise.resolve({ reference, status: "pending" as const }),
  };
  return { service: new TerminalsService(adapter as unknown as MoniepointAdapter), pushed };
}

describe("TerminalsService.push serial resolution", () => {
  const original = process.env.MONIEPOINT_TERMINAL_SERIAL;
  afterEach(() => {
    process.env.MONIEPOINT_TERMINAL_SERIAL = original;
  });

  it("uses the request serial when provided", async () => {
    process.env.MONIEPOINT_TERMINAL_SERIAL = "DEFAULT-1";
    const { service, pushed } = serviceWithAdapter();
    await service.push({ reference: "r1", amount: 5000, terminalSerial: "REQ-9" });
    expect(pushed[0].terminalSerial).toBe("REQ-9");
  });

  it("falls back to the configured default serial", async () => {
    process.env.MONIEPOINT_TERMINAL_SERIAL = "DEFAULT-1";
    const { service, pushed } = serviceWithAdapter();
    await service.push({ reference: "r2", amount: 5000 });
    expect(pushed[0].terminalSerial).toBe("DEFAULT-1");
  });

  it("rejects when neither request nor config supplies a serial", async () => {
    process.env.MONIEPOINT_TERMINAL_SERIAL = "";
    const { service } = serviceWithAdapter();
    await expect(service.push({ reference: "r3", amount: 5000 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});

describe("mapStatus", () => {
  it("normalises Moniepoint statuses", () => {
    expect(mapStatus("PROCESSED")).toBe("processed");
    expect(mapStatus("CANCELLED")).toBe("cancelled");
    expect(mapStatus("PENDING")).toBe("pending");
    expect(mapStatus(undefined)).toBe("pending");
  });
});

describe("MoniepointAdapter amount unit", () => {
  const jsonOk = (body: unknown) =>
    ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as Response;

  beforeAll(() => {
    process.env.MONIEPOINT_CLIENT_ID = "id";
    process.env.MONIEPOINT_CLIENT_SECRET = "secret";
  });

  it("sends kobo amounts to Moniepoint as whole naira", async () => {
    const calls: { url: string; body: unknown }[] = [];
    const fetchMock = jest.fn((url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body ? JSON.parse(init.body as string) : undefined });
      if (url.endsWith("/v1/auth")) return Promise.resolve(jsonOk({ accessToken: "t", expiresIn: 600 }));
      return Promise.resolve(jsonOk({}));
    });
    (global as unknown as { fetch: unknown }).fetch = fetchMock;

    await new MoniepointAdapter().push({ reference: "r", amount: 91375, terminalSerial: "P260" });

    const push = calls.find((c) => c.url.endsWith("/v1/transactions"));
    expect((push?.body as { amount: number }).amount).toBe(914); // 91375 kobo → ₦913.75 → 914
  });
});
