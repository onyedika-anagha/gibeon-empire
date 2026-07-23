import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PosProvider } from "@/hooks/usePos";
import { ThemeProvider } from "@/hooks/useTheme";
import PosShell from "@/components/PosShell";

export const metadata: Metadata = {
  title: "Gibeon Empire — POS",
  description: "Offline-first point of sale.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#100e0c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// Set the theme class before first paint so there is no light/dark flash.
const themeBoot = `(function(){try{var s=localStorage.getItem('gibeon.pos.theme');var d=s?s==='dark':matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <ThemeProvider>
          <PosProvider>
            <PosShell>{children}</PosShell>
          </PosProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
