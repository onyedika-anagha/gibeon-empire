import { describe, expect, it, vi, beforeEach } from "vitest";
import { payViaTerminal } from "./terminal";
import { api } from "./api";

vi.mock("./api", () => ({
  api: { pushToTerminal: vi.fn(), terminalStatus: vi.fn() },
}));

const push = vi.mocked(api.pushToTerminal);
const status = vi.mocked(api.terminalStatus);
const fast = { pollIntervalMs: 1, timeoutMs: 200 };

beforeEach(() => {
  push.mockReset();
  status.mockReset();
  push.mockResolvedValue({ reference: "r", accepted: true });
});

describe("payViaTerminal", () => {
  it("resolves 'processed' once the terminal reports success", async () => {
    status
      .mockResolvedValueOnce({ reference: "r", status: "pending" })
      .mockResolvedValueOnce({ reference: "r", status: "processed" });
    expect(await payViaTerminal("r", 5000, fast)).toBe("processed");
  });

  it("resolves 'cancelled' when the terminal cancels", async () => {
    status.mockResolvedValue({ reference: "r", status: "cancelled" });
    expect(await payViaTerminal("r", 5000, fast)).toBe("cancelled");
  });

  it("resolves 'timeout' when the terminal never settles", async () => {
    status.mockResolvedValue({ reference: "r", status: "pending" });
    expect(await payViaTerminal("r", 5000, fast)).toBe("timeout");
  });

  it("propagates a failed push so the caller can fall back to manual", async () => {
    push.mockRejectedValue(new Error("offline"));
    await expect(payViaTerminal("r", 5000, fast)).rejects.toThrow("offline");
  });
});
