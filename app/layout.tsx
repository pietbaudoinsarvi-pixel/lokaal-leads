import type { ReactNode } from "react";

// metadataBase zorgt dat relatieve OG-afbeeldingen (bv. /photos/...) absolute
// URL's worden in previews (WhatsApp, iMessage, socials).
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://lokaal-leads.vercel.app");

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: "Websitemannetje | Websites voor vakmensen",
  description:
    "Websites die klussen opleveren: aanvragen direct op je telefoon, automatische Google-reviews en onderhoud inbegrepen.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
