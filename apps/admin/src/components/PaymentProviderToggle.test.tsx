import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentProviderToggle from "./PaymentProviderToggle";

vi.mock("@/lib/api", () => ({
  api: {
    getProvider: vi.fn().mockResolvedValue({ provider: "PAYSTACK" }),
    setProvider: vi.fn().mockResolvedValue({ provider: "FLUTTERWAVE" }),
  },
}));

import { api } from "@/lib/api";

describe("PaymentProviderToggle", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the current provider and switches on click", async () => {
    const user = userEvent.setup();
    render(<PaymentProviderToggle />);

    // Paystack is active initially.
    await waitFor(() => expect(screen.getByRole("radio", { name: /paystack/i })).toHaveAttribute("aria-checked", "true"));

    await user.click(screen.getByRole("radio", { name: /flutterwave/i }));

    expect(api.setProvider).toHaveBeenCalledWith("FLUTTERWAVE");
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: /flutterwave/i })).toHaveAttribute("aria-checked", "true"),
    );
  });
});
