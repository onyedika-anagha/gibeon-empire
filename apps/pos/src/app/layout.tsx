import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PosProvider } from "@/hooks/usePos";
import PosShell from "@/components/PosShell";

export const metadata: Metadata = {
  title: "Gibeon Empire — POS",
  description: "Offline-first point of sale.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#14181f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PosProvider>
          <PosShell>{children}</PosShell>
        </PosProvider>
      </body>
    </html>
  );
}
