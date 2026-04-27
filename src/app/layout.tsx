import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { AppNav } from "@/components/layout/AppNav";
import { AppFooter } from "@/components/layout/AppFooter";
import { MOBILE_NAV_CLEARANCE_CLASS } from "@/components/layout/mobileNav";
import { PersistentMap } from "@/features/map/PersistentMap";
import { ChickenWingProvider } from "@/features/chicken-wings";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "optional",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "optional",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "nycgrid — Explore NYC Through Its Cameras",
  description:
    "NYC's public traffic camera network — 900+ feeds operated by the NYC Dept. of Transportation, on a map. Live weather, transit alerts, and a photobooth.",
  openGraph: {
    title: "nycgrid — NYC's public traffic cameras, on a map",
    description:
      "900+ live feeds from NYC DOT traffic cameras across all five boroughs. Public infrastructure data — free, no ads, no tracking.",
    type: "website",
    siteName: "nycgrid",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://nycgrid.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "nycgrid — NYC's public traffic cameras, on a map",
    description:
      "900+ live feeds from NYC DOT traffic cameras across all five boroughs. Public infrastructure data — free, no ads, no tracking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="street"
      className={`${jetbrainsMono.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-[var(--color-base)] text-[var(--color-text-primary)] min-h-full flex flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-surface)] focus:px-3 focus:py-2 focus:font-mono focus:text-sm focus:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        >
          Skip to content
        </a>
        <QueryProvider>
          <ThemeProvider>
            <PersistentMap />
            <ChickenWingProvider />
            <AppNav />
            <div id="main-content" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </div>
            <div
              data-testid="app-shell-footer"
              className={`empty:hidden desktop-layout:pb-0 ${MOBILE_NAV_CLEARANCE_CLASS}`}
            >
              <AppFooter />
            </div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
