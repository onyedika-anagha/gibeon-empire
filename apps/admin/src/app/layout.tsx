import type { Metadata } from "next";
import "./globals.css";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import AdminShell from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "Gibeon Empire — Admin",
  description: "Staff dashboard: products, inventory, orders, payments.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AdminAuthProvider>
          <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
