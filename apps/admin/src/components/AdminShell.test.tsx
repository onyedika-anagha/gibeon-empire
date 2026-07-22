import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import AdminShell from "./AdminShell";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/lib/api", () => ({
  api: { me: vi.fn(), staffLogin: vi.fn() },
  setToken: vi.fn(),
}));

describe("AdminShell route guard", () => {
  beforeEach(() => localStorage.clear());

  it("shows the sign-in screen and hides protected content when unauthenticated", async () => {
    render(
      <AdminAuthProvider>
        <AdminShell>
          <div>secret dashboard</div>
        </AdminShell>
      </AdminAuthProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument());
    expect(screen.queryByText(/secret dashboard/i)).not.toBeInTheDocument();
    // Nav links are not rendered before authentication.
    expect(screen.queryByText(/^Overview$/)).not.toBeInTheDocument();
  });
});
