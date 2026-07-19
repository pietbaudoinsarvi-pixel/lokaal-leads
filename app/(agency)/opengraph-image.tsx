import { ImageResponse } from "next/og";
import { agency } from "@/config/agency";

// OG-afbeelding voor de homepage (link-previews in WhatsApp, iMessage,
// socials). Gegenereerd uit config/agency.ts, dus merk-teksten blijven op één
// plek. Staat in de (agency)-routegroep zodat hij ALLEEN voor de homepage
// geldt: klant-sites houden hun eigen hero-foto als preview.
export const alt = `${agency.name}: websites voor vakmensen`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 88px",
          backgroundColor: "#1F4467",
          color: "#FFFFFF",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 34,
            fontWeight: 700,
            color: "#F0A868",
            letterSpacing: 1,
          }}
        >
          <div style={{ width: 44, height: 6, backgroundColor: "#E8762D", display: "flex" }} />
          {agency.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 980,
          }}
        >
          {agency.tagline}
        </div>
        <div style={{ display: "flex", marginTop: 36, fontSize: 30, color: "#D8E1EA" }}>
          {`${agency.priceMonthly} euro per maand, alles inbegrepen. Demo eerst, betalen daarna.`}
        </div>
      </div>
    ),
    size,
  );
}
