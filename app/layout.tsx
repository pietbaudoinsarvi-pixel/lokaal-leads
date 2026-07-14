import type { ReactNode } from "react";
import { siteUrl } from "@/lib/site-url";

// metadataBase zorgt dat relatieve OG-afbeeldingen (bv. /photos/...) absolute
// URL's worden in previews (WhatsApp, iMessage, socials).
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
