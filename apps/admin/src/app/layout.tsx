import type { Metadata } from "next";
import "./globals.css";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import AdminShell from "@/components/AdminShell";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Gibeon Empire — Admin",
  description: "Staff dashboard: products, inventory, orders, payments.",
  icons: {
    icon: "/logo/favicon.ico",
    apple: "/logo/apple-touch-icon.png",
  },
};

// Apply the saved theme before paint to avoid a flash (defaults to dark).
const themeScript = `(()=>{try{var t=localStorage.getItem("gibeon.admin.theme")||"dark";document.documentElement.classList.toggle("dark",t!=="light")}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark font-sans", geist.variable)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AdminAuthProvider>
          <AdminShell>{children}</AdminShell>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
