// Eenvoudige in-memory rate limiter per sleutel (bv. IP). Best-effort op
// serverless: elke warme instance heeft zijn eigen teller, dus dit is een
// rem tegen simpele misbruik-loops, geen waterdichte quota. Voor echte
// handhaving later een gedeelde store (Upstash/Redis) gebruiken.

const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);

  // Simpele opschoning zodat de map niet oneindig groeit.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}

export function clientIp(req: { headers: Headers }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "onbekend"
  );
}
