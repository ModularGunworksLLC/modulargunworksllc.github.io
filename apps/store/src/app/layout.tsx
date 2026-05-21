import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PreviewBanner } from "@/components/PreviewBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Modular Gunworks LLC | Huntsville FFL Gun Shop",
    template: "%s | Modular Gunworks LLC",
  },
  description:
    "Veteran-owned FFL gun shop in Huntsville, Alabama. Affordable FFL transfers, gunsmithing, and a full online firearms & ammunition catalog shipped nationwide.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
};

export const viewport: Viewport = {
  themeColor: "#181a1b",
  width: "device-width",
  initialScale: 1,
};

const THEME_CSS = [
  "/theme/css/design-system.css",
  "/theme/css/components.css",
  "/theme/css/layout.css",
  "/theme/css/product-tiles.css",
  "/theme/css/woocommerce.css",
  "/theme/css/front-page.css",
  "/theme/css/age-gate.css",
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {THEME_CSS.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
      </head>
      <body>
        <PreviewBanner />
        {children}
        <Script src="/theme/age-gate.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
