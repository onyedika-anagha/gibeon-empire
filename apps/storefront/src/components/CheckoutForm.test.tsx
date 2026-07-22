import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider } from "@/hooks/useCart";
import { AuthProvider } from "@/hooks/useAuth";
import CheckoutForm from "./CheckoutForm";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  api: {
    createOrder: vi.fn().mockResolvedValue({
      id: "o1",
      reference: "GE-TEST",
      contactEmail: "jane@x.com",
      total: 22000,
      subtotal: 22000,
      discountTotal: 0,
      channel: "ONLINE",
      state: "RECEIVED",
      items: [],
      events: [],
    }),
    initializePayment: vi.fn().mockResolvedValue({
      provider: "PAYSTACK",
      reference: "GE-TEST",
      authorizationUrl: "http://pay.test/GE-TEST",
    }),
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

import { api } from "@/lib/api";

const cartItem = { variantId: "v1", slug: "silk-slip", name: "Silk Slip", size: "S", color: "Ink", price: 22000, quantity: 1 };

function renderForm() {
  return render(
    <AuthProvider>
      <CartProvider>
        <CheckoutForm />
      </CartProvider>
    </AuthProvider>,
  );
}

describe("CheckoutForm", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("gibeon.cart", JSON.stringify([cartItem]));
    vi.clearAllMocks();
  });

  it("places a guest order and shows confirmation", async () => {
    const user = userEvent.setup();
    renderForm();

    const placeBtn = await screen.findByRole("button", { name: /place order/i });
    await user.type(screen.getByLabelText(/email/i), "jane@x.com");
    await user.click(placeBtn);

    await waitFor(() => expect(screen.getByText(/thank you/i)).toBeInTheDocument());
    expect(api.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "ONLINE",
        contactEmail: "jane@x.com",
        items: [{ variantId: "v1", quantity: 1 }],
      }),
      undefined,
    );
    expect(api.initializePayment).toHaveBeenCalledWith("o1");
    expect(screen.getByText(/GE-TEST/)).toBeInTheDocument();
  });
});
