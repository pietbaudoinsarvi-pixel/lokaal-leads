"use client";

// Kleine client-knop die het printdialoog opent. De print-kaartpagina zelf
// blijft hiermee een server component.
export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" className="print-btn" onClick={() => window.print()}>
      {label}
    </button>
  );
}
