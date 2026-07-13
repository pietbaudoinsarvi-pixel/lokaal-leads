import type { ReactNode } from "react";

export const metadata = {
  title: "Lokaal Leads",
  description: "Moderne websites met een slimme backend voor lokale bedrijven.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
