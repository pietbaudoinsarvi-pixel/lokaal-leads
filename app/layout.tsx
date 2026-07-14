import type { ReactNode } from "react";

export const metadata = {
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
